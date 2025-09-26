import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

const getLockExpirationMs = () => {
  const saved = parseInt(localStorage.getItem('cart_lock_minutes') || '15', 10);
  const minutes = Number.isFinite(saved) ? Math.max(1, Math.min(120, saved)) : 15;
  return minutes * 60 * 1000;
};
// const LOCK_EXPIRATION_TIME_MS = getLockExpirationMs(); // No se usa actualmente
let timer = null;

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
          if (!seatId) return;

          const { items } = get();
          const exists = items.some(
            (item) => (item.sillaId || item.id || item._id) === seatId
          );

          const { useSeatLockStore } = await import('../components/seatLockStore');
          const seatStore = useSeatLockStore.getState();
          const functionId = seat.functionId || seat.funcionId || get().functionId;
          
          // Validar que functionId no sea null
          if (!functionId) {
            console.error('❌ [CART_TOGGLE] functionId es null, no se puede proceder:', { seatId, seat });
            toast.error('Error: No se pudo determinar la función del evento');
            return;
          }

          if (exists) {
            // DESELECCIÓN: Quitar del carrito y desbloquear
            console.log('🔄 [CART_TOGGLE] Deseleccionando asiento:', seatId);
            
            // Quitar del carrito
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
            
            // Desbloquear en BD
            await seatStore.unlockSeat(seatId, functionId);
            
            toast.success('Asiento eliminado del carrito');
          } else {
            // SELECCIÓN: Verificar estado antes de bloquear
            console.log('✅ [CART_TOGGLE] Seleccionando asiento:', seatId);
            
            // Primero verificar si está bloqueado por el mismo usuario
            const currentSessionId = localStorage.getItem('anonSessionId');
            const isLockedByMe = await seatStore.isSeatLockedByMe(seatId, functionId, currentSessionId);
            
            if (isLockedByMe) {
              console.log('✅ [CART_TOGGLE] Asiento ya bloqueado por el mismo usuario, procediendo a deseleccionar:', seatId);
              // Proceder con la deselección
              await seatStore.unlockSeat(seatId, functionId);
              const updated = items.filter(item => (item._id || item.id || item.sillaId) !== seatId);
              set({ items: updated });
              toast.success('Asiento eliminado del carrito');
              return;
            }
            
            // Verificar si está bloqueado por otro usuario
            const isLockedByOther = await seatStore.isSeatLocked(seatId, functionId);
            if (isLockedByOther) {
              console.error('❌ [CART_TOGGLE] Asiento bloqueado por otro usuario:', seatId);
              toast.error('Este asiento está siendo seleccionado por otro usuario');
              return;
            }
            
            // Verificación adicional: verificar si ya está en el carrito local
            const alreadyInCart = items.some(item => (item._id || item.id || item.sillaId) === seatId);
            if (alreadyInCart) {
              console.log('✅ [CART_TOGGLE] Asiento ya está en el carrito local, procediendo a deseleccionar');
              // Continuar con la lógica de deselección
            } else {
              console.log('✅ [CART_TOGGLE] Asiento no está en carrito local, procediendo a seleccionar');
            }
            
            // Bloquear en BD
            const lockResult = await seatStore.lockSeat(seatId, 'seleccionado', functionId);
            
            if (!lockResult) {
              console.error('❌ [CART_TOGGLE] Error bloqueando asiento:', seatId);
              toast.error('Error al seleccionar el asiento');
              return;
            }
            
            // Añadir al carrito
            const updated = [...items, seat];
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
          const { items } = get();
          const filtered = items.filter(item => (item._id || item.id) !== seatId);
          const newState = { items: filtered };
          if (filtered.length === 0 && get().products.length === 0) {
            clearExpirationTimer();
            newState.cartExpiration = null;
            newState.timeLeft = 0;
            newState.functionId = null;
          }
          set(newState);
          
          // Verificar que el asiento no existe en la base de datos antes de desbloquear
          const { useSeatLockStore } = await import('../components/seatLockStore');
          const seatStore = useSeatLockStore.getState();
          
          // Verificar si el asiento está realmente bloqueado en la BD
          const isLocked = await seatStore.isSeatLocked(seatId, get().functionId);
          
          if (isLocked) {
            // Solo desbloquear si está realmente bloqueado en la BD
            await seatStore.unlockSeat(seatId, get().functionId);
            console.log('🔓 [CART] Asiento desbloqueado de la BD:', seatId);
          } else {
            // Si no está bloqueado en la BD, cambiar a 'disponible' para sincronización en tiempo real
            console.log('🎨 [CART] Asiento no estaba bloqueado en BD, cambiando a disponible:', seatId);
            
            // Cambiar a 'disponible' en lugar de eliminar para sincronización en tiempo real
            const currentSeatStates = seatStore.seatStates;
            const newSeatStates = new Map(currentSeatStates);
            newSeatStates.set(seatId, 'disponible'); // Cambiar a disponible en lugar de eliminar
            // Usar la función específica para actualizar seatStates
            seatStore.setSeatStates(newSeatStates);
            
            console.log('🌐 [CART] Asiento cambiado a disponible - se verá en verde para todos los clientes:', seatId);
          }
          
          toast.success('Asiento eliminado del carrito');
        },

        clearCart: async () => {
          const { items } = get();
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
            timeLeft: 0 
          });
          clearExpirationTimer();
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
          const seatsTotal = items.reduce((sum, item) => sum + (item.precio || 0), 0);
          const productsTotal = products.reduce((sum, item) => sum + (item.precio_total || 0), 0);
          return seatsTotal + productsTotal;
        },

        getItemCount: () => {
          const { items, products } = get();
          return items.length + products.length;
        },

        getProductsTotal: () => {
          const { products } = get();
          return products.reduce((sum, item) => sum + (item.precio_total || 0), 0);
        },

        getSeatsTotal: () => {
          const { items } = get();
          return items.reduce((sum, item) => sum + (item.precio || 0), 0);
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
