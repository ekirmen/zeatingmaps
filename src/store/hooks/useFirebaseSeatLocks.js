import { useEffect, useRef } from 'react';
import { getDatabaseInstance } from '../../services/firebaseClient';
import { ref, onValue, off } from 'firebase/database';
import getZonaColor from '../../utils/getZonaColor';
import normalizeSeatId from '../../utils/normalizeSeatId';
import { cleanupExpiredLocks } from '../../backoffice/services/seatLocks';
import getCartSessionId from '../../utils/getCartSessionId';

const useFirebaseSeatLocks = (
  selectedFunctionId,
  zonas,
  setMapa,
  cartRef,
  setCarrito,
  carritoRef,
  enabled = true
) => {
  const reconnectTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const lastLocksRef = useRef(null);

  useEffect(() => {
    let unsubscribe = () => {};
    if (!enabled || !selectedFunctionId) return undefined;

    const setup = async () => {
      const db = await getDatabaseInstance();
      if (!db) return;

      // Cleanup expired locks on setup and periodically every 30 seconds
      const cleanupInterval = setInterval(() => {
        cleanupExpiredLocks(selectedFunctionId).catch(console.error);
      }, 30000);
      // Initial cleanup
      cleanupExpiredLocks(selectedFunctionId).catch(console.error);

      const locksRef = ref(db, `in-cart/${selectedFunctionId}`);
      const handler = (snapshot) => {
        try {
          const locks = snapshot.val() || {};
          const sessionId = getCartSessionId();

          // Debounce updates to reduce frequent re-renders
          if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = setTimeout(() => {
            // Avoid updating if locks data is unchanged
            if (JSON.stringify(locks) === JSON.stringify(lastLocksRef.current)) return;
            lastLocksRef.current = locks;

            setMapa(prevMapa => {
              if (!prevMapa) return prevMapa;
              // Optimize by updating only changed seats
              const updatedContenido = prevMapa.contenido.map(elemento => {
                const updatedSillas = elemento.sillas.map(s => {
                  const keys = [s._id, s.id]
                    .filter(Boolean)
                    .flatMap((k) => [k, normalizeSeatId(k)]);
                  const lock = keys.reduce((acc, k) => acc || locks[k], null);
                  const zonaId = s.zona || elemento.zona;
                  const baseColor = getZonaColor(zonaId, zonas) || 'lightblue';
                  let estado = s.estado;
                  let color = baseColor;
                  if (lock) {
                    estado = lock.status || 'bloqueado';
                    if (estado === 'bloqueado') color = 'orange';
                    else if (estado === 'reservado') color = 'red';
                    else if (estado === 'pagado') color = 'gray';
                  }
                  const selected = cartRef.current.some(c => c._id === s._id);
                  // Only update if changed
                  if (s.estado !== estado || s.color !== color || s.selected !== selected) {
                    return { ...s, estado, color, selected };
                  }
                  return s;
                });
                return { ...elemento, sillas: updatedSillas };
              });
              return { ...prevMapa, contenido: updatedContenido };
            });

            // Update carrito based on locks with lock ownership enforcement
            if (setCarrito && carritoRef) {
              const lockedSeatIds = Object.keys(locks);
              const currentCarrito = carritoRef.current || [];
              // Add locked seats not in carrito and owned by this session
              const newSeats = lockedSeatIds
                .map(seatId => [seatId, locks[seatId]])
                .filter(([seatId, lock]) => lock?.session_id === sessionId)
                .filter(([seatId]) => !currentCarrito.some(c => c._id === seatId))
                .map(([seatId, lock]) => ({
                  _id: seatId,
                  locked: true,
                  zona: lock?.seatDetails?.zona || null,
                  precio: lock?.seatDetails?.precio || null,
                  nombreMesa: lock?.seatDetails?.nombreMesa || null,
                  zonaNombre: lock?.seatDetails?.zonaNombre || null,
                  zonaColor: lock?.seatDetails?.zonaColor || null,
                  tipoPrecio: lock?.seatDetails?.tipoPrecio || null,
                  descuentoNombre: lock?.seatDetails?.descuentoNombre || null,
                  // Add sessionId of locker for UI distinction
                  lockerSessionId: lock?.session_id || null,
                }));
              // Remove seats unlocked or not owned by this session
              const updatedCarrito = currentCarrito.filter(c => lockedSeatIds.includes(c._id) && locks[c._id]?.session_id === sessionId);
              const combinedCarrito = [...updatedCarrito, ...newSeats];
              setCarrito(combinedCarrito);
              carritoRef.current = combinedCarrito;
            }
          }, 100); // Reduced debounce to 100ms for more responsive UI
        } catch (error) {
          console.error('[useFirebaseSeatLocks] Error processing locks:', error);
        }
      };

      onValue(locksRef, handler);
      unsubscribe = () => {
        off(locksRef, 'value', handler);
        clearInterval(cleanupInterval);
      };
    };

    setup();

    // Enhanced reconnect logic with exponential backoff
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const reconnect = () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (reconnectAttempts >= maxReconnectAttempts) {
        console.error('[useFirebaseSeatLocks] Max reconnect attempts reached');
        return;
      }
      const delay = Math.min(30000, 1000 * 2 ** reconnectAttempts);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts++;
        setup();
      }, delay);
    };

    window.addEventListener('online', reconnect);
    window.addEventListener('offline', () => {
      console.warn('[useFirebaseSeatLocks] Offline detected');
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', reconnect);
      window.removeEventListener('offline', () => {});
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [selectedFunctionId, zonas, setMapa, cartRef, setCarrito, carritoRef, enabled]);
};

export default useFirebaseSeatLocks;
