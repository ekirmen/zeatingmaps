import { supabase, supabaseAdmin } from '../../supabaseClient';

/**
 * Retrieve a user by email from the profiles table.
 * Conservative implementation that returns a predictable shape.
 */
export async function getUserByEmail(email) {
  const client = typeof supabaseAdmin !== 'undefined' ? supabaseAdmin : supabase;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, login')
      .eq('login', email)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: new Error('User not found') };
    }

    return {
      data: {
        user: {
          id: data.id,
          email: data.login
        }
      },
      error: null
    };
  } catch (err) {
    return { data: null, error: err };
  }
}
