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
      // Si eventId no es un UUID válido, no hacer la consulta
      if (!eventId || typeof eventId !== 'string' || !eventId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.warn('[EventThemeService] EventId is not a valid UUID:', eventId);
        return null;
      }

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
   * @param {string} eventName - Nombre del evento (opcional)
   * @returns {Promise<Object>} Configuración creada/actualizada
   */
  static async upsertEventThemeSettings(eventId, tenantId, themeSettings, eventName = null) {
    try {
      const { data, error } = await supabase
        .from('event_theme_settings')
        .upsert({
          event_id: eventId,
          tenant_id: tenantId,
          theme_config: themeSettings,
          updated_at: new Date().toISOString()
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
   * Obtener todas las configuraciones de tema para un tenant
   * @param {string} tenantId - ID del tenant
   * @returns {Promise<Array>} Lista de configuraciones de tema
   */
  static async getAllEventThemeSettings(tenantId) {
    try {
      const { data, error } = await supabase
        .from('event_theme_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

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
      // Usar SQL raw para manejar eventos sin fecha_evento
      const { data, error } = await supabase
        .rpc('get_available_events_with_fallback', { 
          tenant_id_param: tenantId 
        });

      if (error) {
        // Fallback: consulta simple si la función RPC no existe
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('eventos')
          .select('id, nombre, fecha_evento, created_at')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          console.error('[EventThemeService] Error getting events (fallback):', fallbackError);
          throw fallbackError;
        }

        return fallbackData || [];
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
      
      if (eventTheme && eventTheme.theme_config) {
        // Retornar la configuración del tema desde el campo JSONB
        return eventTheme.theme_config;
      }

      // Retornar tema global si no hay tema específico del evento
      return globalTheme;
    } catch (error) {
      console.error('[EventThemeService] Error getting event theme or default:', error);
      return globalTheme;
    }
  }
}
