import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { useSeatLockStore } from '../components/seatLockStore';

const LOCK_EXPIRATION_TIME_MS = 10 * 60 * 1000;
let timer = null;

const startExpirationTimer = () => {
  clearExpirationTimer();
  timer = setInterval(() => {
    const { cartExpiration } = get();
    const timeLeft = Math.max(0, Math.floor((cartExpiration - Date.now()) / 1000));
    set({ timeLeft });
    if (timeLeft <= 0) {
      clearExpirationTimer();
      set({ cart: [], cartExpiration: null, timeLeft: 0, functionId: null });
      toast.error('Tu reserva ha expirado');
      // Aquí puedes llamar a una función para refrescar locks
    }
  }, 1000);
};

const clearExpirationTimer = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

export const useCartStore = create(
  persist(
    (set, get) => {
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
            const newState = { cart: filtered };
            if (filtered.length === 0) {
              clearExpirationTimer();
              newState.cartExpiration = null;
              newState.timeLeft = 0;
              newState.functionId = null;
            }
            set(newState);
            await useSeatLockStore.getState().unlockSeat(seatId);
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
            timeLeft: Math.floor(LOCK_EXPIRATION_TIME_MS / 1000),
            functionId: funcionId,
          });
          startExpirationTimer();
        },

        
        removeFromCart: async (seatId) => {
          const { cart } = get();
          const filtered = cart.filter(item => (item._id || item.id) !== seatId);
          const newState = { cart: filtered };
          if (filtered.length === 0) {
            clearExpirationTimer();
            newState.cartExpiration = null;
            newState.timeLeft = 0;
            newState.functionId = null;
          }
          set(newState);
          await useSeatLockStore.getState().unlockSeat(seatId);
          toast.success('Asiento eliminado del carrito');
        },

        clearCart: async () => {
          const { cart } = get();
          for (const s of cart) {
            await useSeatLockStore
              .getState()
              .unlockSeat(
                s._id || s.id,
                s.functionId || s.funcionId || get().functionId
              );
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
