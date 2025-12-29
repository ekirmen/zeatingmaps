import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Modal, Drawer, Button, message } from '../../utils/antdComponents';
import { ChevronLeft, Menu } from 'lucide-react';
import LeftMenu from './CompBoleteria/LeftMenu';
import Cart from './CompBoleteria/Cart';
import LazySeatingMap from '../../components/LazySeatingMap';
import PaymentModal from './CompBoleteria/PaymentModal';
import ClientModals from './CompBoleteria/ClientModals';
import FunctionModal from './CompBoleteria/FunctionModal';
import DownloadTicketButton from './CompBoleteria/DownloadTicketButton';
import FunctionSwitcher from '../components/FunctionSwitcher';
import EventInfoModal from './CompBoleteria/EventInfoModal';


import { useBoleteria } from '../hooks/useBoleteria';
import { useClientManagement } from '../hooks/useClientManagement';
import { supabase } from '../../supabaseClient';
import { useSeatLockStore } from '../../components/seatLockStore';
import logger from '../../utils/logger';
import UnifiedContextSelector from '../components/UnifiedContextSelector';
import { AppstoreOutlined, EnvironmentOutlined, ShoppingOutlined, EllipsisOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const Boleteria = () => {
  const {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    mapa,
    zonas,
    carrito,
    setCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEvent
  } = useBoleteria();

  // Debug: Log del estado actual (solo en desarrollo, memoizado para evitar renders)
  const debugState = useMemo(() => ({
    selectedEvent: selectedEvent?.id,
    selectedFuncion: selectedFuncion?.id,
    eventosCount: eventos?.length,
    funcionesCount: funciones?.length
  }), [selectedEvent?.id, selectedFuncion?.id, eventos?.length, funciones?.length]);

  useEffect(() => {
    logger.log('Ã°Å¸Å½Â« [Boleteria] Estado actual:', debugState);
  }, [debugState]);

  const [foundSeats, setFoundSeats] = useState([]);
  const [searchAllSeats, setSearchAllSeats] = useState(false);
  const [searchAllSeatsLoading, setSearchAllSeatsLoading] = useState(false);
  const [savedCartBeforeSearch, setSavedCartBeforeSearch] = useState(null);
  const [searchDataLoaded, setSearchDataLoaded] = useState(false);

  // Added for UnifiedContextSelector
  const [selectedVenueId, setSelectedVenueId] = useState('all');

  const handleContextChange = useCallback(({ venueId, eventId, functionId }) => {
    setSelectedVenueId(venueId);

    if (eventId !== 'all' && eventId !== selectedEvent?.id) {
      handleEventSelect(eventId);
    } else if (eventId === 'all' && selectedEvent) {
      // Ideally clear event, but handleEventSelect might expect an ID. 
      // If clearing is not supported by useBoleteria, we might just keep it or inspect handleEventSelect.
      // Assuming handleEventSelect('') or null works
      handleEventSelect(null);
    }

    if (functionId !== 'all' && functionId !== selectedFuncion?.id) {
      handleFunctionSelect(functionId);
    } else if (functionId === 'all' && selectedFuncion) {
      handleFunctionSelect(null);
    }
  }, [selectedEvent, selectedFuncion, handleEventSelect, handleFunctionSelect]);

  const {
    selectedClient,
    setSelectedClient,
    searchResults,
    paymentResults,
    searchLoading,
    handleAddClient,
    handleUnifiedSearch,
    clearSearchResults,
    handleLocatorSearch
  } = useClientManagement((seats) => {
    setCarrito(seats);
    setFoundSeats(seats);
  });

  const {
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe,
    subscribeToFunction,
    unsubscribe,
    lockedSeats: rtLockedSeats,
    seatStates,
    seatStatesVersion  // Version counter to trigger re-renders
  } = useSeatLockStore();



  // Suscribirse a eventos en tiempo real para la función seleccionada (optimizado)
  const subscriptionFuncionId = useRef(null);
  useEffect(() => {
    const currentFuncionId = selectedFuncion?.id;

    // Solo suscribirse si cambió la función
    if (currentFuncionId && currentFuncionId !== subscriptionFuncionId.current && subscribeToFunction) {
      // Desuscribirse de la función anterior si existe
      if (subscriptionFuncionId.current && unsubscribe) {
        logger.log('🔌 [Boleteria] Desuscribiéndose de función anterior:', subscriptionFuncionId.current);
        unsubscribe();
      }

      logger.log('🔌 [Boleteria] Suscribiéndose a función:', currentFuncionId);
      subscribeToFunction(currentFuncionId);
      subscriptionFuncionId.current = currentFuncionId;
    }

    return () => {
      // Dar tiempo al WebSocket para conectarse antes de limpiar
      const timer = setTimeout(() => {
        if (unsubscribe && subscriptionFuncionId.current) {
          logger.log('🔌 [Boleteria] Desuscribiéndose de función:', subscriptionFuncionId.current);
          unsubscribe();
          subscriptionFuncionId.current = null;
        }
      }, 100); // 100ms delay para evitar race condition

      return () => clearTimeout(timer);
    };
  }, [selectedFuncion?.id, subscribeToFunction, unsubscribe]);

  // Debug: Log cuando seatStates cambia
  useEffect(() => {
    if (seatStates && seatStates.size > 0) {
      console.log('🎨 [BOLETERIA] seatStates actualizado:', {
        size: seatStates.size,
        version: seatStatesVersion,
        sample: Array.from(seatStates.entries()).slice(0, 3)
      });
    }
  }, [seatStates, seatStatesVersion]);


  const [isFunctionsModalVisible, setIsFunctionsModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isFunctionModalVisible, setIsFunctionModalVisible] = useState(false);
  const [isEventInfoModalVisible, setIsEventInfoModalVisible] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [clientAbonos, setClientAbonos] = useState([]);
  const [seatPayment, setSeatPayment] = useState(null);
  const [isSeatModalVisible, setIsSeatModalVisible] = useState(false);
  const [permanentLocks, setPermanentLocks] = useState([]);

  // Estados para gestiÂón de precios y entradas
  const [entradas, setEntradas] = useState([]);
  const [selectedEntradaId, setSelectedEntradaId] = useState(null);
  const [priceOptions, setPriceOptions] = useState([]);
  const [blockMode, setBlockMode] = useState(false);
  const [blockAction, setBlockAction] = useState(null); // 'block' | 'unlock'

  // Eliminar useEffect duplicado - ya estÂá manejado arriba

  // useEffect para cargar entradas y opciones de precio (optimizado - solo cuando cambian funcion o evento)
  const prevFuncionId = useRef(null);
  const prevEventId = useRef(null);

  useEffect(() => {
    const currentFuncionId = selectedFuncion?.id;
    const currentEventId = selectedEvent?.id;

    // Solo cargar si cambió la función o el evento
    if (!selectedFuncion || !selectedEvent) return;
    if (currentFuncionId === prevFuncionId.current && currentEventId === prevEventId.current) return;

    prevFuncionId.current = currentFuncionId;
    prevEventId.current = currentEventId;

    const loadEntradasAndPrices = async () => {
      try {
        logger.log('Ã°Å¸Å½Â« [Boleteria] Cargando entradas y precios...');

        // Cargar entradas del recinto
        const recintoId = selectedEvent.recinto || selectedEvent.recinto_id;
        if (!recintoId) {
          logger.warn('No se encontrÂó recinto_id');
          return;
        }

        const { data: entradasData, error: entradasError } = await supabase
          .from('entradas')
          .select('id, nombre_entrada, tipo_producto, precio_base, recinto')
          .eq('recinto', recintoId);

        if (entradasError) {
          logger.error('Error cargando entradas:', entradasError);
          return;
        }

        logger.log('Å“â€¦ Entradas cargadas:', entradasData);
        setEntradas(entradasData || []);

        // Procesar plantilla de precios
        if (selectedFuncion.plantilla?.detalles) {
          const detalles = typeof selectedFuncion.plantilla.detalles === 'string'
            ? JSON.parse(selectedFuncion.plantilla.detalles)
            : selectedFuncion.plantilla.detalles;

          // Agrupar precios por entradaId
          const pricesGrouped = {};
          detalles.forEach(detalle => {
            const entradaId = detalle.entradaId || detalle.productoId;
            if (!entradaId) return;

            if (!pricesGrouped[entradaId]) {
              pricesGrouped[entradaId] = {
                entradaId,
                precios: [],
                minPrecio: Infinity,
                maxPrecio: -Infinity
              };
            }

            pricesGrouped[entradaId].precios.push(detalle);
            pricesGrouped[entradaId].minPrecio = Math.min(pricesGrouped[entradaId].minPrecio, detalle.precio || 0);
            pricesGrouped[entradaId].maxPrecio = Math.max(pricesGrouped[entradaId].maxPrecio, detalle.precio || 0);
          });

          // Combinar con informaciÂón de entradas
          const priceOptionsArray = Object.values(pricesGrouped).map(group => {
            const entrada = entradasData?.find(e => e.id === group.entradaId);
            const safeMinPrecio = Number.isFinite(group.minPrecio) && group.minPrecio !== Infinity
              ? group.minPrecio
              : Number(group.precios?.[0]?.precio ?? 0);
            const safeMaxPrecio = Number.isFinite(group.maxPrecio) && group.maxPrecio !== -Infinity
              ? group.maxPrecio
              : safeMinPrecio;

            return {
              ...group,
              minPrecio: safeMinPrecio,
              maxPrecio: safeMaxPrecio,
              nombre: entrada?.nombre_entrada || 'Sin nombre',
              tipo: entrada?.tipo_producto || 'General',
              entrada: entrada
            };
          });

          logger.log('Å“â€¦ Opciones de precio procesadas:', priceOptionsArray);
          setPriceOptions(priceOptionsArray);

          // Seleccionar la primera entrada por defecto solo si no hay una seleccionada
          if (priceOptionsArray.length > 0 && !selectedEntradaId) {
            setSelectedEntradaId(priceOptionsArray[0].entradaId);
          }
        }
      } catch (error) {
        logger.error('Error en loadEntradasAndPrices:', error);
      }
    };

    loadEntradasAndPrices();
  }, [selectedFuncion?.id, selectedEvent?.id]); // Solo dependencias crÂíticas

  const searchExistingSeats = useCallback(async () => {
    if (!selectedFuncion?.id || searchAllSeatsLoading) return;

    try {
      setSearchAllSeatsLoading(true);
      const funcionId = selectedFuncion.id;
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`id, locator, status, amount, currency, user:profiles!user_id(login, nombre, apellido), seats`)
        .eq('funcion_id', funcionId)
        .in('status', ['completed', 'vendido', 'reservado', 'pagado', 'pending', 'reserved']);

      if (error) {
        throw error;
      }

      const normalizeSeats = (payment) => {
        const rawSeats = Array.isArray(payment.seats)
          ? payment.seats
          : (() => {
            if (!payment.seats) return [];
            if (typeof payment.seats === 'string') {
              try {
                return JSON.parse(payment.seats);
              } catch {
                try {
                  return JSON.parse(JSON.parse(payment.seats));
                } catch {
                  return [];
                }
              }
            }
            if (typeof payment.seats === 'object') {
              return payment.seats.seats || [];
            }
            return [];
          })();

        const buyerFullName = [payment.user?.nombre, payment.user?.apellido].filter(Boolean).join(' ').trim();
        const buyerName = buyerFullName || payment.user?.full_name || payment.user?.login || 'Comprador sin nombre';
        const buyerEmail = payment.user?.login || '';
        const normalizedStatus = (() => {
          const status = (payment.status || '').toLowerCase();
          if (['pagado', 'vendido', 'completed'].includes(status)) return 'vendido';
          if (['reservado', 'pending', 'reserved'].includes(status)) return 'reservado';
          return status || 'reservado';
        })();

        return rawSeats.map((seat, index) => {
          const seatId = seat._id || seat.id || seat.sillaId || seat.seat_id || `seat-${index}`;
          const zonaNombre = seat.nombreZona || seat.zona?.nombre || seat.zonaNombre || seat.zona || 'Zona';
          const nombre = seat.nombre || seat.name || seat.nombreAsiento || seat.seatLabel || seatId;
          const precio = Number(seat.precio ?? seat.price ?? payment.amount ?? 0);

          return {
            _id: seatId,
            sillaId: seatId,
            nombre,
            nombreZona: zonaNombre,
            zona: zonaNombre,
            zonaId: seat.zonaId || seat.zona?.id || seat.zona_id,
            precio,
            tipoPrecio: seat.tipoPrecio || seat.tipo || 'histÂórico',
            locator: payment.locator,
            status: normalizedStatus,
            buyerName,
            buyerEmail,
            funcionId: funcionId,
            funcionFecha: selectedFuncion?.fechaCelebracion || selectedFuncion?.fecha_celebracion,
            modoVenta: 'boleteria'
          };
        });
      };

      const allSeats = (data || []).flatMap(normalizeSeats);
      setFoundSeats(allSeats);
      if (!savedCartBeforeSearch) {
        setSavedCartBeforeSearch(Array.isArray(carrito) ? carrito : []);
      }
      setSearchDataLoaded(true);
    } catch (error) {
      logger.error('ÂÅ’ [Boleteria] Error buscando asientos vendidos/reservados:', error);
    } finally {
      setSearchAllSeatsLoading(false);
    }
  }, [selectedFuncion, setCarrito, carrito, savedCartBeforeSearch, searchAllSeatsLoading]);

  useEffect(() => {
    if (!searchAllSeats) {
      setFoundSeats([]);
      setSearchDataLoaded(false);
      if (savedCartBeforeSearch) {
        setCarrito(savedCartBeforeSearch);
        setSavedCartBeforeSearch(null);
      }
    }
  }, [searchAllSeats, savedCartBeforeSearch, setCarrito]);

  const selectedSeatIds = useMemo(() => {
    if (!Array.isArray(carrito)) return [];

    const ids = carrito
      .map(item => item?._id || item?.sillaId || item?.id)
      .filter(Boolean)
      .map(id => id.toString());

    return Array.from(new Set(ids));
  }, [carrito]);

  useEffect(() => {
    const funcionId = selectedFuncion?.id || selectedFuncion?._id;

    if (!funcionId) {
      setPermanentLocks([]);
      return;
    }

    let isMounted = true;

    const parseSeatsCollection = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;

      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
          if (Array.isArray(parsed?.seats)) return parsed.seats;
        } catch (error) {
          try {
            const nested = JSON.parse(JSON.parse(value));
            if (Array.isArray(nested)) return nested;
            if (Array.isArray(nested?.seats)) return nested.seats;
          } catch (err) {
            return [];
          }
        }
      }

      if (typeof value === 'object' && Array.isArray(value?.seats)) {
        return value.seats;
      }

      return [];
    };

    const buildLocksFromPayments = (payments = []) => {
      const lockMap = new Map();

      payments.forEach(payment => {
        const seats = parseSeatsCollection(payment.seats);
        const normalizedStatus = (() => {
          const status = (payment.status || '').toLowerCase();
          if (['pagado', 'vendido', 'completed'].includes(status)) return 'vendido';
          if (['reservado', 'pending', 'reserved'].includes(status)) return 'reservado';
          if (status === 'anulado') return 'anulado';
          if (status === 'bloqueado') return 'locked';
          return status || 'locked';
        })();

        seats.forEach(seat => {
          const seatIdRaw = seat?.id || seat?._id || seat?.sillaId || seat?.seat_id;
          if (!seatIdRaw) return;

          const seatId = seatIdRaw.toString();
          const zonaId = seat?.zonaId || seat?.zona?.id || seat?.zona_id || null;
          const zonaNombre = seat?.zona?.nombre || seat?.zonaNombre || null;
          const precio = Number(seat?.precio ?? seat?.price);

          lockMap.set(seatId, {
            seat_id: seatId,
            funcion_id: funcionId,
            status: normalizedStatus,
            lock_type: 'seat',
            locator: payment.locator || null,
            session_id: payment.user_id || null,
            precio: Number.isFinite(precio) ? precio : null,
            zona_id: zonaId,
            zona_nombre: zonaNombre,
            source: 'payment'
          });
        });
      });

      return Array.from(lockMap.values());
    };

    const fetchPaymentLocks = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_transactions')
          .select('id, seats, status, locator, user_id')
          .eq('funcion_id', funcionId)
          .in('status', ['pagado', 'reservado', 'anulado', 'vendido', 'bloqueado', 'completed', 'pending', 'reserved']);

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        const locks = buildLocksFromPayments(data || []);
        setPermanentLocks(locks);
      } catch (error) {
        logger.error('ÂÅ’ [Boleteria] Error cargando asientos vendidos/reservados:', error);
        if (isMounted) {
          setPermanentLocks([]);
        }
      }
    };

    fetchPaymentLocks();

    const channel = supabase
      .channel(`payment_transactions-funcion-${funcionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_transactions',
          filter: `funcion_id=eq.${funcionId}`,
        },
        () => {
          fetchPaymentLocks();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        if (typeof supabase.removeChannel === 'function') {
          supabase.removeChannel(channel);
        } else if (typeof channel.unsubscribe === 'function') {
          channel.unsubscribe();
        }
      }
    };
  }, [selectedFuncion]);

  const handleBlockActionToggle = useCallback(
    (action) => {
      const safeCart = Array.isArray(carrito) ? carrito : [];
      const hasSaleItems = safeCart.some(item => !item.lockAction);

      if (hasSaleItems) {
        message.warning('Vacía el carrito de venta antes de usar el modo bloqueo/desbloqueo.');
        return;
      }

      // Si ya estÂá activo el mismo modo, desactivarlo
      if (blockMode && blockAction === action) {
        setBlockMode(false);
        setBlockAction(null);
        setCarrito(prev => (Array.isArray(prev) ? prev.filter(item => !item.lockAction) : []));
        message.info('Modo bloqueo/desbloqueo desactivado.');
        return;
      }

      // Limpiar selecciones previas de bloqueo si se cambia la acciÂón
      const lockItems = safeCart.filter(item => item.lockAction === action);
      if (lockItems.length !== safeCart.filter(item => item.lockAction).length) {
        message.info('Se limpiaron los asientos seleccionados del modo anterior.');
      }

      setCarrito(lockItems);
      setBlockMode(true);
      setBlockAction(action);
      message.info(
        action === 'block'
          ? 'Modo BLOQUEAR activado. Selecciona asientos disponibles para bloquearlos.'
          : 'Modo DESBLOQUEAR activado. Selecciona asientos bloqueados para liberarlos.'
      );
    },
    [blockAction, blockMode, carrito, setCarrito]
  );

  const toggleSeat = useCallback(
    (seatData) => {
      setCarrito(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const seatId = seatData?._id || seatData?.sillaId || seatData?.id;

        if (!seatId) {
          logger.warn('ÅáÂ Ã¯Â¸Â [Boleteria] toggleSeat llamado sin identificador vÂálido:', seatData);
          return safePrev;
        }

        const normalizedSeat = {
          ...seatData,
          _id: seatId,
          sillaId: seatData?.sillaId || seatId,
        };

        const existingIndex = safePrev.findIndex(item => {
          const currentId = item?._id || item?.sillaId || item?.id;
          return currentId === seatId;
        });

        if (existingIndex >= 0) {
          return safePrev.filter((_, index) => index !== existingIndex);
        }

        return [...safePrev, normalizedSeat];
      });
    },
    [setCarrito]
  );

  // Función para reclamar sesión de cliente (Customer Recovery)
  const reclaimSession = useCallback(
    async (clickedSeatId) => {
      try {
        message.loading({ content: 'Reclamando sesión...', key: 'reclaim', duration: 0 });

        // 1. Obtener el session_id del asiento clickeado
        const { data: seatLock, error: lockError } = await supabase
          .from('seat_locks')
          .select('session_id, funcion_id')
          .eq('seat_id', clickedSeatId)
          .eq('funcion_id', selectedFuncion.id)
          .eq('status', 'seleccionado')
          .single();

        if (lockError || !seatLock) {
          throw new Error('No se pudo encontrar la sesión del asiento');
        }

        const targetSessionId = seatLock.session_id;

        // 2. Obtener TODOS los asientos de esa sesión
        const { data: allSeats, error: seatsError } = await supabase
          .from('seat_locks')
          .select('seat_id, zona_id, zona_nombre, precio, metadata')
          .eq('session_id', targetSessionId)
          .eq('funcion_id', selectedFuncion.id)
          .eq('status', 'seleccionado');

        if (seatsError || !allSeats || allSeats.length === 0) {
          throw new Error('No se encontraron asientos en esta sesión');
        }

        // 3. Verificar que no haya asientos pagados (seguridad)
        const { data: paidSeats } = await supabase
          .from('seat_locks')
          .select('seat_id')
          .eq('session_id', targetSessionId)
          .in('status', ['pagado', 'vendido']);

        if (paidSeats && paidSeats.length > 0) {
          throw new Error('Esta sesión ya tiene asientos pagados. No se puede reclamar.');
        }

        // 4. Obtener mi session_id actual
        const mySessionId = localStorage.getItem('anonSessionId');

        if (!mySessionId) {
          throw new Error('No se pudo obtener tu sesión actual');
        }

        // 5. Transferir todos los asientos a mi sesión
        const { error: updateError } = await supabase
          .from('seat_locks')
          .update({
            session_id: mySessionId,
            updated_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          })
          .eq('session_id', targetSessionId)
          .eq('funcion_id', selectedFuncion.id)
          .eq('status', 'seleccionado');

        if (updateError) {
          throw new Error('Error al transferir asientos: ' + updateError.message);
        }

        // 6. Agregar asientos al carrito local
        const seatsForCart = allSeats.map(s => ({
          sillaId: s.seat_id,
          _id: s.seat_id,
          zonaId: s.zona_id,
          zonaNombre: s.zona_nombre,
          precio: s.precio || 0,
          funcionId: selectedFuncion.id,
          metadata: s.metadata || {}
        }));

        setCarrito(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          // Evitar duplicados
          const newSeats = seatsForCart.filter(newSeat =>
            !safePrev.some(existingSeat =>
              (existingSeat._id || existingSeat.sillaId) === newSeat.sillaId
            )
          );
          return [...safePrev, ...newSeats];
        });

        message.success({
          content: `✅ ${allSeats.length} asiento(s) reclamados exitosamente`,
          key: 'reclaim',
          duration: 3
        });

        // 7. Registrar auditoría (deshabilitado - logUserAction no disponible)
        // try {
        //   await logUserAction('reclaim_session', {
        //     original_session: targetSessionId,
        //     new_session: mySessionId,
        //     seats_count: allSeats.length,
        //     funcion_id: selectedFuncion.id,
        //     seats: allSeats.map(s => s.seat_id)
        //   });
        // } catch (auditError) {
        //   console.warn('[RECLAIM] Error en auditoría:', auditError);
        // }

      } catch (error) {
        message.error({
          content: '❌ Error al reclamar sesión: ' + error.message,
          key: 'reclaim',
          duration: 5
        });
        console.error('[RECLAIM] Error:', error);
      }
    },
    [selectedFuncion, setCarrito]
  );

  // Función para cargar venta vendida por localizador (Load Sold Transaction)
  const loadSoldTransaction = useCallback(
    async (clickedSeatId) => {
      try {
        message.loading({ content: 'Cargando venta...', key: 'load-sold', duration: 0 });

        // 1. Obtener el localizador del asiento clickeado
        const { data: seatLock, error: lockError } = await supabase
          .from('seat_locks')
          .select('locator, funcion_id')
          .eq('seat_id', clickedSeatId)
          .eq('funcion_id', selectedFuncion.id)
          .in('status', ['vendido', 'pagado'])
          .single();

        if (lockError || !seatLock || !seatLock.locator) {
          throw new Error('No se pudo encontrar el localizador de este asiento');
        }

        const locator = seatLock.locator;

        // 2. Buscar la transacción en payment_transactions
        const { data: transaction, error: txError } = await supabase
          .from('payment_transactions')
          .select('id, seats, user_id, status, locator, metadata')
          .eq('locator', locator)
          .eq('funcion_id', selectedFuncion.id)
          .single();

        if (txError || !transaction) {
          throw new Error('No se encontró la transacción asociada a este localizador');
        }

        // 3. Parsear los asientos de la transacción
        let transactionSeats = [];
        try {
          transactionSeats = typeof transaction.seats === 'string'
            ? JSON.parse(transaction.seats)
            : transaction.seats;
        } catch (parseError) {
          throw new Error('Error al parsear los asientos de la transacción');
        }

        if (!Array.isArray(transactionSeats) || transactionSeats.length === 0) {
          throw new Error('No se encontraron asientos en esta transacción');
        }

        // 4. Obtener información completa de los asientos desde seat_locks
        const seatIds = transactionSeats.map(s => s.sillaId || s.id || s._id).filter(Boolean);

        const { data: fullSeats, error: seatsError } = await supabase
          .from('seat_locks')
          .select('seat_id, zona_id, zona_nombre, precio, metadata, locator')
          .eq('locator', locator)
          .eq('funcion_id', selectedFuncion.id)
          .in('status', ['vendido', 'pagado']);

        if (seatsError) {
          console.warn('[LOAD_SOLD] Error obteniendo detalles de asientos:', seatsError);
        }

        // 5. Combinar información de transacción y seat_locks
        const seatsForCart = transactionSeats.map(txSeat => {
          const seatId = txSeat.sillaId || txSeat.id || txSeat._id;
          const fullSeat = fullSeats?.find(fs => fs.seat_id === seatId);

          return {
            sillaId: seatId,
            _id: seatId,
            zonaId: txSeat.zonaId || fullSeat?.zona_id,
            zonaNombre: txSeat.zonaNombre || fullSeat?.zona_nombre,
            precio: txSeat.precio || fullSeat?.precio || 0,
            funcionId: selectedFuncion.id,
            locator: locator,
            transactionId: transaction.id,
            isSoldTransaction: true, // Marca especial para identificar en el carrito
            originalStatus: 'vendido',
            metadata: {
              ...(txSeat.metadata || {}),
              ...(fullSeat?.metadata || {}),
              loadedFromTransaction: true
            }
          };
        });

        // 6. Limpiar carrito y agregar asientos de la venta
        setCarrito(seatsForCart);

        message.success({
          content: `✅ Venta cargada: ${seatsForCart.length} asiento(s) | Localizador: ${locator}`,
          key: 'load-sold',
          duration: 5
        });

        // 7. Registrar auditoría (deshabilitado - logUserAction no disponible)
        // try {
        //   await logUserAction('load_sold_transaction', {
        //     locator: locator,
        //     transaction_id: transaction.id,
        //     seats_count: seatsForCart.length,
        //     funcion_id: selectedFuncion.id,
        //     seats: seatsForCart.map(s => s.sillaId)
        //   });
        // } catch (auditError) {
        //   console.warn('[LOAD_SOLD] Error en auditoría:', auditError);
        // }

      } catch (error) {
        message.error({
          content: '❌ Error al cargar venta: ' + error.message,
          key: 'load-sold',
          duration: 5
        });
        console.error('[LOAD_SOLD] Error:', error);
      }
    },
    [selectedFuncion, setCarrito]
  );

  const handleSeatToggle = useCallback(
    async (silla) => {
      const sillaId = silla._id || silla.id;
      if (!sillaId || !selectedFuncion) return;

      if (searchAllSeats) {
        if (!searchDataLoaded && !searchAllSeatsLoading) {
          await searchExistingSeats();
        }

        const seatName = silla.nombre || silla.numero || silla.label || silla._id || `Asiento ${sillaId}`;
        const nombreZona = silla.nombreZona || silla.zona?.nombre || silla?.zona || 'Zona';

        await toggleSeat({
          ...silla,
          _id: sillaId,
          sillaId,
          nombre: seatName,
          nombreZona,
          zona: nombreZona,
          modoVenta: 'search'
        });

        return;
      }

      const seatEstado = silla.estado || silla.status || 'disponible';

      // NUEVO: Detectar si el asiento está seleccionado por otro usuario
      const seatId = silla._id || silla.id;
      const seatState = seatStates?.get(seatId);

      // Detectar click en asiento seleccionado por otro (azul)
      if (seatState === 'seleccionado_por_otro' && !blockMode) {
        Modal.confirm({
          title: '🔄 Reclamar Sesión de Cliente',
          icon: <ExclamationCircleOutlined />,
          content: (
            <div>
              <p>Este asiento está seleccionado por otro usuario (posiblemente un cliente con problemas técnicos).</p>
              <p className="font-semibold mt-2">¿Deseas reclamar TODOS los asientos de esta sesión?</p>
              <p className="text-gray-500 text-sm mt-2">
                Esto transferirá todos los asientos bloqueados por este cliente a tu carrito para que puedas completar la venta.
              </p>
            </div>
          ),
          okText: 'Sí, reclamar sesión',
          okType: 'primary',
          cancelText: 'Cancelar',
          onOk: async () => {
            await reclaimSession(seatId);
          }
        });
        return;
      }

      // NUEVO: Detectar click derecho en asiento vendido/pagado (negro)
      if ((seatState === 'vendido' || seatState === 'pagado' || seatEstado === 'vendido' || seatEstado === 'pagado') && !blockMode) {
        Modal.confirm({
          title: '📋 Cargar Venta por Localizador',
          icon: <ExclamationCircleOutlined />,
          content: (
            <div>
              <p>Este asiento ya está vendido.</p>
              <p className="font-semibold mt-2">¿Deseas cargar TODA la venta asociada a este asiento?</p>
              <p className="text-gray-500 text-sm mt-2">
                Esto cargará todos los asientos de la misma transacción en tu carrito para que puedas:
              </p>
              <ul className="text-gray-500 text-sm mt-1 ml-4 list-disc">
                <li>Cambiar asientos</li>
                <li>Anular la venta</li>
                <li>Reimprimir tickets</li>
                <li>Modificar datos del cliente</li>
              </ul>
            </div>
          ),
          okText: 'Sí, cargar venta',
          okType: 'primary',
          cancelText: 'Cancelar',
          onOk: async () => {
            await loadSoldTransaction(seatId);
          }
        });
        return;
      }


      if (blockMode) {
        const funcionId = selectedFuncion?.id || selectedFuncion?._id || null;

        if (!funcionId) {
          message.warning('Selecciona una función antes de bloquear/desbloquear.');
          return;
        }

        if (!blockAction) {
          message.warning('Elige si deseas BLOQUEAR o DESBLOQUEAR antes de seleccionar asientos.');
          return;
        }

        const blockedStates = ['bloqueado', 'locked', 'lock'];
        const lockAction = blockAction === 'block' ? 'block' : 'unlock';

        if (lockAction === 'block' && blockedStates.includes(seatEstado)) {
          message.warning('El asiento ya estÂá bloqueado. Usa DESBLOQUEAR si quieres liberarlo.');
          return;
        }

        if (lockAction === 'unlock' && !blockedStates.includes(seatEstado)) {
          message.warning('⚠️ Modo Desbloqueo: Solo puedes seleccionar asientos que estén bloqueados (no vendidos/pagados).');
          return;
        }

        setCarrito(prev => {
          const safePrev = Array.isArray(prev) ? prev.filter(item => item.lockAction) : [];
          const existingIndex = safePrev.findIndex(item => (item._id || item.sillaId || item.id) === sillaId);

          // Si el asiento ya estÂá seleccionado con la misma acciÂón, quitarlo
          if (existingIndex >= 0 && safePrev[existingIndex]?.lockAction === lockAction) {
            return safePrev.filter((_, index) => index !== existingIndex);
          }

          // Reemplazar acciÂón si estaba con la contraria
          const withoutSeat = existingIndex >= 0
            ? safePrev.filter((_, index) => index !== existingIndex)
            : safePrev;

          if (safePrev.length !== (Array.isArray(prev) ? prev.length : 0)) {
            message.warning('Solo puedes tener asientos de bloqueo/desbloqueo en el carrito.');
          }

          const seatName = silla.nombre || silla.numero || silla.label || silla._id || `Asiento ${sillaId}`;
          const nombreMesa = silla.nombreMesa || silla.mesa_nombre || silla.mesaNombre || silla.tableName || '';
          const zonaId = silla.zona?.id || silla.zonaId || silla.zona?._id;
          const nombreZona = silla.zona?.nombre || silla?.zonaNombre || silla?.zona || 'Zona';

          return [
            ...withoutSeat,
            {
              _id: sillaId,
              sillaId,
              nombre: seatName,
              nombreZona,
              zona: nombreZona,
              zonaId,
              funcionId,
              funcionFecha: selectedFuncion?.fechaCelebracion || selectedFuncion?.fecha_celebracion,
              nombreMesa,
              lockAction,
              precio: 0,
              tipoPrecio: lockAction,
              descuentoNombre: '',
              modoVenta: 'lock',
              estadoActual: seatEstado
            }
          ];
        });

        message.success(lockAction === 'block' ? 'Asiento marcado para bloquear' : 'Asiento marcado para desbloquear');
        return;
      }

      // Verificar que se haya seleccionado un tipo de entrada
      if (!selectedEntradaId) {
        logger.warn('ÅáÂ Ã¯Â¸Â [Boleteria] No se ha seleccionado un tipo de entrada');
        // Aquí podrías mostrar un mensaje al usuario
        return;
      }

      // En modo boleterÂía simplificado, no verificamos bloqueos aquÂí
      // Los bloqueos se manejan por separado con botones especÂíficos

      if (seatEstado === 'bloqueado' || seatEstado === 'locked' || seatEstado === 'lock') {
        message.warning('Este asiento estÂá bloqueado. Activa el modo bloqueo/desbloqueo para liberarlo.');
        return;
      }

      // Resolver zona y precio
      const zona =
        (Array.isArray(mapa?.zonas) ? mapa.zonas.find(z => Array.isArray(z.asientos) && z.asientos.some(a => a._id === sillaId)) : null) ||
        (Array.isArray(mapa?.contenido) ? mapa.contenido.find(el => Array.isArray(el.sillas) && el.sillas.some(a => a._id === sillaId) && el.zona) : null) ||
        silla.zona || {};
      const zonaId = zona?.id || silla.zonaId || zona?._id;
      const nombreZona = zona?.nombre || silla?.zona?.nombre || 'Zona';

      let detalle = selectedPlantilla?.detalles;
      if (typeof detalle === 'string') {
        try {
          detalle = JSON.parse(detalle);
        } catch (error) {
          logger.warn('ÅáÂ Ã¯Â¸Â [Boleteria] No se pudo parsear la plantilla de precios:', error);
          detalle = [];
        }
      }

      // Buscar el precio basado en la zona Y el tipo de entrada seleccionado
      const detalleZona = Array.isArray(detalle)
        ? detalle.find(d =>
          (d.zonaId || d.zona?.id || d.zona) === zonaId &&
          (d.entradaId || d.productoId) === selectedEntradaId
        )
        : null;

      // Si no se encuentra con el tipo de entrada seleccionado, usar el primer precio de la zona
      const detalleZonaFallback = Array.isArray(detalle)
        ? detalle.find(d => (d.zonaId || d.zona?.id || d.zona) === zonaId)
        : null;

      const detalleFinal = detalleZona || detalleZonaFallback;
      const precio = Number(detalleFinal?.precio) || 0;

      // Obtener informaciÂón del tipo de entrada seleccionado
      const entradaSeleccionada = priceOptions?.find(option => option.entradaId === selectedEntradaId);
      const tipoPrecio = entradaSeleccionada?.nombre || detalleFinal?.tipoEntrada || detalleFinal?.tipo || 'general';
      const descuentoNombre = detalleFinal?.descuentoNombre || detalleFinal?.descuento || '';
      const seatName = silla.nombre || silla.numero || silla.label || silla._id || `Asiento ${sillaId}`;
      const nombreMesa = silla.nombreMesa || silla.mesa_nombre || silla.mesaNombre || silla.tableName || '';
      const funcionId = selectedFuncion?.id || selectedFuncion?._id || null;
      const funcionFecha = selectedFuncion?.fechaCelebracion || selectedFuncion?.fecha_celebracion || null;
      const funcionNombre = selectedFuncion?.nombre || '';

      const cartItem = {
        _id: sillaId,
        sillaId,
        nombre: seatName,
        nombreZona,
        zona: nombreZona,
        zonaId,
        precio,
        tipoPrecio,
        descuentoNombre,
        funcionId,
        funcionFecha,
        funcionNombre,
        nombreMesa,
        precioInfo: detalleFinal || null,
        entradaId: selectedEntradaId,
        entradaNombre: entradaSeleccionada?.nombre || 'General',
        timestamp: Date.now(),
        modoVenta: 'boleteria'
      };

      // Verificar si el asiento ya estÂá en el carrito
      const exists = carrito.some(item => item.sillaId === sillaId);

      if (exists) {
        // Deseleccionar: quitar del carrito y desbloquear en BD
        await toggleSeat(cartItem);
        // Boletería puede desbloquear asientos permanentemente bloqueados
        // allowOverrideSession: usa el session_id del lock existente en lugar del actual
        // allowForceUnlock: permite desbloquear asientos con status permanente
        await unlockSeat(sillaId, funcionId, {
          allowOverrideSession: true,
          allowForceUnlock: true
        });
        logger.log('🗑️ [Boleteria] Asiento deseleccionado y desbloqueado:', sillaId);
      } else {
        // Seleccionar: bloquear en BD primero, luego agregar al carrito
        const lockResult = await lockSeat(sillaId, 'seleccionado', funcionId);
        if (lockResult) {
          await toggleSeat(cartItem);
          logger.log('Å“â€¦ [Boleteria] Asiento seleccionado y bloqueado:', sillaId);
        } else {
          logger.log('ÂÅ’ [Boleteria] No se pudo bloquear el asiento:', sillaId);
        }
      }
    },
    [
      selectedFuncion,
      mapa,
      selectedPlantilla,
      selectedEntradaId,
      priceOptions,
      toggleSeat,
      carrito,
      lockSeat,
      unlockSeat,
      blockMode,
      blockAction,
      setCarrito,
      searchAllSeats,
      searchExistingSeats,
      searchDataLoaded,
      searchAllSeatsLoading
    ]
  );

  const allTicketsPaid = carrito.length > 0 && carrito.every(ticket => ticket.pagado);

  const leftMenuProps = useMemo(() => ({
    eventos,
    selectedEvent,
    onEventSelect: handleEventSelect,
    funciones,
    selectedFuncion,
    onFunctionSelect: handleFunctionSelect,
    onShowFunctions: () => setIsFunctionsModalVisible(true),
    selectedPlantilla,
    setSelectedPlantilla,
    selectedClient,
    setSelectedClient,
    onShowUserSearch: () => setIsSearchModalVisible(true),
    onShowPaymentModal: () => setIsPaymentModalVisible(true),
    selectedAffiliate,
    setSelectedAffiliate,
    clientAbonos,
    setClientAbonos,
    carrito,
    setCarrito,
    foundSeats,
    setFoundSeats,
    searchResults,
    paymentResults,
    searchLoading,
    handleAddClient,
    handleUnifiedSearch,
    clearSearchResults,
    handleLocatorSearch,
    onShowSeatModal: () => setIsSeatModalVisible(true),
    seatPayment,
    setSeatPayment,
    setSelectedEvent
  }), [
    selectedClient,
    setCarrito,
    setSelectedClient,
    handleFunctionSelect,
    setSelectedEvent,
    handleEventSelect,
    selectedEvent,
    eventos,
    funciones,
    selectedFuncion,
    selectedPlantilla,
    setSelectedPlantilla,
    carrito,
    foundSeats,
    setFoundSeats,
    searchResults,
    paymentResults,
    searchLoading,
    handleAddClient,
    handleUnifiedSearch,
    clearSearchResults,
    handleLocatorSearch,
    seatPayment,
    setSeatPayment,
    selectedAffiliate,
    setSelectedAffiliate,
    clientAbonos,
    setClientAbonos
  ]);


  const cartProps = useMemo(() => ({
    carrito,
    setCarrito,
    selectedClient,
    onPaymentClick: () => setIsPaymentModalVisible(true),
    onShowPaymentModal: () => setIsPaymentModalVisible(true),
    selectedAffiliate,
    setSelectedAffiliate,
    clientAbonos,
    setClientAbonos,
    onShowUserSearch: () => setIsSearchModalVisible(true),
    onShowSeatModal: () => setIsSeatModalVisible(true),
    seatPayment,
    setSeatPayment,
    blockMode,
    onApplyLockActions: async () => {
      const lockItems = (Array.isArray(carrito) ? carrito : []).filter(item => item.lockAction);
      if (!lockItems.length) {
        message.warning('Selecciona asientos para bloquear o desbloquear.');
        return;
      }

      if (!selectedFuncion?.id) {
        message.warning('Selecciona una función para aplicar los cambios.');
        return;
      }

      let blockedCount = 0;
      let unlockedCount = 0;

      for (const item of lockItems) {
        const seatId = item._id || item.sillaId || item.id;
        if (!seatId) continue;

        try {
          if (item.lockAction === 'block') {
            const locked = await lockSeat(seatId, 'locked', selectedFuncion.id);
            if (locked) blockedCount += 1;
          } else {
            const unlocked = await unlockSeat(seatId, selectedFuncion.id, {
              allowOverrideSession: true,
              allowForceUnlock: true
            });
            if (unlocked) unlockedCount += 1;
          }
        } catch (error) {
          logger.error('ÂÅ’ [Boleteria] Error aplicando bloqueo/desbloqueo:', error);
        }
      }

      setCarrito(prev => (Array.isArray(prev) ? prev.filter(item => !item.lockAction) : []));
      setBlockMode(false);
      setBlockAction(null);

      if (blockedCount || unlockedCount) {
        message.success(`Bloqueados: ${blockedCount}, Desbloqueados: ${unlockedCount}`);
      } else {
        message.warning('No se aplicaron cambios de bloqueo.');
      }
    }
  }), [
    carrito,
    setCarrito,
    selectedClient,
    selectedAffiliate,
    setSelectedAffiliate,
    clientAbonos,
    setClientAbonos,
    seatPayment,
    setSeatPayment,
    blockMode,
    lockSeat,
    unlockSeat,
    selectedFuncion?.id
  ]);

  const clientModalsProps = useMemo(() => ({
    isSearchModalVisible,
    onSearchCancel: () => setIsSearchModalVisible(false),
    searchResults,
    paymentResults,
    searchLoading,
    onAddClient: handleAddClient,
    handleUnifiedSearch,
    clearSearchResults,
    onClientSelect: (client) => {
      setSelectedClient(client);
      setIsSearchModalVisible(false);
    },
    selectedClient,
    setSelectedClient,
    showCreateUser: false,
    setShowCreateUser: () => { },
    newUserData: {},
    setNewUserData: () => { },
    userSearchValue: '',
    setUserSearchValue: () => { },
    userSearchResults: [],
    setUserSearchResults: () => { },
    userSearchLoading: false,
    setUserSearchLoading: () => { }
  }), [isSearchModalVisible, setIsSearchModalVisible, searchResults, paymentResults, searchLoading, handleAddClient, handleUnifiedSearch, clearSearchResults, handleLocatorSearch, selectedClient, setSelectedClient]);

  const functionModalProps = useMemo(() => ({
    isVisible: isFunctionsModalVisible,
    onClose: () => setIsFunctionsModalVisible(false),
    funciones,
    selectedFuncion,
    onFunctionSelect: handleFunctionSelect,
    selectedEvent
  }), [isFunctionsModalVisible, setIsFunctionsModalVisible, funciones, selectedFuncion, handleFunctionSelect, selectedEvent]);

  const paymentModalProps = useMemo(() => ({
    open: isPaymentModalVisible,
    onCancel: () => setIsPaymentModalVisible(false),
    carrito,
    setCarrito,
    selectedClient,
    setSelectedClient,
    selectedAffiliate,
    setSelectedAffiliate,
    clientAbonos,
    setClientAbonos,
    onShowUserSearch: () => setIsSearchModalVisible(true),
    onShowSeatModal: () => setIsSeatModalVisible(true),
    seatPayment,
    setSeatPayment,
    selectedFuncion,
    selectedEvent
  }), [isPaymentModalVisible, setIsPaymentModalVisible, carrito, setCarrito, selectedClient, setSelectedClient, selectedAffiliate, setSelectedAffiliate, clientAbonos, setClientAbonos, seatPayment, setSeatPayment, selectedFuncion, selectedEvent]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div
      className="flex flex-col md:flex-row bg-gray-50 overflow-hidden min-h-[calc(100vh-88px)]"
      style={{ margin: '0', padding: '0' }}
    >
      {/* Debug info */}
      {/* Debug logs removed for production performance */}

      {/* Sidebar izquierdo - Mobile: Drawer, Desktop: Sidebar */}
      <>
        {/* Mobile: BotÂón para abrir sidebar */}
        <div className="md:hidden fixed top-2 left-2 z-50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-white p-2 rounded shadow-lg"
          >
            <Menu className="text-xl" />
          </button>
        </div>

        {/* Mobile: Drawer para sidebar */}
        <Drawer
          title="MenÂú"
          placement="left"
          onClose={() => setSidebarOpen(false)}
          open={sidebarOpen}
          width={280}
          className="md:hidden"
        >
          <div className="p-2 border-b border-gray-200 mb-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2 text-sm font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 shadow-sm hover:bg-purple-100 transition"
            >
              <ChevronLeft className="text-base" />
              <span>Volver al panel</span>
            </button>
          </div>
          <LeftMenu {...leftMenuProps} />
        </Drawer>

        {/* Desktop: Sidebar fijo */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2 text-sm font-semibold text-purple-700 bg-white border border-purple-200 rounded-lg px-3 py-2 shadow-sm hover:bg-purple-50 transition"
            >
              <ChevronLeft className="text-base" />
              <span>Volver al panel</span>
            </button>
          </div>

          <div className="flex-1 overflow-auto p-1">
            <LeftMenu {...leftMenuProps} />
          </div>
        </div>
      </>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-w-0 mt-14 md:mt-0 relative">
        {/* Panel central - Mapa de asientos */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header ultra compacto con búsqueda de evento y función */}
          <div className="bg-white border-b border-gray-200 px-3 py-2 md:px-4 md:py-3 shadow-sm z-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 flex items-center gap-3">
                {/* Selector de Evento */}
                <div className="flex-1 max-w-md">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Evento</label>
                  <select
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const eventId = e.target.value;
                      if (eventId) {
                        handleEventSelect(eventId);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Seleccionar evento...</option>
                    {eventos.map(evento => (
                      <option key={evento.id} value={evento.id}>
                        {evento.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón para seleccionar función */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">&nbsp;</label>
                  <button
                    onClick={() => setIsFunctionsModalVisible(true)}
                    disabled={!selectedEvent}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedEvent
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {selectedFuncion ? `Función: ${new Date(selectedFuncion.fecha_celebracion).toLocaleDateString()}` : 'Seleccionar Función'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* NavegaciÂón ultra compacta con botones estilo tabs */}
          <div className="bg-white border-b border-gray-200 sticky top-14 md:static z-10 shadow-sm md:shadow-none">
            <div className="flex items-center justify-between px-2 py-1">
              {/* BotÂón para abrir panel lateral */}
              <div className="flex items-center">
                <button
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Abrir panel"
                >
                  <span className="w-3 h-3 bg-gray-400 rounded"></span>
                </button>
              </div>

              {/* Botones de navegación principales */}
              <div className="flex space-x-1">
                <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                  <AppstoreOutlined /> Zonas
                </button>
                <button className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded">
                  <EnvironmentOutlined /> Mapa
                </button>
                <button
                  onClick={() => setIsEventInfoModalVisible(true)}
                  disabled={!selectedFuncion}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${selectedFuncion
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-gray-400 cursor-not-allowed'
                    }`}
                >
                  📊 Info Evento
                </button>
                <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                  <ShoppingOutlined /> Productos
                </button>
                <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                  <EllipsisOutlined /> Otros
                </button>
              </div>

            </div>
          </div>

          {/* SecciÂón ultra compacta de precios dinÂámicos con selecciÂón de entrada */}
          <div className="bg-gray-50 border-b border-gray-200 px-1 py-0.5">
            <div className="flex items-center gap-3 px-1 py-1">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={searchAllSeats}
                  onChange={(e) => setSearchAllSeats(e.target.checked)}
                />
                Buscar
              </label>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <span className="text-[11px] text-gray-600 font-semibold">Modo:</span>
                <button
                  type="button"
                  onClick={() => handleBlockActionToggle('block')}
                  className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-bold transition-all duration-200 ${blockMode && blockAction === 'block'
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-md shadow-red-200'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300'
                    }`}
                >
                  🔒 Bloquear
                </button>
                <button
                  type="button"
                  onClick={() => handleBlockActionToggle('unlock')}
                  className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-bold transition-all duration-200 ${blockMode && blockAction === 'unlock'
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-md shadow-green-200'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300'
                    }`}
                >
                  🔓 Desbloquear
                </button>
              </div>
              {searchAllSeatsLoading && (
                <span className="text-[11px] text-blue-600">Buscando asientos vendidos/reservados...</span>
              )}

              {/* Visual Legend for Block/Unblock Modes */}
              {blockMode && (
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="text-[10px] font-semibold text-gray-700 mb-1">
                    {blockAction === 'block' ? '🔒 Modo Bloquear:' : '🔓 Modo Desbloquear:'}
                  </div>
                  {blockAction === 'block' ? (
                    <div className="text-[10px] text-gray-600 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-red-500"></div>
                        <span>Asientos disponibles (con borde rojo)</span>
                      </div>
                      <div className="text-gray-500 italic">
                        → Selecciona asientos para bloquearlos permanentemente
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-600 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-green-500"></div>
                        <span>Asientos bloqueados (con borde verde)</span>
                      </div>
                      <div className="text-gray-500 italic">
                        → Solo puedes seleccionar asientos bloqueados (no vendidos)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-2 overflow-x-auto">
              {priceOptions && priceOptions.length > 0 ? (
                priceOptions.map((option, index) => {
                  const isActive = selectedEntradaId === option.entradaId;
                  const minPrecio = Number.isFinite(option.minPrecio) ? option.minPrecio : 0;
                  const maxPrecio = Number.isFinite(option.maxPrecio) ? option.maxPrecio : minPrecio;
                  const precioDisplay = minPrecio === maxPrecio
                    ? `$${minPrecio.toFixed(2)}`
                    : `$${minPrecio.toFixed(2)}-$${maxPrecio.toFixed(2)}`;

                  // Determinar color segÂún tipo de producto
                  let bgColor = 'bg-gray-200 text-gray-700';
                  if (isActive) {
                    bgColor = 'bg-purple-600 text-white';
                  } else if (option.tipo === 'Invitaciones' || option.minPrecio === 0) {
                    bgColor = 'bg-orange-200 text-orange-800';
                  } else if (option.tipo === 'Reducido') {
                    bgColor = 'bg-blue-200 text-blue-800';
                  }

                  return (
                    <button
                      key={option.entradaId}
                      onClick={() => {
                        logger.log('Ã°Å¸Å½Â« Entrada seleccionada:', option);
                        setSelectedEntradaId(option.entradaId);
                      }}
                      className={`flex-shrink-0 px-2 py-1 rounded font-medium text-xs ${isActive
                        ? 'bg-purple-600 text-white'
                        : bgColor + ' hover:opacity-80'
                        } transition-colors`}
                      title={`${option.nombre} - ${option.tipo}`}
                    >
                      <div className="text-xs font-medium">
                        {option.nombre.toUpperCase()}
                      </div>
                      <div className="text-xs opacity-90">
                        {precioDisplay}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-gray-500 py-1">
                  {selectedFuncion ? 'Cargando precios...' : 'Selecciona una función para ver precios'}
                </div>
              )}
            </div>
          </div>

          {/* Mapa de asientos ultra compacto */}
          <div className="flex-1 bg-white overflow-hidden relative">
            {/* Debug log removed for production performance */}
            {selectedFuncion && mapa ? (
              <div className="h-full w-full overflow-hidden relative">
                <div className="absolute inset-0">
                  <LazySeatingMap
                    funcionId={selectedFuncion?.id || selectedFuncion?._id}
                    mapa={mapa}
                    zonas={mapa?.zonas || []}
                    selectedFuncion={selectedFuncion}
                    selectedEvent={selectedEvent}
                    onSeatToggle={handleSeatToggle}
                    foundSeats={foundSeats}
                    selectedSeats={selectedSeatIds}
                    lockedSeats={[...permanentLocks, ...rtLockedSeats]}
                    seatStates={seatStates}
                    rtLockedSeats={rtLockedSeats}
                    allowSearchSeatSelection={searchAllSeats}
                    allowBlockedSeatSelection={blockAction === 'unlock'}
                    disableSeatClickThrottle={blockMode}
                    blockMode={blockMode}
                    blockAction={blockAction}
                    modoVenta={true}
                    showPrices={true}
                    showZones={true}
                    showLegend={true}
                    allowSeatSelection={true}
                    debug={true}
                    isSeatLocked={isSeatLocked}
                    isSeatLockedByMe={isSeatLockedByMe}
                  />
                </div>

                {carrito?.length > 0 && (
                  <div className="md:hidden absolute bottom-4 left-2 right-2 z-20 rounded-lg bg-purple-600 text-white text-sm font-semibold px-3 py-2 shadow-lg flex items-center justify-between pointer-events-none">
                    <span className="pointer-events-auto">{carrito.length === 1 ? 'Asiento seleccionado' : `${carrito.length} asientos seleccionados`}</span>
                    <button
                      onClick={() => setCartOpen(true)}
                      className="text-xs opacity-90 hover:opacity-100 underline pointer-events-auto"
                    >
                      Ver carrito Å¾Å“
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                Selecciona una función para ver el mapa de asientos
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho - Carrito de compras */}
        {/* Mobile: BotÂón flotante + Drawer */}
        <>
          {/* Mobile: BotÂón flotante para carrito */}
          {carrito && carrito.length > 0 && (
            <div className="md:hidden fixed bottom-4 right-4 z-50">
              <Button
                type="primary"
                shape="circle"
                size="large"
                onClick={() => setCartOpen(true)}
                className="shadow-lg"
              >
                🛒 {carrito.length}
              </Button>
            </div>
          )}

          {/* Mobile: Drawer para carrito */}
          <Drawer
            title="Carrito"
            placement="right"
            onClose={() => setCartOpen(false)}
            open={cartOpen}
            width={320}
            className="md:hidden"
          >
            <Cart {...cartProps}>
              {allTicketsPaid && <DownloadTicketButton locator={carrito[0].locator} />}
            </Cart>
          </Drawer>

          {/* Desktop: Sidebar fijo para carrito */}
          <div className="hidden md:flex w-64 bg-white border-l border-gray-200 flex flex-col">
            <div className="flex-1 min-h-0">
              <Cart {...cartProps}>
                {allTicketsPaid && <DownloadTicketButton locator={carrito[0].locator} />}
              </Cart>
            </div>
          </div>
        </>
      </div>

      <ClientModals {...clientModalsProps} />
      <FunctionModal {...functionModalProps} />
      <PaymentModal {...paymentModalProps} />
      <Modal
        open={isSeatModalVisible}
        onCancel={() => setIsSeatModalVisible(false)}
        footer={null}
        width={800}
        title="InformaciÂón del Asiento"
      >
        {seatPayment && (
          <div>
            <p><strong>Asiento:</strong> {seatPayment.sillaId}</p>
            <p><strong>Estado:</strong> {seatPayment.estado}</p>
            <p><strong>Precio:</strong> ${seatPayment.precio}</p>
            <p><strong>Cliente:</strong> {seatPayment.cliente}</p>
            <p><strong>Fecha de Pago:</strong> {new Date(seatPayment.fecha_pago).toLocaleString()}</p>
          </div>
        )}
      </Modal>

      {/* Modal de selección de funciones */}
      <FunctionModal
        visible={isFunctionsModalVisible}
        onClose={() => setIsFunctionsModalVisible(false)}
        funciones={funciones}
        selectedFuncion={selectedFuncion}
        onSelectFuncion={handleFunctionSelect}
      />

      {/* Modal de información del evento */}
      <EventInfoModal
        visible={isEventInfoModalVisible}
        onClose={() => setIsEventInfoModalVisible(false)}
        selectedFuncion={selectedFuncion}
      />
    </div>
  );
};

export default Boleteria;


