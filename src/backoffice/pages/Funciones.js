import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { useRecinto } from '../contexts/RecintoContext';
import { supabase } from '../../supabaseClient';
import { syncSeatsForSala } from '../services/apibackoffice';
import { useTenant } from '../../contexts/TenantContext';
import formatDateString from '../../utils/formatDateString';

// Zonas horarias disponibles
const ZONAS_HORARIAS = [
  'America/Mexico_City',
  'America/Cancun',
  'America/Merida',
  'America/Monterrey',
  'America/Matamoros',
  'America/Mazatlan',
  'America/Chihuahua',
  'America/Ojinaga',
  'America/Hermosillo',
  'America/Tijuana',
  'America/Santa_Isabel',
  'America/Bahia_Banderas',
  'America/Panama',
  'Pacific/Galapagos',
  'America/Guayaquil',
  'America/Tegucigalpa',
  'America/Santo_Domingo',
  'America/Caracas',
  'America/Costa_Rica'
];

// Opciones de tiempo de liberación de reservas
const TIEMPOS_LIBERACION = [
  { value: 0, label: 'En la fecha de celebración' },
  { value: -5, label: '5 minutos' },
  { value: -10, label: '10 minutos' },
  { value: -15, label: '15 minutos' },
  { value: -30, label: '30 minutos' },
  { value: -45, label: '45 minutos' },
  { value: -60, label: '60 minutos' },
  { value: -90, label: '90 minutos' },
  { value: -120, label: '2 horas' },
  { value: -180, label: '3 horas' },
  { value: -240, label: '4 horas' },
  { value: -360, label: '6 horas' },
  { value: -480, label: '8 horas' },
  { value: -720, label: '12 horas' },
  { value: -1440, label: '1 día' },
  { value: -2880, label: '2 días' },
  { value: -4320, label: '3 días' },
  { value: -5760, label: '4 días' },
  { value: -7200, label: '5 días' },
  { value: -10080, label: '7 días' },
  { value: -14400, label: '10 días' },
  { value: -28800, label: '20 días' },
  { value: 1440, label: '1 día después' },
  { value: 2880, label: '2 días después' },
  { value: 4320, label: '3 días después' },
  { value: 5760, label: '4 días después' },
  { value: 7200, label: '5 días después' },
  { value: 10080, label: '7 días después' },
  { value: 14400, label: '10 días después' }
];

// Opciones de liberación de impresión de tickets
const TIEMPOS_IMPRESION = [
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
  { value: 360, label: '6 horas' },
  { value: 540, label: '9 horas' },
  { value: 720, label: '12 horas' },
  { value: 1440, label: '1 día' },
  { value: 2880, label: '2 días' },
  { value: 4320, label: '3 días' },
  { value: 5760, label: '4 días' },
  { value: 7200, label: '5 días' },
  { value: 10080, label: '7 días' },
  { value: 'custom', label: 'Fecha personalizada' }
];

// Plataformas de streaming
const PLATAFORMAS_STREAMING = [
  { value: 'ENETRES', label: 'Enetres' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'MEET', label: 'Google Meet' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'TEAMS', label: 'Microsoft Teams' },
  { value: 'VIMEO', label: 'Vimeo' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'ZOOM', label: 'Zoom' }
];

// Número de plazos de pago
const NUM_PLAZOS = [2, 3, 4, 5, 6, 7, 8, 10, 12];

