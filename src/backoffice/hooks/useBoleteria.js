import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { supabase } from '../services/supabaseClient';
import { fetchMapa, fetchZonasPorSala } from '../../services/supabaseServices';

const EVENT_KEY = 'boleteriaEventId';
const FUNC_KEY = 'boleteriaFunctionId';

export const useBoleteria = () => {
  const restoredEventRef = useRef(false);
  const restoredFunctionRef = useRef(false);

  const [eventos, setEventos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [selectedFuncion, setSelectedFuncion] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [carrito, setCarrito] = useState([]);

  useEffect(() => {
    loadEventos();
  }, []);

  useEffect(() => {
    if (selectedFuncion?.id) {
      cargarPlantillasPrecios();
    }
  }, [selectedFuncion]);

  const loadEventos = async () => {
    const { data, error } = await supabase.from('eventos').select('*');
    if (error) {
      console.error(error);
      message.error('Error cargando eventos');
      setEventos([]);
    } else {
      setEventos(data);
    }
  };

  useEffect(() => {
    if (eventos.length > 0 && !restoredEventRef.current) {
      const storedEventId = localStorage.getItem(EVENT_KEY);
      if (storedEventId) {
        handleEventSelect(storedEventId);
      }
      restoredEventRef.current = true;
    }
  }, [eventos]);

  const cargarPlantillasPrecios = async () => {
    const plantillaId =
      typeof selectedFuncion.plantilla === 'object'
        ? selectedFuncion.plantilla.id || selectedFuncion.plantilla._id
        : selectedFuncion.plantilla;

    const { data, error } = await supabase
      .from('plantillas')
      .select('*')
      .eq('id', plantillaId)
      .single();

    if (error) {
      console.error(error);
      message.error('Error cargando plantilla');
    } else {
      setSelectedPlantilla(data);
    }
  };

  const handleEventSelect = async (eventoId) => {
    const { data, error } = await supabase
      .from('funcions')
      .select(`
        *,
        plantilla (
          id,
          nombre
        )
      `)
      .eq('evento', eventoId);

    if (error) {
      console.error('Error cargando funciones:', error);
      message.error(error.message || 'Error cargando funciones');
      return { success: false, funciones: [] };
    } else {
      const ev = eventos.find(e => e.id === eventoId || e._id === eventoId);
      setFunciones(data);
      setSelectedEvent(ev || null);
      setSelectedFuncion(null);
      if (ev?.id) {
        localStorage.setItem(EVENT_KEY, ev.id);
      }
      return { success: true, funciones: data };
    }
  };

  const handleFunctionSelect = async (funcion) => {
    setSelectedFuncion(funcion);

    if (funcion.evento) {
      if (typeof funcion.evento === 'object') {
        setSelectedEvent(funcion.evento);
        if (funcion.evento.id) {
          localStorage.setItem(EVENT_KEY, funcion.evento.id);
        }
      } else {
        const ev = eventos.find(e => e.id === funcion.evento || e._id === funcion.evento);
        setSelectedEvent(ev || null);
        if (ev?.id) {
          localStorage.setItem(EVENT_KEY, ev.id);
        }
      }
    }

    if (funcion.id) {
      localStorage.setItem(FUNC_KEY, funcion.id);
    }

    try {
      await Promise.all([
        fetchMapa(funcion.sala, funcion.id),
        fetchZonasPorSala(funcion.sala)
      ]);
      return true;
    } catch (error) {
      console.error('Error cargando sala/zonas:', error);
      message.error('Error cargando datos de sala');
      return false;
    }
  };

  useEffect(() => {
    const evId = selectedEvent?.id || selectedEvent?._id;
    if (evId) {
      localStorage.setItem(EVENT_KEY, evId);
    } else {
      localStorage.removeItem(EVENT_KEY);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedFuncion?.id) {
      localStorage.setItem(FUNC_KEY, selectedFuncion.id);
    } else {
      localStorage.removeItem(FUNC_KEY);
    }
  }, [selectedFuncion]);

  useEffect(() => {
    if (funciones.length > 0 && !restoredFunctionRef.current) {
      const storedFunctionId = localStorage.getItem(FUNC_KEY);
      if (storedFunctionId) {
        const func = funciones.find(f => f.id === storedFunctionId);
        if (func) {
          handleFunctionSelect(func);
        }
      }
      restoredFunctionRef.current = true;
    }
  }, [funciones]);

  return {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    carrito,
    setCarrito,
    setSelectedEvent,
    handleEventSelect,
    handleFunctionSelect
  };
};
