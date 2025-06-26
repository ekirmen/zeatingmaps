import { supabase } from '../backoffice/services/supabaseClient';

export const fetchAbonosByUser = async (userId) => {
  if (!userId) throw new Error('User ID es requerido');

  const { data, error } = await supabase
    .from('abonos')
    .select('*')
    .eq('user', userId);

  if (error) throw new Error(`Error al obtener abonos: ${error.message}`);
  return data;
};

export const createAbono = async (abonoData) => {
  const { data, error } = await supabase
    .from('abonos')
    .insert([abonoData])
    .select()
    .single();

  if (error) throw new Error(`Error al crear abono: ${error.message}`);
  return data;
};

export const renewAbono = async (id, renewData) => {
  const { data, error } = await supabase
    .from('abonos')
    .update(renewData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error al renovar abono: ${error.message}`);
  return data;
};
