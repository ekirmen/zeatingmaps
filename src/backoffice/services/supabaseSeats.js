// services/supabaseSeats.js
// Prefer the admin client when available so updates bypass RLS restrictions.
import { supabase } from '../../supabaseClient';
import { supabaseAdmin } from './supabaseClient';
import { isUuid } from '../../utils/isUuid';

const normalizeSeatId = (id) =>
  typeof id === 'string' && id.startsWith('silla_') ? id.slice(6) : id;
// ✅ Bloquear o desbloquear varios asientos por ID
export const setSeatsBlocked = async (seatIds, bloqueado) => {
  // The `seats` table identifies each seat using the `_id` field. When the
  // frontend sends seat identifiers they correspond to this column rather than
  // the numeric primary key. Filtering by `id` caused errors because the values
  // include the `silla_` prefix and are not numeric. We therefore update the
  // records using the `_id` column instead of `id`.
  const normalized = seatIds
    .map(normalizeSeatId)
    .filter((id) => id && isUuid(id));

  if (normalized.length === 0) return [];

  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('seats')
    .update({ bloqueado })
    .in('_id', normalized);

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
    .eq('status', 'vendido');

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
  const id = normalizeSeatId(seatId);
  const client = supabaseAdmin || supabase;
  const { error } = await client
    .from('seats')
    .delete()
    .eq('_id', id);

  if (error) throw new Error(error.message);
};

// ✅ Actualizar asiento
export const updateSeat = async (seatId, updates) => {
  const id = normalizeSeatId(seatId);
  if (!isUuid(id)) {
    throw new Error('Invalid seat ID');
  }
  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('seats')
    .update(updates)
    .eq('_id', id)
    .select();

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error('Seat not found');
  }
  return data[0];
};

// ✅ Create or update a seat
export const createOrUpdateSeat = async (seatId, funcionId, zonaId, updates) => {
  const id = normalizeSeatId(seatId);
  if (!isUuid(id)) {
    throw new Error('Invalid seat ID');
  }
  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('seats')
    .update(updates)
    .match({ _id: id, funcion_id: funcionId })
    .select();

  if (error) throw new Error(error.message);
  if (data && data.length > 0) {
    return data[0];
  }

  const seatData = { _id: id, funcion_id: funcionId, zona: zonaId, ...updates };
  const { data: insertData, error: insertErr } = await client
    .from('seats')
    .insert([seatData])
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);
  return insertData;
};
