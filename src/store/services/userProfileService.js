// src/store/services/userProfileService.js
import { supabase } from '../../supabaseClient';

// Obtener perfil completo del usuario
export 

    if (profileError) throw profileError;

    // Si el perfil no existe (posible alta antigua o RLS), devolver un stub mínimo
    const safeProfile = profile || { id: userId, login: null, telefono: null, permisos: {}, tenant_id: null };

    // Paso 2: intentar vista overview (si existe)
    let tenantsInfo = [];
    try {
      const { data: overview } = await supabase
        .from('user_tenants_overview')
        .select('role,permissions,company_name,subdomain,domain')
        .eq('user_id', userId);
      if (Array.isArray(overview)) {
        tenantsInfo = overview;
      }
    } catch (_) {
      // Paso 3: fallback a tablas crudas sin joins
      try {
        const { data: ut } = await supabase
          .from('user_tenants')
          .select('role,permissions,tenant_id')
          .eq('user_id', userId);
        if (Array.isArray(ut) && ut.length > 0) {
          const tenantIds = ut.map(t => t.tenant_id).filter(Boolean);
          if (tenantIds.length > 0) {
            const { data: tenants } = await supabase
              .from('tenants')
              .select('id,company_name,subdomain,domain')
              .in('id', tenantIds);
            const mapById = new Map((tenants || []).map(t => [t.id, t]));
            tenantsInfo = ut.map(t => ({
              role: t.role,
              permissions: t.permissions,
              company_name: mapById.get(t.tenant_id)?.company_name || null,
              subdomain: mapById.get(t.tenant_id)?.subdomain || null,
              domain: mapById.get(t.tenant_id)?.domain || null,
            }));
          }
        }
      } catch (_) {
        // silenciar, devolveremos solo el perfil
      }
    }

    return { ...safeProfile, tenants: tenantsInfo };
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
};

// Obtener compras del usuario (desde payment_transactions)
export 

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener compras:', error);
    return [];
  }
};

// Obtener compras con asientos del usuario
export 

    if (error) throw error;

    // Para cada transacción, obtener sus asientos y datos del evento
    const transactionsWithSeats = await Promise.all(
      (transactions || []).map(async (transaction) => {
        try {
          // Obtener asientos
          const { data: seats, error: seatsError } = await supabase
            .from('seat_locks')
            .select('seat_id, table_id, status, locked_at, expires_at')
            .eq('locator', transaction.locator);

          if (seatsError) {
          }

          // Obtener datos del evento para verificar si wallet está habilitado
          let eventData = null;
          if (transaction.evento_id) {
            try {
              const { data: event, error: eventError } = await supabase
                .from('eventos')
                .select('id, datosBoleto, nombre')
                .eq('id', transaction.evento_id)
                .maybeSingle();

              if (!eventError && event) {
                eventData = event;
              }
            } catch (eventErr) {
            }
          }

          return {
            ...transaction,
            seats: seats || [],
            event: eventData
          };
        } catch (error) {
          return { ...transaction, seats: [], event: null };
        }
      })
    );

    return transactionsWithSeats;
  } catch (error) {
    console.error('Error al obtener compras con asientos:', error);
    return [];
  }
};

// Obtener reservas del usuario
export 

  try {
    let { data, error } = await tryFetch('reservations');
    if (error) {
      ({ data, error } = await tryFetch('reservas'));
      if (error) throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return [];
  }
};

// Obtener eventos favoritos del usuario
export 

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return [];
  }
};

// Obtener historial de actividades del usuario
export 

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
};

// Actualizar perfil del usuario
export 

    if (error) throw error;
    if (!data) {
      throw new Error('No se pudo actualizar el perfil (sin filas coincidentes o sin permisos)');
    }
    return data;
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
};

// Obtener estadísticas del usuario
export 
    let reservations = [];
    let favorites = [];

    try {
      // Usar payment_transactions en lugar de sales
      const res = await supabase.from('payment_transactions').select('amount,status').eq('user_id', userId);
      purchases = res.data || [];
    } catch (_) {}

    try {
      let res = await supabase.from('reservations').select('status').eq('user_id', userId);
      if (res.error) {
        res = await supabase.from('reservas').select('status').eq('user_id', userId);
      }
      reservations = res.data || [];
    } catch (_) {}

    try {
      const res = await supabase.from('user_favorites').select('id').eq('user_id', userId);
      favorites = res.data || [];
    } catch (_) {}

    const totalSpent = purchases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const activeReservations = reservations.filter(r => r.status === 'active').length;
    const totalFavorites = favorites.length;

    return {
      totalPurchases: purchases.length,
      totalSpent,
      activeReservations,
      totalFavorites,
      completedPurchases: purchases.filter(p => p.status === 'completed').length,
      pendingPurchases: purchases.filter(p => p.status === 'pending').length,
      failedPurchases: purchases.filter(p => p.status === 'failed').length
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      totalPurchases: 0,
      totalSpent: 0,
      activeReservations: 0,
      totalFavorites: 0,
      completedPurchases: 0,
      pendingPurchases: 0,
      failedPurchases: 0
    };
  }
};
