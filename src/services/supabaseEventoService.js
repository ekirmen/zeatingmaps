import { supabase } from '../backoffice/services/supabaseClient';

export const fetchEventos = async () => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const createEvento = async (evento) => {
  const { data, error } = await supabase
    .from('eventos')
    .insert([evento])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateEvento = async (id, updates) => {
  const { data, error } = await supabase
    .from('eventos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteEvento = async (id) => {
  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
