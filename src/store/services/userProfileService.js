// src/store/services/userProfileService.js
import { supabase } from '../../supabaseClient';

// Obtener perfil completo del usuario
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_tenants!inner(
          role,
          permissions,
          tenants(
            company_name,
            subdomain,
            domain
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
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
      .select(`
        *,
        events(
          name,
          date,
          venue,
          image_url
        ),
        tickets(
          id,
          seat_number,
          section
        )
      `)
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
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        events(
          name,
          date,
          venue,
          image_url
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
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
      .select(`
        *,
        events(
          id,
          name,
          date,
          venue,
          image_url,
          description
        )
      `)
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
      .select(`
        *,
        events(
          name,
          date
        )
      `)
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
    // Estadísticas de compras
    const { data: purchases, error: purchasesError } = await supabase
      .from('sales')
      .select('total_amount, status')
      .eq('user_id', userId);

    // Estadísticas de reservas
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('status')
      .eq('user_id', userId);

    // Estadísticas de favoritos
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId);

    if (purchasesError || reservationsError || favoritesError) {
      throw new Error('Error al obtener estadísticas');
    }

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