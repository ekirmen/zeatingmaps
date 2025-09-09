import { supabase } from '../../supabaseClient';

/**
 * Servicio para conectar asientos con localizadores de pago
 */
class SeatLocatorService {
  
  /**
   * Conecta asientos bloqueados con transacciones de pago
   */
  async connectSeatsWithLocator() {
    try {
      const { data, error } = await supabase.rpc('connect_seats_with_locator');
      
      if (error) throw error;
      
      console.log('🔗 Connected seats with locator:', data);
      return data;
    } catch (error) {
      console.error('Error connecting seats with locator:', error);
      throw error;
    }
  }

  /**
   * Obtiene asientos por localizador
   */
  async getSeatsByLocator(locator) {
    try {
      const { data, error } = await supabase.rpc('get_seats_by_locator', {
        locator_param: locator
      });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting seats by locator:', error);
      return [];
    }
  }

  /**
   * Obtiene transacción con sus asientos
   */
  async getTransactionWithSeats(locator) {
    try {
      const { data, error } = await supabase.rpc('get_transaction_with_seats', {
        locator_param: locator
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting transaction with seats:', error);
      return null;
    }
  }

  /**
   * Actualiza asientos con localizador
   */
  async updateSeatsWithLocator(seatIds, locator, userId) {
    try {
      // Primero intentar con user_id
      let { data, error } = await supabase
        .from('seat_locks')
        .update({ 
          locator: locator,
          user_id: userId
        })
        .in('seat_id', seatIds)
        .eq('user_id', userId)
        .select();
      
      // Si no hay resultados, intentar con session_id
      if (!data || data.length === 0) {
        console.log('🔍 Trying with session_id instead of user_id');
        const result = await supabase
          .from('seat_locks')
          .update({ 
            locator: locator,
            user_id: userId
          })
          .in('seat_id', seatIds)
          .eq('session_id', userId.toString())
          .select();
        
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      
      console.log('✅ Updated seats with locator:', data);
      return data;
    } catch (error) {
      console.error('Error updating seats with locator:', error);
      throw error;
    }
  }

  /**
   * Obtiene asientos bloqueados por usuario
   */
  async getSeatsByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'seleccionado')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting seats by user:', error);
      return [];
    }
  }

  /**
   * Libera asientos de un usuario
   */
  async releaseUserSeats(userId) {
    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .update({ 
          status: 'liberado',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'seleccionado')
        .select();
      
      if (error) throw error;
      
      console.log('🔓 Released user seats:', data);
      return data;
    } catch (error) {
      console.error('Error releasing user seats:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de asientos por localizador
   */
  async getSeatStatsByLocator(locator) {
    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .select('status')
        .eq('locator', locator);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        seleccionado: data.filter(s => s.status === 'seleccionado').length,
        vendido: data.filter(s => s.status === 'vendido').length,
        liberado: data.filter(s => s.status === 'liberado').length
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting seat stats by locator:', error);
      return { total: 0, seleccionado: 0, vendido: 0, liberado: 0 };
    }
  }
}

const seatLocatorService = new SeatLocatorService();
export default seatLocatorService;
