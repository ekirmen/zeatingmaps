// src/backoffice/services/authService.js
import { supabase } from '../../backoffice/services/supabaseClient';

// Registro (sign up) con creación de perfil
export const registerUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Error al registrar usuario');
  }

  const userId = data.user.id;

  // Crea perfil en tabla 'profiles' (relacionada con auth.users)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, login: email }); // Puedes agregar más campos si tienes otros

  if (profileError) {
    console.warn('⚠️ Error al crear perfil:', profileError.message);
  }

  return data;
};

// Inicio de sesión (sign in)
export const loginUser = async ({ email, password }) => {
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
