import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { AiOutlineLeft, AiOutlineMenu } from 'react-icons/ai';

import LeftMenu from './CompBoleteria/LeftMenu';
import Cart from './CompBoleteria/Cart';
import ZonesAndPrices from './CompBoleteria/ZonesAndPrices';
import PaymentModal from './CompBoleteria/PaymentModal';
import ClientModals from './CompBoleteria/ClientModals';
import FunctionModal from './CompBoleteria/FunctionModal';
import DownloadTicketButton from './CompBoleteria/DownloadTicketButton';
import { useBoleteria } from '../hooks/useBoleteria';
import { useClientManagement } from '../hooks/useClientManagement';
import { supabase } from '../services/supabaseClient';
import { unlockSeat } from '../services/seatLocks';
import { isUuid } from '../../utils/isUuid';

const Boleteria = () => {
  const {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    carrito,
    setCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEvent
  } = useBoleteria();

  const zonesRef = useRef(null);
  const mobileZonesRef = useRef(null);

  const handleSeatsUpdated = (ids, estado) => {
    zonesRef.current?.onSeatsUpdated(ids, estado);
    mobileZonesRef.current?.onSeatsUpdated(ids, estado);
  };

  const {
    selectedClient,
    setSelectedClient,
    searchResults,
    paymentResults,
    searchLoading,
    handleAddClient,
    handleUnifiedSearch,
    clearSearchResults
  } = useClientManagement(setCarrito);

  const [isFunctionsModalVisible, setIsFunctionsModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [clientAbonos, setClientAbonos] = useState([]);

  useEffect(() => {
    const loadAbonos = async () => {
      if (selectedClient?.id) {
        try {
          const { data, error } = await supabase
            .from('abonos')
            .select('*')
            .eq('user', selectedClient.id);

          if (error) throw error;

          setClientAbonos(data);
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

  // Liberar asientos bloqueados cuando la página se recarga o el componente se desmonta
  useEffect(() => {
    const cleanupLocks = () => {
      carrito
        .filter(i => isUuid((i._id || '').replace(/^silla_/, '')))
        .forEach(i => {
          unlockSeat(i._id).catch(() => {});
        });
    };

    window.addEventListener('beforeunload', cleanupLocks);
    return () => {
      cleanupLocks();
      window.removeEventListener('beforeunload', cleanupLocks);
    };
  }, [carrito]);

  const handleClientManagement = () => {
    setIsSearchModalVisible(true);
  };

  const onEventSelect = async (eventoId) => {
    const { success, funciones: funcs = [] } = await handleEventSelect(eventoId);
    if (success) {
      setIsFunctionsModalVisible(true);
      if (funcs.length === 1) {
        await handleFunctionSelect(funcs[0]);
      }
      if (sidebarOpen) setSidebarOpen(false);
    }
  };

  const onFunctionSelect = async (funcion) => {
    const success = await handleFunctionSelect(funcion);
    if (success) setIsFunctionsModalVisible(false);
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
        const newClient = await handleAddClient({
          ...values,
          perfil: 'cliente'
        });
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
      if (!searchTerm?.trim()) {
        message.warning('Por favor ingrese un término de búsqueda');
        return;
      }
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
      <aside className="hidden md:flex md:w-80 bg-white border-r border-gray-200 flex-col">
        <button
          className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 border-b border-gray-200"
          onClick={() => window.history.back()}
          aria-label="Volver"
        >
          <AiOutlineLeft className="text-lg" />
          <span>Back</span>
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

      <div className="md:hidden fixed top-2 left-2 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded bg-white shadow-md focus:outline-none"
          aria-label="Toggle menu"
        >
          <AiOutlineMenu className="text-xl" />
        </button>
      </div>

      {sidebarOpen && (
        <aside className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 border-b border-gray-200 w-full"
              onClick={() => {
                setSidebarOpen(false);
                window.history.back();
              }}
              aria-label="Volver"
            >
              <AiOutlineLeft className="text-lg" />
              <span>Back</span>
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
              
            />
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
              {allTicketsPaid && (
                <DownloadTicketButton paymentId={carrito[0].paymentId} />
              )}
            </Cart>
          </aside>
        </div>

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
              {allTicketsPaid && (
                <DownloadTicketButton paymentId={carrito[0].paymentId} />
              )}
            </Cart>
          </section>
        </div>
      </main>

      <ClientModals {...clientModalsProps} />
      <FunctionModal {...functionModalProps} />
      <PaymentModal {...paymentModalProps} />
    </div>
  );
};

export default Boleteria;
