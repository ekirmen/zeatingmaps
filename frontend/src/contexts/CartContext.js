import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCartState] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : { items: [], functionId: null };
  });
  const [timeLeft, setTimeLeft] = useState(0);

  const updateCart = useCallback((newCart) => {
    setCartState(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  }, []);

  // Replace only the cart items without calling backend
  const setCart = useCallback((items, functionId = null) => {
    setCartState(prev => {
      const updated = { items, functionId: functionId ?? prev.functionId };
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToCart = useCallback(async (seats, functionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('http://localhost:5000/api/seats/reserve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify({ 
          seats: seats.map(seat => seat._id),
          functionId 
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al reservar asientos');
      }

      updateCart({ items: seats, functionId });
      toast.success('Asientos añadidos al carrito');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar el carrito');
    }
  }, [updateCart]);

  const clearCart = useCallback(async () => {
    try {
      if (cart.items?.length > 0) {
        const response = await fetch('http://localhost:5000/api/seats/release', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            seats: cart.items.map(item => item._id)
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al liberar asientos');
        }
      }
      updateCart({ items: [], functionId: null });
      setTimeLeft(0);
    } catch (error) {
      toast.error(error.message || 'Error al limpiar el carrito');
    }
  }, [cart, updateCart]);

  const removeFromCart = useCallback(async (seatId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/seats/release`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ seats: [seatId] })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al liberar asiento');
      }

      updateCart(prev => prev.filter(item => item._id !== seatId));
      toast.success('Asiento eliminado del carrito');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar del carrito');
    }
  }, [updateCart]);

  useEffect(() => {
    if (cart.length > 0) {
      const timer = setTimeout(() => {
        clearCart();
        toast.error('Tiempo expirado - asientos liberados');
      }, 15 * 60 * 1000);

      return () => clearTimeout(timer);
    }
  }, [cart, clearCart]);

  const value = {
    cart: cart.items || [],
    functionId: cart.functionId,
    addToCart,
    clearCart,
    removeFromCart,
    setCart,
    timeLeft
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};