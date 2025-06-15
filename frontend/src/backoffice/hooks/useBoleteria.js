import { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { fetchEventos, fetchMapa, fetchZonasPorSala } from '../services/apibackoffice';

export const useBoleteria = () => {
  const restoredEventRef = useRef(false);
  const restoredFunctionRef = useRef(false);
  // Core states
  const [eventos, setEventos] = useState([]);
  const [funciones, setFunciones] = useState([]);
  const [selectedFuncion, setSelectedFuncion] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [carrito, setCarrito] = useState([]);

  // Load eventos on mount
  useEffect(() => {
    loadEventos();
  }, []);

  // Load plantilla when function changes
  useEffect(() => {
    if (selectedFuncion?._id) {
      cargarPlantillasPrecios();
    }
  }, [selectedFuncion]);

  const loadEventos = async () => {
    try {
      const data = await fetchEventos();
      setEventos(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Error loading events');
      setEventos([]);
    }
  };

  // Restore selection from localStorage after events load
  useEffect(() => {
    if (eventos.length > 0 && !restoredEventRef.current) {
      const storedEventId = localStorage.getItem('boleteriaEventId');
      if (storedEventId) {
        handleEventSelect(storedEventId);
      }
      restoredEventRef.current = true;
    }
  }, [eventos]);

  const cargarPlantillasPrecios = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/funcions/${selectedFuncion._id}/plantilla`
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedPlantilla(data);
      }
    } catch (error) {
      console.error('Error loading function price template:', error);
      message.error('Error loading price template');
    }
  };

  const handleEventSelect = async (eventoId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/funcions?evento=${eventoId}`);
      const data = await response.json();
      setFunciones(Array.isArray(data) ? data : []);
      const ev = eventos.find(e => e._id === eventoId);
      setSelectedEvent(ev || null);
      if (ev?._id) {
        localStorage.setItem('boleteriaEventId', ev._id);
      }
      return true;
    } catch (error) {
      message.error('Error loading functions');
      return false;
    }
  };

  const handleFunctionSelect = async (funcion) => {
    setSelectedFuncion(funcion);
    if (funcion.evento) {
      setSelectedEvent(funcion.evento);
      if (funcion.evento._id) {
        localStorage.setItem('boleteriaEventId', funcion.evento._id);
      }
    }
    if (funcion._id) {
      localStorage.setItem('boleteriaFunctionId', funcion._id);
    }
    try {
      await Promise.all([
        fetchMapa(funcion.sala._id),
        fetchZonasPorSala(funcion.sala._id)
      ]);
      return true;
    } catch (error) {
      message.error('Error loading sala data');
      return false;
    }
  };

  // Persist selections to localStorage
  useEffect(() => {
    if (selectedEvent?._id) {
      localStorage.setItem('boleteriaEventId', selectedEvent._id);
    } else {
      localStorage.removeItem('boleteriaEventId');
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (selectedFuncion?._id) {
      localStorage.setItem('boleteriaFunctionId', selectedFuncion._id);
    } else {
      localStorage.removeItem('boleteriaFunctionId');
    }
  }, [selectedFuncion]);

  // Restore selected function from localStorage after functions load
  useEffect(() => {
    if (funciones.length > 0 && !restoredFunctionRef.current) {
      const storedFunctionId = localStorage.getItem('boleteriaFunctionId');
      if (storedFunctionId) {
        const func = funciones.find(f => f._id === storedFunctionId);
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