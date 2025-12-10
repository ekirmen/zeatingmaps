// src/store/services/authService.js
import { supabase } from '../../supabaseClient';
import { supabaseAdmin } from '../../supabaseClient';
import { getStoreBaseUrl } from '../../utils/siteUrl';
import { createAuthError } from '../../utils/authErrorMessages';

const TENANT_STORAGE_KEY = 'zeatingmaps::tenant-context:v1';

// Función helper para obtener el tenant actual del contexto
const getCurrentTenantId = () => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }

    // 1. Intentar obtener el tenant del localStorage (clave directa)
    const tenantId = window.localStorage.getItem('currentTenantId');
    if (tenantId) {
      return tenantId;
    }

    // 2. Intentar obtenerlo del nuevo contexto persistido
    const cachedContextRaw = window.localStorage.getItem(TENANT_STORAGE_KEY);
    if (cachedContextRaw) {
      try {
        const cachedContext = JSON.parse(cachedContextRaw);
        const cachedTenantId = cachedContext?.tenant?.id || null;
        if (cachedTenantId) {
          window.localStorage.setItem('currentTenantId', cachedTenantId);
          return cachedTenantId;
        }
      } catch (parseError) {
      }
    }

    // 3. Intentar obtenerlo del contexto global inyectado en window
    const globalContext = window.__TENANT_CONTEXT__;
    if (globalContext) {
      const globalTenantId =
        typeof globalContext.getTenantId === 'function'
          ? globalContext.getTenantId()
          : globalContext.tenant?.id;

      if (globalTenantId) {
        window.localStorage.setItem('currentTenantId', globalTenantId);
        return globalTenantId;
      }
    }

    // Si no se puede obtener el tenant, mostrar advertencia
    return null;
  } catch (error) {
    return null;
  }
};

// Función para obtener todos los tenants del usuario
export const getUserTenants = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_tenants')
      .select(`
        tenant_id,
        role,
        permissions,
        is_active,
        is_primary,
        tenants (
          id,
          company_name,
          subdomain,
          domain,
          logo_url,
          primary_color
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener tenants del usuario:', error);
    return [];
  }
};

// Función para cambiar el tenant activo del usuario
export const switchUserTenant = async (userId, newTenantId) => {
  try {
    const { data, error } = await supabase.rpc('switch_user_tenant', {
      user_uuid: userId,
      new_tenant_id: newTenantId
    });

    if (error) throw error;

    if (data) {
      // Actualizar el tenant activo en localStorage
      localStorage.setItem('currentTenantId', newTenantId);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error al cambiar tenant:', error);
    return false;
  }
};

// Función para agregar un usuario a un tenant
export const addUserToTenant = async (userId, tenantId, role = 'usuario', permissions = {}) => {
  try {
    const { data, error } = await supabase.rpc('add_user_to_tenant', {
      user_uuid: userId,
      tenant_uuid: tenantId,
      user_role: role,
      user_permissions: permissions
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al agregar usuario al tenant:', error);
    return false;
  }
};

// Registro (sign up) con creación de perfil
export const registerUser = async ({ email, password, phone }) => {
  let user = null;
  let session = null;

  if (password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { password_set: true } },
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Error al registrar usuario');
    }

    user = data.user;
    session = data.session;
  } else if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      user_metadata: { password_set: false },
      email_confirm: false,
    });
    if (error || !data.user) {
      throw new Error(error?.message || 'Error al registrar usuario');
    }
    user = data.user;
    // send magic link for initial login
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: getStoreBaseUrl() } });
  } else {
    // Fallback to OTP signup if no admin client available
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: getStoreBaseUrl() } });
    if (error) throw new Error(error.message);
    return { user: null, session: null };
  }

  const userId = user.id;

  // Obtener el tenant_id actual
  const tenantId = getCurrentTenantId();

  if (!tenantId) {
    // En producción, esto debería ser un error crítico
    // throw new Error('No se pudo determinar la empresa para el registro');
  }

  // Crea perfil en tabla 'profiles' (relacionada con auth.users)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      login: email,
      telefono: phone,
      permisos: { role: 'usuario' }, // Asignar rol por defecto
      tenant_id: tenantId, // Asignar el tenant_id correspondiente
    });

  if (profileError) {
  }

  // Agregar usuario al tenant actual usando la nueva tabla user_tenants
  if (tenantId) {
    try {
      const { error: tenantError } = await supabase.rpc('add_user_to_tenant', {
        user_uuid: userId,
        tenant_uuid: tenantId,
        user_role: 'usuario',
        user_permissions: { role: 'usuario' }
      });

      if (tenantError) {
      } else {
      }
    } catch (error) {
    }
  }

  if (profileError) {
  }

  return { user, session };
};

// Inicio de sesión (sign in)
export const loginUser = async ({ email, password }) => {
  if (!password) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: getStoreBaseUrl() } });
    if (error) {
      throw await createAuthError({ error, email, supabaseClient: supabase });
    }
    return { user: null, session: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    const authError = await createAuthError({
      error: error || new Error('Respuesta de inicio de sesión inválida'),
      email,
      supabaseClient: supabase,
    });
    throw authError;
  }

  // Verificar que el usuario tenga acceso al tenant actual
  if (data.user) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, permisos')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
      } else {
        // Verificar que el usuario tenga un tenant_id válido
        if (!profile.tenant_id) {
          // En producción, esto podría ser un error crítico
        }

        // Verificar que el usuario tenga acceso al tenant actual
        const currentTenantId = getCurrentTenantId();
        if (currentTenantId && profile.tenant_id && profile.tenant_id !== currentTenantId) {
          // En producción, esto debería ser un error de acceso denegado
          // throw new Error('No tienes acceso a esta empresa');
        }
      }
    } catch (error) {
    }
  }

  return data;
};

// Función para verificar el acceso del usuario al tenant actual
export const verifyTenantAccess = async (userId) => {
  try {
    const currentTenantId = getCurrentTenantId();
    if (!currentTenantId) {
      return { hasAccess: false, reason: 'No se pudo determinar la empresa' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tenant_id, permisos')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Error al verificar perfil del usuario:', error);
      return { hasAccess: false, reason: 'Error al verificar perfil' };
    }

    if (!profile.tenant_id) {
      return { hasAccess: false, reason: 'Usuario sin empresa asignada' };
    }

    if (profile.tenant_id !== currentTenantId) {
      return {
        hasAccess: false,
        reason: 'Usuario no tiene acceso a esta empresa',
        userTenant: profile.tenant_id,
        currentTenant: currentTenantId
      };
    }

    return { hasAccess: true, profile };
  } catch (error) {
    console.error('❌ Error al verificar acceso del usuario:', error);
    return { hasAccess: false, reason: 'Error inesperado' };
  }
};

// Cierre de sesión
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};

// Obtener usuario actual
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
};
