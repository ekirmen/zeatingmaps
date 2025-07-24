import { useEffect, useRef } from 'react';
import { useCartStore } from '../cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';

const useCartRestore = () => {
  const { cart, cartExpiration, clearCart, functionId } = useCartStore();
  const { unlockSeat } = useSeatLockStore();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const now = Date.now();

    if (cartExpiration && cartExpiration < now) {
      cart.forEach((seat) => {
        if (seat.sillaId || seat.id || seat._id) {
          unlockSeat(
            seat.sillaId || seat.id || seat._id,
            seat.functionId || seat.funcionId || functionId
          );
        }
      });

      clearCart();
    }
  }, [cartExpiration, cart, clearCart, unlockSeat]);
};

export default useCartRestore;
