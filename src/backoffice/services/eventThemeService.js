import { supabase } from '../../supabaseClient';

/**
 * Servicio para manejar configuraciones de tema por evento
 */
export class EventThemeService {
  
  /**
   * Obtener configuración de tema para un evento específico
   * @param {string} eventId - ID del evento
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Object|null>} Configuración del tema o null si no existe
   */
  static async getEventThemeSettings(eventId, tenantId) {
    try {
      const { data, error } = await supabase
        .from('event_theme_settings')
        .select('*')
        .eq('event_id', eventId)
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[EventThemeService] Error getting event theme:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[EventThemeService] Error getting event theme:', error);
      return null;
    }
  }

  /**
   * Crear o actualizar configuración de tema para un evento
   * @param {string} eventId - ID del evento
   * @param {string} tenantId - ID del tenant
   * @param {Object} themeSettings - Configuración del tema
   * @param {string} eventName - Nombre del evento
   * @returns {Promise<Object>} Configuración creada/actualizada
   */
  static async upsertEventThemeSettings(eventId, tenantId, themeSettings, eventName = null) {
    try {
      const { data, error } = await supabase
        .from('event_theme_settings')
        .upsert({
          event_id: eventId,
          tenant_id: tenantId,
          event_name: eventName,
          ...themeSettings
        }, {
          onConflict: 'event_id,tenant_id'
        })
        .select()
        .single();

      if (error) {
        console.error('[EventThemeService] Error upserting event theme:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[EventThemeService] Error upserting event theme:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las configuraciones de tema por evento para un tenant
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Array>} Lista de configuraciones
   */
  static async getAllEventThemeSettings(tenantId) {
    try {
      const { data, error } = await supabase
        .from('event_theme_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('event_name', { ascending: true });

      if (error) {
        console.error('[EventThemeService] Error getting all event themes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[EventThemeService] Error getting all event themes:', error);
      return [];
    }
  }

  /**
   * Eliminar configuración de tema para un evento
   * @param {string} eventId - ID del evento
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  static async deleteEventThemeSettings(eventId, tenantId) {
    try {
      const { error } = await supabase
        .from('event_theme_settings')
        .delete()
        .eq('event_id', eventId)
        .eq('tenant_id', tenantId);

      if (error) {
        console.error('[EventThemeService] Error deleting event theme:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[EventThemeService] Error deleting event theme:', error);
      return false;
    }
  }

  /**
   * Obtener lista de eventos disponibles para un tenant
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Array>} Lista de eventos
   */
  static async getAvailableEvents(tenantId) {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, nombre, fecha')
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false });

      if (error) {
        console.error('[EventThemeService] Error getting events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[EventThemeService] Error getting events:', error);
      return [];
    }
  }

  /**
   * Obtener configuración de tema para un evento o usar la configuración global
   * @param {string} eventId - ID del evento
   * @param {string} tenantId - ID del tenant
   * @param {Object} globalTheme - Tema global por defecto
   * @returns {Promise<Object>} Configuración del tema (evento o global)
   */
  static async getEventThemeOrDefault(eventId, tenantId, globalTheme) {
    try {
      const eventTheme = await this.getEventThemeSettings(eventId, tenantId);
      
      if (eventTheme) {
        return {
          seatAvailable: eventTheme.seat_available,
          seatSelectedMe: eventTheme.seat_selected_me,
          seatSelectedOther: eventTheme.seat_selected_other,
          seatBlocked: eventTheme.seat_blocked,
          seatSold: eventTheme.seat_sold,
          seatReserved: eventTheme.seat_reserved
        };
      }

      // Retornar tema global si no hay tema específico del evento
      return globalTheme;
    } catch (error) {
      console.error('[EventThemeService] Error getting event theme or default:', error);
      return globalTheme;
    }
  }
}
