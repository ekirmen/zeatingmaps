import { useEffect } from 'react';
import { notification } from 'antd';
import { useCartStore } from '../cartStore';
import { useSeatLockStore } from '../../components/seatLockStore'; // el store global

function GlobalCartTimer() {
  const { cart, cartExpiration, clearCart, functionId, timeLeft } = useCartStore();
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
  }, [cartExpiration, cart, unlockSeat, clearCart, functionId]);

  // Timer visual
  if (cart && cart.length > 0 && timeLeft > 0) {
    const min = Math.floor(timeLeft / 60);
    const sec = (timeLeft % 60).toString().padStart(2, '0');
    return (
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: '#fffbe6',
        color: '#ad6800',
        border: '1px solid #ffe58f',
        borderRadius: 8,
        padding: '8px 16px',
        zIndex: 2000,
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <span>Reserva activa: </span>
        <span role="img" aria-label="timer">⏳</span> {min}:{sec} para completar tu compra
      </div>
    );
  }

  return null;
}

export default GlobalCartTimer;
