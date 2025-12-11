import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

/**

 * @returns {Object} Objeto con recintos asignados y funciones de gestión
 */
export const useUserRecintos = (userId) => {
  const [recintos, setRecintos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar recintos asignados al usuario
  const loadRecintos = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_recinto_assignments')
        .select(`
          recinto_id,
          recintos (
            id,
            nombre,
            direccion,
            ciudad,
            estado
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const recintosData = (data || [])
        .map(item => item.recintos)
        .filter(recinto => recinto && recinto.estado === 'activo');

      setRecintos(recintosData);
    } catch (err) {
      console.error('Error loading user recintos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar eventos de los recintos asignados
  const loadEventos = async () => {
    if (!userId || recintos.length === 0) {
      setEventos([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const recintoIds = recintos.map(r => r.id);

      const { data, error } = await supabase
        .from('eventos')
        .select(`
          id,
          nombre,
          fecha_celebracion,
          estado,
          recinto_id,
          recintos (
            id,
            nombre,
            direccion,
            ciudad
          )
        `)
        .in('recinto_id', recintoIds)
        .eq('estado', 'activo')
        .order('fecha_celebracion', { ascending: true });

      if (error) throw error;

      setEventos(data || []);
    } catch (err) {
      console.error('Error loading user eventos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar funciones de eventos asignados
  const loadFunciones = async (eventoId) => {
    if (!eventoId) return [];

    try {
      const { data, error } = await supabase
        .from('funciones')
        .select(`
          id,
          nombre,
          fecha_celebracion,
          hora_inicio,
          estado,
          evento_id
        `)
        .eq('evento_id', eventoId)
        .eq('estado', 'activo')
        .order('fecha_celebracion', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error loading funciones:', err);
      return [];
    }
  };

  // Verificar si un usuario puede acceder a un recinto
  const canAccessRecinto = (recintoId) => {
    return recintos.some(r => r.id === recintoId);
  };

  // Verificar si un usuario puede acceder a un evento
  const canAccessEvento = (eventoId) => {
    return eventos.some(e => e.id === eventoId);
  };

  // Obtener recintos disponibles para asignar
  const getAvailableRecintos = async () => {
    try {
      const { data, error } = await supabase
        .from('recintos')
        .select('id, nombre, direccion, ciudad')
        .eq('estado', 'activo')
        .order('nombre');

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Error loading available recintos:', err);
      return [];
    }
  };

  // Asignar recintos a un usuario
  const assignRecintos = async (recintoIds) => {
    if (!userId) return;

    try {
      // Eliminar asignaciones existentes
      await supabase
        .from('user_recinto_assignments')
        .delete()
        .eq('user_id', userId);

      // Crear nuevas asignaciones
      if (recintoIds.length > 0) {
        const assignments = recintoIds.map(recintoId => ({
          user_id: userId,
          recinto_id: recintoId
        }));

        const { error } = await supabase
          .from('user_recinto_assignments')
          .insert(assignments);

        if (error) throw error;
      }

      // Recargar datos
      await loadRecintos();
      await loadEventos();

      return true;
    } catch (err) {
      console.error('Error assigning recintos:', err);
      setError(err.message);
      return false;
    }
  };

  // Efectos
  useEffect(() => {
    if (userId) {
      loadRecintos();
    }
  }, [userId]);

  useEffect(() => {
    if (recintos.length > 0) {
      loadEventos();
    }
  }, [recintos]);

  return {
    recintos,
    eventos,
    loading,
    error,
    loadRecintos,
    loadEventos,
    loadFunciones,
    canAccessRecinto,
    canAccessEvento,
    getAvailableRecintos,
    assignRecintos
  };
};

export default useUserRecintos;
