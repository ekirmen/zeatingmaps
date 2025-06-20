import { supabase } from '../backoffice/services/supabaseClient';

/**
 * Fetch all users with relevant profile fields.
 *
 * This helper uses the authenticated supabase client so it
 * respects row level security policies defined in the project.
 */
export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('login, email, telefono, empresa, perfil, permisos, formaDePago');

  if (error) throw error;
  return data;
};

