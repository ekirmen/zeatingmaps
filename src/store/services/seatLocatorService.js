import { supabase } from '../../supabaseClient';

/**
 * Normaliza un arreglo de asientos asegurando una estructura consistente
 */
const normalizeSeats = (seats = []) => {
  if (!Array.isArray(seats)) return [];

  return seats
    .map((seat) => {
      if (!seat) return null;

      const id =
        seat.id ||
        seat._id ||
        seat.sillaId ||
        seat.seatId ||
        seat.asientoId;

      if (!id) return null;

      return {
        id,
        raw: seat,
        zonaId:
          seat.zonaId ||
          seat.zona_id ||
          seat.zona?.id ||
          seat.zona ||
          seat.zoneId ||
          null,
        zonaNombre:
          seat.zona_nombre ||
          seat.zonaNombre ||
          seat.zona ||
          seat.zonaLabel ||
          null,
        precio:
          typeof seat.precio === 'number'
            ? seat.precio
            : typeof seat.price === 'number'
              ? seat.price
              : typeof seat.monto === 'number'
                ? seat.monto
                : null,
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
   * - Intenta RPC con ambos parámetros (compatibilidad hacia atrás)
   * - Si falla, intenta RPC con uno solo
   * - Si aún falla, consulta manualmente payment_transactions y seat_locks
   */
  async getTransactionWithSeats(locator) {
    if (!locator) return null;

    // 1) RPC intento amplio (ambos args)
    try {
      const rpcPayload = {
        locator_param: locator,
        transaction_locator: locator,
      };

      const { data, error } = await supabase.rpc(
        'get_transaction_with_seats',
        rpcPayload
      );

      if (!error && data) {
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            return {
              transaction: parsed?.transaction ?? null,
              seats: Array.isArray(parsed?.seats) ? parsed.seats : [],
            };
          } catch (parseErr) {
            console.warn(
              'Could not parse RPC response as JSON (dual args), falling back:',
              parseErr
            );
          }
        } else if (typeof data === 'object' && data !== null) {
          return {
            transaction: data.transaction ?? data,
            seats: Array.isArray(data.seats) ? data.seats : [],
          };
        }
      }

      if (error) {
        console.warn(
          'RPC (dual args) get_transaction_with_seats failed, trying single-arg:',
          error
        );
      }
    } catch (rpcErr) {
      console.warn(
        'RPC (dual args) get_transaction_with_seats threw, trying single-arg:',
        rpcErr
      );
    }

    // 2) RPC intento mínimo (solo transaction_locator)
    try {
      const { data, error } = await supabase.rpc(
        'get_transaction_with_seats',
        { transaction_locator: locator }
      );

      if (!error && data) {
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            return {
              transaction: parsed?.transaction ?? null,
              seats: Array.isArray(parsed?.seats) ? parsed.seats : [],
            };
          } catch (parseErr) {
            console.warn(
              'Could not parse RPC response as JSON (single arg), falling back:',
              parseErr
            );
          }
        } else if (typeof data === 'object' && data !== null) {
          return {
            transaction: data.transaction ?? data,
            seats: Array.isArray(data.seats) ? data.seats : [],
          };
        }
      }

      if (error) {
        console.warn(
          'RPC (single arg) get_transaction_with_seats failed, falling back to manual queries:',
          error
        );
      }
    } catch (rpcErr) {
      console.warn(
        'RPC (single arg) get_transaction_with_seats threw, falling back to manual queries:',
        rpcErr
      );
    }

    // 3) Fallback manual: buscar transacción y luego asientos por locator
    try {
      const transaction = await this.fetchTransactionRecord(locator);
      if (!transaction) return null;

      // Intentar obtener asientos desde seat_locks primero
      let seats = [];
      const { data: seatsFromLocks, error: seatsError } = await supabase
        .from('seat_locks')
        .select(
          'id, seat_id, table_id, funcion_id, locked_at, expires_at, status, lock_type, created_at, tenant_id, locator, user_id, updated_at, zona_id, zona_nombre, session_id, precio, metadata'
        )
        .eq('locator', locator);

      if (!seatsError && Array.isArray(seatsFromLocks) && seatsFromLocks.length > 0) {
        seats = seatsFromLocks;
      } else if (seatsError) {
        console.warn('Error fetching seats from seat_locks by locator:', seatsError);
      }

      // Si no hay asientos en seat_locks, intentar parsear desde transaction.seats
      if (seats.length === 0 && transaction.seats) {
        try {
          let parsedSeats = [];
          if (Array.isArray(transaction.seats)) {
            parsedSeats = transaction.seats;
          } else if (typeof transaction.seats === 'string') {
            parsedSeats = JSON.parse(transaction.seats);
          }
          
          // Normalizar los asientos para que tengan la misma estructura que seat_locks
          if (Array.isArray(parsedSeats) && parsedSeats.length > 0) {
            seats = parsedSeats.map((seat, index) => ({
              id: seat.id || seat._id || `seat-${index}`,
              seat_id: seat.seat_id || seat.id || seat._id || seat.sillaId || `seat-${index}`,
              table_id: seat.table_id || seat.mesa_id || seat.mesaId || seat.mesa?.id || seat.mesa || null,
              zona_id: seat.zona_id || seat.zonaId || seat.zona?.id || null,
              zona_nombre: seat.zona_nombre || seat.zonaNombre || seat.zona?.nombre || seat.zona || null,
              precio: seat.precio || seat.price || null,
              status: seat.status || 'vendido',
              funcion_id: transaction.funcion_id || null,
              locator: transaction.locator || locator,
              user_id: transaction.user_id || null,
              tenant_id: transaction.tenant_id || null,
              metadata: seat.metadata || {}
            }));
            console.log(`✅ [seatLocatorService] Obtenidos ${seats.length} asientos desde transaction.seats`);
          }
        } catch (parseError) {
          console.warn('Error parseando asientos desde transaction.seats:', parseError);
        }
      }

      return {
        transaction,
        seats: Array.isArray(seats) ? seats : [],
        event: null // Se puede agregar más adelante si es necesario
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
        // PGRST116 = no rows returned for single result
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data ?? null;
    };

    const byLocator = await tryFetch('locator');
    if (byLocator) return byLocator;

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
        updateTimestamp = true,
      } = options || {};

      const now = new Date().toISOString();
      const updateData = {
        locator: locator || null,
        user_id: userId || null,
      };

      if (status) updateData.status = status;
      if (tenantId) updateData.tenant_id = tenantId;
      if (updateTimestamp) updateData.updated_at = now;

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

      const applyUpdate = async (payload, predicateCallback) => {
        let query = supabase
          .from('seat_locks')
          .update(payload)
          .in('seat_id', seatIds);

        if (Array.isArray(statusFilters) && statusFilters.length > 0) {
          query = query.in('status', statusFilters);
        }

        if (funcionId) {
          query = query.eq('funcion_id', funcionId);
        }

        if (typeof predicateCallback === 'function') {
          query = predicateCallback(query) || query;
        }

        return query.select('id, seat_id, status');
      };

      const shouldReturnResult = (result) =>
        result?.error || (Array.isArray(result?.data) && result.data.length > 0);

      const runUpdateSequence = async (payload) => {
        let result = { data: [], error: null };

        if (userId) {
          result = await applyUpdate(payload, (q) => q.eq('user_id', userId));
          if (shouldReturnResult(result)) {
            return result;
          }
        }

        if (sessionId || userId) {
          const browserSession =
            sessionId || userId?.toString() || resolveBrowserSessionId();
          if (browserSession) {
            result = await applyUpdate(payload, (q) =>
              q.eq('session_id', browserSession.toString())
            );
            if (shouldReturnResult(result)) {
              return result;
            }
          }
        }

        result = await applyUpdate(payload, (q) => q.is('user_id', null));
        return result;
      };

      const isMissingColumnError = (errorObject, column) =>
        errorObject?.code === 'PGRST204' &&
        typeof errorObject?.message === 'string' &&
        errorObject.message.includes(`'${column}'`);

      let response = await runUpdateSequence(updateData);

      if (response.error && isMissingColumnError(response.error, 'precio') && updateData.precio !== undefined) {
        console.warn(
          '[SeatLocatorService] "precio" column unavailable, retrying without it.'
        );

        const fallbackUpdate = { ...updateData };
        delete fallbackUpdate.precio;
        response = await runUpdateSequence(fallbackUpdate);
      }

      if (response.error) throw response.error;

      const updatedRows = Array.isArray(response.data) ? response.data : [];
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
          updated_at: new Date().toISOString(),
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

      const total = Array.isArray(data) ? data.length : 0;
      const seleccionado = data?.filter((s) => s.status === 'seleccionado').length ?? 0;
      const vendido = data?.filter((s) => s.status === 'vendido').length ?? 0;
      const liberado = data?.filter((s) => s.status === 'liberado').length ?? 0;

      return { total, seleccionado, vendido, liberado };
    } catch (error) {
      console.error('Error getting seat stats by locator:', error);
      return { total: 0, seleccionado: 0, vendido: 0, liberado: 0 };
    }
  }
}

const seatLocatorService = new SeatLocatorService();
export default seatLocatorService;
