import { getDatabaseInstance } from '../../services/firebaseClient';
import { ref, set, remove } from 'firebase/database';

let cachedSessionId = null;

const getSessionId = () => {
  if (cachedSessionId) return cachedSessionId;
  try {
    cachedSessionId = localStorage.getItem('cart_session_id');
    if (!cachedSessionId) {
      cachedSessionId = crypto.randomUUID();
      localStorage.setItem('cart_session_id', cachedSessionId);
    }
  } catch (err) {
    cachedSessionId = crypto.randomUUID();
  }
  return cachedSessionId;
};

const getExpiration = () => {
  let mins = 15;
  try {
    const saved = localStorage.getItem('cartSeatMinutes');
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
      session_id: getSessionId(),
      expires: options.expires || getExpiration(),
      seatDetails: options.seatDetails || null,
    };
    await set(ref(db, path), payload);
    console.log('[seatLocks] Seat', id, 'stored in Firebase with status', status);
  } else {
    console.log('[seatLocks] No Firebase database instance available');
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
