import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, remove, serverTimestamp, runTransaction } from 'firebase/database';
import { db } from '../../services/firebaseClient';

/**
 * Manages seat locks for a specific event in Firebase.
 * @param {string} eventId The ID of the event/function to monitor.
 * @param {string} userId The ID of the current user.
 * @returns {object} An object containing loading state and functions to interact with seat locks.
 */
export const useFirebaseSeatLocks = (eventId, userId) => {
  const [seatLocks, setSeatLocks] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Effect to fetch and listen for real-time changes to seat locks
  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    let unsubscribe;
    const setupListener = async () => {
      try {
        const dbInstance = await db;
        const seatsRef = ref(dbInstance, `seats/${eventId}`);
        
        unsubscribe = onValue(seatsRef, (snapshot) => {
          setSeatLocks(snapshot.val() || {});
          setIsLoading(false);
        });
      } catch (error) {
        console.error("Error setting up Firebase seat listener:", error);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [eventId]);

  // Checks if a seat is locked by anyone
  const isSeatLocked = useCallback((seatId) => {
    return !!seatLocks[seatId];
  }, [seatLocks]);

  // Checks if a seat is locked by the current user
  const isSeatLockedByMe = useCallback((seatId) => {
    return seatLocks[seatId]?.reservedBy === userId;
  }, [seatLocks, userId]);

  // Function to lock a seat using a transaction for safety
  const lockSeat = useCallback(async (seatId) => {
    if (!eventId || !userId) return;
    try {
      const dbInstance = await db;
      const seatRef = ref(dbInstance, `seats/${eventId}/${seatId}`);
      
      const { committed } = await runTransaction(seatRef, (currentData) => {
        // If the seat is already locked by someone else, abort the transaction
        if (currentData) {
          return; // Abort
        }
        // Otherwise, lock the seat
        return {
          reservedBy: userId,
          timestamp: serverTimestamp(),
        };
      });

      return committed;
    } catch (error) {
      console.error(`Error locking seat ${seatId}:`, error);
      return false;
    }
  }, [eventId, userId]);

  // Function to unlock a seat
  const unlockSeat = useCallback(async (seatId) => {
    if (!eventId || !userId) return;
    try {
      const dbInstance = await db;
      const seatRef = ref(dbInstance, `seats/${eventId}/${seatId}`);
      
      // Use a transaction to ensure you only unlock a seat you own
      const { committed } = await runTransaction(seatRef, (currentData) => {
        if (currentData?.reservedBy === userId) {
          return null; // Setting to null removes the data
        }
        // If someone else locked it or it's already free, do nothing
        return;
      });
      
      return committed;
    } catch (error) {
      console.error(`Error unlocking seat ${seatId}:`, error);
      return false;
    }
  }, [eventId, userId]);

  return { isLoading, isSeatLocked, isSeatLockedByMe, lockSeat, unlockSeat };
};