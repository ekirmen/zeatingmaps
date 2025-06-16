import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCartState] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : { items: [], functionId: null };
  });
  const [expiration, setExpiration] = useState(() => {
    const saved = localStorage.getItem('cartExpiration');
    return saved ? parseInt(saved, 10) : null;
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    return expiration ? Math.max(0, Math.floor((expiration - Date.now()) / 1000)) : 0;
  });

  useEffect(() => {
    if (expiration && expiration <= Date.now()) {
      clearCart();
    }
  }, [clearCart]);

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

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/seats/reserve`, {
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

      const data = await response.json();
      updateCart({ items: seats, functionId });
      if (data.expiresAt) {
        const exp = new Date(data.expiresAt).getTime();
        setExpiration(exp);
        localStorage.setItem('cartExpiration', String(exp));
      }
      toast.success('Asientos añadidos al carrito');
    } catch (error) {
      toast.error(error.message || 'Error al actualizar el carrito');
    }
  }, [updateCart]);

  const clearCart = useCallback(async () => {
    try {
      if (cart.items?.length > 0) {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/seats/release`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            seats: cart.items.map(item => item._id),
            functionId: cart.functionId
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al liberar asientos');
        }
      }
      updateCart({ items: [], functionId: null });
      setExpiration(null);
      localStorage.removeItem('cartExpiration');
      setTimeLeft(0);
    } catch (error) {
      toast.error(error.message || 'Error al limpiar el carrito');
    }
  }, [cart, updateCart]);

  const removeFromCart = useCallback(async (seatId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/seats/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ seats: [seatId], functionId: cart.functionId })
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
    if (!expiration) return;
    const tick = () => {
      const diff = Math.floor((expiration - Date.now()) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
      if (diff <= 0) {
        clearCart();
        toast.error('Tiempo expirado - asientos liberados');
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiration, clearCart]);

  const value = {
    cart: cart.items || [],
    functionId: cart.functionId,
    addToCart,
    clearCart,
    removeFromCart,
    setCart,
    timeLeft,
    hasActiveTimer: !!expiration && expiration > Date.now()
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