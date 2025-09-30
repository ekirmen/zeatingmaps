import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { message, Modal, Button, Tabs } from 'antd';
import { AiOutlineLeft } from 'react-icons/ai';

import LeftMenu from './CompBoleteria/LeftMenu';
import Cart from './CompBoleteria/Cart';
import ZonesAndPrices from './CompBoleteria/ZonesAndPricesSimple';
import CompactBoleteria from './CompBoleteria/CompactBoleteria';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import PaymentModal from './CompBoleteria/PaymentModal';
import ClientModals from './CompBoleteria/ClientModals';
import FunctionModal from './CompBoleteria/FunctionModal';
import DownloadTicketButton from './CompBoleteria/DownloadTicketButton';

import { useBoleteria } from '../hooks/useBoleteria';
import { useClientManagement } from '../hooks/useClientManagement';
import { supabase } from '../../supabaseClient';
import { useSeatLockStore } from '../../components/seatLockStore';
import { fetchPaymentBySeat } from '../services/apibackoffice';
import downloadTicket from '../../utils/downloadTicket';

const { TabPane } = Tabs;

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
  const [activeTab, setActiveTab] = useState('compact'); // Cambiar a 'compact' por defecto

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
  const zonesRef = useRef(null);

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
      const detalleZona = Array.isArray(detalle)
        ? detalle.find(d => (d.zonaId || d.zona?.id || d.zona) === zonaId)
        : null;
      const precio = Number(detalleZona?.precio) || 0;

      const tipoPrecio = detalleZona?.tipoEntrada || detalleZona?.tipo || 'general';
      const descuentoNombre = detalleZona?.descuentoNombre || detalleZona?.descuento || '';
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
        precioInfo: detalleZona || null,
        timestamp: Date.now(),
        modoVenta: 'boleteria'
      };

      // En modo boletería simplificado, solo agregar/quitar del carrito
      // El bloqueo se maneja por separado con botones específicos
      await toggleSeat(cartItem);
    },
    [selectedFuncion, mapa, selectedPlantilla, toggleSeat]
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
    onShowFunctions: () => setIsFunctionsModalVisible(true),
    setSelectedEvent
  }), [selectedClient, setCarrito, setSelectedClient, handleFunctionSelect, setSelectedEvent]);

  const zonesAndPricesProps = useMemo(() => ({
    eventos,
    selectedEvent,
    onEventSelect: handleEventSelect,
    setSelectedEvent,
    funciones,
    onShowFunctions: () => setIsFunctionsModalVisible(true),
    selectedFuncion,
    onFunctionSelect: handleFunctionSelect,
    setSelectedFuncion: handleFunctionSelect,
    carrito,
    setCarrito,
    selectedPlantilla,
    setSelectedPlantilla,
    selectedClient,
    setSelectedClient,
    abonos: clientAbonos,
    selectedAffiliate,
    setSelectedAffiliate,
    showSeatingMap: activeTab === 'map',
    plantillas: [], // Plantillas adicionales (placeholder por ahora)
    zonas,
    mapa
  }), [
    eventos,
    selectedEvent,
    handleEventSelect,
    setSelectedEvent,
    funciones,
    selectedFuncion,
    handleFunctionSelect,
    carrito,
    setCarrito,
    selectedPlantilla,
    setSelectedPlantilla,
    selectedClient,
    setSelectedClient,
    clientAbonos,
    selectedAffiliate,
    setSelectedAffiliate,
    activeTab,
    zonas,
    mapa
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Debug info */}
      {console.log('🎫 [Boleteria] Renderizando componente...')}
      {console.log('🎫 [Boleteria] Active tab:', activeTab)}
      {console.log('🎫 [Boleteria] Selected function:', selectedFuncion)}
      {console.log('🎫 [Boleteria] Mapa:', mapa)}

      {/* Sidebar izquierdo */}
      <div className="flex flex-col w-full max-w-xs md:max-w-sm lg:w-80 min-w-[16rem] bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <AiOutlineLeft className="text-lg" />
            <span>Volver</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <LeftMenu {...leftMenuProps} />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Tabs para cambiar entre vistas */}
        <div className="bg-white border-b border-gray-200">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="px-4 overflow-x-auto"
          >
            <TabPane tab="🎫 Vista Compacta" key="compact" />
            <TabPane tab="🗺️ Mapa Interactivo" key="map" />
          </Tabs>
        </div>

        {/* Área de trabajo principal */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'compact' ? (
            // Vista compacta - todo en una pantalla
            <div className="h-full overflow-auto min-w-0">
              {console.log('🎫 [Boleteria] Renderizando vista compacta')}
              <CompactBoleteria
                selectedFuncion={selectedFuncion}
                mapa={mapa}
              />
            </div>
          ) : (
            // Vista con mapa interactivo
            <div className="flex h-full flex-col xl:flex-row overflow-hidden">
              {console.log('🎫 [Boleteria] Renderizando vista mapa interactivo')}
              {/* Panel izquierdo - Zonas y precios */}
              <div className="w-full xl:w-80 bg-white border-b xl:border-b-0 xl:border-r border-gray-200 overflow-auto">
                <div className="p-4">
                  <ZonesAndPrices {...zonesAndPricesProps} />
                </div>
              </div>

              {/* Panel central - Mapa de asientos */}
              <div className="flex-1 bg-white overflow-hidden min-w-0">
                {selectedFuncion && mapa ? (
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold">Mapa de Asientos - {selectedFuncion.nombre || 'Función'}</h3>
                      <p className="text-sm text-gray-600">
                        🟢 Disponible | 🟡 Seleccionado | 🔴 Vendido | 🟣 Reservado | ⚫ Bloqueado
                      </p>
                    </div>
                    <div className="flex-1 p-4 overflow-auto">
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
                        showLegend={true}
                        allowSeatSelection={true}
                        debug={true}
                        isSeatLocked={isSeatLocked}
                        isSeatLockedByMe={isSeatLockedByMe}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Selecciona una función para ver el mapa de asientos
                  </div>
                )}
              </div>

              {/* Panel derecho - Carrito */}
              <div className="w-full xl:w-96 bg-white border-t xl:border-t-0 xl:border-l border-gray-200 flex flex-col">
                <div className="flex-1 min-h-0">
                  <Cart {...cartProps}>
                    {allTicketsPaid && <DownloadTicketButton locator={carrito[0].locator} />}
                  </Cart>
                </div>
              </div>
            </div>
          )}
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
