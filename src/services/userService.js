import { supabase } from '../supabaseClient';

/**
 * Fetch all users with relevant profile fields.
 *
 * This helper uses the authenticated supabase client so it
 * respects row level security policies defined in the project.
 */
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  return data;
};