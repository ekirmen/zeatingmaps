import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';
import normalizeSeatId from '../utils/normalizeSeatId';
import { isUuid } from '../utils/isUuid';
import { lockSeat, unlockSeat } from '../backoffice/services/seatLocks';
import getCartSessionId from '../utils/getCartSessionId';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCartState] = useState(() => {
    const savedCart = sessionStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : { items: [], functionId: null };
  });

  const [expiration, setExpiration] = useState(() => {
    const saved = sessionStorage.getItem('cartExpiration');
    return saved ? parseInt(saved, 10) : null;
  });

  const [duration, setDuration] = useState(() => {
    const saved = sessionStorage.getItem('cartSeatMinutes');
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
          sessionStorage.setItem('cartSeatMinutes', String(mins));
        }
      }
    };
    load();
  }, []);

  const updateCart = useCallback((newCart) => {
    setCartState(newCart);
    sessionStorage.setItem('cart', JSON.stringify(newCart));
  }, []);

  const setCart = useCallback(
    (items, functionId = null) => {
      setCartState(prev => {
        const updated = { items, functionId: functionId ?? prev.functionId };
        sessionStorage.setItem('cart', JSON.stringify(updated));
        if (items.length > 0) {
          const expiresAt = Date.now() + duration * 60 * 1000; // minutes from settings
          setExpiration(expiresAt);
          sessionStorage.setItem('cartExpiration', String(expiresAt));
        } else {
          setExpiration(null);
          sessionStorage.removeItem('cartExpiration');
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

      const sessionId = getCartSessionId();
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('seats')
        .update({
          reserved: true,
          reserved_at: now,
          status: 'selected',
          selected_by: sessionId,
          selected_at: now
        })
        .in('_id', seatIds);

      if (error) throw error;

      await Promise.all(
        seats.map((s) => lockSeat(s._id || s.id, 'bloqueado', functionId))
      );

      updateCart({ items: seats, functionId });

      const expiresAt = Date.now() + duration * 60 * 1000; // minutes from settings
      setExpiration(expiresAt);
      sessionStorage.setItem('cartExpiration', String(expiresAt));

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
        .update({
          reserved: false,
          reserved_at: null,
          status: 'available',
          selected_by: null,
          selected_at: null
        })
        .in('_id', seatIds);

        if (error) throw error;

        await Promise.all(
          cart.items.map((i) => unlockSeat(i._id || i.id, cart.functionId))
        );
      }

      updateCart({ items: [], functionId: null });
      setExpiration(null);
      sessionStorage.removeItem('cartExpiration');
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
        .update({
          reserved: false,
          reserved_at: null,
          status: 'available',
          selected_by: null,
          selected_at: null
        })
        .eq('_id', id);

      if (error) throw error;

      await unlockSeat(id, cart.functionId);

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
    duration,
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
