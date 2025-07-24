// src/store/pages/CartPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import Cart from './Cart';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart } = useCartStore();

  const handlePaymentClick = () => {
    const funcionId = cart[0]?.functionId || cart[0]?.funcionId || null;
    if (!funcionId) {
      console.warn('No hay funcionId en el carrito');
      return;
    }

    navigate('/store/payment', {
      state: {
        carrito: cart,
        funcionId,
      },
    });
  };

  return <Cart onPaymentClick={handlePaymentClick} />;
};

export default CartPage;
