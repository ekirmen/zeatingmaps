import { supabase } from '../supabaseClient';

export const fetchAbonosByUser = async (userId) => {
  if (!userId) throw new Error('User ID es requerido');

  const { data, error } = await supabase
    .from('abonos')
    .select('*')
    .eq('usuario_id', userId);

  if (error) throw new Error(`Error al obtener abonos: ${error.message}`);
  return data.map((a) => ({
    ...a,
    user: a.usuario_id,
    seat: a.seat_id,
    packageType: a.package_type,
    startDate: a.start_date,
    endDate: a.end_date,
  }));
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
