import { supabase } from '../../config/supabase';

// Servicio para manejar el bloqueo de asientos usando Edge Functions
export const seatLockService = {
  // Bloquear un asiento
  lockSeat: async (seatId, funcionId, sessionId, status = 'seleccionado', lockType = 'seat') => {
    try {
      const { data, error } = await supabase.functions.invoke('seat-locks', {
        body: {
          action: 'lock',
          seat_id: seatId,
          funcion_id: funcionId,
          session_id: sessionId,
          status,
          lock_type: lockType
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error locking seat:', error);
      return { success: false, error: error.message };
    }
  },

  // Desbloquear un asiento
  unlockSeat: async (seatId, funcionId, sessionId) => {
    try {
      const { data, error } = await supabase.functions.invoke('seat-locks', {
        body: {
          action: 'unlock',
          seat_id: seatId,
          funcion_id: funcionId,
          session_id: sessionId
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error unlocking seat:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener asientos bloqueados para una función
  getLockedSeats: async (funcionId) => {
    try {
      const { data, error } = await supabase.functions.invoke('seat-locks', {
        body: {
          action: 'get',
          funcion_id: funcionId,
          seat_id: 'dummy', // Required by the function but not used for get
          session_id: 'dummy' // Required by the function but not used for get
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting locked seats:', error);
      return { success: false, error: error.message };
    }
  }
};
