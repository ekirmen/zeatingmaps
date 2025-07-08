import { useEffect } from "react";
import { getDatabaseInstance } from "../../services/firebaseClient";
import { ref, onValue, off } from "firebase/database";
import { cleanupExpiredLocks } from "../../backoffice/services/seatLocks";
import normalizeSeatId from "../../utils/normalizeSeatId";

const useSeatLocksArray = (
  funcionId,
  setSeats,
  getSessionId,
  enabled = true,
) => {
  useEffect(() => {
    let unsubscribe = () => {};
    if (!enabled || !funcionId) return undefined;

    const setup = async () => {
      const db = await getDatabaseInstance();
      if (!db) return;

      // Remove expired locks to avoid stale blocked seats
      cleanupExpiredLocks(funcionId).catch(() => {});

      const locksRef = ref(db, `in-cart/${funcionId}`);
      const handler = (snapshot) => {
        const locks = snapshot.val() || {};
        setSeats((prev) =>
          prev.map((seat) => {
            const keys = [seat.id, seat._id]
              .filter(Boolean)
              .flatMap((k) => [k, normalizeSeatId(k)]);
            const lock = keys.reduce((acc, k) => acc || locks[k], null);
            if (lock) {
              const sameSession =
                getSessionId && lock.session_id === getSessionId();
              const status = lock.status || "bloqueado";
              return {
                ...seat,
                status:
                  sameSession && seat.status === "selected"
                    ? seat.status
                    : status,
              };
            }
            // If the seat was previously blocked but no lock exists, mark available
            if (seat.status === "bloqueado" || seat.status === "blocked") {
              return { ...seat, status: "available" };
            }
            return seat;
          }),
        );
      };
      onValue(locksRef, handler);
      unsubscribe = () => off(locksRef, "value", handler);
    };

    setup();
    return () => unsubscribe();
  }, [funcionId, setSeats, enabled, getSessionId]);
};

export default useSeatLocksArray;
