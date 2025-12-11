import { useState, useEffect, useRef } from 'react';
import { message } from '../../../../utils/antdComponents';
import { useSeatLockStore } from '../../../../components/seatLockStore';
import { fetchAbonoAvailableSeats } from '../../../../services/supabaseServices';

export 
  const [tempBlocks, setTempBlocks] = useState([]);
  const [abonoSeats, setAbonoSeats] = useState([]);
  const [animatingSeats, setAnimatingSeats] = useState([]);
  const unlockSeatRef = useRef(useSeatLockStore.getState().unlockSeat);

  const {
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe,
    subscribeToFunction,
    unsubscribe
  } = useSeatLockStore();

  useEffect(() => {
    const loadAbonoSeats = async () => {
      if (abonoMode && selectedEvent?.id) {
        try {
          const ids = await fetchAbonoAvailableSeats(selectedEvent.id);
          setAbonoSeats(Array.isArray(ids) ? ids : []);
        } catch (err) {
          console.error('Error loading abono seats', err);
          message.error('Error cargando asientos de abono');
          setAbonoSeats([]);
        }
      } else {
        setAbonoSeats([]);
      }
    };
    loadAbonoSeats();
  }, [abonoMode, selectedEvent]);

  // Suscribirse a eventos en tiempo real para la funci³n seleccionada
  useEffect(() => {
    if (selectedEvent?.id && subscribeToFunction) {
      subscribeToFunction(selectedEvent.id);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedEvent?.id, subscribeToFunction, unsubscribe]);

  // Liberar asientos bloqueados temporalmente al desmontar o recargar la p¡gina
  useEffect(() => {
    const cleanupTemp = () => {
      tempBlocks.forEach(id => {
        unlockSeatRef.current(id).catch(() => {});
      });
    };
    window.addEventListener('beforeunload', cleanupTemp);
    return () => {
      cleanupTemp();
      window.removeEventListener('beforeunload', cleanupTemp);
    };
  }, [tempBlocks]);

  const handleSeatAnimation = (seat) => {
    setAnimatingSeats(prev => [...prev, seat]);
  };

  const handleAnimationComplete = (seatId) => {
    setAnimatingSeats(prev => prev.filter(seat => seat._id !== seatId));
  };

  return {
    blockMode,
    setBlockMode,
    tempBlocks,
    setTempBlocks,
    abonoSeats,
    animatingSeats,
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe,
    handleSeatAnimation,
    handleAnimationComplete
  };
};

