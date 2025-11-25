import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { Modal, Drawer, Button as AntButton, message } from 'antd';
import { AiOutlineLeft, AiOutlineMenu } from 'react-icons/ai';

import LeftMenu from './CompBoleteria/LeftMenu';
import Cart from './CompBoleteria/Cart';
import LazySeatingMap from '../../components/LazySeatingMap';
import PaymentModal from './CompBoleteria/PaymentModal';
import ClientModals from './CompBoleteria/ClientModals';
import FunctionModal from './CompBoleteria/FunctionModal';
import DownloadTicketButton from './CompBoleteria/DownloadTicketButton';

import { useBoleteria } from '../hooks/useBoleteria';
import { useClientManagement } from '../hooks/useClientManagement';
import { supabase } from '../../supabaseClient';
import { useSeatLockStore } from '../../components/seatLockStore';
import logger from '../../utils/logger';

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
    logger.log('🎫 [Boleteria] Estado actual:', debugState);
  }, [debugState]);

  const [foundSeats, setFoundSeats] = useState([]);
  const [searchAllSeats, setSearchAllSeats] = useState(false);
  const [searchAllSeatsLoading, setSearchAllSeatsLoading] = useState(false);
  const [savedCartBeforeSearch, setSavedCartBeforeSearch] = useState(null);
  const [searchDataLoaded, setSearchDataLoaded] = useState(false);

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

  const seatLockStore = useSeatLockStore();

  const lockSeat = seatLockStore.lockSeat;
  const unlockSeat = seatLockStore.unlockSeat;
  const isSeatLocked = seatLockStore.isSeatLocked;
  const isSeatLockedByMe = seatLockStore.isSeatLockedByMe;
  const subscribeToFunction = seatLockStore.subscribeToFunction;
  const unsubscribe = seatLockStore.unsubscribe;

  // Suscribirse a eventos en tiempo real para la función seleccionada (optimizado)
  const subscriptionFuncionId = useRef(null);
  useEffect(() => {
    const currentFuncionId = selectedFuncion?.id;
    
    // Solo suscribirse si cambió la función
    if (currentFuncionId && currentFuncionId !== subscriptionFuncionId.current && subscribeToFunction) {
      // Desuscribirse de la función anterior si existe
      if (subscriptionFuncionId.current && unsubscribe) {
        logger.log('🔔 [Boleteria] Desuscribiéndose de función anterior:', subscriptionFuncionId.current);
        unsubscribe();
      }
      
      logger.log('🔔 [Boleteria] Suscribiéndose a función:', currentFuncionId);
      subscribeToFunction(currentFuncionId);
      subscriptionFuncionId.current = currentFuncionId;
    }

    return () => {
      if (unsubscribe && subscriptionFuncionId.current) {
        logger.log('🔔 [Boleteria] Desuscribiéndose de función:', subscriptionFuncionId.current);
        unsubscribe();
        subscriptionFuncionId.current = null;
      }
    };
  }, [selectedFuncion?.id, subscribeToFunction, unsubscribe]);

  const [isFunctionsModalVisible, setIsFunctionsModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [clientAbonos, setClientAbonos] = useState([]);
  const [seatPayment, setSeatPayment] = useState(null);
  const [isSeatModalVisible, setIsSeatModalVisible] = useState(false);
  const [permanentLocks, setPermanentLocks] = useState([]);
  
  // Estados para gestión de precios y entradas
  const [entradas, setEntradas] = useState([]);
  const [selectedEntradaId, setSelectedEntradaId] = useState(null);
  const [priceOptions, setPriceOptions] = useState([]);
  const [blockMode, setBlockMode] = useState(false);

  // Eliminar useEffect duplicado - ya está manejado arriba

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
        logger.log('🎫 [Boleteria] Cargando entradas y precios...');
        
        // Cargar entradas del recinto
        const recintoId = selectedEvent.recinto || selectedEvent.recinto_id;
        if (!recintoId) {
          logger.warn('No se encontró recinto_id');
          return;
        }

        const { data: entradasData, error: entradasError } = await supabase
          .from('entradas')
          .select('*')
          .eq('recinto', recintoId);

        if (entradasError) {
          logger.error('Error cargando entradas:', entradasError);
          return;
        }

        logger.log('✅ Entradas cargadas:', entradasData);
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

          // Combinar con información de entradas
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

          logger.log('✅ Opciones de precio procesadas:', priceOptionsArray);
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
  }, [selectedFuncion?.id, selectedEvent?.id]); // Solo dependencias críticas

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
            tipoPrecio: seat.tipoPrecio || seat.tipo || 'histórico',
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
      logger.error('❌ [Boleteria] Error buscando asientos vendidos/reservados:', error);
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
        logger.error('❌ [Boleteria] Error cargando asientos vendidos/reservados:', error);
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

  const handleBlockModeToggle = useCallback((checked) => {
    const safeCart = Array.isArray(carrito) ? carrito : [];

    if (checked) {
      const hasSaleItems = safeCart.some(item => !item.lockAction);

      if (hasSaleItems) {
        message.warning('Vacía el carrito de venta antes de usar el modo bloqueo/desbloqueo.');
        return;
      }

      setBlockMode(true);
      message.info('Modo bloqueo/desbloqueo activado. Selecciona asientos para bloquear o desbloquear.');
    } else {
      setBlockMode(false);
      setCarrito(prev => (Array.isArray(prev) ? prev.filter(item => !item.lockAction) : []));
      message.info('Modo bloqueo/desbloqueo desactivado.');
    }
  }, [carrito, setCarrito]);

  const toggleSeat = useCallback(
    (seatData) => {
      setCarrito(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const seatId = seatData?._id || seatData?.sillaId || seatData?.id;

        if (!seatId) {
          logger.warn('⚠️ [Boleteria] toggleSeat llamado sin identificador válido:', seatData);
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

      if (blockMode) {
        const funcionId = selectedFuncion?.id || selectedFuncion?._id || null;

        if (!funcionId) {
          message.warning('Selecciona una función antes de bloquear/desbloquear.');
          return;
        }

        if (seatEstado !== 'disponible' && seatEstado !== 'bloqueado' && seatEstado !== 'locked') {
          message.warning('Solo se pueden bloquear asientos disponibles o desbloquear los que ya estén bloqueados.');
          return;
        }

        const isCurrentlyBlocked = seatEstado === 'bloqueado' || seatEstado === 'locked';
        const lockAction = isCurrentlyBlocked ? 'unlock' : 'block';

        setCarrito(prev => {
          const safePrev = Array.isArray(prev) ? prev.filter(item => item.lockAction) : [];
          const withoutSeat = safePrev.filter(item => (item._id || item.sillaId || item.id) !== sillaId);

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

        message.success(isCurrentlyBlocked ? 'Asiento marcado para desbloquear' : 'Asiento marcado para bloquear');
        return;
      }

      // Verificar que se haya seleccionado un tipo de entrada
      if (!selectedEntradaId) {
        logger.warn('⚠️ [Boleteria] No se ha seleccionado un tipo de entrada');
        // Aquí podrías mostrar un mensaje al usuario
        return;
      }

      // En modo boletería simplificado, no verificamos bloqueos aquí
      // Los bloqueos se manejan por separado con botones específicos

      if (seatEstado === 'bloqueado' || seatEstado === 'locked') {
        message.warning('Este asiento está bloqueado. Activa el modo bloqueo/desbloqueo para liberarlo.');
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
          logger.warn('⚠️ [Boleteria] No se pudo parsear la plantilla de precios:', error);
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

      // Obtener información del tipo de entrada seleccionado
      const entradaSeleccionada = priceOptions?.find(option => option.entradaId === selectedEntradaId);
      const tipoPrecio = entradaSeleccionada?.nombre || detalleFinal?.tipoEntrada || detalleFinal?.tipo || 'general';
      const descuentoNombre = detalleFinal?.descuentoNombre || detalleFinal?.descuento || '';
      const seatName = silla.nombre || silla.numero || silla.label || silla._id || `Asiento ${sillaId}`;
      const nombreMesa = silla.nombreMesa || silla.mesa_nombre || silla.mesaNombre || silla.tableName || '';
      const funcionId = selectedFuncion?.id || selectedFuncion?._id || null;
      const funcionFecha = selectedFuncion?.fechaCelebracion || selectedFuncion?.fecha_celebracion || null;

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
        nombreMesa,
        precioInfo: detalleFinal || null,
        entradaId: selectedEntradaId,
        entradaNombre: entradaSeleccionada?.nombre || 'General',
        timestamp: Date.now(),
        modoVenta: 'boleteria'
      };

      // Verificar si el asiento ya está en el carrito
      const exists = carrito.some(item => item.sillaId === sillaId);
      
      if (exists) {
        // Deseleccionar: quitar del carrito y desbloquear en BD
        await toggleSeat(cartItem);
        await unlockSeat(sillaId, funcionId);
        logger.log('🔄 [Boleteria] Asiento deseleccionado y desbloqueado:', sillaId);
      } else {
        // Seleccionar: bloquear en BD primero, luego agregar al carrito
        const lockResult = await lockSeat(sillaId, 'seleccionado', funcionId);
        if (lockResult) {
          await toggleSeat(cartItem);
          logger.log('✅ [Boleteria] Asiento seleccionado y bloqueado:', sillaId);
        } else {
          logger.log('❌ [Boleteria] No se pudo bloquear el asiento:', sillaId);
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
            const unlocked = await unlockSeat(seatId, selectedFuncion.id);
            if (unlocked) unlockedCount += 1;
          }
        } catch (error) {
          logger.error('❌ [Boleteria] Error aplicando bloqueo/desbloqueo:', error);
        }
      }

      setCarrito(prev => (Array.isArray(prev) ? prev.filter(item => !item.lockAction) : []));
      setBlockMode(false);

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
    setShowCreateUser: () => {},
    newUserData: {},
    setNewUserData: () => {},
    userSearchValue: '',
    setUserSearchValue: () => {},
    userSearchResults: [],
    setUserSearchResults: () => {},
    userSearchLoading: false,
    setUserSearchLoading: () => {}
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
        {/* Mobile: Botón para abrir sidebar */}
        <div className="md:hidden fixed top-2 left-2 z-50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-white p-2 rounded shadow-lg"
          >
            <AiOutlineMenu className="text-xl" />
          </button>
        </div>

        {/* Mobile: Drawer para sidebar */}
        <Drawer
          title="Menú"
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
              <AiOutlineLeft className="text-base" />
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
              <AiOutlineLeft className="text-base" />
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
          <div className="bg-white border-b border-gray-200 px-3 py-2 md:px-1 md:py-0.5 shadow-sm md:shadow-none z-10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Evento:</span>
                  <select 
                    className="text-xs border border-gray-300 rounded px-1 py-0.5 min-w-0 flex-1"
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const eventId = e.target.value;
                      if (eventId && handleEventSelect) {
                        handleEventSelect(eventId);
                      }
                    }}
                  >
                    <option value="">Selecciona evento</option>
                    {eventos?.map(evento => (
                      <option key={evento.id} value={evento.id}>
                        {evento.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Función:</span>
                  <select 
                    className="text-xs border border-gray-300 rounded px-1 py-0.5 min-w-0 flex-1"
                    value={selectedFuncion?.id || ''}
                    onChange={(e) => {
                      const functionId = e.target.value;
                      if (functionId && handleFunctionSelect) {
                        handleFunctionSelect(functionId);
                      }
                    }}
                    disabled={!selectedEvent}
                  >
                    <option value="">Selecciona función</option>
                    {funciones?.filter(func => func.evento_id === selectedEvent?.id).map(funcion => (
                      <option key={funcion.id} value={funcion.id}>
                        {new Date(funcion.fecha_celebracion).toLocaleDateString()} {new Date(funcion.fecha_celebracion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0">
                🟢🟡🔴🟣⚫
              </div>
            </div>
          </div>

          {/* Navegación ultra compacta con botones estilo tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-14 md:static z-10 shadow-sm md:shadow-none">
            <div className="flex items-center justify-between px-2 py-1">
              {/* Botón para abrir panel lateral */}
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
                  🏷️ Zonas
                </button>
                <button className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded">
                  🗺️ Mapa
                </button>
                <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                  🍔 Productos
                </button>
                <button className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                  ⚙️ Otros
                </button>
        </div>

              {/* Botones secundarios */}
              <div className="flex items-center space-x-1">
                <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Cliente">
                  <i className="text-sm">👤</i>
                </button>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Fidelización">
                  <i className="text-sm">💳</i>
                </button>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="Información">
                  <i className="text-sm">ℹ️</i>
                </button>
              </div>
            </div>
          </div>

          {/* Sección ultra compacta de precios dinámicos con selección de entrada */}
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
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={blockMode}
                          onChange={(e) => handleBlockModeToggle(e.target.checked)}
                        />
                        Bloqueo/Desbloqueo
                      </label>
                      {searchAllSeatsLoading && (
                        <span className="text-[11px] text-blue-600">Buscando asientos vendidos/reservados...</span>
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
                  
                  // Determinar color según tipo de producto
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
                        logger.log('🎫 Entrada seleccionada:', option);
                        setSelectedEntradaId(option.entradaId);
                      }}
                      className={`flex-shrink-0 px-2 py-1 rounded font-medium text-xs ${
                        isActive 
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
              <div className="h-full p-2 overflow-auto">
                <LazySeatingMap
                  funcionId={selectedFuncion?.id || selectedFuncion?._id}
                  mapa={mapa}
                  zonas={mapa?.zonas || []}
                  selectedFuncion={selectedFuncion}
                  selectedEvent={selectedEvent}
                  onSeatToggle={handleSeatToggle}
                  foundSeats={foundSeats}
                  selectedSeats={selectedSeatIds}
                  lockedSeats={permanentLocks}
                  allowSearchSeatSelection={searchAllSeats}
                  modoVenta={true}
                  showPrices={true}
                  showZones={true}
                  showLegend={false}
                  allowSeatSelection={true}
                  debug={true}
                  isSeatLocked={isSeatLocked}
                  isSeatLockedByMe={isSeatLockedByMe}
                />

                {carrito?.length > 0 && (
                  <div className="md:hidden sticky bottom-4 left-0 right-0 mx-2 mt-3 rounded-lg bg-purple-600 text-white text-sm font-semibold px-3 py-2 shadow-lg flex items-center justify-between">
                    <span>{carrito.length === 1 ? 'Asiento seleccionado' : `${carrito.length} asientos seleccionados`}</span>
                    <span className="text-xs opacity-90">Continúa la compra en el carrito ➜</span>
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
        {/* Mobile: Botón flotante + Drawer */}
        <>
          {/* Mobile: Botón flotante para carrito */}
          {carrito && carrito.length > 0 && (
            <div className="md:hidden fixed bottom-4 right-4 z-50">
              <AntButton
                type="primary"
                shape="circle"
                size="large"
                onClick={() => setCartOpen(true)}
                className="shadow-lg"
              >
                🛒 {carrito.length}
              </AntButton>
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
        title="Información del Asiento"
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
    </div>
  );
};

export default Boleteria;
