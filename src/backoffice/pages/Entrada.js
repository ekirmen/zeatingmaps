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
    quantityStep: "",
    customQuantityStep: "",
    activoBoleteria: false,
    activoStore: false,
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
    quantityStep: "",
    customQuantityStep: "",
    activoBoleteria: false,
    activoStore: false,
    ivaSeleccionado: "",
    recinto: ""
  });
  const [ticketId, setTicketId] = useState(null);

  const loadTickets = useCallback(async () => {
    if (!formData.recinto) {
      setTickets([]);
      return;
    }

    try {
      // 🎫 CARGAR ENTRADAS CON INFORMACIÓN RELACIONADA
      const { data, error } = await supabase
        .from("entradas")
        .select(`
          *,
          recintos:recinto(id, nombre, direccion),
          ivas:iva(id, porcentaje, nombre)
        `)
        .eq("recinto", formData.recinto);

      if (error) {
        console.error("Error al cargar tickets:", error.message);
        setTickets([]);
      } else {
        // Procesar datos con información relacionada
        const mapped = (data || []).map(t => ({
          ...t,
          tipo: t.tipo_producto,
          _id: t.id,
          // Información del recinto
          recinto_nombre: t.recintos?.nombre || 'Sin recinto',
          recinto_direccion: t.recintos?.direccion || '',
          // Información del IVA
          iva_info: t.ivas ? {
            porcentaje: t.ivas.porcentaje,
            nombre: t.ivas.nombre
          } : null,
          // Estadísticas calculadas
          precio_con_iva: t.precio_base ?
            (t.precio_base * (1 + (t.ivas?.porcentaje || 0) / 100)).toFixed(2) :
            null
        }));

        setTickets(mapped);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
    }
  }, [formData.recinto]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSaveData = async (datos) => {
    // Calcular el múltiplo final
    let quantityStepValue = null;
    if (datos.quantityStep && datos.quantityStep !== '') {
      if (datos.quantityStep === 'custom') {
        quantityStepValue = datos.customQuantityStep ? parseInt(datos.customQuantityStep) : null;
      } else {
        quantityStepValue = parseInt(datos.quantityStep);
      }
    }

    // Prepara sólo los campos que realmente quieres persistir
    const datosAInsertar = {
      nombre_entrada: datos.nombreEntrada,
      min: datos.min,
      max: datos.max,
      iva: datos.ivaSeleccionado,        // viene de la tabla ivas
      tipo_producto: datos.tipoProducto,
      recinto: datos.recinto,
      quantity_step: quantityStepValue,
      activo_boleteria: datos.activoBoleteria || false,
      activo_store: datos.activoStore || false,
    };

    const { error } = await supabase
      .from("entradas")
      .insert([ datosAInsertar ]);  // insert espera un array

    if (error) {
      console.error("Error al guardar datos:", error.message);
      alert("Error al guardar: " + error.message);
    } else {
      setShowPopup(false);
      loadTickets();
    }
  };

  const handleEditTicket = (ticket) => {
    // Determinar quantityStep desde quantity_step
    let quantityStep = "";
    let customQuantityStep = "";
    if (ticket.quantity_step) {
      if (ticket.quantity_step === 2) {
        quantityStep = "2";
      } else if (ticket.quantity_step === 3) {
        quantityStep = "3";
      } else {
        quantityStep = "custom";
        customQuantityStep = ticket.quantity_step.toString();
      }
    }

    setEditFormData({
      producto: ticket.producto || "",
      nombreEntrada: ticket.nombre_entrada || ticket.nombreEntrada || "",
      precio: ticket.precio || "",
      cantidad: ticket.cantidad || "",
      min: ticket.min || 1,
      max: ticket.max || 10,
      quantityStep: quantityStep,
      customQuantityStep: customQuantityStep,
      activoBoleteria: ticket.activo_boleteria || false,
      activoStore: ticket.activo_store || false,
      ivaSeleccionado: ticket.iva || "",
      recinto: ticket.recinto || ""
    });
    setTicketId(ticket._id);
    setShowEditPopup(true);
  };

  const handleSaveEditData = async (datos) => {
    // Calcular el múltiplo final
    let quantityStepValue = null;
    if (datos.quantityStep && datos.quantityStep !== '') {
      if (datos.quantityStep === 'custom') {
        quantityStepValue = datos.customQuantityStep ? parseInt(datos.customQuantityStep) : null;
      } else {
        quantityStepValue = parseInt(datos.quantityStep);
      }
    }

    const datosAInsertar = {
      nombre_entrada: datos.nombreEntrada,
      min: datos.min,
      max: datos.max,
      iva: datos.ivaSeleccionado,
      tipo_producto: datos.tipoProducto,
      recinto: datos.recinto,
      quantity_step: quantityStepValue,
      activo_boleteria: datos.activoBoleteria || false,
      activo_store: datos.activoStore || false,
    };

    const { error } = await supabase
      .from("entradas")
      .update(datosAInsertar)
      .eq("id", ticketId);

    if (error) {
      console.error("Error al actualizar datos:", error.message);
      alert("Error al actualizar: " + error.message);
    } else {
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
        loadTickets();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Entradas</h1>
                <p className="text-sm text-gray-600">Crea y administra las entradas para tus recintos y eventos</p>
              </div>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                onClick={() => setShowPopup(true)}
                disabled={!formData.recinto}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Entrada
              </button>
            </div>
          </div>
        </div>

        {/* Selector de Recinto Simplificado */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Recinto:</label>
            <select
              value={formData.recinto}
              onChange={(e) => setFormData({ ...formData, recinto: e.target.value })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar recinto</option>
              {recintos.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
            {formData.recinto && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ✓ {recintos.find(r => r.id === formData.recinto)?.nombre}
              </span>
            )}
          </div>
        </div>

        {/* Lista de Tickets */}
        {formData.recinto && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900">Entradas del Recinto</h2>
                <div className="text-xs text-gray-600">
                  {tickets.length} entrada{tickets.length !== 1 ? 's' : ''} configurada{tickets.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {tickets.length > 0 && (
              <div className="p-3">
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <div key={t._id} className="flex flex-wrap items-center justify-between gap-3 border rounded px-3 py-2 bg-white">
                      <div className="font-medium">{t.nombreEntrada || t.nombre || t.producto || 'Entrada'}</div>
                      <div className="text-sm text-gray-600">Tipo: {t.tipo || t.tipo_producto || 'General'}</div>
                      <div className="text-sm text-gray-600">Cantidad: {t.min || 1} - {t.max || 10}</div>
                      <div className="text-sm text-gray-600">IVA: {t.iva_info?.porcentaje ?? t.iva ?? 0}</div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditTicket(t)} className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs">Editar</button>
                        <button onClick={() => handleDeleteTicket(t._id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
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
