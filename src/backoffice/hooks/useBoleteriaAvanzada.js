import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { supabase, supabaseAdmin } from '../../supabaseClient';
import { fetchMapa, fetchZonasPorSala, createPayment } from '../services/apibackoffice';
import useSelectedSeatsStore from '../../stores/useSelectedSeatsStore';

const EVENT_KEY = 'boleteriaEventId';
const FUNC_KEY = 'boleteriaFunctionId';
const CART_KEY = 'boleteriaCart';
const SELECTED_SEATS_KEY = 'boleteriaSelectedSeats';

export const useBoleteriaAvanzada = () => {
  console.log('🚀 [useBoleteriaAvanzada] Hook initialized');
  
  // Usar el store unificado para selectedFuncion y selectedEvent
  const {
    selectedFuncion,
    selectedEvent,
    setSelectedFuncion,
    setSelectedEvent,
    selectedClient,
    setSelectedClient,
    selectedAffiliate,
    setSelectedAffiliate,
    selectedSeats,
    setSelectedSeats,
    addSeat,
    removeSeat,
    clearSeats,
    getSeatCount,
    getTotalPrice,
    isSeatSelected,
    syncWithSeatLocks
  } = useSelectedSeatsStore();
  
  const [eventos, setEventos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [carrito, setCarrito] = useState(() => {
    // Cargar carrito desde localStorage al inicializar
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error cargando carrito desde localStorage:', error);
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  // Persistir carrito en localStorage
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(carrito));
  }, [carrito]);

  // Cargar eventos
  const loadEventos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEventos(data || []);
    } catch (err) {
      console.error('Error cargando eventos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar funciones de un evento
  const loadFunciones = useCallback(async (eventoId) => {
    if (!eventoId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('funciones')
        .select(`
          *,
          evento:eventos(*),
          sala:salas(*)
        `)
        .eq('evento_id', eventoId)
        .eq('activo', true)
        .order('fecha_celebracion', { ascending: true });

      if (error) throw error;
      setFunciones(data || []);
    } catch (err) {
      console.error('Error cargando funciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar plantilla de precios
  const loadPlantillaPrecios = useCallback(async (eventoId) => {
    if (!eventoId) return;
    
    try {
      const { data, error } = await supabase
        .from('plantillas_precios')
        .select('*')
        .eq('evento_id', eventoId)
        .eq('activo', true)
        .single();

      if (error) {
        console.warn('No se encontró plantilla de precios:', error);
        return;
      }
      
      setSelectedPlantilla(data);
    } catch (err) {
      console.error('Error cargando plantilla de precios:', err);
    }
  }, []);

  // Cargar mapa y zonas
  const loadMapaYZonas = useCallback(async (salaId) => {
    if (!salaId) return;
    
    try {
      setLoading(true);
      const [mapaData, zonasData] = await Promise.all([
        fetchMapa(salaId),
        fetchZonasPorSala(salaId)
      ]);
      
      setMapa(mapaData);
      setZonas(zonasData || []);
    } catch (err) {
      console.error('Error cargando mapa y zonas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manejar selección de evento
  const handleEventSelect = useCallback(async (eventoId) => {
    console.log('🎭 [useBoleteriaAvanzada] Evento seleccionado:', eventoId);
    
    const evento = eventos.find(e => e.id === eventoId);
    if (!evento) return;
    
    setSelectedEvent(evento);
    localStorage.setItem(EVENT_KEY, eventoId);
    
    // Cargar funciones y plantilla de precios
    await Promise.all([
      loadFunciones(eventoId),
      loadPlantillaPrecios(eventoId)
    ]);
  }, [eventos, loadFunciones, loadPlantillaPrecios]);

  // Manejar selección de función
  const handleFunctionSelect = useCallback(async (funcionId) => {
    console.log('🎪 [useBoleteriaAvanzada] Función seleccionada:', funcionId);
    
    const funcion = funciones.find(f => f.id === funcionId);
    if (!funcion) return;
    
    setSelectedFuncion(funcion);
    localStorage.setItem(FUNC_KEY, funcionId);
    
    // Cargar mapa y zonas si hay sala
    if (funcion.sala) {
      const salaId = typeof funcion.sala === 'object' ? funcion.sala.id : funcion.sala;
      await loadMapaYZonas(salaId);
    }
  }, [funciones, loadMapaYZonas]);

  // Obtener precio de asiento basado en zona y plantilla
  const getSeatPrice = useCallback((seat, zonaId) => {
    if (!selectedPlantilla?.detalles) return 50; // Precio por defecto
    
    try {
      const detalles = Array.isArray(selectedPlantilla.detalles) 
        ? selectedPlantilla.detalles 
        : JSON.parse(selectedPlantilla.detalles);
      
      const detalle = detalles.find(d => d.zonaId === zonaId);
      return detalle?.precio || 50;
    } catch (error) {
      console.error('Error obteniendo precio:', error);
      return 50;
    }
  }, [selectedPlantilla]);

  // Calcular estadísticas de asientos
  const calculateSeatStats = useCallback((mapa, lockedSeats, isSeatLocked, isSeatLockedByMe) => {
    if (!mapa?.contenido) return {};
    
    const stats = {};
    
    mapa.contenido.forEach(elemento => {
      if (elemento.sillas && Array.isArray(elemento.sillas)) {
        elemento.sillas.forEach(silla => {
          const zonaId = elemento.zona?.id || 'general';
          if (!stats[zonaId]) {
            stats[zonaId] = {
              total: 0,
              disponibles: 0,
              seleccionados: 0,
              vendidos: 0,
              reservados: 0,
              bloqueados: 0,
              precio: getSeatPrice(silla, zonaId)
            };
          }
          
          stats[zonaId].total++;
          
          // Determinar estado del asiento
          if (isSeatLocked && isSeatLocked(silla._id)) {
            if (isSeatLockedByMe && isSeatLockedByMe(silla._id)) {
              stats[zonaId].seleccionados++;
            } else {
              stats[zonaId].bloqueados++;
            }
          } else if (silla.estado === 'vendido' || silla.estado === 'pagado') {
            stats[zonaId].vendidos++;
          } else if (silla.estado === 'reservado') {
            stats[zonaId].reservados++;
          } else {
            stats[zonaId].disponibles++;
          }
        });
      }
    });
    
    return stats;
  }, [getSeatPrice]);

  // Sincronizar con locks de asientos
  const syncWithLocks = useCallback((lockedSeats, isSeatLocked, isSeatLockedByMe) => {
    if (syncWithSeatLocks) {
      syncWithSeatLocks(lockedSeats, isSeatLocked, isSeatLockedByMe);
    }
  }, [syncWithSeatLocks]);

  // Procesar pago
  const processPayment = useCallback(async (paymentData) => {
    try {
      console.log('💳 [useBoleteriaAvanzada] Procesando pago:', paymentData);
      
      const paymentResult = await createPayment({
        ...paymentData,
        seats: carrito,
        funcion: selectedFuncion?.id,
        event: selectedEvent?.id,
        monto: carrito.reduce((total, seat) => total + (seat.precio || 0), 0)
      });

      console.log('✅ [useBoleteriaAvanzada] Pago procesado:', paymentResult);
      
      // Limpiar carrito después del pago exitoso
      setCarrito([]);
      clearSeats();
      
      return paymentResult;
    } catch (error) {
      console.error('❌ [useBoleteriaAvanzada] Error en pago:', error);
      throw error;
    }
  }, [carrito, selectedFuncion, selectedEvent, clearSeats]);

  // Cargar datos iniciales
  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  // Restaurar selecciones desde localStorage
  useEffect(() => {
    const savedEventId = localStorage.getItem(EVENT_KEY);
    const savedFunctionId = localStorage.getItem(FUNC_KEY);
    
    if (savedEventId && eventos.length > 0) {
      const evento = eventos.find(e => e.id === savedEventId);
      if (evento) {
        setSelectedEvent(evento);
        loadFunciones(savedEventId);
        loadPlantillaPrecios(savedEventId);
      }
    }
    
    if (savedFunctionId && funciones.length > 0) {
      const funcion = funciones.find(f => f.id === savedFunctionId);
      if (funcion) {
        setSelectedFuncion(funcion);
        if (funcion.sala) {
          const salaId = typeof funcion.sala === 'object' ? funcion.sala.id : funcion.sala;
          loadMapaYZonas(salaId);
        }
      }
    }
  }, [eventos, funciones, loadFunciones, loadPlantillaPrecios, loadMapaYZonas]);

  return {
    // Estados
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    mapa,
    zonas,
    carrito,
    setCarrito,
    selectedClient,
    setSelectedClient,
    selectedAffiliate,
    setSelectedAffiliate,
    selectedSeats,
    setSelectedSeats,
    loading,
    error,
    debugInfo,
    
    // Acciones
    handleEventSelect,
    handleFunctionSelect,
    getSeatPrice,
    calculateSeatStats,
    syncWithLocks,
    processPayment,
    
    // Utilidades
    addSeat,
    removeSeat,
    clearSeats,
    getSeatCount,
    getTotalPrice,
    isSeatSelected
  };
};

export default useBoleteriaAvanzada;
