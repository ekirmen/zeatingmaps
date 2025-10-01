import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from 'antd';
import { AiOutlineLeft } from 'react-icons/ai';

import LeftMenu from './CompBoleteria/LeftMenu';
import Cart from './CompBoleteria/Cart';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import PaymentModal from './CompBoleteria/PaymentModal';
import ClientModals from './CompBoleteria/ClientModals';
import FunctionModal from './CompBoleteria/FunctionModal';
import DownloadTicketButton from './CompBoleteria/DownloadTicketButton';

import { useBoleteria } from '../hooks/useBoleteria';
import { useClientManagement } from '../hooks/useClientManagement';
import { supabase } from '../../supabaseClient';
import { useSeatLockStore } from '../../components/seatLockStore';

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

  const [foundSeats, setFoundSeats] = useState([]);

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

  // Suscribirse a eventos en tiempo real para la función seleccionada
  useEffect(() => {
    if (selectedFuncion?.id && subscribeToFunction) {
      console.log('🔔 [Boleteria] Suscribiéndose a función:', selectedFuncion.id);
      subscribeToFunction(selectedFuncion.id);
    }

    return () => {
      if (unsubscribe) {
        console.log('🔔 [Boleteria] Desuscribiéndose de función:', selectedFuncion?.id);
        unsubscribe();
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

  useEffect(() => {
    if (!selectedFuncion) return;
    const id = selectedFuncion.id || selectedFuncion._id;
    if (id) {
      subscribeToFunction(id);
    }
    return () => {
      unsubscribe();
    };
  }, [selectedFuncion, subscribeToFunction, unsubscribe]);

  // useEffect para cargar entradas y opciones de precio
  useEffect(() => {
    const loadEntradasAndPrices = async () => {
      if (!selectedFuncion || !selectedEvent) return;

      try {
        console.log('🎫 [Boleteria] Cargando entradas y precios...');
        
        // Cargar entradas del recinto
        const recintoId = selectedEvent.recinto || selectedEvent.recinto_id;
        if (!recintoId) {
          console.warn('No se encontró recinto_id');
          return;
        }

        const { data: entradasData, error: entradasError } = await supabase
          .from('entradas')
          .select('*')
          .eq('recinto', recintoId);

        if (entradasError) {
          console.error('Error cargando entradas:', entradasError);
          return;
        }

        console.log('✅ Entradas cargadas:', entradasData);
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
            return {
              ...group,
              nombre: entrada?.nombre_entrada || 'Sin nombre',
              tipo: entrada?.tipo_producto || 'General',
              entrada: entrada
            };
          });

          console.log('✅ Opciones de precio procesadas:', priceOptionsArray);
          setPriceOptions(priceOptionsArray);

          // Seleccionar la primera entrada por defecto
          if (priceOptionsArray.length > 0 && !selectedEntradaId) {
            setSelectedEntradaId(priceOptionsArray[0].entradaId);
          }
        }
      } catch (error) {
        console.error('Error en loadEntradasAndPrices:', error);
      }
    };

    loadEntradasAndPrices();
  }, [selectedFuncion, selectedEvent, selectedEntradaId]);

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
          if (status === 'pagado' || status === 'vendido') return 'vendido';
          if (status === 'reservado') return 'reservado';
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
            session_id: payment.usuario_id || payment.user_id || null,
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
          .select('id, seats, status, locator, user_id, usuario_id')
          .eq('funcion_id', funcionId)
          .in('status', ['pagado', 'reservado', 'anulado', 'vendido', 'bloqueado']);

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        const locks = buildLocksFromPayments(data || []);
        setPermanentLocks(locks);
      } catch (error) {
        console.error('❌ [Boleteria] Error cargando asientos vendidos/reservados:', error);
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

  const toggleSeat = useCallback(
    (seatData) => {
      setCarrito(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const seatId = seatData?._id || seatData?.sillaId || seatData?.id;

        if (!seatId) {
          console.warn('⚠️ [Boleteria] toggleSeat llamado sin identificador válido:', seatData);
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

      // Verificar que se haya seleccionado un tipo de entrada
      if (!selectedEntradaId) {
        console.warn('⚠️ [Boleteria] No se ha seleccionado un tipo de entrada');
        // Aquí podrías mostrar un mensaje al usuario
        return;
      }

      // En modo boletería simplificado, no verificamos bloqueos aquí
      // Los bloqueos se manejan por separado con botones específicos

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
          console.warn('⚠️ [Boleteria] No se pudo parsear la plantilla de precios:', error);
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
        console.log('🔄 [Boleteria] Asiento deseleccionado y desbloqueado:', sillaId);
      } else {
        // Seleccionar: bloquear en BD primero, luego agregar al carrito
        const lockResult = await lockSeat(sillaId, 'seleccionado', funcionId);
        if (lockResult) {
          await toggleSeat(cartItem);
          console.log('✅ [Boleteria] Asiento seleccionado y bloqueado:', sillaId);
        } else {
          console.log('❌ [Boleteria] No se pudo bloquear el asiento:', sillaId);
        }
      }
    },
    [selectedFuncion, mapa, selectedPlantilla, selectedEntradaId, priceOptions, toggleSeat, carrito, lockSeat, unlockSeat]
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
    setSeatPayment
  }), [carrito, setCarrito, selectedClient, selectedAffiliate, setSelectedAffiliate, clientAbonos, setClientAbonos, seatPayment, setSeatPayment]);

  const clientModalsProps = useMemo(() => ({
    isSearchModalVisible,
    setIsSearchModalVisible,
    searchResults,
    paymentResults,
    searchLoading,
    handleAddClient,
    handleUnifiedSearch,
    clearSearchResults,
    handleLocatorSearch,
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
    isVisible: isPaymentModalVisible,
    onClose: () => setIsPaymentModalVisible(false),
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
    setSeatPayment
  }), [isPaymentModalVisible, setIsPaymentModalVisible, carrito, setCarrito, selectedClient, setSelectedClient, selectedAffiliate, setSelectedAffiliate, clientAbonos, setClientAbonos, seatPayment, setSeatPayment]);

  return (
    <div className="flex bg-gray-50 overflow-hidden" style={{ margin: '0', padding: '0', height: 'calc(100vh - 88px)', position: 'absolute', top: '88px', left: '0', right: '0', bottom: '0' }}>
      {/* Debug info */}
      {console.log('🎫 [Boleteria] Renderizando componente...')}
      {console.log('🎫 [Boleteria] Selected function:', selectedFuncion)}
      {console.log('🎫 [Boleteria] Mapa:', mapa)}

      {/* Sidebar izquierdo ultra compacto */}
      <div className="flex flex-col w-full max-w-xs md:max-w-sm lg:w-64 min-w-[12rem] bg-white border-r border-gray-200">
        <div className="p-1 border-b border-gray-200">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-1 text-gray-700 hover:text-gray-900 text-xs"
          >
            <AiOutlineLeft className="text-xs" />
            <span>Volver</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-1">
          <LeftMenu {...leftMenuProps} />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Panel central - Mapa de asientos */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header ultra compacto con búsqueda de evento y función */}
          <div className="bg-white border-b border-gray-200 px-1 py-0.5">
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
        <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-1 py-0.5">
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
            <div className="flex space-x-2 overflow-x-auto">
              {priceOptions && priceOptions.length > 0 ? (
                priceOptions.map((option, index) => {
                  const isActive = selectedEntradaId === option.entradaId;
                  const precioDisplay = option.minPrecio === option.maxPrecio
                    ? `$${option.minPrecio.toFixed(2)}`
                    : `$${option.minPrecio.toFixed(2)}-$${option.maxPrecio.toFixed(2)}`;
                  
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
                        console.log('🎫 Entrada seleccionada:', option);
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
          <div className="flex-1 bg-white overflow-hidden">
            {console.log('🎫 [Boleteria] Renderizando vista mapa interactivo')}
                {selectedFuncion && mapa ? (
              <div className="h-full p-1 overflow-auto">
                      <SeatingMapUnified
                        funcionId={selectedFuncion?.id || selectedFuncion?._id}
                        mapa={mapa}
                        zonas={mapa?.zonas || []}
                        selectedFuncion={selectedFuncion}
                        selectedEvent={selectedEvent}
                        onSeatToggle={handleSeatToggle}
                        foundSeats={foundSeats}
                        selectedSeats={selectedSeatIds}
                        lockedSeats={permanentLocks}
                        modoVenta={true}
                        showPrices={true}
                        showZones={true}
                  showLegend={false}
                        allowSeatSelection={true}
                        debug={true}
                        isSeatLocked={isSeatLocked}
                        isSeatLockedByMe={isSeatLockedByMe}
                      />
                  </div>
                ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    Selecciona una función para ver el mapa de asientos
                  </div>
                )}
          </div>
              </div>

        {/* Panel derecho - Carrito de compras ultra compacto */}
        <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
                <div className="flex-1 min-h-0">
                  <Cart {...cartProps}>
                    {allTicketsPaid && <DownloadTicketButton locator={carrito[0].locator} />}
                  </Cart>
                </div>
        </div>
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
