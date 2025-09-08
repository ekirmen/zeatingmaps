// src/store/services/userProfileService.js
import { supabase } from '../../supabaseClient';

// Obtener perfil completo del usuario
export const getUserProfile = async (userId) => {
  try {
    // Paso 1: perfil básico sin joins
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

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

    return { ...profile, tenants: tenantsInfo };
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
};

// Obtener compras del usuario
export const getUserPurchases = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener compras:', error);
    return [];
  }
};

// Obtener reservas del usuario
export const getUserReservations = async (userId) => {
  // intentar con 'reservations' y fallback a 'reservas'
  const tryFetch = async (table) => supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

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
export const getUserFavorites = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return [];
  }
};

// Obtener historial de actividades del usuario
export const getUserActivityHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
};

// Actualizar perfil del usuario
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        login: profileData.email,
        telefono: profileData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
};

// Obtener estadísticas del usuario
export const getUserStats = async (userId) => {
  try {
    let purchases = [];
    let reservations = [];
    let favorites = [];

    try {
      const res = await supabase.from('sales').select('total_amount,status').eq('user_id', userId);
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
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);

    const activeReservations = reservations.filter(r => r.status === 'active').length;
    const totalFavorites = favorites.length;

    return {
      totalPurchases: purchases.length,
      totalSpent,
      activeReservations,
      totalFavorites,
      completedPurchases: purchases.filter(p => p.status === 'completed').length
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      totalPurchases: 0,
      totalSpent: 0,
      activeReservations: 0,
      totalFavorites: 0,
      completedPurchases: 0
    };
  }
};