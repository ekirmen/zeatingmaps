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
  // Try querying the expected `profiles_with_auth` view first. If it doesn't
  // exist (returns 404) or any other error occurs, fall back to a more generic
  // `profile_view` if available. This helps installations that renamed the view
  // or already expose the necessary join under a different name.
  let { data, error } = await client
    .from('profiles_with_auth')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (error && error.code === '42P01') {
    // relation does not exist: attempt profile_view instead
    ({ data, error } = await client
      .from('profile_view')
      .select('id, email')
      .eq('email', email)
      .maybeSingle());
  }

  if (error || !data) {
    return { data: null, error: error || new Error('User not found') };
  }

  return { data: { user: { id: data.id, email: data.email } }, error: null };
};
