import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';



const clampMinutes = (value, fallback) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(120, value));
};

const readMinutesFromStorage = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    if (!window.localStorage) {
      return fallback;
    }

    const stored = window.localStorage.getItem(key);
    if (stored == null || stored === '') {
      return fallback;
    }

    const parsed = parseInt(stored, 10);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return clampMinutes(parsed, fallback);
  } catch (error) {
    return fallback;
  }
};

const getLockExpirationMs = () => {
  const defaultMinutes = 15;
  const baseMinutes = readMinutesFromStorage('cart_lock_minutes', defaultMinutes);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const mobileMinutes = readMinutesFromStorage('cart_lock_minutes_mobile', NaN);

  const minutes = isMobile && Number.isFinite(mobileMinutes)
    ? clampMinutes(mobileMinutes, baseMinutes)
    : baseMinutes;

  return minutes * 60 * 1000;
};
//  // No se usa actualmente
let timer = null;

const toNumberOrZero = (value) => {
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return Number.isFinite(value) ? value : 0;
};

export const useCartStore = create(
  persist(
    (set, get) => {
      const clearExpirationTimer = () => {
        if (timer) clearInterval(timer);
        timer = null;
      };

      const startExpirationTimer = () => {
        clearExpirationTimer();
        timer = setInterval(() => {
          const { cartExpiration } = get();
          const timeLeft = Math.max(
            0,
            Math.floor((cartExpiration - Date.now()) / 1000)
          );
          set({ timeLeft });
          if (timeLeft <= 0) {
            clearExpirationTimer();
            set({
              items: [],
              products: [],
              cartExpiration: null,
              timeLeft: 0,
              functionId: null
            });
            toast.error('Tu reserva ha expirado');
          }
        }, 1000);
      };

      return {
        // Seat items (existing functionality)
        items: [],
        functionId: null,
        cartExpiration: null,
        timeLeft: 0,

        // Product items (new functionality)
        products: [],

        // Saved carts functionality
        savedCarts: [],
        savedCartsLoading: false,

        // Enhanced seat management
        toggleSeat: async (seat) => {
          const seatId = seat.sillaId || seat.id || seat._id;
          if (!seatId) {
            console.error('❌ [CART_TOGGLE] No se pudo obtener seatId del objeto:', seat);
            return;
          }

          // Procesando asiento

          const { items } = get();
          // Items actuales en carrito
          // Buscando seatId

          const exists = items.some(
            (item) => (item.sillaId || item.id || item._id) === seatId
          );

          // ¿Asiento ya existe en carrito?

          const { useSeatLockStore } = await import('../components/seatLockStore');
          const functionId = seat.functionId || seat.funcionId || get().functionId;
          const sessionId = await useSeatLockStore.getState().getValidSessionId();

          if (!sessionId) {
            toast.error('No pudimos validar tu sesión. Intenta recargar.');
            return;
          }

          // functionId extraído

          // Validar que functionId no sea null
          if (!functionId) {
            console.error('❌ [CART_TOGGLE] functionId es null, no se puede proceder:', { seatId, seat });
            toast.error('Error: No se pudo determinar la función del evento');
            return;
          }

          if (exists) {
            // DESELECCIÓN: Actualización optimista (actualizar UI primero)
            // ACTUALIZACIÓN OPTIMISTA: Quitar del carrito inmediatamente
            const filtered = items.filter(
              (item) => (item.sillaId || item.id || item._id) !== seatId
            );
            const newState = { items: filtered };
            if (filtered.length === 0 && get().products.length === 0) {
              clearExpirationTimer();
              newState.cartExpiration = null;
              newState.timeLeft = 0;
              newState.functionId = null;
            }
            set(newState);

            // Operaciones en background (no bloquear UI)
            Promise.all([
              // Desbloquear en BD primero (más rápido que verificar pago)
              (async () => {
                try {
                  await useSeatLockStore.getState().unlockSeat(seatId, functionId, { sessionIdOverride: sessionId });
                } catch (err) {
                  console.warn('Error desbloqueando asiento (continuando):', err);
                }
              })(),
              // Verificar pago solo si es necesario (con timeout corto, en background)
              (async () => {
                const currentSessionId = localStorage.getItem('anonSessionId');
                if (functionId) {
                  try {
                    const seatPaymentChecker = await import('../services/seatPaymentChecker');
                    // Timeout de 1.5 segundos para verificación rápida
                    const paymentCheck = await seatPaymentChecker.default.isSeatPaidByUser(
                      seatId,
                      functionId,
                      currentSessionId,
                      { timeout: 1500, useCache: true }
                    );

                    if (paymentCheck.isPaid) {
                      // Si está pagado, volver a agregarlo al carrito
                      const itemToRestore = items.find(item => (item.sillaId || item.id || item._id) === seatId);
                      if (itemToRestore) {
                        set({ items: [...filtered, itemToRestore] });
                        toast.error('Este asiento ya ha sido comprado y no puede ser deseleccionado');
                      }
                      return;
                    }
                  } catch (err) {
                    // Si hay timeout o error, continuar (optimistic update)
                    if (err.message !== 'Timeout') {
                      console.warn('Error verificando pago (continuando):', err);
                    }
                  }
                }
              })()
            ]).catch(err => {
            });

            toast.success('Asiento eliminado del carrito');
          } else {
            // SELECCIÓN: Verificar estado antes de bloquear
            // Verificar si está bloqueado por otro usuario (no por mí)
            const currentSessionId = localStorage.getItem('anonSessionId');
            const isLockedByOther = await useSeatLockStore.getState().isSeatLocked(seatId, functionId);
            const isLockedByMe = await useSeatLockStore.getState().isSeatLockedByMe(seatId, functionId, currentSessionId);

            if (isLockedByOther && !isLockedByMe) {
              console.error('❌ [CART_TOGGLE] Asiento bloqueado por otro usuario:', seatId);
              toast.error('Este asiento está siendo seleccionado por otro usuario');
              return;
            }

            // Si ya está bloqueado por mí, verificar si ya está en el carrito
            if (isLockedByMe) {
              // Verificar si ya está en el carrito
              const alreadyInCart = items.some(item =>
                (item._id || item.id || item.sillaId) === seatId
              );

              if (alreadyInCart) {
                return;
              } else {
                // Asiento bloqueado pero no en carrito, agregando
                // Continuar con la lógica de agregar al carrito
              }
            }

            // Solo bloquear si no está ya bloqueado (esperar respuesta del servidor)
            if (!isLockedByMe) {
              // Verificar si el asiento ya fue pagado
              if (functionId) {
                const seatPaymentChecker = await import('../services/seatPaymentChecker');
                const paymentCheck = await seatPaymentChecker.default.isSeatPaidByUser(seatId, functionId, currentSessionId);

                if (paymentCheck.isPaid) {
                  toast.error('Este asiento ya ha sido comprado y no puede ser seleccionado nuevamente');
                  return;
                }
              }

              // Bloquear en BD (esperar respuesta del servidor)
              const lockResult = await useSeatLockStore.getState().lockSeat(seatId, 'seleccionado', functionId);

              if (!lockResult) {
                console.error('❌ [CART_TOGGLE] Error bloqueando asiento:', seatId);
                toast.error('Error al seleccionar el asiento');
                return;
              }
            } else {
            }

            // Preparar asiento para el carrito
            const seatPrecio = toNumberOrZero(seat.precio);

            const seatForCart = {
              _id: seatId,
              sillaId: seatId,
              id: seatId,
              nombre: seat.nombre || seat.numero || seatId,
              precio: seatPrecio,
              zonaId: seat.zonaId || null,
              nombreZona: seat.nombreZona || seat.zona?.nombre || 'Zona',
              mesaId: seat.mesaId || seat.mesa || seat.tableId || null,
              nombreMesa: seat.nombreMesa || seat.mesa?.nombre || (seat.mesaId ? `Mesa ${seat.mesaId}` : null),
              functionId: functionId,
              funcionId: functionId,
              ...seat // Incluir cualquier otra propiedad del asiento
            };

            // Agregar al carrito DESPUÉS de confirmar el bloqueo
            const updated = [...items, seatForCart];
            const newState = {
              items: updated,
              functionId: functionId,
            };

            if (items.length === 0 && get().products.length === 0) {
              const newExpiration = Date.now() + getLockExpirationMs();
              newState.cartExpiration = newExpiration;
              newState.timeLeft = Math.floor(getLockExpirationMs() / 1000);
              startExpirationTimer();
            }

            // Actualizar carrito después de confirmar bloqueo
            set(newState);
            toast.success('Asiento añadido al carrito');
          }
        },

        // Enhanced product management
        addProduct: (product) => {
          const { products } = get();
          const existingProduct = products.find(p => p.id === product.id);

          if (existingProduct) {
            // Update quantity if product already exists
            const updatedProducts = products.map(p =>
              p.id === product.id
                ? { ...p, cantidad: p.cantidad + product.cantidad }
                : p
            );
            set({ products: updatedProducts });
            toast.success(`Cantidad actualizada de ${product.nombre}`);
          } else {
            // Add new product
            set({ products: [...products, product] });
            toast.success(`${product.cantidad} ${product.nombre} agregado al carrito`);
          }

          // Start timer if this is the first item
          if (get().items.length === 0 && products.length === 0) {
            startExpirationTimer();
          }
        },

        updateProductQuantity: (productId, newQuantity) => {
          const { products } = get();
          if (newQuantity <= 0) {
            // Remove product if quantity is 0 or negative
            const filtered = products.filter(p => p.id !== productId);
            set({ products: filtered });
            toast.success('Producto eliminado del carrito');
          } else {
            // Update quantity
            const updated = products.map(p =>
              p.id === productId ? { ...p, cantidad: newQuantity, precio_total: p.precio * newQuantity } : p
            );
            set({ products: updated });
          }
        },

        removeProduct: (productId) => {
          const { products } = get();
          const filtered = products.filter(p => p.id !== productId);
          set({ products: filtered });
          toast.success('Producto eliminado del carrito');
        },

        // Enhanced cart management
        addToCart: (seats, funcionId) => {
          const newExpiration = Date.now() + getLockExpirationMs();
          set({
            items: seats,
            cartExpiration: newExpiration,
            timeLeft: Math.floor(getLockExpirationMs() / 1000),
            functionId: funcionId,
          });
          startExpirationTimer();
        },

        // Restaurar temporizador después de recarga
        restoreTimer: async () => {
          const { cartExpiration, items } = get();
          if (!cartExpiration) return;
          const remaining = Math.floor((cartExpiration - Date.now()) / 1000);
          if (remaining > 0) {
            set({ timeLeft: remaining });
            try {
              const { useSeatLockStore } = await import('../components/seatLockStore');
              await useSeatLockStore.getState().restoreCurrentSession();
            } catch (err) {
            }
            startExpirationTimer();
          } else {
            // Expirado: liberar asientos y limpiar
            const { useSeatLockStore } = await import('../components/seatLockStore');
            for (const s of items) {
              const seatId = s._id || s.id || s.sillaId;
              const functionId = s.functionId || s.funcionId || get().functionId;

              // Solo desbloquear si tenemos un seatId válido
              if (seatId && functionId) {
                await useSeatLockStore
                  .getState()
                  .unlockSeat(seatId, functionId);
              }
            }
            set({
              items: [],
              products: [],
              functionId: null,
              cartExpiration: null,
              timeLeft: 0,
            });
          }
        },

        removeFromCart: async (seatId) => {
          const { items, functionId } = get();

          // ACTUALIZACIÓN OPTIMISTA: Quitar del carrito inmediatamente (UI primero)
          const itemToRemove = items.find(item => (item.sillaId || item.id || item._id) === seatId);
          const filtered = items.filter(item => (item.sillaId || item.id || item._id) !== seatId);

          const newState = { items: filtered };
          if (filtered.length === 0 && get().products.length === 0) {
            clearExpirationTimer();
            newState.cartExpiration = null;
            newState.timeLeft = 0;
            newState.functionId = null;
          }
          set(newState);

          // Disparar evento inmediatamente para actualizar UI
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('seatRemovedFromCart', {
              detail: { seatId, functionId }
            }));
          }

          toast.success('Asiento eliminado del carrito');

          // Operaciones en background (no bloquear UI)
          // 1. Desbloquear en BD (sin verificar primero - más rápido)
          Promise.all([
            // Desbloquear directamente (más rápido que verificar primero)
            (async () => {
              try {
                const { useSeatLockStore } = await import('../components/seatLockStore');
                await useSeatLockStore.getState().unlockSeat(seatId, functionId);
              } catch (err) {
                console.warn('Error desbloqueando asiento (continuando):', err);
                // Si falla, al menos marcar como disponible localmente
                try {
                  const { useSeatLockStore } = await import('../components/seatLockStore');
                  useSeatLockStore.getState().updateSeatState(seatId, 'disponible');
                } catch (err2) {
                }
              }
            })(),
            // Verificar pago solo si es necesario (con timeout corto, en background)
            (async () => {
              const currentSessionId = localStorage.getItem('anonSessionId');
              if (functionId && itemToRemove) {
                try {
                  const seatPaymentChecker = await import('../services/seatPaymentChecker');
                  // Timeout de 1.5 segundos para verificación rápida
                  const paymentCheck = await seatPaymentChecker.default.isSeatPaidByUser(
                    seatId,
                    functionId,
                    currentSessionId,
                    { timeout: 1500, useCache: true }
                  );

                  if (paymentCheck.isPaid) {
                    // Si está pagado, volver a agregarlo al carrito
                    set({ items: [...filtered, itemToRemove] });
                    toast.error('Este asiento ya ha sido comprado y no puede ser eliminado del carrito');
                    return;
                  }
                } catch (err) {
                  // Si hay timeout o error, continuar (optimistic update)
                  if (err.message !== 'Timeout') {
                    console.warn('Error verificando pago (continuando):', err);
                  }
                }
              }
            })()
          ]).catch(err => {
          });
        },

        clearCart: async (skipUnlock = false) => {
          const { items } = get();
          // Solo intentar desbloquear si no se especifica skipUnlock
          if (!skipUnlock) {
            const { useSeatLockStore } = await import('../components/seatLockStore');
            for (const s of items) {
              const seatId = s._id || s.id || s.sillaId;
              const functionId = s.functionId || s.funcionId || get().functionId;

              // Solo desbloquear si tenemos un seatId válido
              if (seatId && functionId) {
                try {
                  await useSeatLockStore
                    .getState()
                    .unlockSeat(seatId, functionId);
                } catch (error) {
                  // Ignorar errores de desbloqueo (asiento ya vendido, etc.)
                  console.log('⚠️ [CART] No se pudo desbloquear asiento (probablemente ya vendido):', seatId);
                }
              }
            }
          }

          // Limpiar el estado del carrito inmediatamente para actualizar la UI
          set({
            items: [],
            products: [],
            functionId: null,
            cartExpiration: null,
            timeLeft: 0
          });
          clearExpirationTimer();

          // Solo disparar el evento cartCleared si realmente se está limpiando todo el carrito
          // (no cuando se deselecciona un asiento individual)
          if (items.length > 0) {
            // Forzar una actualización del estado de los asientos después de limpiar
            // Usar requestAnimationFrame para asegurar que el estado se haya actualizado
            requestAnimationFrame(() => {
              // Disparar un evento personalizado para notificar que el carrito se limpió
              window.dispatchEvent(new CustomEvent('cartCleared', {
                detail: { clearedSeats: items }
              }));
            });
          }

          toast.success('Carrito limpiado');
        },

        // Saved carts functionality
        loadSavedCarts: async () => {
          try {
            set({ savedCartsLoading: true });
            const { data, error } = await supabase
              .from('saved_carts')
              .select('*')
              .order('created_at', { ascending: false });

            if (error) throw error;
            set({ savedCarts: data || [] });
          } catch (error) {
            console.error('Error loading saved carts:', error);
            toast.error('Error al cargar carritos guardados');
          } finally {
            set({ savedCartsLoading: false });
          }
        },

        saveCurrentCart: async (cartName = 'Carrito guardado') => {
          try {
            const { items, products, functionId } = get();
            if (items.length === 0 && products.length === 0) {
              toast.error('No hay items en el carrito para guardar');
              return;
            }

            const cartData = {
              name: cartName,
              function_id: functionId,
              seats: items,
              products: products,
              total: get().calculateTotal(),
              created_at: new Date().toISOString()
            };

            const { error } = await supabase
              .from('saved_carts')
              .insert([cartData]);

            if (error) throw error;

            toast.success('Carrito guardado correctamente');
            get().loadSavedCarts();
          } catch (error) {
            console.error('Error saving cart:', error);
            toast.error('Error al guardar el carrito');
          }
        },

        loadSavedCart: async (cartId) => {
          try {
            const { data, error } = await supabase
              .from('saved_carts')
              .select('*')
              .eq('id', cartId)
              .single();

            if (error) throw error;

            // Load seats and products from saved cart
            set({
              items: data.seats || [],
              products: data.products || [],
              functionId: data.function_id,
            });

            toast.success('Carrito cargado correctamente');
          } catch (error) {
            console.error('Error loading saved cart:', error);
            toast.error('Error al cargar el carrito');
          }
        },

        deleteSavedCart: async (cartId) => {
          try {
            const { error } = await supabase
              .from('saved_carts')
              .delete()
              .eq('id', cartId);

            if (error) throw error;

            toast.success('Carrito eliminado correctamente');
            get().loadSavedCarts();
          } catch (error) {
            console.error('Error deleting saved cart:', error);
            toast.error('Error al eliminar el carrito');
          }
        },

        // Utility functions
        hasActiveTimer: () => {
          const { cartExpiration } = get();
          return !!cartExpiration && cartExpiration > Date.now();
        },

        calculateTotal: () => {
          const { items, products } = get();
          const seatsTotal = items.reduce((sum, item) => sum + toNumberOrZero(item.precio), 0);
          const productsTotal = products.reduce((sum, item) => sum + toNumberOrZero(item.precio_total), 0);
          return seatsTotal + productsTotal;
        },

        getItemCount: () => {
          const { items, products } = get();
          return items.length + products.length;
        },

        getProductsTotal: () => {
          const { products } = get();
          return products.reduce((sum, item) => sum + toNumberOrZero(item.precio_total), 0);
        },

        getSeatsTotal: () => {
          const { items } = get();
          return items.reduce((sum, item) => sum + toNumberOrZero(item.precio), 0);
        },
      };
    },
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        products: state.products,
        cartExpiration: state.cartExpiration,
        functionId: state.functionId,
      }),
    }
  )
);

// Exponer el store globalmente para debugging
if (typeof window !== 'undefined') {
  window.useCartStore = useCartStore;
}

export default useCartStore;