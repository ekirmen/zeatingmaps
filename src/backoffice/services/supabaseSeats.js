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
    // Attempt to find the seat by its _id (UUID) and funcion_id
    const { data: existingSeat, error: fetchError } = await supabase
      .from('seats')
      .select('*')
      .eq('_id', seatId) // Use .eq() for exact match on UUID primary key
      .eq('funcion_id', funcionId)
      .maybeSingle(); // Use maybeSingle() to get a single record or null

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 indicates no rows found, which is expected for new seats
      console.error('Error checking for existing seat in Supabase:', fetchError.message);
      throw fetchError;
    }

    let result;
    if (existingSeat) {
      // If the seat already exists, update its properties
      console.log(`Updating existing seat: ${seatId} for funcion: ${funcionId}`);
      const { data, error } = await supabase
        .from('seats')
        .update(payload)
        .eq('_id', seatId) // Crucial fix: Use .eq() for UUID primary key
        .eq('funcion_id', funcionId) // Also match on funcion_id for safety and specificity
        .select(); // Return the updated row

      result = { data, error };
    } else {
      // If the seat does not exist, insert a new record
      console.log(`Inserting new seat: ${seatId} for funcion: ${funcionId}`);
      // Ensure all NOT NULL columns are provided for insertion
      const insertPayload = {
        _id: seatId, // Provide the UUID for insertion
        funcion_id: funcionId,
        zona: zonaId, // Assuming 'zona' is the correct column name and is NOT NULL
        ...payload
      };

      const { data, error } = await supabase
        .from('seats')
        .insert([insertPayload])
        .select(); // Return the inserted row

      result = { data, error };
    }

    if (result.error) {
      console.error('Supabase operation failed (createOrUpdateSeat):', result.error.message);
      throw result.error;
    }

    console.log(`Seat ${seatId} operation successful.`);
    return result.data; // Return the first (and only) item if successful
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
