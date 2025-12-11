import supabaseWithTracking from './supabaseWithTracking';
import { supabase } from '../config/supabase';

/**
 * Servicio para gestión de funciones con tracking automático
 */
export const funcionesService = {
  /**
   * Crear una nueva función

   * @returns {Promise<Object>} Función creada
   */
  async crearFuncion(funcionData) {
    try {
      const { data, error } = await supabaseWithTracking.insert('funciones', funcionData);

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('❌ Error al crear función:', error);
      throw error;
    }
  },

  /**
   * Actualizar una función existente
   * @param {number} id - ID de la función
   * @param {Object} funcionData - Datos a actualizar
   * @returns {Promise<Object>} Función actualizada
   */
  async actualizarFuncion(id, funcionData) {
    try {
      const { data, error } = await supabaseWithTracking.update('funciones', funcionData, { id });

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('❌ Error al actualizar función:', error);
      throw error;
    }
  },

  /**
   * Obtener funciones por evento
   * @param {number} eventoId - ID del evento
   * @returns {Promise<Array>} Lista de funciones
   */
  async obtenerFuncionesPorEvento(eventoId) {
    try {
      const { data, error } = await supabaseWithTracking.select(
        'funciones',
        '*',
        { evento_id: eventoId }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener funciones:', error);
      throw error;
    }
  },

  /**
   * Obtener función por ID
   * @param {number} id - ID de la función
   * @returns {Promise<Object>} Función
   */
  async obtenerFuncionPorId(id) {
    try {
      const { data, error } = await supabaseWithTracking.select(
        'funciones',
        '*',
        { id }
      );

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('❌ Error al obtener función:', error);
      throw error;
    }
  },

  /**
   * Eliminar función
   * @param {number} id - ID de la función
   * @returns {Promise<boolean>} Éxito de la eliminación
   */
  async eliminarFuncion(id) {
    try {
      const { error } = await supabaseWithTracking.delete('funciones', { id });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar función:', error);
      throw error;
    }
  },

  /**
   * Obtener funciones públicas (para el store)
   * @param {number} eventoId - ID del evento
   * @returns {Promise<Array>} Lista de funciones públicas
   */
  async obtenerFuncionesPublicas(eventoId) {
    try {
      const { data, error } = await supabase
        .from('funciones')
        .select('*')
        .eq('evento_id', eventoId)
        .eq('activo', true)
        .eq('visible_en_store', true)
        .gte('fecha_celebracion', new Date().toISOString())
        .order('fecha_celebracion', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener funciones públicas:', error);
      throw error;
    }
  },

  /**
   * Obtener funciones para boletería
   * @param {number} eventoId - ID del evento
   * @returns {Promise<Array>} Lista de funciones para boletería
   */
  async obtenerFuncionesParaBoleteria(eventoId) {
    try {
      const { data, error } = await supabase
        .from('funciones')
        .select('*')
        .eq('evento_id', eventoId)
        .eq('activo', true)
        .eq('visible_en_boleteria', true)
        .order('fecha_celebracion', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error al obtener funciones para boletería:', error);
      throw error;
    }
  }
};

export default funcionesService;
