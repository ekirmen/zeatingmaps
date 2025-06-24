// services/supabaseSeats.js
import { supabase } from '../../backoffice/services/supabaseClient';
import { isUuid } from '../../utils/isUuid';
// ✅ Bloquear o desbloquear varios asientos por ID
export const setSeatsBlocked = async (seatIds, bloqueado) => {
  // The `seats` table identifies each seat using the `_id` field. When the
  // frontend sends seat identifiers they correspond to this column rather than
  // the numeric primary key. Filtering by `id` caused errors because the values
  // include the `silla_` prefix and are not numeric. We therefore update the
  // records using the `_id` column instead of `id`.
  const { data, error } = await supabase
    .from('seats')
    .update({ bloqueado })
    .in('_id', seatIds);

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Obtener asientos por función
export const fetchSeatsByFuncion = async (funcionId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('funcion_id', funcionId);

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Obtener asientos comprados de una función (opcionalmente por estado)
export const fetchAsientosComprados = async (funcionId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('funcion_id', funcionId)
    .eq('estado', 'vendido');

  if (error) throw new Error(error.message);
  return data;
};

// ✅ Crear un asiento
export const createSeat = async (seatData) => {
  const { data, error } = await supabase
    .from('seats')
    .insert([seatData])
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};

// ✅ Eliminar asiento por ID
export const deleteSeat = async (seatId) => {
  const { error } = await supabase
    .from('seats')
    .delete()
    .eq('id', seatId);

  if (error) throw new Error(error.message);
};

// ✅ Actualizar asiento
export const updateSeat = async (seatId, updates) => {
  if (!isUuid(seatId)) {
    throw new Error('Invalid seat ID');
  }
  const { data, error } = await supabase
    .from('seats')
    .update(updates)
    .eq('id', seatId)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};
