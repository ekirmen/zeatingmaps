import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import normalizeSeatId from '../utils/normalizeSeatId';
import { isUuid } from '../utils/isUuid';

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

  const [duration, setDuration] = useState(() => {
    const saved = localStorage.getItem('cartSeatMinutes');
    const mins = saved ? parseInt(saved, 10) : 15;
    return isNaN(mins) ? 15 : mins;
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    return expiration ? Math.max(0, Math.floor((expiration - Date.now()) / 1000)) : 0;
  });

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'cart-seat-expiration')
        .single();
      if (!error && data) {
        const mins = parseInt(data.value, 10);
        if (!isNaN(mins)) {
          setDuration(mins);
          localStorage.setItem('cartSeatMinutes', String(mins));
        }
      }
    };
    load();
  }, []);

  const updateCart = useCallback((newCart) => {
    setCartState(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  }, []);

  const setCart = useCallback(
    (items, functionId = null) => {
      setCartState(prev => {
        const updated = { items, functionId: functionId ?? prev.functionId };
        localStorage.setItem('cart', JSON.stringify(updated));
        if (items.length > 0) {
          const expiresAt = Date.now() + duration * 60 * 1000; // minutes from settings
          setExpiration(expiresAt);
          localStorage.setItem('cartExpiration', String(expiresAt));
        } else {
          setExpiration(null);
          localStorage.removeItem('cartExpiration');
          setTimeLeft(0);
        }
        return updated;
      });
    },
    []
  );

  const addToCart = useCallback(async (seats, functionId) => {
    try {
      const seatIds = seats
        .map((s) => normalizeSeatId(s._id || s.id))
        .filter((id) => id !== undefined && id !== null && isUuid(id));

      const { error } = await supabase
        .from('seats')
        .update({ reserved: true, reserved_at: new Date().toISOString() })
        .in('_id', seatIds);

      if (error) throw error;

      updateCart({ items: seats, functionId });

      const expiresAt = Date.now() + duration * 60 * 1000; // minutes from settings
      setExpiration(expiresAt);
      localStorage.setItem('cartExpiration', String(expiresAt));

      toast.success('Asientos añadidos al carrito');
    } catch (error) {
      toast.error(error.message || 'Error al reservar asientos');
    }
  }, [updateCart]);

  const clearCart = useCallback(async () => {
    try {
      const seatIds = cart.items
        .map((i) => normalizeSeatId(i._id || i.id))
        .filter((id) => id !== undefined && id !== null && isUuid(id));

      if (seatIds.length > 0) {
        const { error } = await supabase
        .from('seats')
        .update({ reserved: false, reserved_at: null })
        .in('_id', seatIds);

        if (error) throw error;
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
      const id = normalizeSeatId(seatId?._id || seatId);
      const { error } = await supabase
        .from('seats')
        .update({ reserved: false, reserved_at: null })
        .eq('_id', id);

      if (error) throw error;

      const newItems = cart.items.filter(item => (item._id || item.id) !== id);
      updateCart({ items: newItems, functionId: cart.functionId });

      toast.success('Asiento eliminado del carrito');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar del carrito');
    }
  }, [cart, updateCart]);

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
