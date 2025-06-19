import { supabase } from '../backoffice/services/supabaseClient'; // Ajusta si la ruta es distinta

export const fetchTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error('Error fetching tags: ' + error.message);
  return data;
};

export const createTag = async (tagData) => {
  const { data, error } = await supabase
    .from('tags')
    .insert([tagData])
    .select()
    .single();

  if (error) throw new Error('Error creating tag: ' + error.message);
  return data;
};

export const updateTag = async (id, updatedData) => {
  const { data, error } = await supabase
    .from('tags')
    .update(updatedData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error('Error updating tag: ' + error.message);
  return data;
};

export const deleteTag = async (id) => {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Error deleting tag: ' + error.message);
  return { success: true };
};
