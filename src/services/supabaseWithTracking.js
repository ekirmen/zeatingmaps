import { supabase } from '../config/supabase';
import { useUserTracking } from '../hooks/useUserTracking';

/**
 * Cliente de Supabase con tracking automático de usuarios
 * Intercepta todas las operaciones para agregar campos de auditoría
 */
class SupabaseWithTracking {
  constructor() {
    this.supabase = supabase;
  }

  /**

   * @returns {Promise<string>} Email del usuario o ID
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return 'anonymous';
      return user.email || user.id || 'anonymous';
    } catch (error) {
      return 'anonymous';
    }
  }

  /**
   * Agrega campos de tracking para inserción
   * @param {Object} data - Datos a insertar
   * @returns {Object} Datos con tracking agregado
   */
  async addInsertTracking(data) {
    
    const now = new Date().toISOString();

    return {
      ...data,
      created_by: currentUser,
      updated_by: currentUser,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Agrega campos de tracking para actualización
   * @param {Object} data - Datos a actualizar
   * @returns {Object} Datos con tracking agregado
   */
  async addUpdateTracking(data) {
    
    const now = new Date().toISOString();

    return {
      ...data,
      updated_by: currentUser,
      updated_at: now
    };
  }

  /**
   * Inserta datos con tracking automático
   * @param {string} table - Nombre de la tabla
   * @param {Object|Array} data - Datos a insertar
   * @returns {Promise} Resultado de la inserción
   */
  async insert(table, data) {
    try {
      let dataWithTracking;

      if (Array.isArray(data)) {
        // Si es un array, agregar tracking a cada elemento
        dataWithTracking = await Promise.all(
          data.map(item => this.addInsertTracking(item))
        );
      } else {
        // Si es un objeto, agregar tracking
        dataWithTracking = await this.addInsertTracking(data);
      }

      return await this.supabase.from(table).insert(dataWithTracking);
    } catch (error) {
      console.error(`Error en insert con tracking para tabla ${table}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza datos con tracking automático
   * @param {string} table - Nombre de la tabla
   * @param {Object} data - Datos a actualizar
   * @param {Object} filter - Filtros para la actualización
   * @returns {Promise} Resultado de la actualización
   */
  async update(table, data, filter) {
    try {
      const dataWithTracking = await this.addUpdateTracking(data);

      let query = this.supabase.from(table).update(dataWithTracking);

      // Aplicar filtros
      if (filter) {
        Object.keys(filter).forEach(key => {
          query = query.eq(key, filter[key]);
        });
      }

      return await query;
    } catch (error) {
      console.error(`Error en update con tracking para tabla ${table}:`, error);
      throw error;
    }
  }

  /**
   * Elimina datos (sin tracking, pero con logging)
   * @param {string} table - Nombre de la tabla
   * @param {Object} filter - Filtros para la eliminación
   * @returns {Promise} Resultado de la eliminación
   */
  async delete(table, filter) {
    try {
      const currentUser = await this.getCurrentUser();
      let query = this.supabase.from(table).delete();

      // Aplicar filtros
      if (filter) {
        Object.keys(filter).forEach(key => {
          query = query.eq(key, filter[key]);
        });
      }

      return await query;
    } catch (error) {
      console.error(`Error en delete para tabla ${table}:`, error);
      throw error;
    }
  }

  /**
   * Selecciona datos (sin modificaciones)
   * @param {string} table - Nombre de la tabla
   * @param {string} select - Campos a seleccionar
   * @param {Object} filter - Filtros para la selección
   * @returns {Promise} Resultado de la selección
   */
  async select(table, select = '*', filter = {}) {
    try {
      let query = this.supabase.from(table).select(select);

      // Aplicar filtros
      if (filter) {
        Object.keys(filter).forEach(key => {
          if (Array.isArray(filter[key])) {
            query = query.in(key, filter[key]);
          } else {
            query = query.eq(key, filter[key]);
          }
        });
      }

      return await query;
    } catch (error) {
      // Error logging removed for production performance
      throw error;
    }
  }

  /**
   * Upsert (insert o update) con tracking automático
   * @param {string} table - Nombre de la tabla
   * @param {Object|Array} data - Datos a upsert
   * @param {Object} options - Opciones del upsert
   * @returns {Promise} Resultado del upsert
   */
  async upsert(table, data, options = {}) {
    try {
      let dataWithTracking;

      if (Array.isArray(data)) {
        // Para upsert, agregar tracking de inserción
        dataWithTracking = await Promise.all(
          data.map(item => this.addInsertTracking(item))
        );
      } else {
        dataWithTracking = await this.addInsertTracking(data);
      }

      return await this.supabase.from(table).upsert(dataWithTracking, options);
    } catch (error) {
      console.error(`Error en upsert con tracking para tabla ${table}:`, error);
      throw error;
    }
  }
}

// Crear instancia única
const supabaseWithTracking = new SupabaseWithTracking();

export default supabaseWithTracking;
