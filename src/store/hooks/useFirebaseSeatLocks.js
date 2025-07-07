import { useEffect } from 'react';
import { getDatabaseInstance } from '../../services/firebaseClient';
import { ref, onValue, off } from 'firebase/database';
import getZonaColor from '../../utils/getZonaColor';
import normalizeSeatId from '../../utils/normalizeSeatId';

const useFirebaseSeatLocks = (
  selectedFunctionId,
  zonas,
  setMapa,
  cartRef,
  setCarrito,
  carritoRef,
  enabled = true
) => {
  useEffect(() => {
    let unsubscribe = () => {};
    if (!enabled || !selectedFunctionId) return undefined;

    const setup = async () => {
      const db = await getDatabaseInstance();
      if (!db) return;

      const locksRef = ref(db, `in-cart/${selectedFunctionId}`);
      const handler = (snapshot) => {
        const locks = snapshot.val() || {};
        setMapa(prevMapa => {
          if (!prevMapa) return prevMapa;
          return {
            ...prevMapa,
            contenido: prevMapa.contenido.map(elemento => ({
              ...elemento,
              sillas: elemento.sillas.map(s => {
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
                return { ...s, estado, color, selected };
              })
            }))
          };
        });

        // Update carrito based on locks
        if (setCarrito && carritoRef) {
          const lockedSeatIds = Object.keys(locks);
          const currentCarrito = carritoRef.current || [];
          // Add locked seats not in carrito
          const newSeats = lockedSeatIds
            .filter(seatId => !currentCarrito.some(c => c._id === seatId))
            .map(seatId => ({ _id: seatId, locked: true }));
          // Remove seats unlocked
          const updatedCarrito = currentCarrito.filter(c => lockedSeatIds.includes(c._id));
          const combinedCarrito = [...updatedCarrito, ...newSeats];
          setCarrito(combinedCarrito);
          carritoRef.current = combinedCarrito;
        }
      };
      onValue(locksRef, handler);
      unsubscribe = () => off(locksRef, 'value', handler);
    };

    setup();
    return () => unsubscribe();
  }, [selectedFunctionId, zonas, setMapa, cartRef, setCarrito, carritoRef, enabled]);
};

export default useFirebaseSeatLocks;
