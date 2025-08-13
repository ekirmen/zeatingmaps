import React, { useState, useEffect, useCallback } from "react";
import { useRecinto } from "../contexts/RecintoContext";
import { useIva } from "../contexts/IvaContext";
import RecintoSelector from "./CompPlantillaPrecio/RecintoSelector";
import TicketsList from "./CompPlantillaPrecio/TicketsList";
import PopupCrearEntrada from "./CompPlantillaPrecio/PopupCrearEntrada";
import PopupEditarEntrada from "./CompPlantillaPrecio/PopupEditarEntrada";
import { supabase } from "../../supabaseClient";

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
    nombreEntrada: "",
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
    nombreEntrada: "",
    precio: "",
    cantidad: "",
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
      const mapped = data.map(t => ({
        ...t,
        tipo: t.tipo_producto,
        _id: t.id
      }));
      setTickets(mapped);
    }
  }, [formData.recinto]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSaveData = async (datos) => {
    // Prepara sólo los campos que realmente quieres persistir
    const datosAInsertar = {
      nombre_entrada: datos.nombreEntrada,
      min: datos.min,
      max: datos.max,
      iva: datos.ivaSeleccionado,        // viene de la tabla ivas
      tipo_producto: datos.tipoProducto,
      recinto: datos.recinto,
    };
  
    const { error } = await supabase
      .from("entradas")
      .insert([ datosAInsertar ]);  // insert espera un array
  
    if (error) {
      console.error("Error al guardar datos:", error.message);
      alert("Error al guardar: " + error.message);
    } else {
      console.log("Datos guardados exitosamente");
      setShowPopup(false);
      loadTickets();
    }
  };

  const handleEditTicket = (ticket) => {
    setEditFormData({
      producto: ticket.producto || "",
      nombreEntrada: ticket.nombre_entrada || ticket.nombreEntrada || "",
      precio: ticket.precio || "",
      cantidad: ticket.cantidad || "",
      min: ticket.min || 1,
      max: ticket.max || 10,
      ivaSeleccionado: ticket.iva || "",
      recinto: ticket.recinto || ""
    });
    setTicketId(ticket._id);
    setShowEditPopup(true);
  };

  const handleSaveEditData = async (datos) => {
    const datosAInsertar = {
      nombre_entrada: datos.nombreEntrada,
      min: datos.min,
      max: datos.max,
      iva: datos.ivaSeleccionado,
      tipo_producto: datos.tipoProducto,
      recinto: datos.recinto,
    };

    const { error } = await supabase
      .from("entradas")
      .update(datosAInsertar)
      .eq("id", ticketId);

    if (error) {
      console.error("Error al actualizar datos:", error.message);
      alert("Error al actualizar: " + error.message);
    } else {
      console.log("Datos actualizados exitosamente");
      setShowEditPopup(false);
      loadTickets();
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta entrada?")) {
      const { error } = await supabase
        .from("entradas")
        .delete()
        .eq("id", ticketId);

      if (error) {
        console.error("Error al eliminar:", error.message);
        alert("Error al eliminar: " + error.message);
      } else {
        console.log("Entrada eliminada exitosamente");
        loadTickets();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-8 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Entradas</h1>
                <p className="text-lg text-gray-600">
                  Crea y administra las entradas para tus recintos y eventos
                </p>
              </div>
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all duration-200 font-semibold flex items-center gap-2"
                onClick={() => setShowPopup(true)}
                disabled={!formData.recinto}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Entrada
              </button>
            </div>
          </div>
        </div>

        {/* Selector de Recinto */}
        <div className="mb-8">
          <RecintoSelector
            recintos={recintos}
            recintoSeleccionado={formData.recinto}
            onChange={(value) => setFormData({ ...formData, recinto: value })}
          />
        </div>

        {/* Estado de la Selección */}
        {!formData.recinto && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Selecciona un Recinto
            </h3>
            <p className="text-yellow-700">
              Para crear entradas, primero debes seleccionar un recinto del selector superior
            </p>
          </div>
        )}

        {/* Lista de Tickets */}
        {formData.recinto && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Entradas del Recinto</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {tickets.length} entrada{tickets.length !== 1 ? 's' : ''} configurada{tickets.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {tickets.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No hay entradas configuradas
                  </div>
                )}
              </div>
            </div>
            
            {tickets.length > 0 && (
              <div className="p-6">
                <TicketsList
                  tickets={tickets}
                  onEdit={handleEditTicket}
                  onDelete={handleDeleteTicket}
                />
              </div>
            )}
          </div>
        )}

        {/* Popups */}
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
    </div>
  );
};

export default Entrada;
