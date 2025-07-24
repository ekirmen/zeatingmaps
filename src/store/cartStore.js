import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { useSeatLockStore } from '../components/seatLockStore';

const LOCK_EXPIRATION_TIME_MS = 15 * 60 * 1000; // 15 minutos

export const useCartStore = create(
  persist(
    (set, get) => {
      let timer = null;

      const clearExpirationTimer = () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      };

      const startExpirationTimer = () => {
        clearExpirationTimer();
        const expiration = Date.now() + LOCK_EXPIRATION_TIME_MS;
        set({ cartExpiration: expiration });

        timer = setInterval(() => {
          const { cartExpiration, clearCart } = get();
          if (!cartExpiration) return;

          const remaining = cartExpiration - Date.now();
          if (remaining <= 0) {
            clearCart();
            toast.error('Tu carrito ha expirado.');
            clearInterval(timer);
            timer = null;
          } else {
            set({ timeLeft: Math.floor(remaining / 1000) });
          }
        }, 1000);
      };

      return {
        cart: [],
        functionId: null,
        cartExpiration: null,
        timeLeft: 0,

        toggleSeat: async (seat) => {
          const seatId = seat.sillaId || seat.id || seat._id;
          if (!seatId) return;

          const { cart } = get();
          const exists = cart.some(
            (item) => (item.sillaId || item.id || item._id) === seatId
          );

          if (exists) {
            const filtered = cart.filter(
              (item) => (item.sillaId || item.id || item._id) !== seatId
            );
            set({ cart: filtered });
            await useSeatLockStore.getState().unlockSeat(seatId);
            if (filtered.length === 0) {
              clearExpirationTimer();
            }
            toast.success('Asiento eliminado del carrito');
          } else {
            const updated = [...cart, seat];
            set({
              cart: updated,
              functionId: seat.functionId || seat.funcionId || get().functionId,
            });
            if (cart.length === 0) {
              startExpirationTimer();
            }
            toast.success('Asiento añadido al carrito');
          }
        },

        addToCart: (seats, funcionId) => {
          const newExpiration = Date.now() + LOCK_EXPIRATION_TIME_MS;
          set({
            cart: seats,
            cartExpiration: newExpiration,
          });
        },

        
        removeFromCart: async (seatId) => {
          const { cart } = get();
          const filtered = cart.filter(item => (item._id || item.id) !== seatId);
          set({ cart: filtered });
          await useSeatLockStore.getState().unlockSeat(seatId);
          toast.success('Asiento eliminado del carrito');
        },

        clearCart: async () => {
          const { cart } = get();
          for (const s of cart) {
            await useSeatLockStore.getState().unlockSeat(s._id || s.id);
          }
          set({ cart: [], functionId: null, cartExpiration: null, timeLeft: 0 });
          clearExpirationTimer();
        },

        hasActiveTimer: () => {
          const { cartExpiration } = get();
          return !!cartExpiration && cartExpiration > Date.now();
        },
      };
    },
    {
      name: 'cart-storage',
      partialize: (state) => ({
        cart: state.cart,
        cartExpiration: state.cartExpiration,
        functionId: state.functionId,
      }),
    }
  )
);
