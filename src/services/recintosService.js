import supabaseWithTracking from './supabaseWithTracking';
import { supabase } from '../config/supabase';

/**
 * Servicio para gestión de recintos con tracking automático
 */
export const recintosService = {
  /**
   * Crear un nuevo recinto
   * @param {Object} recintoData - Datos del recinto
   * @returns {Promise<Object>} Recinto creado
   */
  async crearRecinto(recintoData) {
    try {
      const { data, error } = await supabaseWithTracking.insert('recintos', recintoData);
      
      if (error) throw error;
      
      console.log('✅ Recinto creado con tracking:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ Error al crear recinto:', error);
      throw error;
    }
  },

  /**
   * Actualizar un recinto existente
   * @param {number} id - ID del recinto
   * @param {Object} recintoData - Datos a actualizar
   * @returns {Promise<Object>} Recinto actualizado
   */
  async actualizarRecinto(id, recintoData) {
    try {
      const { data, error } = await supabaseWithTracking.update('recintos', recintoData, { id });
      
      if (error) throw error;
      
      console.log('✅ Recinto actualizado con tracking:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ Error al actualizar recinto:', error);
      throw error;
    }
  },

  /**
   * Obtener recintos por tenant
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Array>} Lista de recintos
   */
  async obtenerRecintosPorTenant(tenantId) {
    try {
      const { data, error } = await supabaseWithTracking.select(
        'recintos',
        '*',
        { tenant_id: tenantId }
      );
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener recintos:', error);
      throw error;
    }
  },

  /**
   * Obtener recinto por ID
   * @param {number} id - ID del recinto
   * @returns {Promise<Object>} Recinto
   */
  async obtenerRecintoPorId(id) {
    try {
      const { data, error } = await supabaseWithTracking.select(
        'recintos',
        '*',
        { id }
      );
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('❌ Error al obtener recinto:', error);
      throw error;
    }
  },

  /**
   * Eliminar recinto
   * @param {number} id - ID del recinto
   * @returns {Promise<boolean>} Éxito de la eliminación
   */
  async eliminarRecinto(id) {
    try {
      const { error } = await supabaseWithTracking.delete('recintos', { id });
      
      if (error) throw error;
      
      console.log('✅ Recinto eliminado:', id);
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar recinto:', error);
      throw error;
    }
  },

  /**
   * Obtener recintos públicos (para el store)
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Array>} Lista de recintos públicos
   */
  async obtenerRecintosPublicos(tenantId) {
    try {
      const { data, error } = await supabase
        .from('recintos')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener recintos públicos:', error);
      throw error;
    }
  }
};

export default recintosService;
