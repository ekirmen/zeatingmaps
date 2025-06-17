import React from 'react';
import { useCart } from '../../contexts/CartContext';

const CartTimer = () => {
  const { timeLeft, hasActiveTimer } = useCart();

  if (!hasActiveTimer) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg shadow-lg z-50">
      <p className="text-sm">Tiempo restante de reserva:</p>
      <p className="text-xl font-mono">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
    </div>
  );
};

export default CartTimer;