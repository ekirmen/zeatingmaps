// services/supabaseSeats.js
import { supabase } from './supabaseClient';

// ✅ Bloquear o desbloquear varios asientos por ID
export const setSeatsBlocked = async (seatIds, bloqueado) => {
  const { data, error } = await supabase
    .from('seats')
    .update({ bloqueado })
    .in('id', seatIds);

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
  const { data, error } = await supabase
    .from('seats')
    .update(updates)
    .eq('id', seatId)
    .select();

  if (error) throw new Error(error.message);
  return data[0];
};
