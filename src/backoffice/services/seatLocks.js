import { isUuid } from '../../utils/isUuid';
import { getDatabaseInstance } from '../../services/firebaseClient';
import { ref, set, remove } from 'firebase/database';

const normalizeSeatId = (id) =>
  typeof id === 'string' && id.startsWith('silla_') ? id.slice(6) : id;

// Add a seat to the locking table with the provided status. If the seat
// already exists in the table we simply update its status.
export const lockSeat = async (seatId, status = 'bloqueado') => {
  const id = normalizeSeatId(seatId);
  if (!isUuid(id)) {
    throw new Error('Invalid seat ID');
  }
  const db = await getDatabaseInstance();
  if (db) {
    console.log('[seatLocks] Writing lock to Firebase for seat', id);
    await set(ref(db, `in-cart/${id}`), { status, timestamp: Date.now() });
    console.log('[seatLocks] Seat', id, 'stored in Firebase with status', status);
  } else {
    console.log('[seatLocks] No Firebase database instance available');
  }
};

// Remove a seat from the locking table.
export const unlockSeat = async (seatId) => {
  const id = normalizeSeatId(seatId);
  const db = await getDatabaseInstance();
  if (db) {
    console.log('[seatLocks] Removing lock from Firebase for seat', id);
    await remove(ref(db, `in-cart/${id}`));
  } else {
    console.log('[seatLocks] No Firebase database instance available');
  }
};
