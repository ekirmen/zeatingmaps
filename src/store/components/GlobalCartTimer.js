import { useEffect } from 'react';
import { notification } from 'antd';
import { useCartStore } from '../cartStore';
import { useSeatLockStore } from '../../components/seatLockStore'; // el store global

function GlobalCartTimer() {
  const { cart, cartExpiration, clearCart, functionId } = useCartStore();
  const unlockSeat = useSeatLockStore(state => state.unlockSeat);

  useEffect(() => {
    if (!cartExpiration) return;

    const checkExpiration = async () => {
      if (Date.now() > cartExpiration) {
        notification.warning({
          message: 'Tu selección ha expirado',
          description: 'Hemos liberado los asientos de tu carrito por inactividad.',
          placement: 'topRight',
        });

        for (const item of cart) {
          await unlockSeat(
            item.sillaId || item.id || item._id,
            item.functionId || item.funcionId || functionId
          );
        }

        clearCart();
      }
    };

    const timeoutId = setTimeout(checkExpiration, cartExpiration - Date.now() + 1000);

    return () => clearTimeout(timeoutId);
  }, [cartExpiration, cart, unlockSeat, clearCart]);

  return null;
}

export default GlobalCartTimer;
