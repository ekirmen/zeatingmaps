import { supabase, supabaseAdmin } from './supabaseClient';
import { isUuid } from '../../utils/isUuid';
import { getDatabaseInstance } from '../../services/firebaseClient';
import { ref, set, remove } from 'firebase/database';

const TABLE = 'seat_locks';
const normalizeSeatId = (id) =>
  typeof id === 'string' && id.startsWith('silla_') ? id.slice(6) : id;

// Add a seat to the locking table with the provided status. If the seat
// already exists in the table we simply update its status.
export const lockSeat = async (seatId, status = 'bloqueado') => {
  const id = normalizeSeatId(seatId);
  if (!isUuid(id)) {
    throw new Error('Invalid seat ID');
  }
  const client = supabaseAdmin || supabase;
  const { error } = await client
    .from(TABLE)
    .upsert({ seat_id: id, status }, { onConflict: 'seat_id' });
  if (error) throw new Error(error.message);

  const db = await getDatabaseInstance();
  if (db) {
    await set(ref(db, `in-cart/${id}`), { status, timestamp: Date.now() });
  }
};

// Remove a seat from the locking table.
export const unlockSeat = async (seatId) => {
  const id = normalizeSeatId(seatId);
  const client = supabaseAdmin || supabase;
  const { error } = await client.from(TABLE).delete().eq('seat_id', id);
  if (error) throw new Error(error.message);

  const db = await getDatabaseInstance();
  if (db) {
    await remove(ref(db, `in-cart/${id}`));
  }
};
