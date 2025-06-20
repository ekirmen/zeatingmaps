import { supabase } from '../../backoffice/services/supabaseClient';

export const registerUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    throw new Error(error?.message || 'Error al registrar usuario');
  }
  const userId = data.user.id;
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, login: email });
  if (profileError) {
    console.warn('Profile upsert error:', profileError.message);
  }
  return data;
};

export const loginUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(error?.message || 'Credenciales incorrectas');
  }
  return data;
};
