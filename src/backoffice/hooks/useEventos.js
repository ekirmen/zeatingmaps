// hooks/useEventos.js
import { useCallback } from 'react';
import { supabase } from '../../backoffice/services/supabaseClient';

export const useEventos = (navigate, setEventos, setEventosFiltrados) => {
  const fetchEventos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setEventos(data);
      setEventosFiltrados(data); // opcional
    } catch (error) {
      console.error('Error al cargar eventos:', error.message);
      navigate('/login'); // si quieres mantener este fallback
    }
  }, [navigate, setEventos, setEventosFiltrados]);

  const handleDelete = useCallback(async (eventoId) => {
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar este evento?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventoId);

      if (error) throw error;

      fetchEventos();
    } catch (error) {
      console.error('Error al eliminar evento:', error.message);
      navigate('/login');
    }
  }, [navigate, fetchEventos]);

  const handleDuplicate = useCallback(async (evento) => {
    try {
      const duplicated = { ...evento };
      delete duplicated.id;

      duplicated.nombre += ' (copia)';
      duplicated.created_at = new Date().toISOString();

      const { error } = await supabase.from('eventos').insert([duplicated]);
      if (error) throw error;

      fetchEventos();
    } catch (error) {
      console.error('Error al duplicar evento:', error.message);
    }
  }, [fetchEventos]);

  const handleSave = useCallback(async (nuevoEvento) => {
    try {
      const { error } = await supabase.from('eventos').insert([nuevoEvento]);
      if (error) throw error;

      fetchEventos();
    } catch (error) {
      console.error('Error al guardar evento:', error.message);
    }
  }, [fetchEventos]);

  return {
    fetchEventos,
    handleDelete,
    handleDuplicate,
    handleSave
  };
};
