import { supabase, supabaseAdmin } from '../../supabaseClient';

/**
 * Retrieve a user by email from the profiles table.
 * Simplified version that goes directly to the profiles table.
 */
export const getUserByEmail = async (email) => {
  const client = supabaseAdmin || supabase;

  // Go directly to profiles table
  const { data, error } = await client
    .from('profiles')
    .select('id, login')
    .eq('login', email)
    .maybeSingle();

  if (error || !data) {
    return { data: null, error: error || new Error('User not found') };
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
};
