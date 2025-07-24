import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { supabase } from '../services/supabaseClient';
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
        .select('*, sala(*), plantilla(*)')
        .eq('id', functionId)
        .single();
  
      if (funcionError) throw funcionError;
      if (!funcionData) {
        message.warning('Función no encontrada.');
        return false;
      }
  
      setSelectedFuncion(funcionData);
      localStorage.setItem(FUNC_KEY, functionId);
  
      // Procesar plantilla
      let plantilla = funcionData.plantilla;
      if (plantilla && plantilla.detalles && typeof plantilla.detalles === 'string') {
        try {
          plantilla = {
            ...plantilla,
            detalles: JSON.parse(plantilla.detalles)
          };
        } catch (e) {
          console.error('Error parsing plantilla.detalles JSON:', e);
          plantilla = {
            ...plantilla,
            detalles: []
          };
        }
      }
      setSelectedPlantilla(plantilla);
  
      // Cargar mapa y zonas
      if (funcionData.sala?.id) {
        const mapData = await fetchMapa(funcionData.sala.id);
        setMapa(mapData);
  
        const zonasData = await fetchZonasPorSala(funcionData.sala.id);
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
  

  // Manejar la selección de un evento
  const handleEventSelect = useCallback(async (eventId, initialFuncId = null) => {
    setLoading(true);
    setError(null);
    setSelectedEvent(null);
    setFunciones([]);
    setSelectedFuncion(null);
    setMapa(null);
    setZonas([]);
    setCarrito([]);
    localStorage.removeItem(FUNC_KEY);

    try {
      const { data: eventData, error: eventError } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      if (!eventData) {
        message.warning('Evento no encontrado.');
        return { success: false, funciones: [] };
      }

      setSelectedEvent(eventData);
      localStorage.setItem(EVENT_KEY, eventId);

      const { data: funcionesData, error: funcionesError } = await supabase
        .from('funciones')
        .select('*')
        .eq('evento', eventId)
        .order('fecha_celebracion', { ascending: true });

      if (funcionesError) throw funcionesError;

      setFunciones(funcionesData || []);

      if (funcionesData && funcionesData.length > 0) {
        const funcToSelect = initialFuncId && funcionesData.find(f => f.id === initialFuncId)
          ? initialFuncId
          : funcionesData[0].id;

        await handleFunctionSelect(funcToSelect);
      }

      return { success: true, funciones: funcionesData || [] };

    } catch (err) {
      console.error("Error al seleccionar evento:", err);
      message.error(`Error al seleccionar evento: ${err.message}`);
      setError(err);
      return { success: false, funciones: [] };
    } finally {
      setLoading(false);
    }
  }, [handleFunctionSelect]);

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
        const storedFuncId = localStorage.getItem(FUNC_KEY);

        if (storedEventId) {
          const initialEvent = data.find(e => e.id === storedEventId);
          if (initialEvent) {
            await handleEventSelect(storedEventId, storedFuncId);
          }
        }

      } catch (err) {
        console.error("Error al cargar eventos:", err);
        message.error(`Error al cargar eventos: ${err.message}`);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, [handleEventSelect]);

  return {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    mapa,
    zonas,
    carrito,
    setCarrito,
    setSelectedEvent,
    handleEventSelect,
    handleFunctionSelect,
    loading,
    error
  };
};
