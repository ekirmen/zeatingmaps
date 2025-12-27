import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { useRecinto } from '../contexts/RecintoContext';
import { supabase } from '../../supabaseClient';
import { syncSeatsForSala } from '../services/apibackoffice';
import { useTenant } from '../../contexts/TenantContext';
import formatDateString from '../../utils/formatDateString';
import funcionesService from '../../services/funcionesService';
import { checkAndRefreshAuth } from '../../utils/authUtils';

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

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkInitialAuth = async () => {
      const { session, error } = await checkAndRefreshAuth();
      if (error || !session?.user) {
      } else {
      }
    };

    checkInitialAuth();

    // Exponer función de prueba globalmente para debugging
    window.testFuncionesAuth = async () => {
      try {
        const { session, error } = await checkAndRefreshAuth();
        if (error || !session?.user) {
          console.error('❌ No hay sesión activa');
          return;
        }
        // Probar lectura
        const { data, error: readError } = await supabase
          .from('funciones')
          .select('id, fecha_celebracion')
          .limit(1);

        if (readError) {
          console.error('❌ Error leyendo funciones:', readError);
        } else {
        }
      } catch (err) {
        console.error('❌ Error en prueba:', err);
      }
    };

    // Función para verificar el estado actual del componente
    window.checkFuncionesState = () => {
    };

    // Función para forzar la recarga de funciones
    window.reloadFunciones = async () => {
      await loadFunciones();
    };

    // Función para probar carga de funciones
    window.testLoadFunciones = async () => {
      try {
        // Probar diferentes nombres de tabla
        const tableNames = ['funciones', 'function', 'sessions', 'eventos_sessions'];

        for (const tableName of tableNames) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            if (error.code === 'PGRST116') {
              console.log(`❌ Tabla '${tableName}' no existe (404)`);
            } else {
            }
          } else {
            break; // Si encontramos una tabla que funciona, usarla
          }
        }

        // Probar sin filtros en la tabla funciones
        const { data: allFunciones, error: allError } = await supabase
          .from('funciones')
          .select('id, fecha_celebracion, sala_id, evento_id, tenant_id, creadopor')
          .limit(10);

        if (allError) {
          console.error('❌ Error leyendo todas las funciones:', allError);
        } else {
        }

        // Probar con filtro de sala
        if (salaSeleccionada?.id) {
          const { data: salaFunciones, error: salaError } = await supabase
            .from('funciones')
            .select('id, fecha_celebracion, sala_id, evento_id, tenant_id, creadopor')
            .eq('sala_id', salaSeleccionada.id);

          if (salaError) {
            console.error('❌ Error leyendo funciones de sala:', salaError);
          } else {
          }
        }
      } catch (err) {
        console.error('❌ Error en prueba:', err);
      }
    };
  }, []);
  const { recintoSeleccionado, salaSeleccionada, setRecintoSeleccionado, setSalaSeleccionada, recintos } = useRecinto();

  // Debug: Mostrar estado de recinto y sala
  useEffect(() => {
  }, [recintoSeleccionado, salaSeleccionada, recintos]);

  // Debug eliminado
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillasComisiones, setPlantillasComisiones] = useState([]);
  const [plantillasProductos, setPlantillasProductos] = useState([]);
  const [plantillasPaquetes, setPlantillasPaquetes] = useState([]);
  const [loadingPlantillasPaquetes, setLoadingPlantillasPaquetes] = useState(false);
  const [loadingPlantillasProductos, setLoadingPlantillasProductos] = useState(false);
  const [funciones, setFunciones] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingFuncion, setEditingFuncion] = useState(null);
  const LAST_FUNC_KEY = 'backoffice_last_funcion_form';

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
    idSala: salaSeleccionada?.id || null,
    idPlantillaEntradas: null,
    idPlantillaProductos: null,
    idPlantillaPaquetes: null,
    idSpecialProductsTemplate: null,
    idPlantillaCupos: null,
    permitePagoPlazos: false,
    cantidadCuotas: 0,
    diasEntrePagos: 0,
    fechaInicioPagosPlazos: '',
    fechaFinPagosPlazos: '',
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
    idBarcodePool: null,
    activo: true,
    visibleEnBoleteria: true,
    visibleEnStore: true
  });

  // Cargar último formulario usado al iniciar y cuando cambie la sala seleccionada
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_FUNC_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setNuevaFuncion(prev => ({
          ...prev,
          ...saved,
          idSala: salaSeleccionada?.id || saved.idSala || prev.idSala || null,
        }));
      }
    } catch (e) {
      /* omitido */
    }
  }, [salaSeleccionada]);

  // Persistir cambios del formulario para reutilizarlos al crear otra función
  useEffect(() => {
    try {
      localStorage.setItem(LAST_FUNC_KEY, JSON.stringify(nuevaFuncion));
    } catch (e) {
      /* omitido */
    }
  }, [nuevaFuncion]);

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

  // Helper function to convert empty strings to null for timestamp fields
  const formatTimestampField = (value) => {
    return value === '' ? null : value;
  };

  // Helper function to convert ISO timestamp to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';

      // Get local date components
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting datetime-local:', error);
      return '';
    }
  };

  // Helper function to convert empty strings to null for integer fields
  const formatIntegerField = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    return parseInt(value) || null;
  };

  // Helper function to convert empty strings to null for UUID fields
  const formatUUIDField = (value) => {
    if (value === '' || value === null || value === undefined) return null;

    // Convert to string if it's a number or other type
    const stringValue = String(value);

    // Check if it's a valid UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(stringValue)) {
      return stringValue;
    }

    // If it's not a valid UUID, return null
    /* omitido */
    return null;
  };

  // Helper function for ID fields that can be integers or UUIDs
  const formatIDField = (value) => {
    if (value === '' || value === null || value === undefined) return null;

    // If it's already a number, return it
    if (typeof value === 'number') return value;

    // Convert to string and check if it's a number
    const stringValue = String(value);
    const numValue = parseInt(stringValue);

    // If it's a valid number, return it
    if (!isNaN(numValue)) return numValue;

    // If it's not a number, check if it's a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(stringValue)) {
      return stringValue;
    }

    // If it's neither a number nor a UUID, return null
    /* omitido */
    return null;
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

  // Función para calcular fecha de apertura de puertas (2 horas antes)
  const calcularAperturaPuertas = (fechaCelebracion) => {
    if (!fechaCelebracion) return '';
    const fecha = new Date(fechaCelebracion);
    // Restar 2 horas exactas
    fecha.setHours(fecha.getHours() - 2);
    // Formatear para datetime-local (YYYY-MM-DDTHH:MM)
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Función para sincronizar fechas de canales
  const sincronizarFechasCanales = (fechaInicio, fechaFin) => {
    if (nuevaFuncion.mismaFechaCanales) {
      setNuevaFuncion(prev => ({
        ...prev,
        canales: {
          boxOffice: { ...prev.canales.boxOffice, inicio: fechaInicio || '', fin: fechaFin || '' },
          internet: { ...prev.canales.internet, inicio: fechaInicio || '', fin: fechaFin || '' }
        }
      }));
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
      idSala: salaSeleccionada?.id || nuevaFuncion.idSala || null,
      idPlantillaEntradas: null,
      idPlantillaProductos: null,
      idPlantillaPaquetes: null,
      idSpecialProductsTemplate: null,
      idPlantillaCupos: null,
      permitePagoPlazos: false,
      cantidadCuotas: 0,
      diasEntrePagos: 0,
      fechaInicioPagosPlazos: '',
      fechaFinPagosPlazos: '',
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
      idBarcodePool: null,
      activo: true,
      visibleEnBoleteria: true,
      visibleEnStore: true
    });
  };

  // Cargar último formulario guardado (helper para botón "Nueva Función")
  const loadLastNuevaFuncion = () => {
    try {
      const raw = localStorage.getItem(LAST_FUNC_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setNuevaFuncion(prev => ({
          ...prev,
          ...saved,
          idSala: salaSeleccionada?.id || saved.idSala || prev.idSala || null,
        }));
      } else {
        resetNuevaFuncion();
      }
    } catch (e) {
      /* omitido */
      resetNuevaFuncion();
    }
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
          console.error('❌ [fetchEventos] Error cargando eventos:', error);
        } else {
          setEventos(data || []);
        }
      }
    };

    fetchEventos();
  }, [salaSeleccionada, recintoSeleccionado]);

  // Fetch funciones
  const loadFunciones = useCallback(async () => {
    if (!salaSeleccionada?.id) {
      return;
    }
    try {
      // Intentar con la tabla 'funciones' primero
      let { data, error } = await supabase
        .from('funciones')
        .select(`
          id,
          fecha_celebracion,
          inicio_venta,
          fin_venta,
          permite_pago_plazos,
          permite_reserva,
          tiempo_caducidad_reservas,
          fecha_liberacion_reservas,
          evento_id,
          sala_id,
          plantilla_entradas,
          plantilla_comisiones,
          plantilla_producto,
          canales,
          activo,
          visible_en_boleteria,
          visible_en_store,
          plantilla,
          zona_horaria,
          lit_sesion,
          utiliza_lit_sesion,
          apertura_puertas,
          promotional_session_label,
          session_belongs_season_pass,
          streaming_mode,
          streaming_type,
          streaming_url,
          streaming_id,
          streaming_password,
          streaming_only_one_session_by_ticket,
          streaming_show_url,
          streaming_transmission_start,
          streaming_transmission_stop,
          plantilla_cupos,
          id_barcode_pool,
          cantidad_cuotas,
          dias_entre_pagos,
          fecha_inicio_pagos_plazos,
          fecha_fin_pagos_plazos,
          misma_fecha_canales,
          cancellation_date_selected,
          end_date_cancellation,
          ticket_printing_release_date_selected,
          ticket_printing_release_date,
          custom_printing_ticket_date,
          custom_ses1,
          custom_ses2,
          recinto_id,
          tenant_id,
          creadopor,
          created_at,
          updated_at,
          eventos!evento_id(id, nombre),
          salas!sala_id(id, nombre),
          plantillas!plantilla_entradas(id, nombre)
        `)
        .eq('sala_id', salaSeleccionada.id)
        .order('fecha_celebracion', { ascending: true });

      // Si la tabla 'funciones' no existe (404), intentar con nombres alternativos
      if (error && error.code === 'PGRST116') {
        const alternativeTables = ['sessions', 'eventos_sessions', 'function'];

        for (const tableName of alternativeTables) {
          const result = await supabase
            .from(tableName)
            .select('*')
            .eq('sala_id', salaSeleccionada.id)
            .limit(10);

          if (!result.error) {
            data = result.data;
            error = null;
            break;
          } else if (result.error.code !== 'PGRST116') {
          }
        }
      }

      if (error) {
        console.error('❌ [loadFunciones] Error cargando funciones:', error);
        console.error('🔍 [loadFunciones] Detalles del error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Si es un error 404, mostrar mensaje específico
        if (error.code === 'PGRST116') {
          console.error('💡 [loadFunciones] La tabla "funciones" no existe en la base de datos');
          console.error('💡 [loadFunciones] Necesitas crear la tabla o verificar el nombre correcto');
        }

        setFunciones([]);
        return;
      }
      setFunciones(data || []);
    } catch (error) {
      console.error('❌ [loadFunciones] Error inesperado:', error);
      setFunciones([]);
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
            pagoAPlazos:permite_pago_plazos,
            permitirReservasWeb:permite_reserva,
            tiempoCaducidadReservas:tiempo_caducidad_reservas,
            fechaLiberacionReservas:fecha_liberacion_reservas,
            evento_id,
            sala_id,
            plantilla_entradas,
            plantilla_comisiones,
            plantilla_producto
          `);

        if (error) {
          /* omitido */
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
        /* omitido */
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
        /* omitido */
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
        // Si la tabla no existe, establecer un array vacío
        if (error.code === '42P01') { // undefined_table
          setPlantillasProductos([]);
        } else {
          setPlantillasProductos([]);
        }
      } else {
        setPlantillasProductos(data || []);
      }
    } catch (error) {
      /* omitido */
      setPlantillasProductos([]);
    } finally {
      setLoadingPlantillasProductos(false);
    }
  };

  useEffect(() => {
    fetchPlantillasProductos();
  }, []);

  const fetchPlantillasPaquetes = async () => {
    setLoadingPlantillasPaquetes(true);
    try {
      const { data, error } = await supabase
        .from('plantillas_paquetes')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) {
        if (error.code === '42P01') {
          setPlantillasPaquetes([]);
        } else {
          setPlantillasPaquetes([]);
        }
      } else {
        setPlantillasPaquetes(data || []);
      }
    } catch (error) {
      setPlantillasPaquetes([]);
    } finally {
      setLoadingPlantillasPaquetes(false);
    }
  };

  useEffect(() => {
    fetchPlantillasPaquetes();
  }, []);

  // Actualizar la sala automáticamente cuando cambie la sala seleccionada
  useEffect(() => {
    if (salaSeleccionada?.id) {
      setNuevaFuncion(prev => ({
        ...prev,
        idSala: salaSeleccionada.id
      }));
    }
  }, [salaSeleccionada]);

  // Sincronizar fechas de canales cuando se marque/desmarque "Misma fecha en todos los canales"
  useEffect(() => {
    if (nuevaFuncion.mismaFechaCanales && nuevaFuncion.fechaInicioVenta && nuevaFuncion.fechaFinVenta) {
      sincronizarFechasCanales(nuevaFuncion.fechaInicioVenta, nuevaFuncion.fechaFinVenta);
    }
  }, [nuevaFuncion.mismaFechaCanales]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Verificar autenticación antes de proceder
      const { session, error: authError } = await checkAndRefreshAuth();
      if (authError || !session?.user) {
        console.error('❌ Error de autenticación:', authError);
        // Intentar obtener más información sobre el estado de autenticación
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        alert('Error de autenticación. Por favor, inicie sesión nuevamente.');
        return;
      }
      // Validar que la fecha de inicio de venta sea anterior a la fecha de celebración
      if (new Date(nuevaFuncion.fechaInicioVenta) >= new Date(nuevaFuncion.fechaCelebracion)) {
        alert('La fecha de inicio de venta debe ser anterior a la fecha de celebración');
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

      // Validar que las fechas requeridas no estén vacías
      if (!nuevaFuncion.fechaCelebracion) {
        alert('La fecha de celebración es obligatoria');
        return;
      }
      if (!nuevaFuncion.fechaInicioVenta) {
        alert('La fecha de inicio de venta es obligatoria');
        return;
      }
      if (!nuevaFuncion.fechaFinVenta) {
        alert('La fecha de fin de venta es obligatoria');
        return;
      }

      // Validar que los UUIDs requeridos estén presentes
      if (!eventoSeleccionado) {
        alert('Debe seleccionar un evento');
        return;
      }
      if (!nuevaFuncion.idSala) {
        alert('Debe seleccionar una sala');
        return;
      }
      if (!currentTenant?.id) {
        alert('Error: No se pudo obtener el tenant actual');
        return;
      }
      if (!recintoSeleccionado?.id) {
        alert('Error: No se pudo obtener el recinto seleccionado');
        return;
      }

      // Validación adicional para sala_id
      if (!nuevaFuncion.idSala) {
        alert('Error: El ID de la sala es requerido');
        return;
      }

      // logs omitidos

      const funcionData = {
        evento_id: formatUUIDField(eventoSeleccionado?.id),
        sala_id: formatIDField(nuevaFuncion.idSala),
        fecha_celebracion: nuevaFuncion.fechaCelebracion,
        zona_horaria: nuevaFuncion.zonaHoraria,
        lit_sesion: nuevaFuncion.litSesion,
        utiliza_lit_sesion: nuevaFuncion.utilizaLitSesion,
        tiempo_caducidad_reservas: nuevaFuncion.tiempoCaducidadReservas,
        apertura_puertas: formatTimestampField(nuevaFuncion.aperturaPuertas),
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
        streaming_transmission_start: formatTimestampField(nuevaFuncion.streamingTransmissionStart),
        streaming_transmission_stop: formatTimestampField(nuevaFuncion.streamingTransmissionStop),
        // Persistir plantilla en ambas columnas por compatibilidad
        plantilla: formatIntegerField(nuevaFuncion.idPlantillaEntradas),
        plantilla_entradas: formatIntegerField(nuevaFuncion.idPlantillaEntradas),
        plantilla_producto: formatIntegerField(nuevaFuncion.idPlantillaProductos),
        plantilla_paquetes: formatIntegerField(nuevaFuncion.idPlantillaPaquetes),
        plantilla_comisiones: formatIntegerField(nuevaFuncion.idSpecialProductsTemplate),
        plantilla_cupos: formatIntegerField(nuevaFuncion.idPlantillaCupos),
        permite_pago_plazos: nuevaFuncion.permitePagoPlazos,
        cantidad_cuotas: formatIntegerField(nuevaFuncion.cantidadCuotas),
        dias_entre_pagos: formatIntegerField(nuevaFuncion.diasEntrePagos),
        fecha_inicio_pagos_plazos: formatTimestampField(nuevaFuncion.fechaInicioPagosPlazos),
        fecha_fin_pagos_plazos: formatTimestampField(nuevaFuncion.fechaFinPagosPlazos),
        permite_reserva: nuevaFuncion.permiteReserva,
        misma_fecha_canales: nuevaFuncion.mismaFechaCanales,
        inicio_venta: nuevaFuncion.fechaInicioVenta,
        fin_venta: nuevaFuncion.fechaFinVenta,
        canales: nuevaFuncion.canales,
        cancellation_date_selected: nuevaFuncion.cancellationDateSelected,
        end_date_cancellation: formatTimestampField(nuevaFuncion.endDateCancellation),
        ticket_printing_release_date_selected: nuevaFuncion.ticketPrintingReleaseDateSelected,
        ticket_printing_release_date: nuevaFuncion.ticketPrintingReleaseDate,
        custom_printing_ticket_date: formatTimestampField(nuevaFuncion.customPrintingTicketDate),
        custom_ses1: nuevaFuncion.customSes1,
        custom_ses2: nuevaFuncion.customSes2,
        id_barcode_pool: formatIntegerField(nuevaFuncion.idBarcodePool),
        activo: nuevaFuncion.activo,
        visible_en_boleteria: nuevaFuncion.visibleEnBoleteria,
        visible_en_store: nuevaFuncion.visibleEnStore,
        tenant_id: formatUUIDField(currentTenant?.id),
        recinto_id: formatIDField(recintoSeleccionado?.id),
        creadopor: session.user.id // Usar el ID del usuario de la sesión
      };
      // Validación final antes de enviar
      if (!funcionData.sala_id) {
        alert('Error: El ID de la sala no puede ser null. Por favor, seleccione una sala.');
        return;
      }

      // Validación del tenant_id
      if (!funcionData.tenant_id) {
        alert('Error: El tenant_id no puede ser null. Por favor, verifique la configuración del tenant.');
        return;
      }

      if (editingFuncion) {
        const { data: updatedData, error } = await supabase
          .from('funciones')
          .update(funcionData)
          .eq('id', editingFuncion.id)
          .select();

        if (error) {
          console.error('❌ Error actualizando función:', error);
          console.error('🔍 Detalles del error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        alert('Función actualizada exitosamente');
      } else {
        const { data: insertedData, error } = await supabase
          .from('funciones')
          .insert([funcionData])
          .select();

        if (error) {
          console.error('❌ Error creando función:', error);
          console.error('🔍 Detalles del error:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        // Enviar notificación push si la función está en canal internet
        if (insertedData && insertedData[0]) {
          try {
            // Asegurar que la función tenga los datos necesarios para la notificación
            const funcionCreada = insertedData[0];

            // Si canales viene como string, parsearlo para la verificación
            if (typeof funcionCreada.canales === 'string') {
              try {
                funcionCreada.canales = JSON.parse(funcionCreada.canales);
              } catch (e) {
              }
            }

            const { sendFunctionCreatedNotification } = await import('../../services/eventPushNotifications');
            const result = await sendFunctionCreatedNotification(funcionCreada);

            if (result) {
              if (result.skipped) {
              } else if (result.sent > 0) {
                alert(`Función creada exitosamente. Notificaciones enviadas a ${result.sent} usuarios.`);
              } else {
                alert('Función creada exitosamente');
              }
            } else {
              alert('Función creada exitosamente');
            }
          } catch (error) {
            console.error('[Funciones] Error enviando notificaciones push:', error);
            // No fallar el guardado si falla la notificación
            alert('Función creada exitosamente');
          }
        } else {
          alert('Función creada exitosamente');
        }
      }

      setModalIsOpen(false);
      setEditingFuncion(null);
      resetNuevaFuncion();

      loadFunciones();
    } catch (error) {
      console.error('❌ Error al guardar la función:', error);
      alert('Error al guardar la función: ' + error.message);
    }
  };

  const handleEdit = async (funcion) => {
    setEditingFuncion(funcion);

    try {
      // Traer el registro completo por id (por si el listado no incluyó todos los campos)
      const { data: full, error } = await supabase
        .from('funciones')
        .select('*')
        .eq('id', funcion.id)
        .single();
      const f = error ? funcion : (full || funcion);

      // Parsear canales si viene en string
      let canalesParsed = f.canales;
      if (typeof canalesParsed === 'string') {
        try { canalesParsed = JSON.parse(canalesParsed); } catch (_) { canalesParsed = null; }
      }

      const funcionEditada = {
        // Campos base y equivalencias
        fechaCelebracion: formatDateTimeLocal(f.fecha_celebracion),
        zonaHoraria: f.zona_horaria || 'America/Mexico_City',
        litSesion: f.lit_sesion || '',
        utilizaLitSesion: f.utiliza_lit_sesion || false,
        tiempoCaducidadReservas: f.tiempo_caducidad_reservas ?? -120,
        aperturaPuertas: formatDateTimeLocal(f.apertura_puertas),
        promotionalSessionLabel: f.promotional_session_label || '',
        sessionBelongsSeasonPass: f.session_belongs_season_pass || false,
        idAbonoSala: Array.isArray(f.id_abono_sala) ? f.id_abono_sala : [],

        // Streaming
        streamingMode: !!f.streaming_mode,
        overwriteStreamingSetup: !!f.overwrite_streaming_setup,
        streamingType: f.streaming_type || 'ENETRES',
        streamingUrl: f.streaming_url || '',
        streamingId: f.streaming_id || '',
        streamingPassword: f.streaming_password || '',
        streamingOnlyOneSessionByTicket: !!f.streaming_only_one_session_by_ticket,
        streamingShowUrl: !!f.streaming_show_url,
        streamingTransmissionStart: formatDateTimeLocal(f.streaming_transmission_start),
        streamingTransmissionStop: formatDateTimeLocal(f.streaming_transmission_stop),

        // Relaciones/plantillas
        idSala: f.sala_id || null,
        idPlantillaEntradas: f.plantilla_entradas ?? f.plantilla ?? null,
        idPlantillaProductos: f.plantilla_producto || null,
        idPlantillaPaquetes: f.plantilla_paquetes || null,
        idSpecialProductsTemplate: f.plantilla_comisiones || null,
        idPlantillaCupos: f.plantilla_cupos || null,

        // Opciones
        permitePagoPlazos: f.permite_pago_plazos ?? f.pago_a_plazos ?? false,
        cantidadCuotas: f.cantidad_cuotas || 0,
        diasEntrePagos: f.dias_entre_pagos || 0,
        fechaInicioPagosPlazos: formatDateTimeLocal(f.fecha_inicio_pagos_plazos),
        fechaFinPagosPlazos: formatDateTimeLocal(f.fecha_fin_pagos_plazos),
        permiteReserva: f.permite_reserva ?? f.permitir_reservas_web ?? false,
        mismaFechaCanales: f.misma_fecha_canales !== false,

        // Ventas y canales
        fechaInicioVenta: formatDateTimeLocal(f.inicio_venta),
        fechaFinVenta: formatDateTimeLocal(f.fin_venta),
        canales: canalesParsed || { boxOffice: { activo: true, inicio: '', fin: '' }, internet: { activo: true, inicio: '', fin: '' } },

        // Cancelación e impresión
        cancellationDateSelected: !!f.cancellation_date_selected,
        endDateCancellation: f.end_date_cancellation || '',
        ticketPrintingReleaseDateSelected: !!f.ticket_printing_release_date_selected,
        ticketPrintingReleaseDate: typeof f.ticket_printing_release_date === 'number' ? f.ticket_printing_release_date : 120,
        customPrintingTicketDate: f.custom_printing_ticket_date || '',

        // Custom fields
        customSes1: f.custom_ses1 || '',
        customSes2: f.custom_ses2 || '',

        // Otros
        idBarcodePool: f.id_barcode_pool || null,
        visibleEnBoleteria: f.visible_en_boleteria !== false,
        visibleEnStore: f.visible_en_store !== false,
        activo: f.activo !== false
      };

      setNuevaFuncion(funcionEditada);

      // Sincronizar filtros superiores (recinto, sala, evento)
      try {
        let encontradoRecinto = null;
        let encontradaSala = null;
        for (const recinto of recintos) {
          const sala = (recinto.salas || []).find(s => String(s.id) === String(f.sala_id));
          if (sala) {
            encontradoRecinto = recinto;
            encontradaSala = sala;
            break;
          }
        }
        if (encontradoRecinto) setRecintoSeleccionado(encontradoRecinto);
        if (encontradaSala) setSalaSeleccionada(encontradaSala);
        const eventoSel = eventos.find(ev => String(ev.id) === String(f.evento_id));
        if (eventoSel) setEventoSeleccionado(eventoSel);
      } catch (_) { }

      setModalIsOpen(true);
    } catch (e) {
      // Si falla el fetch, abrir con lo que teníamos
      setModalIsOpen(true);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta función?')) return;

    try {
      await funcionesService.eliminarFuncion(id);
      await loadFunciones();
    } catch (error) {
      console.error('Error al eliminar función:', error);
      alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDuplicate = async (id) => {
    try {
      // Fetch the function to duplicate
      const { data, error } = await supabase.from('funciones').select('*').eq('id', id).single();

      if (error || !data) {
        console.error('Error fetching function:', error);
        alert('No se pudo obtener la función para duplicar');
        return;
      }

      // Exclude fields that might cause unique constraint violations
      const {
        id: _,
        created_at,
        updated_at,
        slug,
        ...duplicatedData
      } = data;

      // Add a suffix to the name to indicate it's a duplicate
      if (duplicatedData.nombre) {
        duplicatedData.nombre = `${duplicatedData.nombre} (Copia)`;
      }

      // Insert the duplicated function
      const { data: newFunction, error: insertError } = await supabase
        .from('funciones')
        .insert([duplicatedData])
        .select()
        .single();

      if (insertError) {
        console.error('Error duplicating function:', insertError);
        alert(`Error al duplicar: ${insertError.message || 'Error desconocido'}`);
        return;
      }

      // Sync seats if sala is specified
      if (duplicatedData.sala) {
        try {
          await syncSeatsForSala(duplicatedData.sala);
        } catch (syncError) {
          console.error('Error syncing seats:', syncError);
          // Don't fail the duplication if seat sync fails
        }
      }

      // Reload functions to show the new one
      await loadFunciones();
      alert('Función duplicada correctamente');
    } catch (err) {
      console.error('Unexpected error during duplication:', err);
      alert('Error inesperado al duplicar la función');
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Funciones</h1>
                <p className="text-lg text-gray-600">
                  Administra las funciones, precios y configuraciones de tus eventos
                </p>
              </div>
              <button
                onClick={() => {
                  setRecintoSeleccionado(null);
                  setSalaSeleccionada(null);
                  setEventoSeleccionado(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Selectores de Recinto, Sala y Evento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Selector Recinto */}
              <div className="w-full">
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  Seleccionar Recinto *
                </label>
                <select
                  value={recintoSeleccionado ? recintoSeleccionado.id : ''}
                  onChange={(e) => {
                    const recinto = recintos.find(r => String(r.id) === e.target.value);
                    setRecintoSeleccionado(recinto);
                    setSalaSeleccionada(null);
                  }}
                  className="w-full px-4 py-3.5 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer min-h-[48px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px'
                  }}
                >
                  <option value="" disabled style={{ color: '#999' }}>Seleccionar Recinto</option>
                  {recintos.map(recinto => (
                    <option key={recinto.id} value={recinto.id} style={{ color: '#333' }}>{recinto.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selector Sala */}
              {recintoSeleccionado && (
                <div className="w-full">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Seleccionar Sala *
                  </label>
                  <select
                    value={salaSeleccionada ? salaSeleccionada.id : ''}
                    onChange={(e) => {
                      const sala = recintoSeleccionado.salas.find(s => String(s.id) === e.target.value);
                      setSalaSeleccionada(sala);
                    }}
                    className="w-full px-4 py-3.5 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer min-h-[48px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '40px'
                    }}
                  >
                    <option value="" disabled style={{ color: '#999' }}>Seleccionar Sala</option>
                    {recintoSeleccionado.salas && recintoSeleccionado.salas.map(sala => (
                      <option key={sala.id} value={sala.id} style={{ color: '#333' }}>{sala.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector Evento (Sólo aparece cuando hay sala seleccionada) */}
              {salaSeleccionada && (
                <div className="w-full">
                  <label className="block text-base font-semibold text-gray-800 mb-3">
                    Seleccionar Evento
                  </label>
                  <select
                    value={eventoSeleccionado ? eventoSeleccionado.id : ''}
                    onChange={(e) => {
                      const evento = eventos.find(ev => String(ev.id) === e.target.value);
                      setEventoSeleccionado(evento);
                    }}
                    className="w-full px-4 py-3.5 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white appearance-none cursor-pointer min-h-[48px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: '40px'
                    }}
                  >
                    <option value="" style={{ color: '#999' }}>Todos los eventos</option>
                    {eventos.map(evento => (
                      <option key={evento.id} value={evento.id} style={{ color: '#333' }}>{evento.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Acción: Nueva Función */}
            {recintoSeleccionado && salaSeleccionada && (
              <div className="flex items-center gap-3 flex-shrink-0 mt-4 lg:mt-0 lg:self-end">
                <button
                  onClick={() => {
                    setEditingFuncion(null);
                    loadLastNuevaFuncion();
                    setModalIsOpen(true);
                  }}
                  disabled={!recintoSeleccionado || !salaSeleccionada || !eventoSeleccionado}
                  className={`px-6 py-3.5 rounded-lg shadow-sm transition-all duration-200 font-semibold flex items-center justify-center gap-2 whitespace-nowrap min-h-[48px] ${recintoSeleccionado && salaSeleccionada && eventoSeleccionado
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  title={!eventoSeleccionado ? "Selecciona un evento primero" : ""}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nueva Función
                </button>
              </div>
            )}
          </div>

          {/* Instrucciones */}
          {(!recintoSeleccionado || !salaSeleccionada) && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Instrucciones</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Selecciona un <strong>Recinto</strong></li>
                  <li>Selecciona una <strong>Sala</strong></li>
                  <li>Selecciona un <strong>Evento</strong> (opcional para ver, requerido para crear)</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Tabla Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Evento</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Sala</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Plantillas</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Venta</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {funciones.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-base">
                      {recintoSeleccionado || salaSeleccionada || eventoSeleccionado
                        ? 'No se encontraron funciones con los filtros seleccionados'
                        : 'Selecciona los filtros arriba para ver las funciones.'
                      }
                    </td>
                  </tr>
                ) : (
                  funciones.map((funcion, index) => (
                    <tr
                      key={funcion.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatFecha(funcion.fechaCelebracion)}</div>
                        <div className="text-xs text-gray-500 mt-1">{funcion.hora || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{getEventoNombre(funcion.evento_id)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {funcion.sala?.nombre || 'Sin sala'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            🎟️ {getPlantillaNombre(funcion.plantilla_entradas)}
                          </span>
                          {getPlantillaProductoNombre(funcion.plantilla_producto) !== 'Sin plantilla' && (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              🍿 {getPlantillaProductoNombre(funcion.plantilla_producto)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <div><span className="font-medium">Inicio:</span> {formatFecha(funcion.inicioVenta)}</div>
                          <div><span className="font-medium">Fin:</span> {formatFecha(funcion.finVenta)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          {funcion.pagoAPlazos && (
                            <span className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-100" title="Pago a plazos">💳</span>
                          )}
                          {funcion.permitirReservasWeb && (
                            <span className="p-1 rounded bg-green-50 text-green-600 border border-green-100" title="Reservas web">🌐</span>
                          )}
                          {!funcion.pagoAPlazos && !funcion.permitirReservasWeb && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(funcion)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDuplicate(funcion.id)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Duplicar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(funcion.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
        }}
        className="bg-white rounded-lg shadow-xl max-w-7xl mx-auto w-full focus:outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        style={{
          overlay: { zIndex: 2001 },
          content: {
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
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

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onChange={(e) => {
                      const fechaCelebracion = e.target.value;
                      const aperturaPuertas = calcularAperturaPuertas(fechaCelebracion);
                      setNuevaFuncion({
                        ...nuevaFuncion,
                        fechaCelebracion,
                        aperturaPuertas
                      });
                    }}
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

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> La sala se selecciona automáticamente desde el buscador de recinto/sala/evento en la parte superior.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plantilla de paquetes</label>
                    <select
                      className="border p-2 w-full rounded"
                      value={nuevaFuncion.idPlantillaPaquetes}
                      onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, idPlantillaPaquetes: e.target.value })}
                    >
                      <option value="">No existen plantillas de paquetes activas</option>
                      {plantillasPaquetes.map((plantilla) => (
                        <option key={plantilla.id} value={plantilla.id}>
                          {plantilla.nombre}
                        </option>
                      ))}
                    </select>
                    {loadingPlantillasPaquetes && (
                      <p className="text-xs text-gray-500 mt-1">Cargando plantillas de paquetes...</p>
                    )}
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
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cantidad de cuotas
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="12"
                            className="border p-2 w-full rounded"
                            value={nuevaFuncion.cantidadCuotas || ''}
                            onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, cantidadCuotas: parseInt(e.target.value) || 0 })}
                            placeholder="Ej: 3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Días entre pagos
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            className="border p-2 w-full rounded"
                            value={nuevaFuncion.diasEntrePagos || ''}
                            onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, diasEntrePagos: parseInt(e.target.value) || 0 })}
                            placeholder="Ej: 30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha inicio pagos a plazos
                          </label>
                          <input
                            type="datetime-local"
                            className="border p-2 w-full rounded"
                            value={nuevaFuncion.fechaInicioPagosPlazos || ''}
                            onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, fechaInicioPagosPlazos: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha fin pagos a plazos
                          </label>
                          <input
                            type="datetime-local"
                            className="border p-2 w-full rounded"
                            value={nuevaFuncion.fechaFinPagosPlazos || ''}
                            onChange={(e) => setNuevaFuncion({ ...nuevaFuncion, fechaFinPagosPlazos: e.target.value })}
                          />
                        </div>
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
                        onChange={(e) => {
                          const fechaInicio = e.target.value;
                          setNuevaFuncion({ ...nuevaFuncion, fechaInicioVenta: fechaInicio });
                          sincronizarFechasCanales(fechaInicio, nuevaFuncion.fechaFinVenta);
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fin venta</label>
                      <input
                        type="datetime-local"
                        className="border p-2 w-full rounded"
                        value={nuevaFuncion.fechaFinVenta}
                        onChange={(e) => {
                          const fechaFin = e.target.value;
                          setNuevaFuncion({ ...nuevaFuncion, fechaFinVenta: fechaFin });
                          sincronizarFechasCanales(nuevaFuncion.fechaInicioVenta, fechaFin);
                        }}
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
                              disabled={!nuevaFuncion.canales.boxOffice.activo || nuevaFuncion.mismaFechaCanales}
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
                              disabled={!nuevaFuncion.canales.boxOffice.activo || nuevaFuncion.mismaFechaCanales}
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
                              disabled={!nuevaFuncion.canales.internet.activo || nuevaFuncion.mismaFechaCanales}
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
                              disabled={!nuevaFuncion.canales.internet.activo || nuevaFuncion.mismaFechaCanales}
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
        </div>
      </Modal>
    </div>
  );
};

export default Funciones;
