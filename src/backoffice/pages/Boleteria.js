import React, { useState, useEffect, useRef } from 'react';
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
import { supabase } from '../services/supabaseClient';
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
  const unlockSeatRef = useRef(seatLockStore.unlockSeat);
  const zonesRef = useRef(null);
  const mobileZonesRef = useRef(null);

  const [isFunctionsModalVisible, setIsFunctionsModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleSeatToggle = (seat) => {
    const exists = carrito.some(item => item._id === seat._id);
    if (exists) {
      setCarrito(prev => prev.filter(item => item._id !== seat._id));
    } else {
      if (!selectedClient) {
        message.info('Seleccione un cliente antes de agregar asientos');
      }
      setCarrito(prev => [...prev, { ...seat, funcionId: selectedFuncion.id || selectedFuncion._id }]);
    }
  };

  const handleSeatInfo = async (seat) => {
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
  };

  const loadPaymentIntoPOS = async (payment) => {
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
  };

  const handleDownloadSeatTicket = async () => {
    if (!seatPayment?.locator) return;
    try {
      await downloadTicket(seatPayment.locator);
    } catch {
      message.error('Error al descargar ticket');
    }
  };
  

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

  
  const handleClientManagement = () => setIsSearchModalVisible(true);

  const onEventSelect = async (eventoId) => {
    const { success, funciones: funcs = [] } = await handleEventSelect(eventoId);
    if (success) {
      setIsFunctionsModalVisible(true);
      if (funcs.length === 1) await handleFunctionSelect(funcs[0]);
      if (sidebarOpen) setSidebarOpen(false);
    }
  };

  const onFunctionSelect = async (funcion) => {
    const success = await handleFunctionSelect(funcion);
    if (success) setIsFunctionsModalVisible(false);
  };

  const handleSeatsUpdated = (ids, estado) => {
    zonesRef.current?.onSeatsUpdated(ids, estado);
    mobileZonesRef.current?.onSeatsUpdated(ids, estado);
  };

  const allTicketsPaid = carrito?.length > 0 && carrito.every(ticket => ticket.status === 'pagado');

  const clientModalsProps = {
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
        await handleUnifiedSearch(searchTerm);
      } catch (error) {
        console.error('Search error:', error);
        message.error('Error en la búsqueda');
      }
    }
  };

  const functionModalProps = {
    visible: isFunctionsModalVisible,
    onCancel: () => setIsFunctionsModalVisible(false),
    funciones,
    onFunctionSelect
  };

  const paymentModalProps = {
    open: isPaymentModalVisible,
    onCancel: () => setIsPaymentModalVisible(false),
    carrito,
    selectedClient,
    selectedFuncion,
    selectedAffiliate
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-80 bg-white border-r border-gray-200 flex-col">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 border-b border-gray-200" aria-label="Volver">
          <AiOutlineLeft className="text-lg" /><span>Back</span>
        </button>
        <div className="flex-grow overflow-auto px-4 py-6 space-y-6">
          <LeftMenu
            onSearchClick={handleClientManagement}
            onAddClientClick={handleClientManagement}
            selectedClient={selectedClient}
            onClientRemove={() => setSelectedClient(null)}
            setCarrito={setCarrito}
            setSelectedClient={setSelectedClient}
            onFunctionSelect={handleFunctionSelect}
            setSelectedEvent={setSelectedEvent}
          />
        </div>
      </aside>

      {/* Toggle sidebar mobile */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded bg-white shadow-md" aria-label="Toggle menu">
          <AiOutlineMenu className="text-xl" />
        </button>
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <aside className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setSidebarOpen(false); window.history.back(); }} className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 border-b border-gray-200 w-full" aria-label="Volver">
              <AiOutlineLeft className="text-lg" /><span>Back</span>
            </button>
            <div className="px-4 py-6 space-y-6">
              <LeftMenu
                onSearchClick={handleClientManagement}
                onAddClientClick={handleClientManagement}
                selectedClient={selectedClient}
                onClientRemove={() => setSelectedClient(null)}
                setCarrito={setCarrito}
                setSelectedClient={setSelectedClient}
                onFunctionSelect={handleFunctionSelect}
                setSelectedEvent={setSelectedEvent}
              />
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        <div className="hidden md:flex flex-grow space-x-6 min-h-0 overflow-hidden">
          <section className="flex-1 h-full min-h-0 bg-white rounded-lg shadow-md overflow-auto">
          <ZonesAndPrices
            ref={zonesRef}
            eventos={eventos}
            selectedEvent={selectedEvent}
            onEventSelect={onEventSelect}
            funciones={funciones}
            onShowFunctions={() => setIsFunctionsModalVisible(true)}
            selectedFuncion={selectedFuncion}
            selectedClient={selectedClient}
            abonos={clientAbonos}
            carrito={carrito}
            setCarrito={setCarrito}
            selectedPlantilla={selectedPlantilla}
            selectedAffiliate={selectedAffiliate}
            setSelectedAffiliate={setSelectedAffiliate}
            showSeatingMap={false}
          />
          {/* Add SeatingMapUnified below for better seat rendering */}
          {selectedFuncion && (
            <SeatingMapUnified
              funcionId={selectedFuncion.id || selectedFuncion._id}
              mapa={mapa || { zonas: [] }}
              lockSeat={lockSeat}
              unlockSeat={unlockSeat}
              isSeatLocked={isSeatLocked}
              isSeatLockedByMe={isSeatLockedByMe}
              onSeatToggle={handleSeatToggle}
              onSeatInfo={handleSeatInfo}
              foundSeats={foundSeats}
            />
          )}
          </section>

          <aside className="h-full bg-white rounded-lg shadow-md flex flex-col overflow-auto w-96 min-w-[300px]">
            <Cart
              carrito={carrito}
              setCarrito={setCarrito}
              onSeatsUpdated={handleSeatsUpdated}
              selectedClient={selectedClient}
              onPaymentClick={() => setIsPaymentModalVisible(true)}
              setSelectedClient={setSelectedClient}
              selectedAffiliate={selectedAffiliate}
            >
              {allTicketsPaid && <DownloadTicketButton locator={carrito[0].locator} />}
            </Cart>
          </aside>
        </div>

        {/* Mobile layout */}
        <div className="flex flex-col md:hidden flex-grow min-h-0 overflow-auto space-y-6 p-4 bg-white rounded-lg shadow-md">
          <section className="min-h-[300px]">
            <ZonesAndPrices
              ref={mobileZonesRef}
              eventos={eventos}
              selectedEvent={selectedEvent}
              onEventSelect={onEventSelect}
              funciones={funciones}
              onShowFunctions={() => setIsFunctionsModalVisible(true)}
              selectedFuncion={selectedFuncion}
              selectedClient={selectedClient}
              abonos={clientAbonos}
              carrito={carrito}
              setCarrito={setCarrito}
              selectedPlantilla={selectedPlantilla}
            selectedAffiliate={selectedAffiliate}
            setSelectedAffiliate={setSelectedAffiliate}
            showSeatingMap={false}
          />
          </section>

          <section>
            <Cart
              carrito={carrito}
              setCarrito={setCarrito}
              onSeatsUpdated={handleSeatsUpdated}
              selectedClient={selectedClient}
              onPaymentClick={() => setIsPaymentModalVisible(true)}
              setSelectedClient={setSelectedClient}
              selectedAffiliate={selectedAffiliate}
            >
              {allTicketsPaid && <DownloadTicketButton locator={carrito[0].locator} />}
            </Cart>
          </section>
        </div>
      </main>

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
