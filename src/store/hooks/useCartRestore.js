import { useEffect, useRef } from 'react';
import { useCartStore } from '../cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';

const useCartRestore = () => {
  const { cart, cartExpiration, clearCart } = useCartStore();
  const { unlockSeat } = useSeatLockStore();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const now = Date.now();

    if (cartExpiration && cartExpiration < now) {
      cart.forEach((seat) => {
        if (seat.sillaId) unlockSeat(seat.sillaId);
      });

      clearCart();
    }
  }, [cartExpiration, cart, clearCart, unlockSeat]);
};

export default useCartRestore;
