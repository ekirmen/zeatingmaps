import supabaseWithTracking from './supabaseWithTracking';
import { supabase } from '../config/supabase';

/**
 * Servicio para gestión de eventos con tracking automático
 */
export const eventosService = {
  /**
   * Crear un nuevo evento
   * @param {Object} eventoData - Datos del evento
   * @returns {Promise<Object>} Evento creado
   */
  async crearEvento(eventoData) {
    try {
      const { data, error } = await supabaseWithTracking.insert('eventos', eventoData);

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('❌ Error al crear evento:', error);
      throw error;
    }
  },

  /**
   * Actualizar un evento existente
   * @param {number} id - ID del evento
   * @param {Object} eventoData - Datos a actualizar
   * @returns {Promise<Object>} Evento actualizado
   */
  async actualizarEvento(id, eventoData) {
    try {
      const { data, error } = await supabaseWithTracking.update('eventos', eventoData, { id });

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('❌ Error al actualizar evento:', error);
      throw error;
    }
  },

  /**
   * Obtener eventos por tenant
   * @param {string} tenantId - ID del tenant
   * @param {Object} options - Opciones de filtrado
   * @returns {Promise<Array>} Lista de eventos
   */
  async obtenerEventosPorTenant(tenantId, options = {}) {
    try {
      const { data, error } = await supabaseWithTracking.select(
        'eventos',
        '*',
        { tenant_id: tenantId, ...options }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener eventos:', error);
      throw error;
    }
  },

  /**
   * Obtener evento por ID
   * @param {number} id - ID del evento
   * @returns {Promise<Object>} Evento
   */
  async obtenerEventoPorId(id) {
    try {
      const { data, error } = await supabaseWithTracking.select(
        'eventos',
        '*',
        { id }
      );

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('❌ Error al obtener evento:', error);
      throw error;
    }
  },

  /**
   * Eliminar evento
   * @param {number} id - ID del evento
   * @returns {Promise<boolean>} Éxito de la eliminación
   */
  async eliminarEvento(id) {
    try {
      const { error } = await supabaseWithTracking.delete('eventos', { id });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar evento:', error);
      throw error;
    }
  },

  /**
   * Obtener eventos públicos (para el store)
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Array>} Lista de eventos públicos
   */
  async obtenerEventosPublicos(tenantId) {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('oculto', false)
        .eq('desactivado', false)
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener eventos públicos:', error);
      throw error;
    }
  }
};

export default eventosService;
