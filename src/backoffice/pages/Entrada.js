import React, { useState, useEffect, useCallback } from "react";
import { useRecinto } from "../contexts/RecintoContext";
import { useIva } from "../contexts/IvaContext";
import RecintoSelector from "./CompPlantillaPrecio/RecintoSelector";
import TicketsList from "./CompPlantillaPrecio/TicketsList";
import PopupCrearEntrada from "./CompPlantillaPrecio/PopupCrearEntrada";
import PopupEditarEntrada from "./CompPlantillaPrecio/PopupEditarEntrada";
import { supabase } from "../services/supabaseClient";

const tiposDeProducto = [
  { label: "General", description: "Precio general.", value: "General" },
  { label: "Reducido", description: "Descuento para algún colectivo.", value: "Reducido" },
  { label: "Invitaciones o cortesías", description: "Entradas de cortesía.", value: "Invitaciones" },
  { label: "Oferta", description: "Descuento para todo el mundo.", value: "Oferta" },
  { label: "Código descuento", description: "Descuento con código.", value: "CodigoDescuento" },
  { label: "Grupos", description: "Ticket de grupo para personas.", value: "Grupos" },
  { label: "Fidelización", description: "Puntos del club de fidelización.", value: "Fidelizacion" },
  { label: "Promoción (peores asientos)", description: "Asientos con visibilidad reducida.", value: "Promocion" },
  { label: "Pase de temporada", description: "Incluido en un abono de temporada.", value: "PaseTemporada" },
  { label: "Hard Ticketing", description: "Venta física pre-impresa.", value: "HardTicketing" },
  { label: "Paquete", description: "Entrada para paquetes con hotel.", value: "Paquete" },
  { label: "Acreditación", description: "Acreditaciones pre-aprobadas.", value: "Acreditacion" },
  { label: "Gratificación", description: "Regalo promocional.", value: "Gratificacion" },
  { label: "Componente Paquete", description: "Incluida en paquetes.", value: "ComponentePaquete" },
  { label: "Producto Especial", description: "Diferente del precio general.", value: "Especial" }
];

const Entrada = () => {
  const { recintos } = useRecinto();
  const { ivas } = useIva();

  const [formData, setFormData] = useState({
    producto: "",
    min: 1,
    max: 10,
    tipoProducto: "",
    ivaSeleccionado: "",
    recinto: ""
  });

  const [showPopup, setShowPopup] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editFormData, setEditFormData] = useState({
    producto: "",
    tipo: "",
    min: 1,
    max: 10,
    ivaSeleccionado: "",
    recinto: ""
  });
  const [ticketId, setTicketId] = useState(null);

  const loadTickets = useCallback(async () => {
    if (!formData.recinto) {
      setTickets([]);
      return;
    }
    const { data, error } = await supabase
      .from("entradas")
      .select("*")
      .eq("recinto", formData.recinto);

    if (error) {
      console.error("Error al cargar tickets:", error.message);
      setTickets([]);
    } else {
      setTickets(data);
    }
  }, [formData.recinto]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSaveData = async (datos) => {
    const datosConIva = {
      ...datos,
      iva: datos.ivaSeleccionado, // mapear correctamente
    };
    delete datosConIva.ivaSeleccionado; // eliminar el campo innecesario
  
    const { error } = await supabase.from("entradas").insert(datosConIva);
    if (error) {
      console.error("Error al guardar datos:", error.message);
      alert("Error al guardar datos");
    } else {
      alert("Entrada creada correctamente");
      setShowPopup(false);
      loadTickets();
    }
  };

  const handleEditTicket = async (id) => {
    setTicketId(id);
    const { data, error } = await supabase.from("entradas").select("*").eq("id", id).single();
    if (error) {
      console.error("Error al obtener el ticket:", error.message);
    } else {
      setEditFormData({
        producto: data.producto,
        tipo: data.tipo,
        min: data.min,
        max: data.max,
        ivaSeleccionado: data.iva || '',
        recinto: data.recinto
      });
      setShowEditPopup(true);
    }
  };

  const handleSaveEditData = async (datosEditados) => {
    const datosConIva = {
      ...datosEditados,
      iva: datosEditados.ivaSeleccionado,
    };
    delete datosConIva.ivaSeleccionado;
  
    const { error } = await supabase.from("entradas").update(datosConIva).eq("id", ticketId);
    if (error) {
      console.error("Error al actualizar:", error.message);
      alert("Error al actualizar el ticket");
    } else {
      alert("Entrada actualizada correctamente");
      setShowEditPopup(false);
      loadTickets();
    }
  };
  
  const handleDeleteTicket = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ticket?")) {
      const { error } = await supabase.from("entradas").delete().eq("id", id);
      if (error) {
        console.error("Error al eliminar el ticket:", error.message);
      } else {
        alert("Ticket eliminado correctamente.");
        loadTickets();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-8">
        <h2 className="text-3xl font-semibold text-gray-800 mb-4 sm:mb-0">Gestión de Entradas</h2>
        <button
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-colors"
          onClick={() => setShowPopup(true)}
        >
          Crear Entrada
        </button>
      </header>

      <div className="mb-8">
        <RecintoSelector
          recintos={recintos}
          recintoSeleccionado={formData.recinto}
          onChange={(value) => setFormData({ ...formData, recinto: value })}
        />
      </div>

      <div className="mb-8">
        <TicketsList
          tickets={tickets}
          onEdit={handleEditTicket}
          onDelete={handleDeleteTicket}
        />
      </div>

      {showPopup && (
        <PopupCrearEntrada
          tiposDeProducto={tiposDeProducto}
          ivas={ivas}
          onClose={() => setShowPopup(false)}
          onSave={handleSaveData}
          recintoSeleccionado={formData.recinto}
        />
      )}

      {showEditPopup && (
        <PopupEditarEntrada
          tiposDeProducto={tiposDeProducto}
          ivas={ivas}
          formData={editFormData}
          onClose={() => setShowEditPopup(false)}
          onSave={handleSaveEditData}
          recintoSeleccionado={editFormData.recinto}
          onFormChange={setEditFormData}
        />
      )}
    </div>
  );
};

export default Entrada;
