import { useCallback } from 'react';
import { 
  getEventos,
  deleteEvento,
  duplicateEvento,
  saveEvento
} from '../../services/eventoService';

export const useEventos = (navigate, setEventos, setEventosFiltrados) => {
  const fetchEventos = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getEventos(token);
      setEventos(data);
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const handleDelete = useCallback(async (eventoId) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este evento?');
    if (!confirmDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      await deleteEvento(eventoId, token);
      fetchEventos();
    } catch (error) {
      if (error.message.includes('Unauthorized')) {
        navigate('/login');
      }
    }
  }, [navigate, fetchEventos]);

  // ... otros hooks relacionados con eventos

  return {
    fetchEventos,
    handleDelete,
    // ... otros métodos
  };
};