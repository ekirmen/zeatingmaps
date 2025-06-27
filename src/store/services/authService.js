// src/backoffice/services/authService.js
import { supabase, supabaseAdmin } from '../../backoffice/services/supabaseClient';
import { SITE_URL } from '../../utils/siteUrl';

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
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${SITE_URL}/store` } });
  } else {
    // Fallback to OTP signup if no admin client available
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${SITE_URL}/store` } });
    if (error) throw new Error(error.message);
    return { user: null, session: null };
  }

  const userId = user.id;

  // Crea perfil en tabla 'profiles' (relacionada con auth.users)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      login: email,
      telefono: phone,
      permisos: { role: 'usuario' }, // Asignar rol por defecto
    });

  if (profileError) {
    console.warn('⚠️ Error al crear perfil:', profileError.message);
  }

  return { user, session };
};

// Inicio de sesión (sign in)
export const loginUser = async ({ email, password }) => {
  if (!password) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${SITE_URL}/store` } });
    if (error) throw new Error(error.message);
    return { user: null, session: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(error?.message || 'Credenciales incorrectas');
  }

  return data;
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
