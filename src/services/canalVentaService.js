import { supabase } from '../supabaseClient';

/**
 * Obtiene todos los canales de venta del tenant del usuario actual
 */
export const fetchCanalesVenta = async () => {
  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();

      return [];
    }

    // Obtener el tenant_id del perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      return [];
    }
    const { data, error } = await supabase
      .from('canales_venta')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('activo', true) // Solo canales activos
      .order('nombre');

    if (error) {
      console.error('Error fetching canales venta:', error);
      throw new Error('Error fetching canales venta: ' + error.message);
    }
    return data || [];
  } catch (error) {
    console.error('Error in fetchCanalesVenta:', error);
    return [];
  }
};

/**
 * Verifica si un canal de venta específico está activo para el tenant
 */
export 
    if (!user) return false;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) return false;

    const { data, error } = await supabase
      .from('canales_venta')
      .select('activo')
      .eq('id', canalId)
      .eq('tenant_id', profile.tenant_id)
      .eq('activo', true)
      .single();

    if (error || !data) return false;
    return data.activo === true;
  } catch (error) {
    console.error('Error verificando canal de venta:', error);
    return false;
  }
};

/**
 * Obtiene canales de venta por URL (para validar desde qué sitio se accede)
 */
export 
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) return null;

    // Buscar canal que coincida con la URL
    const { data, error } = await supabase
      .from('canales_venta')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('activo', true)
      .ilike('url', `%${url}%`)
      .single();

    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error('Error obteniendo canal por URL:', error);
    return null;
  }
};

/**
 * Crea un nuevo canal de venta
 */
export const createCanalVenta = async (canalData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    const canalWithTenant = {
      ...canalData,
      tenant_id: profile.tenant_id
    };

    const { data, error } = await supabase
      .from('canales_venta')
      .insert([canalWithTenant])
      .select()
      .single();

    if (error) throw new Error('Error creating canal venta: ' + error.message);
    return data;
  } catch (error) {
    console.error('Error in createCanalVenta:', error);
    throw error;
  }
};

/**
 * Actualiza un canal de venta existente
 */
export const updateCanalVenta = async (id, canalData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    const { data, error } = await supabase
      .from('canales_venta')
      .update(canalData)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select()
      .single();

    if (error) throw new Error('Error updating canal venta: ' + error.message);
    return data;
  } catch (error) {
    console.error('Error in updateCanalVenta:', error);
    throw error;
  }
};

/**
 * Elimina un canal de venta
 */
export const deleteCanalVenta = async (id) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant_id válido');
    }

    const { error } = await supabase
      .from('canales_venta')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id);

    if (error) throw new Error('Error deleting canal venta: ' + error.message);
    return { success: true };
  } catch (error) {
    console.error('Error in deleteCanalVenta:', error);
    throw error;
  }
};
