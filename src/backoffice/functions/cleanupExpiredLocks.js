import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import serviceAccount from './serviceAccountKey.json';

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = getDatabase(app);

export const cleanupExpiredLocks = async (funcionId) => {
  if (!funcionId) {
    console.error('Function ID is required to clean up expired locks.');
    return;
  }
  const locksRef = db.ref(`in-cart/${funcionId}`);
  try {
    const snapshot = await locksRef.once('value');
    const locks = snapshot.val() || {};
    const now = Date.now();
    for (const [seatId, lock] of Object.entries(locks)) {
      if (lock.expires && lock.expires < now) {
        await locksRef.child(seatId).remove();
        console.log(`[cleanupExpiredLocks] Removed expired lock for seat ${seatId}`);
      }
    }
  } catch (error) {
    console.error('[cleanupExpiredLocks] Error cleaning up expired locks:', error);
  }
};

// Example usage: call cleanupExpiredLocks with a function ID
// cleanupExpiredLocks('your-function-id-here').then(() => process.exit(0));
