import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSelectedSeatsStore = create(
  persist(
    (set, get) => ({
      // Estado
      selectedSeats: [],
      selectedClient: null,
      selectedEvent: null,
      selectedFuncion: null,
      selectedAffiliate: null,
      
      // Acciones para asientos
      addSeat: (seat) => {
        set((state) => {
          const exists = state.selectedSeats.find(s => s._id === seat._id);
          if (exists) return state;
          
          return {
            selectedSeats: [...state.selectedSeats, seat]
          };
        });
      },
      
      removeSeat: (seatId) => {
        set((state) => ({
          selectedSeats: state.selectedSeats.filter(s => s._id !== seatId)
        }));
      },
      
      toggleSeat: (seat) => {
        set((state) => {
          const exists = state.selectedSeats.find(s => s._id === seat._id);
          if (exists) {
            return {
              selectedSeats: state.selectedSeats.filter(s => s._id !== seat._id)
            };
          } else {
            return {
              selectedSeats: [...state.selectedSeats, seat]
            };
          }
        });
      },
      
      clearSeats: () => {
        set({ selectedSeats: [] });
      },
      
      setSeats: (seats) => {
        set({ selectedSeats: Array.isArray(seats) ? seats : [] });
      },
      
      setSelectedSeats: (seats) => {
        set({ selectedSeats: Array.isArray(seats) ? seats : [] });
      },
      
      // Acciones para cliente
      setSelectedClient: (client) => {
        set({ selectedClient: client });
      },
      
      clearSelectedClient: () => {
        set({ selectedClient: null });
      },
      
      // Acciones para evento y función
      setSelectedEvent: (event) => {
        set({ selectedEvent: event });
      },
      
      setSelectedFuncion: (funcion) => {
        set({ selectedFuncion: funcion });
      },
      
      setSelectedAffiliate: (affiliate) => {
        set({ selectedAffiliate: affiliate });
      },
      
      // Acciones para limpiar todo
      clearAll: () => {
        set({
          selectedSeats: [],
          selectedClient: null,
          selectedEvent: null,
          selectedFuncion: null,
          selectedAffiliate: null
        });
      },
      
      // Getters
      getSeatCount: () => {
        return get().selectedSeats.length;
      },
      
      getTotalPrice: () => {
        return get().selectedSeats.reduce((total, seat) => {
          return total + (seat.precio || 0);
        }, 0);
      },
      
      isSeatSelected: (seatId) => {
        return get().selectedSeats.some(s => s._id === seatId);
      },
      
      // Acciones para sincronización con seat_locks
      syncWithSeatLocks: (lockedSeats) => {
        set((state) => {
          // Filtrar solo asientos que están en seat_locks con status 'seleccionado'
          const syncedSeats = lockedSeats
            .filter(lock => lock.status === 'seleccionado')
            .map(lock => {
              // Buscar el asiento en la lista actual o crear uno básico
              const existingSeat = state.selectedSeats.find(s => s._id === lock.seat_id);
              if (existingSeat) return existingSeat;
              
              // Crear asiento básico desde seat_locks
              return {
                _id: lock.seat_id,
                nombre: `Asiento ${lock.seat_id}`,
                precio: lock.precio || 10.00,
                zona: {
                  id: lock.zona_id || 'ORO',
                  nombre: lock.zona_nombre || 'ORO'
                },
                zonaId: lock.zona_id || 'ORO',
                precioInfo: {
                  base: lock.precio || 10.00,
                  tipoPrecio: 'normal',
                  descuentoNombre: '',
                  zonaId: lock.zona_id || 'ORO'
                }
              };
            });
          
          return { selectedSeats: syncedSeats };
        });
      }
    }),
    {
      name: 'selected-seats-storage',
      partialize: (state) => ({
        selectedSeats: state.selectedSeats,
        // selectedClient: NO se persiste para evitar errores de atención al cliente
        selectedEvent: state.selectedEvent,
        selectedFuncion: state.selectedFuncion,
        selectedAffiliate: state.selectedAffiliate
      })
    }
  )
);

export default useSelectedSeatsStore;
