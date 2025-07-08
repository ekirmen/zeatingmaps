import { useEffect, useRef } from 'react';
import { getDatabaseInstance } from '../../services/firebaseClient';
import { ref, onValue, off } from 'firebase/database';
import getZonaColor from '../../utils/getZonaColor';
import normalizeSeatId from '../../utils/normalizeSeatId';
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
  const debounceTimeoutRef = useRef(null);
  const lastLocksRef = useRef(null);

  useEffect(() => {
    if (!enabled || !selectedFunctionId) return;

    let unsubscribe = () => {};

    const setup = async () => {
      const db = await getDatabaseInstance();
      if (!db) return;

      const locksRef = ref(db, `in-cart/${selectedFunctionId}`);

      const handler = (snapshot) => {
        try {
          const locks = snapshot.val() || {};
          const sessionId = getCartSessionId();

          if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = setTimeout(() => {
            if (JSON.stringify(locks) === JSON.stringify(lastLocksRef.current)) return;
            lastLocksRef.current = locks;

            setMapa(prevMapa => {
              if (!prevMapa) return prevMapa;
              const updatedContenido = prevMapa.contenido.map(elemento => {
                const updatedSillas = elemento.sillas.map(s => {
                  const keys = [s._id, s.id]
                    .filter(Boolean)
                    .flatMap(k => [k, normalizeSeatId(k)]);
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
                  if (s.estado !== estado || s.color !== color || s.selected !== selected) {
                    return { ...s, estado, color, selected };
                  }
                  return s;
                });
                return { ...elemento, sillas: updatedSillas };
              });
              return { ...prevMapa, contenido: updatedContenido };
            });

            if (setCarrito && carritoRef) {
              const lockedSeatIds = Object.keys(locks);
              const currentCarrito = carritoRef.current || [];
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
                  lockerSessionId: lock?.session_id || null,
                }));
              const updatedCarrito = currentCarrito.filter(c => lockedSeatIds.includes(c._id) && locks[c._id]?.session_id === sessionId);
              const combinedCarrito = [...updatedCarrito, ...newSeats];
              setCarrito(combinedCarrito);
              carritoRef.current = combinedCarrito;
            }
          }, 100);
        } catch (error) {
          console.error('[useFirebaseSeatLocks] Error processing locks:', error);
        }
      };

      onValue(locksRef, handler);
      unsubscribe = () => {
        off(locksRef, 'value', handler);
      };
    };

    setup();

    return () => {
      unsubscribe();
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [selectedFunctionId, zonas, setMapa, cartRef, setCarrito, carritoRef, enabled]);
};

export default useFirebaseSeatLocks;
