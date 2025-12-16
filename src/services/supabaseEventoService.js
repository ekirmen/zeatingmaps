import { supabase } from '../supabaseClient';

export const getAllEventos = async () => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*');
  if (error) throw error;
  return data;
};

export const getEventoById = async (id) => {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const createEvento = async (evento) => {
  const { data, error } = await supabase
    .from('eventos')
    .insert(evento)
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