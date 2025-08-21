import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { message, Modal, Button } from 'antd';
import { AiOutlineLeft, AiOutlineMenu } from 'react-icons/ai';

import LeftMenu from './CompBoleteria/LeftMenu';
import Cart from './CompBoleteria/Cart';
import ZonesAndPrices from './CompBoleteria/ZonesAndPrices';
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

const Boleteria = () => {
  const {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    mapa,
    carrito,
    setCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEvent
  } = useBoleteria();

  const [foundSeats, setFoundSeats] = React.useState([]);

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

  const [isFunctionsModalVisible, setIsFunctionsModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [clientAbonos, setClientAbonos] = useState([]);
  const [seatPayment, setSeatPayment] = useState(null);
  const [isSeatModalVisible, setIsSeatModalVisible] = useState(false);

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

  const handleSeatToggle = useCallback((seat) => {
    const exists = carrito.some(item => item._id === seat._id);
    if (exists) {
      setCarrito(prev => prev.filter(item => item._id !== seat._id));
    } else {
      if (!selectedClient) {
        message.info('Seleccione un cliente antes de agregar asientos');
      }
      setCarrito(prev => [...prev, { ...seat, funcionId: selectedFuncion.id || selectedFuncion._id }]);
    }
  }, [carrito, selectedClient, selectedFuncion]);

  const handleSeatInfo = useCallback(async (seat) => {
    if (!selectedFuncion) return;
    try {
      const data = await fetchPaymentBySeat(selectedFuncion.id || selectedFuncion._id, seat._id);
      if (data) {
        setSeatPayment(data);
        setIsSeatModalVisible(true);
      } else {
        message.error('Ticket no encontrado');
      }
    } catch (err) {
      console.error('Seat info error:', err);
      message.error('Error al buscar ticket');
    }
  }, [selectedFuncion]);

  const loadPaymentIntoPOS = useCallback(async (payment) => {
    if (!payment) return;
    if (payment.event) setSelectedEvent(payment.event);
    if (payment.funcion) await handleFunctionSelect(payment.funcion);
    if (payment.user) {
      setSelectedClient(payment.user);
    }
    if (payment.seats) {
      setCarrito(
        payment.seats.map(seat => ({
          _id: seat.id || seat._id,
          nombre: seat.name,
          precio: seat.price || 0,
          nombreMesa: seat.mesa?.nombre || '',
          zona: seat.zona?.nombre || 'General',
          status: payment.status,
          paymentId: payment.id,
          locator: payment.locator,
          funcionId: payment.funcion?.id || payment.funcion,
          funcionFecha: payment.funcion?.fechaCelebracion,
        }))
      );
    }
    setIsSeatModalVisible(false);
    message.success('Ticket cargado correctamente');
  }, [setSelectedEvent, handleFunctionSelect, setSelectedClient, setCarrito]);

  const handleDownloadSeatTicket = useCallback(async () => {
    if (!seatPayment?.locator) return;
    try {
      await downloadTicket(seatPayment.locator);
    } catch {
      message.error('Error al descargar ticket');
    }
  }, [seatPayment]);
  

  useEffect(() => {
    const loadAbonos = async () => {
      if (selectedClient?.id) {
        try {
          const { data, error } = await supabase
            .from('abonos')
            .select('*')
            .eq('usuario_id', selectedClient.id);

          if (error) throw error;

          setClientAbonos((data || []).map(a => ({
            ...a,
            packageType: a.package_type,
            seat: a.seat_id
          })));
        } catch (err) {
          console.error('Error loading abonos', err);
          setClientAbonos([]);
        }
      } else {
        setClientAbonos([]);
      }
    };
    loadAbonos();
  }, [selectedClient]);

  useEffect(() => {
    const cleanupLocks = () => {
      unlockSeatRef.current = seatLockStore.unlockSeat;
      carrito.forEach(i => unlockSeatRef.current(i._id, i.funcionId).catch(() => {}));
    };
    window.addEventListener('beforeunload', cleanupLocks);
    return () => {
      window.removeEventListener('beforeunload', cleanupLocks);
    };
  }, [carrito, seatLockStore]);

  
  const handleClientManagement = useCallback(() => setIsSearchModalVisible(true), []);

  const onEventSelect = useCallback(async (eventoId) => {
    const { success, funciones: funcs = [] } = await handleEventSelect(eventoId);
    if (success) {
      setIsFunctionsModalVisible(true);
      if (funcs.length === 1) await handleFunctionSelect(funcs[0]);
    }
  }, [handleEventSelect, handleFunctionSelect]);

  const onFunctionSelect = useCallback(async (funcion) => {
    const success = await handleFunctionSelect(funcion);
    if (success) setIsFunctionsModalVisible(false);
  }, [handleFunctionSelect]);

  const handleSeatsUpdated = useCallback((ids, estado) => {
    zonesRef.current?.onSeatsUpdated(ids, estado);
  }, []);

  const allTicketsPaid = useMemo(() => 
    carrito?.length > 0 && carrito.every(ticket => ticket.status === 'pagado'), 
    [carrito]
  );

  const clientModalsProps = useMemo(() => ({
    isSearchModalVisible,
    searchLoading,
    searchResults,
    paymentResults,
    onSearchCancel: () => {
      setIsSearchModalVisible(false);
      clearSearchResults();
    },
    onClientSelect: (client) => {
      setSelectedClient(client);
      setIsSearchModalVisible(false);
      clearSearchResults();
    },
    onAddClient: async (values) => {
      try {
        const newClient = await handleAddClient({ ...values, perfil: 'cliente' });
        if (newClient) {
          setSelectedClient(newClient);
          setIsSearchModalVisible(false);
          message.success('Cliente agregado exitosamente');
        }
      } catch (error) {
        console.error('Error adding client:', error);
        message.error(error.message || 'Error al agregar cliente');
      }
    },
    handleUnifiedSearch: async (searchTerm) => {
      if (!searchTerm?.trim()) return message.warning('Por favor ingrese un término de búsqueda');
      try {
        const result = await handleUnifiedSearch(searchTerm);
        console.log('Search result:', result);
        if (result?.type === 'clients') {
          setSearchResults(result.data);
        } else if (result?.type === 'payments') {
          setPaymentResults(result.data);
        }
      } catch (error) {
        console.error('Search error:', error);
        message.error('Error en la búsqueda');
      }
    }
  }), [isSearchModalVisible, searchLoading, searchResults, paymentResults, clearSearchResults, setSelectedClient, handleAddClient, handleUnifiedSearch, setSearchResults, setPaymentResults]);

  const functionModalProps = useMemo(() => ({
    visible: isFunctionsModalVisible,
    onCancel: () => setIsFunctionsModalVisible(false),
    funciones,
    onFunctionSelect
  }), [isFunctionsModalVisible, funciones, onFunctionSelect]);

  const paymentModalProps = useMemo(() => ({
    open: isPaymentModalVisible,
    onCancel: () => setIsPaymentModalVisible(false),
    carrito,
    selectedClient,
    selectedFuncion,
    selectedAffiliate,
    selectedEvent
  }), [isPaymentModalVisible, carrito, selectedClient, selectedFuncion, selectedAffiliate, selectedEvent]);

  // Memoizar las props de ZonesAndPrices para evitar re-renderizados
  const zonesAndPricesProps = useMemo(() => ({
    ref: zonesRef,
    eventos,
    selectedEvent,
    onEventSelect,
    funciones,
    onShowFunctions: () => setIsFunctionsModalVisible(true),
    selectedFuncion,
    selectedClient,
    abonos: clientAbonos,
    carrito,
    setCarrito,
    selectedPlantilla,
    selectedAffiliate,
    setSelectedAffiliate,
    showSeatingMap: true
  }), [
    eventos,
    selectedEvent,
    onEventSelect,
    funciones,
    selectedFuncion,
    selectedClient,
    clientAbonos,
    carrito,
    setCarrito,
    selectedPlantilla,
    selectedAffiliate,
    setSelectedAffiliate
  ]);

  // Memoizar las props del Cart
  const cartProps = useMemo(() => ({
    carrito,
    setCarrito,
    onSeatsUpdated: handleSeatsUpdated,
    selectedClient,
    onPaymentClick: () => setIsPaymentModalVisible(true),
    setSelectedClient,
    selectedAffiliate
  }), [carrito, setCarrito, handleSeatsUpdated, selectedClient, setSelectedClient, selectedAffiliate]);

  // Memoizar las props del LeftMenu
  const leftMenuProps = useMemo(() => ({
    selectedClient,
    onClientRemove: () => setSelectedClient(null),
    setCarrito,
    setSelectedClient,
    onFunctionSelect: handleFunctionSelect,
    setSelectedEvent
  }), [selectedClient, setCarrito, setSelectedClient, handleFunctionSelect, setSelectedEvent]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar izquierdo */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
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
      <div className="flex-1 flex flex-col">
        {/* Área de trabajo principal */}
        <div className="flex-1 flex">
          {/* Panel izquierdo - Zonas y precios */}
          <div className="flex-1 bg-white border-r border-gray-200 overflow-auto">
            <ZonesAndPrices {...zonesAndPricesProps} />
          </div>

          {/* Panel derecho - Carrito */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
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
        footer={[
          <Button key="load" type="primary" onClick={() => loadPaymentIntoPOS(seatPayment)}>Cargar en POS</Button>,
          seatPayment?.status === 'pagado' ? (
            <Button key="dl" onClick={handleDownloadSeatTicket}>Descargar Ticket</Button>
          ) : null
        ]}
      >
        {seatPayment && (
          <div className="space-y-2">
            <p><strong>Localizador:</strong> {seatPayment.locator}</p>
            <p><strong>Estado:</strong> {seatPayment.status}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Boleteria;
