import { supabase } from '../../supabaseClient';

/**
 * Normaliza un arreglo de asientos asegurando una estructura consistente
 */
const normalizeSeats = (seats = []) => {
  if (!Array.isArray(seats)) return [];

  return seats
    .map((seat) => {
      if (!seat) return null;

      const id = seat.id || seat._id || seat.sillaId || seat.seatId || seat.asientoId;
      if (!id) return null;

      return {
        id: id,
        raw: seat,
        zonaId: seat.zonaId || seat.zona_id || seat.zona?.id || seat.zona || seat.zoneId || null,
        zonaNombre: seat.zona_nombre || seat.zonaNombre || seat.zona || seat.zonaLabel || null,
        precio: typeof seat.precio === 'number'
          ? seat.precio
          : typeof seat.price === 'number'
            ? seat.price
            : typeof seat.monto === 'number'
              ? seat.monto
              : null
      };
    })
    .filter(Boolean);
};

/**
 * Obtiene un Session ID seguro desde el entorno del navegador
 */
const resolveBrowserSessionId = () => {
  if (typeof window === 'undefined') return null;

  try {
    return (
      window.localStorage?.getItem('anonSessionId') ||
      window.sessionStorage?.getItem('anonSessionId') ||
      null
    );
  } catch (err) {
    console.warn('Could not resolve browser session id:', err);
    return null;
  }
};

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
        locator_param: locator,
        transaction_locator: locator,
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
    if (!locator) {
      return null;
    }

    const rpcPayload = {
      locator_param: locator,
      transaction_locator: locator,
    };

    try {
      const { data, error } = await supabase.rpc('get_transaction_with_seats', rpcPayload);

      if (!error && data) {
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            return {
              transaction: parsed?.transaction ?? null,
              seats: Array.isArray(parsed?.seats) ? parsed.seats : [],
            };
          } catch (parseError) {
            console.warn('Could not parse RPC response as JSON, falling back to manual fetch:', parseError);
          }
        } else if (typeof data === 'object' && data !== null) {
          return {
            transaction: data.transaction ?? data,
            seats: Array.isArray(data.seats) ? data.seats : [],
          };
        }
      }

      if (error) {
        console.warn('RPC get_transaction_with_seats failed, falling back to manual queries:', error);
      }
    } catch (rpcError) {
      console.warn('RPC get_transaction_with_seats threw an exception, falling back to manual queries:', rpcError);
    }

    try {
      const transaction = await this.fetchTransactionRecord(locator);

      if (!transaction) {
        return null;
      }

      const { data: seats, error: seatsError } = await supabase
        .from('seat_locks')
        .select(
          'id, seat_id, table_id, funcion_id, locked_at, expires_at, status, lock_type, created_at, tenant_id, locator, user_id, updated_at, zona_id, zona_nombre, session_id, precio, metadata'
        )
        .eq('locator', locator);

      if (seatsError) {
        console.warn('Error fetching seats by locator during fallback:', seatsError);
      }

      return {
        transaction,
        seats: Array.isArray(seats) ? seats : [],
      };
    } catch (fallbackError) {
      console.error('Error getting transaction with seats using fallback logic:', fallbackError);
      return null;
    }
  }

  /**
   * Busca una transacción por locator y, si no existe, por order_id
   */
  async fetchTransactionRecord(locator) {
    const tryFetch = async (column) => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq(column, locator)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data ?? null;
    };

    const byLocator = await tryFetch('locator');
    if (byLocator) {
      return byLocator;
    }

    return tryFetch('order_id');
  }

  /**
   * Actualiza asientos con localizador y estado final
   */
  async updateSeatsWithLocator(seatIds, locator, userId, options = {}) {
    try {
      if (!Array.isArray(seatIds) || seatIds.length === 0) {
        return { data: [], updated: 0 };
      }

      const {
        zoneInfo = null,
        status = null,
        tenantId = null,
        funcionId = null,
        sessionId = null,
        statusFilters = ['locked', 'seleccionado', 'seleccionado_por_otro', 'expirando', 'reservado'],
        metadata = null,
        updateTimestamp = true
      } = options || {};

      const now = new Date().toISOString();
      const updateData = {
        locator: locator || null,
        user_id: userId || null,
      };

      if (status) {
        updateData.status = status;
      }

      if (tenantId) {
        updateData.tenant_id = tenantId;
      }

      if (updateTimestamp) {
        updateData.updated_at = now;
      }

      if (zoneInfo) {
        if (zoneInfo.zona_id || zoneInfo.zonaId || zoneInfo.id) {
          updateData.zona_id = zoneInfo.zona_id || zoneInfo.zonaId || zoneInfo.id;
        }
        if (zoneInfo.zona_nombre || zoneInfo.zonaNombre || zoneInfo.nombre) {
          updateData.zona_nombre = zoneInfo.zona_nombre || zoneInfo.zonaNombre || zoneInfo.nombre;
        }
        if (typeof zoneInfo.precio === 'number') {
          updateData.precio = zoneInfo.precio;
        }
      }

      if (metadata && typeof metadata === 'object') {
        updateData.metadata = metadata;
      }

      const applyUpdate = async (predicateCallback) => {
        const baseQuery = supabase
          .from('seat_locks')
          .update(updateData)
          .in('seat_id', seatIds);

        if (Array.isArray(statusFilters) && statusFilters.length > 0) {
          baseQuery.in('status', statusFilters);
        }

        if (funcionId) {
          baseQuery.eq('funcion_id', funcionId);
        }

        predicateCallback(baseQuery);

        return baseQuery.select('id, seat_id, status');
      };

      let response = { data: [], error: null };

      if (userId) {
        response = await applyUpdate((query) => query.eq('user_id', userId));
      }

      if ((!response.data || response.data.length === 0) && (sessionId || userId)) {
        const browserSession = sessionId || userId?.toString() || resolveBrowserSessionId();
        if (browserSession) {
          response = await applyUpdate((query) => query.eq('session_id', browserSession.toString()));
        }
      }

      if (!response.data || response.data.length === 0) {
        response = await applyUpdate((query) => {
          query.is('user_id', null);
        });
      }

      if (response.error) {
        throw response.error;
      }

      const updatedRows = response.data || [];
      console.log('✅ Updated seats with locator/state:', {
        locator,
        updated: updatedRows.length,
        status,
        tenantId,
        funcionId,
      });

      return {
        data: updatedRows,
        updated: updatedRows.length,
      };
    } catch (error) {
      console.error('Error updating seats with locator:', error);
      throw error;
    }
  }

  /**
   * Finaliza los asientos asociados a una transacción actualizando locator y estado
   */
  async finalizeSeatsAfterPayment({
    seats = [],
    locator,
    userId = null,
    tenantId = null,
    funcionId = null,
    status = null,
    sessionId = null,
    metadata = null,
  }) {
    const normalizedSeats = normalizeSeats(seats);
    const seatIds = normalizedSeats.map((seat) => seat.id);

    if (seatIds.length === 0 || !locator) {
      return { updated: 0 };
    }

    const primarySeat = normalizedSeats[0];
    const zoneInfo = primarySeat
      ? {
          zona_id: primarySeat.zonaId,
          zona_nombre: primarySeat.zonaNombre,
          precio: primarySeat.precio,
        }
      : null;

    return this.updateSeatsWithLocator(seatIds, locator, userId, {
      zoneInfo,
      status,
      tenantId,
      funcionId,
      sessionId,
      metadata,
      statusFilters: ['locked', 'seleccionado', 'seleccionado_por_otro', 'expirando', 'reservado'],
    });
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
