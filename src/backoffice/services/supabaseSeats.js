// src/backoffice/services/supabaseSeats.js

import { supabase } from '../../supabaseClient'; // Ensure this path is correct

/**
 * Fetches all seat records associated with a specific function ID from Supabase.
 *
 * @param {number} funcionId - The ID of the function/event to fetch seats for.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of seat objects, or an empty array if an error occurs.
 */
export const fetchSeatsByFuncion = async (funcionId) => {
  try {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('funcion_id', funcionId);

    if (error) {
      console.error('Error fetching seats by function:', error.message);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Unexpected error fetching seats by function:', error.message);
    return [];
  }
};

/**
 * Creates a new seat record or updates an existing one in the Supabase 'seats' table.
 * This function handles the logic for managing seat status (e.g., locking/unlocking).
 * It first attempts to find the seat; if found, it updates it, otherwise it inserts a new record.
 *
 * @param {string} seatId - The UUID of the seat.
 * @param {number} funcionId - The ID of the function/event the seat belongs to.
 * @param {string} zonaId - The zone ID of the seat. (Required for new insertions).
 * @param {object} payload - The data to update or insert (e.g., { status: 'bloqueado', user_id: '...' }).
 * @returns {Promise<object|null>} A promise that resolves to the updated or inserted seat data, or null if the operation fails.
 */
export const createOrUpdateSeat = async (seatId, funcionId, zonaId, payload) => {
  if (!seatId || !funcionId || !zonaId) {
    console.error('createOrUpdateSeat: Missing required parameters (seatId, funcionId, zonaId).');
    return null;
  }

  try {
    // Build the payload for insert/update operations
    const insertPayload = {
      _id: seatId,
      funcion_id: funcionId,
      zona: zonaId,
      ...payload,
    };

    // Check if the seat already exists to avoid relying on ON CONFLICT,
    // which requires a database constraint that might not be present.
    const { data: existingSeat, error: selectError } = await supabase
      .from('seats')
      .select('_id')
      .eq('_id', seatId)
      .eq('funcion_id', funcionId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking existing seat:', selectError.message);
      throw selectError;
    }

    let result;
    if (existingSeat) {
      // Seat exists, perform an update
      const { data, error } = await supabase
        .from('seats')
        .update(insertPayload)
        .eq('_id', seatId)
        .eq('funcion_id', funcionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating seat:', error.message);
        throw error;
      }
      result = data;
    } else {
      // Seat does not exist, insert a new row
      const { data, error } = await supabase
        .from('seats')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        console.error('Error inserting seat:', error.message);
        throw error;
      }
      result = data;
    }

    console.log(`Seat ${seatId} operation successful.`);
    return result;
  } catch (error) {
    console.error('Error in createOrUpdateSeat:', error.message);
    throw error; // Re-throw to allow calling context to handle
  }
};

/**
 * Unlocks a seat in Supabase by setting its status to 'disponible' and clearing associated lock information.
 * This function is typically used when a user removes a seat from their cart or a lock expires.
 *
 * @param {string} seatId - The UUID of the seat to unlock.
 * @param {number} funcionId - The ID of the function/event the seat belongs to.
 * @param {string} [userId=null] - Optional: The user ID who locked the seat. If provided, the unlock operation will only succeed if this userId matches the 'locked_by' column, adding an extra layer of security.
 * @returns {Promise<object|null>} A promise that resolves to the updated seat data, or null if the operation fails or no matching locked seat is found.
 */
export const unlockSeat = async (seatId, funcionId, userId = null) => {
  if (!seatId || !funcionId) {
    console.error('unlockSeat: Missing required parameters (seatId, funcionId).');
    return null;
  }

  try {
    const updatePayload = {
      status: 'disponible',
      locked_at: null,
      locked_by: null,
      lock_expires_at: null,
      user_id: null // Also clear the user_id if it was associated with a temporary lock
    };

    let query = supabase
      .from('seats')
      .update(updatePayload)
      .eq('_id', seatId) // Crucial fix: Use .eq() for UUID primary key
      .eq('funcion_id', funcionId);

    // Optionally add a check for locked_by for more secure unlocking
    if (userId) {
      query = query.eq('locked_by', userId);
      console.log(`Attempting to unlock seat ${seatId} by user ${userId} for funcion ${funcionId}.`);
    } else {
      console.log(`Attempting to unlock seat ${seatId} for funcion ${funcionId} (no specific user).`);
    }

    const { data, error } = await query.select(); // Return the updated row

    if (error) {
      console.error('Error unlocking seat in Supabase:', error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(`Unlock operation for seat ${seatId} did not affect any rows. It might not have been locked by this user or was already unlocked.`);
      return null; // No row was updated
    }

    console.log(`Seat ${seatId} unlocked successfully.`);
    return data; // Return the updated data
  } catch (error) {
    console.error('Error in unlockSeat:', error.message);
    throw error; // Re-throw to allow calling context to handle
  }
};
