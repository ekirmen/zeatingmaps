import { getDatabaseInstance } from '../../services/firebaseClient';
import { ref, set, remove } from 'firebase/database';
import getCartSessionId from '../../utils/getCartSessionId';

const getExpiration = () => {
  let mins = 15;
  try {
    const saved = sessionStorage.getItem('cartSeatMinutes');
    const parsed = parseInt(saved, 10);
    if (!isNaN(parsed)) mins = parsed;
  } catch (_) {}
  return Date.now() + mins * 60 * 1000;
};

const normalizeSeatId = (id) =>
  typeof id === 'string' && id.startsWith('silla_') ? id.slice(6) : id;

const buildLockPath = (funcionId, seatId) =>
  funcionId ? `in-cart/${funcionId}/${seatId}` : `in-cart/${seatId}`;

// Add a seat to the locking table with the provided status. If the seat
// already exists in the table we simply update its status.
export const lockSeat = async (
  seatId,
  status = 'bloqueado',
  funcionId,
  options = {}
) => {
  const id = normalizeSeatId(seatId);
  const db = await getDatabaseInstance();
  if (db) {
    const path = buildLockPath(funcionId, id);
    console.log('[seatLocks] Writing lock to Firebase for seat', id, 'at', path);
    const payload = {
      status,
      timestamp: Date.now(),
      session_id: getCartSessionId(),
      expires: options.expires || getExpiration(),
      seatDetails: options.seatDetails || null,
    };
    try {
      await set(ref(db, path), payload);
      console.log('[seatLocks] Seat', id, 'stored in Firebase with status', status);
    } catch (error) {
      console.error('[seatLocks] Error storing seat lock:', error);
    }
  } else {
    console.log('[seatLocks] No Firebase database instance available');
  }
};

// Cleanup expired locks for a given functionId
export const cleanupExpiredLocks = async (funcionId) => {
  const db = await getDatabaseInstance();
  if (!db) return;
  const locksRef = ref(db, `in-cart/${funcionId}`);
  try {
    // Use get() from firebase/database to fetch snapshot
    const { get } = await import('firebase/database');
    const snapshot = await get(locksRef);
    const locks = snapshot.val() || {};
    const now = Date.now();
    for (const [seatId, lock] of Object.entries(locks)) {
      if (lock.expires && lock.expires < now) {
        const seatRef = ref(db, `in-cart/${funcionId}/${seatId}`);
        await remove(seatRef);
        console.log(`[seatLocks] Removed expired lock for seat ${seatId}`);
      }
    }
  } catch (error) {
    console.error('[seatLocks] Error cleaning up expired locks:', error);
  }
};

// Remove a seat from the locking table.
export const unlockSeat = async (seatId, funcionId) => {
  const id = normalizeSeatId(seatId);
  const db = await getDatabaseInstance();
  if (db) {
    const path = buildLockPath(funcionId, id);
    console.log('[seatLocks] Removing lock from Firebase for seat', id, 'at', path);
    await remove(ref(db, path));
  } else {
    console.log('[seatLocks] No Firebase database instance available');
  }
};
