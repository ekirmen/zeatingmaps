import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { supabase } from '../../supabaseClient';
import { fetchMapa, fetchZonasPorSala } from '../../services/supabaseServices';

const EVENT_KEY = 'boleteriaEventId';
const FUNC_KEY = 'boleteriaFunctionId';

export const useBoleteria = () => {
  const [eventos, setEventos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [selectedFuncion, setSelectedFuncion] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [mapa, setMapa] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoizar el setCarrito para evitar re-renderizados
  const setCarritoMemo = useCallback((newCarrito) => {
    setCarrito(newCarrito);
  }, []);

  // Memoizar el setSelectedEvent para evitar re-renderizados
  const setSelectedEventMemo = useCallback((newEvent) => {
    setSelectedEvent(newEvent);
  }, []);

  // Manejar la selección de una función
  const handleFunctionSelect = useCallback(async (functionId) => {
    setLoading(true);
    setError(null);
    setSelectedFuncion(null);
    setSelectedPlantilla(null);
    setMapa(null);
    setZonas([]);
    setCarrito([]);

    // Ensure functionId is a primitive value
    if (typeof functionId === 'object' && functionId !== null) {
      functionId = functionId._id || functionId.id || null;
    }
  
    try {
      const { data: funcionData, error: funcionError } = await supabase
        .from('funciones')
        .select(`
          *,
          plantilla(*)
        `)
        .eq('id', functionId)
        .single();
  
      if (funcionError) throw funcionError;
      if (!funcionData) {
        message.warning('Función no encontrada.');
        return false;
      }
  
      // Mapear los campos para que coincidan con lo que espera el frontend
      const salaField = funcionData.sala;
      const mappedSala = typeof salaField === 'object' && salaField !== null
        ? salaField
        : (salaField ? { id: salaField } : null);

      const funcionMapeada = {
        ...funcionData,
        sala: mappedSala,
        fechaCelebracion: funcionData.fecha_celebracion,
        inicioVenta: funcionData.inicio_venta,
        finVenta: funcionData.fin_venta,
        pagoAPlazos: funcionData.pago_a_plazos,
        permitirReservasWeb: funcionData.permitir_reservas_web
      };
  
      setSelectedFuncion(funcionMapeada);
      localStorage.setItem(FUNC_KEY, functionId);
      
      console.log('Función seleccionada:', funcionMapeada);
      console.log('Plantilla de la función:', funcionData.plantilla);
  
      // Cargar plantilla de precios si existe
      if (funcionData.plantilla) {
        console.log('Plantilla encontrada:', funcionData.plantilla);
        setSelectedPlantilla(funcionData.plantilla);
      } else {
        console.log('No hay plantilla de precios para esta función');
        setSelectedPlantilla(null);
      }
  
      // Cargar mapa y zonas usando salaId robusto
      const salaId = mappedSala?.id || mappedSala?._id || salaField || null;
      if (salaId) {
        const mapData = await fetchMapa(salaId);
        setMapa(mapData);
  
        const zonasData = await fetchZonasPorSala(salaId);
        setZonas(zonasData);
      } else {
        setMapa(null);
        setZonas([]);
      }
  
      return true;
  
    } catch (err) {
      console.error("Error al seleccionar función:", err);
      message.error(`Error al seleccionar función: ${err.message}`);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoizar el handleEventSelect para evitar re-renderizados
  const handleEventSelect = useCallback(async (eventoId) => {
    setLoading(true);
    setError(null);
    setSelectedEvent(null);
    setSelectedFuncion(null);
    setSelectedPlantilla(null);
    setMapa(null);
    setZonas([]);
    setCarrito([]);

    try {
      const { data: eventoData, error: eventoError } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .single();

      if (eventoError) throw eventoError;
      if (!eventoData) {
        message.warning('Evento no encontrado.');
        return { success: false };
      }

      setSelectedEvent(eventoData);
      localStorage.setItem(EVENT_KEY, eventoId);

      // Cargar funciones del evento (sin embeds)
      const { data: funcionesData, error: funcionesError } = await supabase
        .from('funciones')
        .select('*')
        .eq('evento', eventoId)
        .order('fecha_celebracion', { ascending: true });

      if (funcionesError) throw funcionesError;

      const funcionesMapeadas = (funcionesData || []).map(funcion => ({
        ...funcion,
        sala: (typeof funcion.sala === 'object' && funcion.sala !== null) ? funcion.sala : (funcion.sala ? { id: funcion.sala } : null),
        fechaCelebracion: funcion.fecha_celebracion,
        inicioVenta: funcion.inicio_venta,
        finVenta: funcion.fin_venta,
        pagoAPlazos: funcion.pago_a_plazos,
        permitirReservasWeb: funcion.permitir_reservas_web
      }));

      setFunciones(funcionesMapeadas);

      return { success: true, funciones: funcionesMapeadas };

    } catch (err) {
      console.error("Error al seleccionar evento:", err);
      message.error(`Error al seleccionar evento: ${err.message}`);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoizar el valor de retorno para evitar re-renderizados
  const returnValue = useMemo(() => ({
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    mapa,
    carrito,
    setCarrito: setCarritoMemo,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEvent: setSelectedEventMemo,
    setSelectedFuncion
  }), [
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    mapa,
    carrito,
    setCarritoMemo,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEventMemo,
    setSelectedFuncion
  ]);

  // Cargar eventos al inicio
  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;

        setEventos(data || []);

        const storedEventId = localStorage.getItem(EVENT_KEY);


        if (storedEventId) {
          const initialEvent = data.find(e => e.id === storedEventId);
          if (initialEvent) {
            await handleEventSelect(storedEventId);
          }
        }

      } catch (err) {
        console.error("Error al cargar eventos:", err);
        message.error(`Error al cargar eventos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [handleEventSelect]);

  return returnValue;
};
