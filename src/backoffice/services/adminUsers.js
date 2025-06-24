import { supabase, supabaseAdmin } from './supabaseClient';

/**
 * Retrieve a user by email using the available admin API.
 * If `getUserByEmail` is not provided by the installed
 * `supabase-js` version, fall back to fetching the profile
 * joined with `auth.users`.
 */
export const getUserByEmail = async (email) => {
  const client = supabaseAdmin || supabase;
  const admin = client.auth.admin;

  if (typeof admin.getUserByEmail === 'function') {
    return admin.getUserByEmail(email);
  }

  // Fallback for libraries that removed getUserByEmail.
  const { data, error } = await client
    .from('profiles')
    .select('id, auth:auth.users(email)')
    .eq('auth.email', email)
    .single();

  if (error || !data) {
    return { data: null, error: error || new Error('User not found') };
  }

  return { data: { user: { id: data.id, email: data.auth?.email } }, error: null };
};
