import { supabase } from '../supabaseClient';


export const getAbonosByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('abonos')
      .select('*')
      .eq('usuario_id', userId);

    if (error) {
      console.error('Error fetching abonos:', error);
      return [];
    }

    return data.map((a) => ({
      ...a,
      user: a.usuario_id,
      seat: a.seat_id,
      packageType: a.package_type,
      startDate: a.start_date,
      endDate: a.end_date,
    }));
  } catch (error) {
    console.error('Error in getAbonosByUser:', error);
    return [];
  }
};

export const createAbono = async (abonoData) => {
  try {
    const { data, error } = await supabase
      .from('abonos')
      .insert([abonoData])
      .select()
      .single();

    if (error) throw new Error(`Error al crear abono: ${error.message}`);
    return data;
  } catch (error) {
    console.error('Error creating abono:', error);
    throw error;
  }
};

export const renewAbono = async (abonoId, renewalData) => {
  try {
    const { data, error } = await supabase
      .from('abonos')
      .update(renewalData)
      .eq('id', abonoId)
      .select()
      .single();

    if (error) throw new Error(`Error al renovar abono: ${error.message}`);
    return data;
  } catch (error) {
    console.error('Error renewing abono:', error);
    throw error;
  }
};