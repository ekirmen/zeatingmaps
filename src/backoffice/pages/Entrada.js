import React, { useState, useEffect, useCallback } from "react";
import { useRecinto } from "../contexts/RecintoContext";
import { useIva } from "../contexts/IvaContext";
import RecintoSelector from "./CompPlantillaPrecio/RecintoSelector";
import TicketsList from "./CompPlantillaPrecio/TicketsList";
import PopupCrearEntrada from "./CompPlantillaPrecio/PopupCrearEntrada";
import PopupEditarEntrada from "./CompPlantillaPrecio/PopupEditarEntrada";

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

  const [ticketId, setTicketId] = useState("");

  const loadTickets = useCallback(async () => {
    if (!formData.recinto) {
      setTickets([]);
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/entradas?recinto=${formData.recinto}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error('Error al cargar tickets:', error);
    }
  }, [formData.recinto]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSaveData = async (datos) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/entradas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      const result = await response.json();

      if (response.ok) {
        alert('Entrada creada correctamente');
        setShowPopup(false);
        loadTickets();
      } else {
        alert('Error al guardar datos');
      }
    } catch (error) {
      console.error('Error de conexión:', error.message);
    }
  };

  const handleEditTicket = async (id) => {
    setTicketId(id);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/entradas/${id}`);
      const ticket = await response.json();

      setEditFormData({
        producto: ticket.producto,
        tipo: ticket.tipo,
        min: ticket.min,
        max: ticket.max,
        ivaSeleccionado: ticket.iva || '',
        recinto: ticket.recinto
      });
      setShowEditPopup(true);
    } catch (error) {
      console.error('Error al obtener el ticket:', error.message);
    }
  };

  const handleSaveEditData = async (datosEditados) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/entradas/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEditados)
      });
      const result = await response.json();

      if (response.ok) {
        alert('Entrada actualizada correctamente');
        setShowEditPopup(false);
        loadTickets();
      } else {
        console.error('Error al actualizar:', result.message);
      }
    } catch (error) {
      console.error('Error de conexión:', error.message);
    }
  };

  const handleDeleteTicket = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este ticket?")) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/entradas/${id}`, { method: "DELETE" });
        alert("Ticket eliminado correctamente.");
        loadTickets();
      } catch (error) {
        console.error("Error al eliminar el ticket:", error);
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