const Funciones = () => {
  const { currentTenant } = useTenant();
  const { recintoSeleccionado, salaSeleccionada, setRecintoSeleccionado, setSalaSeleccionada, recintos } = useRecinto();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillasComisiones, setPlantillasComisiones] = useState([]);
  const [plantillasProductos, setPlantillasProductos] = useState([]);
  const [loadingPlantillasProductos, setLoadingPlantillasProductos] = useState(false);
  const [funciones, setFunciones] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingFuncion, setEditingFuncion] = useState(null);
  const [nuevaFuncion, setNuevaFuncion] = useState({
    fechaCelebracion: '',
    zonaHoraria: 'America/Mexico_City',
    litSesion: '',
    utilizaLitSesion: false,
    tiempoCaducidadReservas: -120,
    aperturaPuertas: '',
    promotionalSessionLabel: '',
    sessionBelongsSeasonPass: false,
    idAbonoSala: [],
    streamingMode: false,
    overwriteStreamingSetup: false,
    streamingType: 'ENETRES',
    streamingUrl: '',
    streamingId: '',
    streamingPassword: '',
    streamingOnlyOneSessionByTicket: false,
    streamingShowUrl: false,
    streamingTransmissionStart: '',
    streamingTransmissionStop: '',
    idSala: '',
    idPlantillaEntradas: '',
    idPlantillaProductos: '',
    idSpecialProductsTemplate: '',
    idPlantillaCupos: '',
    permitePagoPlazos: false,
    numPlazosPago: 0,
    permiteReserva: false,
    mismaFechaCanales: true,
    fechaInicioVenta: '',
    fechaFinVenta: '',
    canales: {
      boxOffice: { activo: true, inicio: '', fin: '' },
      internet: { activo: true, inicio: '', fin: '' }
    },
    cancellationDateSelected: false,
    endDateCancellation: '',
    ticketPrintingReleaseDateSelected: false,
    ticketPrintingReleaseDate: 120,
    customPrintingTicketDate: '',
    customSes1: '',
    customSes2: '',
    idBarcodePool: '',
    activo: true,
    visibleEnBoleteria: true,
    visibleEnStore: true
  });

  const getEventoNombre = (eventoId) => {
    const evento = eventos.find((e) => e.id === eventoId);
    if (evento) return evento.nombre;
    return eventoId ? `Evento ${eventoId}` : 'Evento desconocido';
  };

  const getPlantillaNombre = (plantillaId) => {
    if (plantillaId && typeof plantillaId === 'object' && plantillaId.nombre) {
      return plantillaId.nombre;
    }
    const plantilla = plantillas.find((p) => p.id === plantillaId);
    if (plantilla) return plantilla.nombre;
    return plantillaId ? `Plantilla ${plantillaId}` : 'Sin plantilla';
  };

  const getPlantillaComisionesNombre = (plantillaId) => {
    if (plantillaId && typeof plantillaId === 'object' && plantillaId.nombre) {
      return plantillaId.nombre;
    }
    const plantilla = plantillasComisiones.find((p) => p.id === plantillaId);
    if (plantilla) return plantilla.nombre;
    return plantillaId ? `Plantilla ${plantillaId}` : 'Sin plantilla';
  };

  const getPlantillaProductoNombre = (plantillaId) => {
    if (plantillaId && typeof plantillaId === 'object' && plantillaId.nombre) {
      return plantillaId.nombre;
    }
    const plantilla = plantillasProductos.find((p) => p.id === plantillaId);
    if (plantilla) return plantilla.nombre;
    return plantillaId ? `Plantilla ${plantillaId}` : 'Sin plantilla';
  };

  const formatFecha = (date) => {
    return formatDateString(date);
  };

  const getTiempoCaducidadText = (minutos) => {
    if (minutos === 0) return 'En la fecha de celebración';
    if (minutos < 0) {
      const horas = Math.abs(minutos) / 60;
      const dias = horas / 24;
      if (dias >= 1) return `${Math.floor(dias)} días`;
      if (horas >= 1) return `${Math.floor(horas)} horas`;
      return `${Math.abs(minutos)} minutos`;
    } else {
      const horas = minutos / 60;
      const dias = horas / 24;
      if (dias >= 1) return `${Math.floor(dias)} días`;
      if (horas >= 1) return `${Math.floor(horas)} horas`;
      return `${minutos} minutos`;
    }
  };

  // Función para resetear el estado
  const resetNuevaFuncion = () => {
    setNuevaFuncion({
      fechaCelebracion: '',
      zonaHoraria: 'America/Mexico_City',
      litSesion: '',
      utilizaLitSesion: false,
      tiempoCaducidadReservas: -120,
      aperturaPuertas: '',
      promotionalSessionLabel: '',
      sessionBelongsSeasonPass: false,
      idAbonoSala: [],
      streamingMode: false,
      overwriteStreamingSetup: false,
      streamingType: 'ENETRES',
      streamingUrl: '',
      streamingId: '',
      streamingPassword: '',
      streamingOnlyOneSessionByTicket: false,
      streamingShowUrl: false,
      streamingTransmissionStart: '',
      streamingTransmissionStop: '',
      idSala: '',
      idPlantillaEntradas: '',
      idPlantillaProductos: '',
      idSpecialProductsTemplate: '',
      idPlantillaCupos: '',
      permitePagoPlazos: false,
      numPlazosPago: 0,
      permiteReserva: false,
      mismaFechaCanales: true,
      fechaInicioVenta: '',
      fechaFinVenta: '',
      canales: {
        boxOffice: { activo: true, inicio: '', fin: '' },
        internet: { activo: true, inicio: '', fin: '' }
      },
      cancellationDateSelected: false,
      endDateCancellation: '',
      ticketPrintingReleaseDateSelected: false,
      ticketPrintingReleaseDate: 120,
      customPrintingTicketDate: '',
      customSes1: '',
      customSes2: '',
      idBarcodePool: '',
      activo: true,
      visibleEnBoleteria: true,
      visibleEnStore: true
    });
  };

  // Fetch eventos when sala changes
  useEffect(() => {
    const fetchEventos = async () => {
      if (salaSeleccionada && recintoSeleccionado) {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .eq('recinto', recintoSeleccionado.id)
          .eq('sala', salaSeleccionada.id);
        
        if (error) {
          console.error('Error fetching eventos:', error);
        } else {
          setEventos(data || []);
        }
      }
    };

    fetchEventos();
  }, [salaSeleccionada, recintoSeleccionado]);

  // Fetch funciones
  const loadFunciones = useCallback(async () => {
    if (!salaSeleccionada?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('funciones')
        .select(`
          *,
          eventos!evento_id(*),
          plantillas!plantilla_entradas(*)
        `)
        .eq('sala_id', salaSeleccionada.id)
        .order('fecha_celebracion', { ascending: true });
      
      if (error) throw error;
      setFunciones(data || []);
    } catch (error) {
      console.error('Error loading funciones:', error);
    }
  }, [salaSeleccionada]);

  useEffect(() => {
    loadFunciones();
  }, [loadFunciones]);

  // Load funciones when sala changes
  useEffect(() => {
    if (salaSeleccionada?.id) {
      loadFunciones();
    }
  }, [salaSeleccionada, loadFunciones]);

  useEffect(() => {
    if (!recintoSeleccionado && !salaSeleccionada && !eventoSeleccionado) {
      const fetchAllFunciones = async () => {
        const { data, error } = await supabase
          .from('funciones')
          .select(`
            id,
            fechaCelebracion:fecha_celebracion,
            inicioVenta:inicio_venta,
            finVenta:fin_venta,
            pagoAPlazos:pago_a_plazos,
            permitirReservasWeb:permitir_reservas_web,
            tiempoCaducidadReservas:tiempo_caducidad_reservas,
            fechaLiberacionReservas:fecha_liberacion_reservas,
            evento,
            sala(*),
            plantilla(*),
            plantillaComisiones:plantilla_comisiones(*),
            plantillaProducto:plantilla_producto(*)
          `);

        if (error) {
          console.error('Error al obtener todas las funciones:', error);
        } else {
          setFunciones(data || []);
        }
      };

      fetchAllFunciones();
    }
  }, [recintoSeleccionado, salaSeleccionada, eventoSeleccionado]);

  useEffect(() => {
    const fetchPlantillas = async () => {
      const { data, error } = await supabase
        .from('plantillas')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error al obtener plantillas:', error);
      } else {
        setPlantillas(data || []);
      }
    };

    fetchPlantillas();
  }, []);

  useEffect(() => {
    const fetchPlantillasComisiones = async () => {
      const { data, error } = await supabase
        .from('plantillas_comisiones')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error al obtener plantillas de comisiones:', error);
      } else {
        setPlantillasComisiones(data || []);
      }
    };

    fetchPlantillasComisiones();
  }, []);

  const fetchPlantillasProductos = async () => {
    setLoadingPlantillasProductos(true);
    try {
      const { data, error } = await supabase
        .from('plantillas_productos_template')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        console.error('Error al obtener plantillas de productos:', error);
        // Si la tabla no existe, establecer un array vacío
        if (error.code === '42P01') { // undefined_table
          console.warn('La tabla plantillas_productos_template no existe. Se establecerá un array vacío.');
          setPlantillasProductos([]);
        } else {
          setPlantillasProductos([]);
        }
      } else {
        setPlantillasProductos(data || []);
      }
    } catch (error) {
      console.error('Error inesperado al obtener plantillas de productos:', error);
      setPlantillasProductos([]);
    } finally {
      setLoadingPlantillasProductos(false);
    }
  };

  useEffect(() => {
    fetchPlantillasProductos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validar que la fecha de inicio de venta sea anterior a la fecha de celebración
      if (new Date(nuevaFuncion.fechaInicioVenta) >= new Date(nuevaFuncion.fechaCelebracion)) {
        alert('La fecha de inicio de venta debe ser anterior a la fecha de celebración');
        return;
      }

      // Validar que la fecha de fin de venta sea posterior o igual a la fecha de inicio de venta
      if (new Date(nuevaFuncion.fechaFinVenta) < new Date(nuevaFuncion.fechaInicioVenta)) {
        alert('La fecha de fin de venta debe ser posterior o igual a la fecha de inicio de venta');
        return;
      }
      
      // Validar que la fecha de fin de venta sea anterior o igual a la fecha de celebración
      if (new Date(nuevaFuncion.fechaFinVenta) > new Date(nuevaFuncion.fechaCelebracion)) {
        alert('La fecha de fin de venta debe ser anterior o igual a la fecha de celebración');
        return;
      }

      // Validar que se haya seleccionado al menos un canal
      const canalesActivos = Object.values(nuevaFuncion.canales).some(canal => canal.activo);
      if (!canalesActivos) {
        alert('Debe seleccionar al menos un canal de venta');
        return;
      }

      // Validar que se haya seleccionado una sala
      if (!nuevaFuncion.idSala) {
        alert('Debe seleccionar una sala');
        return;
      }

      // Validar que se haya seleccionado una plantilla de tickets
      if (!nuevaFuncion.idPlantillaEntradas) {
        alert('Debe seleccionar una plantilla de tickets');
        return;
      }

      const funcionData = {
        evento_id: eventoSeleccionado?.id,
        sala_id: nuevaFuncion.idSala,
        fecha_celebracion: nuevaFuncion.fechaCelebracion,
        zona_horaria: nuevaFuncion.zonaHoraria,
        lit_sesion: nuevaFuncion.litSesion,
        utiliza_lit_sesion: nuevaFuncion.utilizaLitSesion,
        tiempo_caducidad_reservas: nuevaFuncion.tiempoCaducidadReservas,
        apertura_puertas: nuevaFuncion.aperturaPuertas,
        promotional_session_label: nuevaFuncion.promotionalSessionLabel,
        session_belongs_season_pass: nuevaFuncion.sessionBelongsSeasonPass,
        id_abono_sala: nuevaFuncion.idAbonoSala,
        streaming_mode: nuevaFuncion.streamingMode,
        overwrite_streaming_setup: nuevaFuncion.overwriteStreamingSetup,
        streaming_type: nuevaFuncion.streamingType,
        streaming_url: nuevaFuncion.streamingUrl,
        streaming_id: nuevaFuncion.streamingId,
        streaming_password: nuevaFuncion.streamingPassword,
        streaming_only_one_session_by_ticket: nuevaFuncion.streamingOnlyOneSessionByTicket,
        streaming_show_url: nuevaFuncion.streamingShowUrl,
        streaming_transmission_start: nuevaFuncion.streamingTransmissionStart,
        streaming_transmission_stop: nuevaFuncion.streamingTransmissionStop,
        plantilla_entradas: nuevaFuncion.idPlantillaEntradas,
        plantilla_productos: nuevaFuncion.idPlantillaProductos,
        plantilla_comisiones: nuevaFuncion.idSpecialProductsTemplate,
        plantilla_cupos: nuevaFuncion.idPlantillaCupos,
        permite_pago_plazos: nuevaFuncion.permitePagoPlazos,
        num_plazos_pago: nuevaFuncion.numPlazosPago,
        permite_reserva: nuevaFuncion.permiteReserva,
        misma_fecha_canales: nuevaFuncion.mismaFechaCanales,
        fecha_inicio_venta: nuevaFuncion.fechaInicioVenta,
        fecha_fin_venta: nuevaFuncion.fechaFinVenta,
        canales: nuevaFuncion.canales,
        cancellation_date_selected: nuevaFuncion.cancellationDateSelected,
        end_date_cancellation: nuevaFuncion.endDateCancellation,
        ticket_printing_release_date_selected: nuevaFuncion.ticketPrintingReleaseDateSelected,
        ticket_printing_release_date: nuevaFuncion.ticketPrintingReleaseDate,
        custom_printing_ticket_date: nuevaFuncion.customPrintingTicketDate,
        custom_ses1: nuevaFuncion.customSes1,
        custom_ses2: nuevaFuncion.customSes2,
        id_barcode_pool: nuevaFuncion.idBarcodePool,
        activo: nuevaFuncion.activo,
        visible_en_boleteria: nuevaFuncion.visibleEnBoleteria,
        visible_en_store: nuevaFuncion.visibleEnStore,
        tenant_id: currentTenant?.id,
        recinto_id: recintoSeleccionado?.id
      };

      if (editingFuncion) {
        const { error } = await supabase
          .from('funciones')
          .update(funcionData)
          .eq('id', editingFuncion.id);
        
        if (error) throw error;
        alert('Función actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('funciones')
          .insert([funcionData]);
        
        if (error) throw error;
        alert('Función creada exitosamente');
      }

      setModalIsOpen(false);
      setEditingFuncion(null);
      resetNuevaFuncion();
      
      loadFunciones();
    } catch (error) {
      console.error('Error saving funcion:', error);
      alert('Error al guardar la función: ' + error.message);
    }
  };

  const handleEdit = (funcion) => {
    setEditingFuncion(funcion);
    
    // Asegurar que todos los campos estén inicializados correctamente
    const funcionEditada = {
      fechaCelebracion: funcion.fecha_celebracion || '',
      zonaHoraria: funcion.zona_horaria || 'America/Mexico_City',
      litSesion: funcion.lit_sesion || '',
      utilizaLitSesion: funcion.utiliza_lit_sesion || false,
      tiempoCaducidadReservas: funcion.tiempo_caducidad_reservas || -120,
      aperturaPuertas: funcion.apertura_puertas || '',
      promotionalSessionLabel: funcion.promotional_session_label || '',
      sessionBelongsSeasonPass: funcion.session_belongs_season_pass || false,
      idAbonoSala: funcion.id_abono_sala || [],
      streamingMode: funcion.streaming_mode || false,
      overwriteStreamingSetup: funcion.overwrite_streaming_setup || false,
      streamingType: funcion.streaming_type || 'ENETRES',
      streamingUrl: funcion.streaming_url || '',
      streamingId: funcion.streaming_id || '',
      streamingPassword: funcion.streaming_password || '',
      streamingOnlyOneSessionByTicket: funcion.streaming_only_one_session_by_ticket || false,
      streamingShowUrl: funcion.streaming_show_url || false,
      streamingTransmissionStart: funcion.streaming_transmission_start || '',
      streamingTransmissionStop: funcion.streaming_transmission_stop || '',
      idSala: funcion.sala_id || funcion.sala || '',
      idPlantillaEntradas: funcion.plantilla_entradas || funcion.plantilla || '',
      idPlantillaProductos: funcion.plantilla_productos || funcion.plantilla_producto || '',
      idSpecialProductsTemplate: funcion.plantilla_comisiones || '',
      idPlantillaCupos: funcion.plantilla_cupos || '',
      permitePagoPlazos: funcion.permite_pago_plazos || false,
      numPlazosPago: funcion.num_plazos_pago || 0,
      permiteReserva: funcion.permite_reserva || funcion.permitir_reservas_web || false,
      mismaFechaCanales: funcion.misma_fecha_canales !== false,
      fechaInicioVenta: funcion.fecha_inicio_venta || funcion.inicio_venta || '',
      fechaFinVenta: funcion.fecha_fin_venta || funcion.fin_venta || '',
      canales: funcion.canales || {
        boxOffice: { activo: true, inicio: '', fin: '' },
        internet: { activo: true, inicio: '', fin: '' }
      },
      cancellationDateSelected: funcion.cancellation_date_selected || false,
      endDateCancellation: funcion.end_date_cancellation || '',
      ticketPrintingReleaseDateSelected: funcion.ticket_printing_release_date_selected || false,
      ticketPrintingReleaseDate: funcion.ticket_printing_release_date || 120,
      customPrintingTicketDate: funcion.custom_printing_ticket_date || '',
      customSes1: funcion.custom_ses1 || '',
      customSes2: funcion.custom_ses2 || '',
      idBarcodePool: funcion.id_barcode_pool || '',
      activo: funcion.activo !== false,
      visibleEnBoleteria: funcion.visible_en_boleteria !== false,
      visibleEnStore: funcion.visible_en_store !== false
    };
    
    setNuevaFuncion(funcionEditada);
    setModalIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta función?')) return;

    const { error } = await supabase.from('funciones').delete().eq('id', id);
    if (error) {
      alert('Error al eliminar');
    } else {
      loadFunciones();
    }
  };

  const handleDuplicate = async (id) => {
    const { data, error } = await supabase.from('funciones').select('*').eq('id', id).single();
    if (error || !data) {
      alert('No se pudo duplicar');
      return;
    }

    const { id: _, ...duplicatedData } = data;
    const { error: insertError } = await supabase.from('funciones').insert([duplicatedData]);
    if (insertError) {
      alert('Error al duplicar');
    } else {
      if (duplicatedData.sala) {
        await syncSeatsForSala(duplicatedData.sala);
      }
      loadFunciones();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Funciones</h1>
              <button
                onClick={() => {
                  setEditingFuncion(null);
                  resetNuevaFuncion();
                  setModalIsOpen(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Nueva Función
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recinto</label>
                <select
                  value={recintoSeleccionado ? recintoSeleccionado.id : ''}
                  onChange={(e) => {
                    const recinto = recintos.find(r => String(r.id) === e.target.value);
                    setRecintoSeleccionado(recinto);
                    setSalaSeleccionada(null);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar Recinto</option>
                  {recintos.map(recinto => (
                    <option key={recinto.id} value={recinto.id}>
                      {recinto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {recintoSeleccionado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                  <select
                    value={salaSeleccionada ? salaSeleccionada.id : ''}
                    onChange={(e) => {
                      const sala = recintoSeleccionado.salas.find(s => String(s.id) === e.target.value);
                      setSalaSeleccionada(sala);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar Sala</option>
                    {recintoSeleccionado.salas.map(sala => (
                      <option key={sala.id} value={sala.id}>
                        {sala.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {salaSeleccionada && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evento</label>
                  <select
                    value={eventoSeleccionado || ''}
                    onChange={(e) => setEventoSeleccionado(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar Evento</option>
                    {eventos.map(evento => (
                      <option key={evento.id} value={evento.id}>
                        {evento.nombre}
                      </option>
                    ))}
                  </select>
                  {eventos.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No hay eventos disponibles para esta sala. 
                      <a href="/dashboard/eventos" className="text-blue-600 hover:underline ml-1">
                        Crear evento
                      </a>
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-end">
                <button 
                  onClick={() => {
                    setRecintoSeleccionado(null);
                    setSalaSeleccionada(null);
                    setEventoSeleccionado(null);
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Celebración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sala
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantilla Precios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantilla Comisiones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plantilla Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inicio Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fin Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liberación Reservas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {funciones.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                      {recintoSeleccionado || salaSeleccionada || eventoSeleccionado 
                        ? 'No se encontraron funciones con los filtros seleccionados'
                        : 'No hay funciones creadas. Crea una nueva función para comenzar.'
                      }
                    </td>
                  </tr>
                ) : (
                  funciones.map(funcion => (
                    <tr key={funcion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(funcion.fechaCelebracion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getEventoNombre(funcion.evento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {funcion.sala?.nombre || 'Sala desconocida'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPlantillaNombre(funcion.plantilla)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPlantillaComisionesNombre(funcion.plantillaComisiones)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPlantillaProductoNombre(funcion.plantillaProducto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(funcion.inicioVenta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFecha(funcion.finVenta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {funcion.tiempoCaducidadReservas !== null 
                          ? getTiempoCaducidadText(funcion.tiempoCaducidadReservas)
                          : 'No configurado'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col space-y-1">
                          {funcion.pagoAPlazos && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pago a plazos
                            </span>
                          )}
                          {funcion.permitirReservasWeb && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Reservas web
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(funcion)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(funcion.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Eliminar
                          </button>
                          <button 
                            onClick={() => handleDuplicate(funcion.id)}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                          >
                            Duplicar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => {
          setModalIsOpen(false);
          setEditingFuncion(null);
          resetNuevaFuncion();
        }}
        className="bg-white rounded-lg shadow-xl max-w-4xl mx-auto focus:outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingFuncion ? 'Editar Función' : 'Nueva Función'}
            </h2>
            <button
              onClick={() => {
                setModalIsOpen(false);
                setEditingFuncion(null);
                resetNuevaFuncion();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Evento</label>
                <input
                  type="text"
                  className="border p-2 w-full rounded bg-gray-100"
                  value={eventoSeleccionado ? eventoSeleccionado.nombre : ''}
                  disabled
                  readOnly
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="streamingMode"
                  checked={nuevaFuncion.streamingMode}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingMode: e.target.checked })}
                />
                <label htmlFor="streamingMode" className="text-sm font-medium text-gray-700">En línea</label>
              </div>
            </div>

            {/* Fechas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de celebración
                  <span className="ml-1 text-gray-500">
                    <i className="fas fa-question-circle" title="Fecha y hora del evento"></i>
                  </span>
                </label>
                <input
                  type="datetime-local"
                  className="border p-2 w-full rounded"
                  value={nuevaFuncion.fechaCelebracion}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, fechaCelebracion: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona horaria</label>
                <select
                  className="border p-2 w-full rounded"
                  value={nuevaFuncion.zonaHoraria}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, zonaHoraria: e.target.value })}
                  required
                >
                  {ZONAS_HORARIAS.map(zona => (
                    <option key={zona} value={zona}>{zona}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Apertura de puertas</label>
                <input
                  type="datetime-local"
                  className="border p-2 w-full rounded"
                  value={nuevaFuncion.aperturaPuertas}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, aperturaPuertas: e.target.value })}
                />
              </div>
            </div>

            {/* Literal de función */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="utilizaLitSesion"
                  checked={nuevaFuncion.utilizaLitSesion}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, utilizaLitSesion: e.target.checked })}
                />
                <label htmlFor="utilizaLitSesion" className="text-sm font-medium text-gray-700">Literal de función</label>
              </div>
              <div>
                <input
                  type="text"
                  className="border p-2 w-full rounded"
                  placeholder="Literal de función"
                  value={nuevaFuncion.litSesion}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, litSesion: e.target.value })}
                  disabled={!nuevaFuncion.utilizaLitSesion}
                />
              </div>
            </div>

            {/* Fecha de liberación de reservas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de liberación de reservas
                <span className="ml-1 text-gray-500">
                  <i className="fas fa-question-circle" title="Tiempo antes o después de la fecha de celebración para liberar reservas"></i>
                </span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={nuevaFuncion.tiempoCaducidadReservas}
                onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, tiempoCaducidadReservas: parseInt(e.target.value) })}
                required
              >
                <optgroup label="Antes de la fecha de celebración">
                  {TIEMPOS_LIBERACION.filter(option => option.value <= 0).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Después de la fecha de compra">
                  {TIEMPOS_LIBERACION.filter(option => option.value > 0).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Etiqueta promocional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-tag mr-2"></i>
                Etiqueta promocional de la función
                <span className="ml-1 text-gray-500">
                  <i className="fas fa-question-circle" title="Etiqueta promocional para marketing"></i>
                </span>
              </label>
              <input
                type="text"
                className="border p-2 w-full rounded"
                placeholder="Etiqueta promocional"
                value={nuevaFuncion.promotionalSessionLabel}
                onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, promotionalSessionLabel: e.target.value })}
                maxLength={50}
              />
            </div>

            {/* Pase de temporada */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sessionBelongsSeasonPass"
                  checked={nuevaFuncion.sessionBelongsSeasonPass}
                  onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, sessionBelongsSeasonPass: e.target.checked })}
                />
                <label htmlFor="sessionBelongsSeasonPass" className="text-sm font-medium text-gray-700">
                  La función pertenece al pase de temporada
                </label>
              </div>
              {nuevaFuncion.sessionBelongsSeasonPass && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pertenece a Abono</label>
                  <select
                    className="border p-2 w-full rounded"
                    multiple
                    value={nuevaFuncion.idAbonoSala}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setNuevaFuncion({ ...nuevaFuncion, idAbonoSala: values });
                    }}
                  >
                    <option value="">No existen abonos activos</option>
                  </select>
                </div>
              )}
            </div>

            {/* Opciones de streaming */}
            {nuevaFuncion.streamingMode && (
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Opciones de streaming</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="overwriteStreamingSetup"
                      checked={nuevaFuncion.overwriteStreamingSetup}
                      onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, overwriteStreamingSetup: e.target.checked })}
                    />
                    <label htmlFor="overwriteStreamingSetup" className="text-sm font-medium text-gray-700">
                      Sobrescribir la configuración del evento
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plataforma de streaming</label>
                      <select
                        className="border p-2 w-full rounded"
                        value={nuevaFuncion.streamingType}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingType: e.target.value })}
                      >
                        {PLATAFORMAS_STREAMING.map(plataforma => (
                          <option key={plataforma.value} value={plataforma.value}>
                            {plataforma.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL del video</label>
                      <input
                        type="text"
                        className="border p-2 w-full rounded"
                        placeholder="URL del video"
                        value={nuevaFuncion.streamingUrl}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Identificador de la sala</label>
                      <input
                        type="text"
                        className="border p-2 w-full rounded"
                        placeholder="ID de la sala"
                        value={nuevaFuncion.streamingId}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña <span className="text-gray-500">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        className="border p-2 w-full rounded"
                        placeholder="Contraseña"
                        value={nuevaFuncion.streamingPassword}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingPassword: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="streamingOnlyOneSessionByTicket"
                        checked={nuevaFuncion.streamingOnlyOneSessionByTicket}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingOnlyOneSessionByTicket: e.target.checked })}
                      />
                      <label htmlFor="streamingOnlyOneSessionByTicket" className="text-sm font-medium text-gray-700">
                        Solo un dispositivo simultáneo por entrada
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="streamingShowUrl"
                        checked={nuevaFuncion.streamingShowUrl}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingShowUrl: e.target.checked })}
                      />
                      <label htmlFor="streamingShowUrl" className="text-sm font-medium text-gray-700">
                        Mostrar URL
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de inicio de la transmisión <span className="text-gray-500">(Opcional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="border p-2 w-full rounded"
                        value={nuevaFuncion.streamingTransmissionStart}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingTransmissionStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha fin de la transmisión <span className="text-gray-500">(Opcional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="border p-2 w-full rounded"
                        value={nuevaFuncion.streamingTransmissionStop}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, streamingTransmissionStop: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Configuraciones */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Configuraciones</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sala</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={nuevaFuncion.idSala}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, idSala: e.target.value })}
                    required
                  >
                    <option value="">Selecciona una sala</option>
                    {salaSeleccionada && (
                      <option value={salaSeleccionada.id}>{salaSeleccionada.nombre}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plantilla de tickets</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={nuevaFuncion.idPlantillaEntradas}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, idPlantillaEntradas: e.target.value })}
                    required
                  >
                    <option value="">Selecciona la plantilla de entradas</option>
                    {plantillas.map(plantilla => (
                      <option key={plantilla.id} value={plantilla.id}>{plantilla.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plantilla de productos</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={nuevaFuncion.idPlantillaProductos}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, idPlantillaProductos: e.target.value })}
                  >
                    <option value="">No existen plantillas de productos activas</option>
                    {plantillasProductos.map(plantilla => (
                      <option key={plantilla.id} value={plantilla.id}>{plantilla.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plantilla de precios especiales</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={nuevaFuncion.idSpecialProductsTemplate}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, idSpecialProductsTemplate: e.target.value })}
                  >
                    <option value="">Selecciona una plantilla de productos especiales</option>
                    {plantillasComisiones.map(plantilla => (
                      <option key={plantilla.id} value={plantilla.id}>{plantilla.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plantilla de cupos</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={nuevaFuncion.idPlantillaCupos}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, idPlantillaCupos: e.target.value })}
                  >
                    <option value="">No existen plantillas de cupos activas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pool códigos de barras</label>
                  <select
                    className="border p-2 w-full rounded"
                    value={nuevaFuncion.idBarcodePool}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, idBarcodePool: e.target.value })}
                  >
                    <option value="">Selecciona pool de códigos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Opciones</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="permitePagoPlazos"
                      checked={nuevaFuncion.permitePagoPlazos}
                      onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, permitePagoPlazos: e.target.checked })}
                    />
                    <label htmlFor="permitePagoPlazos" className="text-sm font-medium text-gray-700">
                      Pago a plazos
                    </label>
                  </div>
                  {nuevaFuncion.permitePagoPlazos && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número máximo de pagos
                      </label>
                      <select
                        className="border p-2 w-full rounded"
                        value={nuevaFuncion.numPlazosPago}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, numPlazosPago: parseInt(e.target.value) })}
                      >
                        <option value={0}>Selecciona el máximo número de plazos</option>
                        {NUM_PLAZOS.map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="permiteReserva"
                    checked={nuevaFuncion.permiteReserva}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, permiteReserva: e.target.checked })}
                  />
                  <label htmlFor="permiteReserva" className="text-sm font-medium text-gray-700">
                    Permite reservas a clientes web
                    <span className="ml-1 text-gray-500">
                      <i className="fas fa-question-circle" title="Permitir reservas desde la web"></i>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Canales y periodos de venta */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Canales y periodos de venta</h4>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="mismaFechaCanales"
                    checked={nuevaFuncion.mismaFechaCanales}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, mismaFechaCanales: e.target.checked })}
                  />
                  <label htmlFor="mismaFechaCanales" className="text-sm font-medium text-gray-700">
                    Misma fecha en todos los canales
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inicio venta</label>
                    <input
                      type="datetime-local"
                      className="border p-2 w-full rounded"
                      value={nuevaFuncion.fechaInicioVenta}
                      onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, fechaInicioVenta: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fin venta</label>
                    <input
                      type="datetime-local"
                      className="border p-2 w-full rounded"
                      value={nuevaFuncion.fechaFinVenta}
                      onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, fechaFinVenta: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Tabla de canales */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              className="channelsChk"
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNuevaFuncion({
                                  ...nuevaFuncion,
                                  canales: {
                                    boxOffice: { ...nuevaFuncion.canales.boxOffice, activo: checked },
                                    internet: { ...nuevaFuncion.canales.internet, activo: checked }
                                  }
                                });
                              }}
                            />
                            <span>Canales activos</span>
                          </div>
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Inicio venta</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Fin venta</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={nuevaFuncion.canales.boxOffice.activo}
                              onChange={(e) => setNuevaFuncion({
                                ...nuevaFuncion,
                                canales: {
                                  ...nuevaFuncion.canales,
                                  boxOffice: { ...nuevaFuncion.canales.boxOffice, activo: e.target.checked }
                                }
                              })}
                            />
                            <span>Box office</span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="datetime-local"
                            className="border p-2 w-full rounded"
                            value={nuevaFuncion.canales.boxOffice.inicio}
                            onChange={(e) => setNuevaFuncion({
                              ...nuevaFuncion,
                              canales: {
                                ...nuevaFuncion.canales,
                                boxOffice: { ...nuevaFuncion.canales.boxOffice, inicio: e.target.value }
                              }
                            })}
                            disabled={!nuevaFuncion.canales.boxOffice.activo}
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="datetime-local"
                            className="border p-2 w-full rounded"
                            value={nuevaFuncion.canales.boxOffice.fin}
                            onChange={(e) => setNuevaFuncion({
                              ...nuevaFuncion,
                              canales: {
                                ...nuevaFuncion.canales,
                                boxOffice: { ...nuevaFuncion.canales.boxOffice, fin: e.target.value }
                              }
                            })}
                            disabled={!nuevaFuncion.canales.boxOffice.activo}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={nuevaFuncion.canales.internet.activo}
                              onChange={(e) => setNuevaFuncion({
                                ...nuevaFuncion,
                                canales: {
                                  ...nuevaFuncion.canales,
                                  internet: { ...nuevaFuncion.canales.internet, activo: e.target.checked }
                                }
                              })}
                            />
                            <span>Internet</span>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="datetime-local"
                            className="border p-2 w-full rounded"
                            value={nuevaFuncion.canales.internet.inicio}
                            onChange={(e) => setNuevaFuncion({
                              ...nuevaFuncion,
                              canales: {
                                ...nuevaFuncion.canales,
                                internet: { ...nuevaFuncion.canales.internet, inicio: e.target.value }
                              }
                            })}
                            disabled={!nuevaFuncion.canales.internet.activo}
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <input
                            type="datetime-local"
                            className="border p-2 w-full rounded"
                            value={nuevaFuncion.canales.internet.fin}
                            onChange={(e) => setNuevaFuncion({
                              ...nuevaFuncion,
                              canales: {
                                ...nuevaFuncion.canales,
                                internet: { ...nuevaFuncion.canales.internet, fin: e.target.value }
                              }
                            })}
                            disabled={!nuevaFuncion.canales.internet.activo}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Fechas de cancelación */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Fechas de cancelación</h4>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cancellationDateSelected"
                    checked={nuevaFuncion.cancellationDateSelected}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, cancellationDateSelected: e.target.checked })}
                  />
                  <label htmlFor="cancellationDateSelected" className="text-sm font-medium text-gray-700">
                    Fecha límite para cancelar entradas
                  </label>
                </div>
                {nuevaFuncion.cancellationDateSelected && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de fin de cancelación</label>
                    <input
                      type="datetime-local"
                      className="border p-2 w-full rounded"
                      value={nuevaFuncion.endDateCancellation}
                      onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, endDateCancellation: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bloqueo de impresión de tickets */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Bloqueo de impresión de tickets</h4>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ticketPrintingReleaseDateSelected"
                    checked={nuevaFuncion.ticketPrintingReleaseDateSelected}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, ticketPrintingReleaseDateSelected: e.target.checked })}
                  />
                  <label htmlFor="ticketPrintingReleaseDateSelected" className="text-sm font-medium text-gray-700">
                    Restringir la impresión antes de la fecha de celebración
                  </label>
                </div>
                
                {nuevaFuncion.ticketPrintingReleaseDateSelected && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de liberación de tickets</label>
                      <select
                        className="border p-2 w-full rounded"
                        value={nuevaFuncion.ticketPrintingReleaseDate}
                        onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, ticketPrintingReleaseDate: e.target.value })}
                      >
                        <optgroup label="Antes de la fecha de celebración">
                          {TIEMPOS_IMPRESION.filter(option => option.value !== 'custom').map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Fecha custom">
                          <option value="custom">Fecha personalizada</option>
                        </optgroup>
                      </select>
                    </div>
                    {nuevaFuncion.ticketPrintingReleaseDate === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecciona una fecha personalizada
                        </label>
                        <input
                          type="datetime-local"
                          className="border p-2 w-full rounded"
                          value={nuevaFuncion.customPrintingTicketDate}
                          onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, customPrintingTicketDate: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Campos personalizados */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Campos personalizados</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personalizado 1</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded"
                    placeholder="Campo personalizado 1"
                    value={nuevaFuncion.customSes1}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, customSes1: e.target.value })}
                    maxLength={250}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Personalizado 2</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded"
                    placeholder="Campo personalizado 2"
                    value={nuevaFuncion.customSes2}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, customSes2: e.target.value })}
                    maxLength={250}
                  />
                </div>
              </div>
            </div>

            {/* Controles de Activación */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Estado y Visibilidad</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={nuevaFuncion.activo}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, activo: e.target.checked })}
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700">Activar Función</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="visibleEnBoleteria"
                    checked={nuevaFuncion.visibleEnBoleteria}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, visibleEnBoleteria: e.target.checked })}
                  />
                  <label htmlFor="visibleEnBoleteria" className="text-sm font-medium text-gray-700">Visible en Boletería</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="visibleEnStore"
                    checked={nuevaFuncion.visibleEnStore}
                    onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, visibleEnStore: e.target.checked })}
                  />
                  <label htmlFor="visibleEnStore" className="text-sm font-medium text-gray-700">Visible en Store</label>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => {
                  setModalIsOpen(false);
                  setEditingFuncion(null);
                  resetNuevaFuncion();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingFuncion ? 'Actualizar' : 'Crear'} Función
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Funciones;
