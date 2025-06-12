import { useState, useEffect } from 'react';
import { message } from 'antd';
import { fetchEventos, fetchMapa, fetchZonasPorSala } from '../services/apibackoffice';

export const useBoleteria = () => {
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