import { supabase } from '../supabaseClient';

/**
 * Bloquea un asiento
 */


const AutoWrapped_qjmlh2 = (props) => {
        return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
      };

      const { data, error } = await supabase
        .from('seat_locks')
        .insert({
          seat_id: seatData.seatId,
          funcion_id: seatData.funcionId,
          locked_at: new Date().toISOString(),
          expires_at: seatData.expiresAt,
          status: seatData.status || 'locked',
          lock_type: seatData.lockType || 'seat',
          tenant_id: seatData.tenantId,
          locator: seatData.locator || generateLocator(), // Generar locator si no se proporciona
          user_id: seatData.userId,
          zona_id: seatData.zonaId,
          table_id: seatData.tableId || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error locking seat:', error);
      throw error;
    }
  };

  /**
   * Libera un asiento
   */
  export 

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unlocking seat:', error);
      throw error;
    }
  };

  /**
   * Obtiene asientos bloqueados por localizador
   */
  export 

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching seat locks by locator:', error);
      throw error;
    }
  };

  /**
   * Obtiene asientos bloqueados por usuario
   */
  export 

      if (funcionId) {
        query = query.eq('funcion_id', funcionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching seat locks by user:', error);
      throw error;
    }
  };

  /**
   * Actualiza asientos con localizador
   */
  export 
      
      if (zoneInfo) {
        updateData.zona_id = zoneInfo.zona_id || 'ORO';
      }
      
      const { data, error } = await supabase
        .from('seat_locks')
        .update(updateData)
        .in('seat_id', seatIds)
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating seats with locator:', error);
      throw error;
    }
  };

  /**
   * Limpia bloqueos expirados
   */
  export 

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
      throw error;
    }
  };

};

export default AutoWrapped_qjmlh2;