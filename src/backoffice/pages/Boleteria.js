import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { message, Modal, Button, Tabs } from 'antd';
import { AiOutlineLeft, AiOutlineMenu } from 'react-icons/ai';

import LeftMenu from './CompBoleteria/LeftMenu';
import Cart from './CompBoleteria/Cart';
import ZonesAndPrices from './CompBoleteria/ZonesAndPrices';
import CompactBoleteria from './CompBoleteria/CompactBoleteria';
import TestCompactBoleteria from './CompBoleteria/TestCompactBoleteria';
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
    mapa,
    carrito,
    setCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEvent
  } = useBoleteria();

  const [foundSeats, setFoundSeats] = React.useState([]);
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

  const handleSeatToggle = useCallback(
    async (silla) => {
      const sillaId = silla._id || silla.id;
      if (!sillaId || !selectedFuncion) return;

      // Si está bloqueado por otro usuario, no permitir acción
      if (isSeatLocked(sillaId) && !isSeatLockedByMe(sillaId)) return;

      // Resolver zona y precio
      const zona =
        mapa?.zonas?.find(z => z.asientos?.some(a => a._id === sillaId)) ||
        mapa?.contenido?.find(el => el.sillas?.some(a => a._id === sillaId) && el.zona) ||
        silla.zona || {};
      const zonaId = zona?.id || silla.zonaId;
      const nombreZona = zona?.nombre || 'Zona';
      const detalle = selectedPlantilla?.detalles?.find(d => d.zonaId === zonaId);
      const precio = detalle?.precio || 0;

      // Alternar bloqueo en DB + carrito
      if (isSeatLockedByMe(sillaId)) {
        await unlockSeat(sillaId, selectedFuncion.id || selectedFuncion._id);
        await toggleSeat({
          sillaId,
          zonaId,
          precio,
          nombre: silla.nombre || silla.numero || silla._id,
          nombreZona,
          functionId: selectedFuncion.id || selectedFuncion._id,
        });
      } else {
        const ok = await lockSeat(sillaId, 'seleccionado', selectedFuncion.id || selectedFuncion._id);
        if (!ok) return;
        await toggleSeat({
          sillaId,
          zonaId,
          precio,
          nombre: silla.nombre || silla.numero || silla._id,
          nombreZona,
          functionId: selectedFuncion.id || selectedFuncion._id,
        });
      }
    },
    [selectedFuncion, mapa, selectedPlantilla, toggleSeat, isSeatLocked, isSeatLockedByMe, lockSeat, unlockSeat]
  );

  const toggleSeat = useCallback(
    (seatData) => {
      setCarrito(prev => {
        const existingIndex = prev.findIndex(item => item.sillaId === seatData.sillaId);
        if (existingIndex >= 0) {
          // Remover del carrito
          const newCart = prev.filter((_, index) => index !== existingIndex);
          localStorage.setItem('boleteriaCart', JSON.stringify(newCart));
          return newCart;
        } else {
          // Añadir al carrito
          const newCart = [...prev, seatData];
          localStorage.setItem('boleteriaCart', JSON.stringify(newCart));
          return newCart;
        }
      });
    },
    [setCarrito]
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
    funciones,
    onShowFunctions: () => setIsFunctionsModalVisible(true),
    selectedFuncion,
    carrito,
    setCarrito,
    selectedPlantilla,
    selectedClient,
    abonos: clientAbonos,
    selectedAffiliate,
    setSelectedAffiliate,
    showSeatingMap: activeTab === 'map'
  }), [selectedEvent, handleEventSelect, funciones, selectedFuncion, carrito, setCarrito, selectedPlantilla, selectedClient, clientAbonos, selectedAffiliate, setSelectedAffiliate, activeTab]);

  const cartProps = useMemo(() => ({
    carrito,
    setCarrito,
    selectedClient,
    setSelectedClient,
    onShowPaymentModal: () => setIsPaymentModalVisible(true),
    selectedAffiliate,
    setSelectedAffiliate,
    clientAbonos,
    setClientAbonos,
    onShowUserSearch: () => setIsSearchModalVisible(true),
    onShowSeatModal: () => setIsSeatModalVisible(true),
    seatPayment,
    setSeatPayment
  }), [carrito, setCarrito, selectedClient, setSelectedClient, selectedAffiliate, setSelectedAffiliate, clientAbonos, setClientAbonos, seatPayment, setSeatPayment]);

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
    <div className="flex h-screen bg-gray-50">
      {/* Debug info */}
      {console.log('🎫 [Boleteria] Renderizando componente...')}
      {console.log('🎫 [Boleteria] Active tab:', activeTab)}
      {console.log('🎫 [Boleteria] Selected function:', selectedFuncion)}
      {console.log('🎫 [Boleteria] Mapa:', mapa)}
      
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
        {/* Tabs para cambiar entre vistas */}
        <div className="bg-white border-b border-gray-200">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="px-4"
          >
            <TabPane tab="🎫 Vista Compacta" key="compact" />
            <TabPane tab="🗺️ Mapa Interactivo" key="map" />
          </Tabs>
        </div>

        {/* Área de trabajo principal */}
        <div className="flex-1 flex">
          {activeTab === 'compact' ? (
            // Vista compacta - todo en una pantalla
            <div className="flex-1 overflow-auto">
              {console.log('🎫 [Boleteria] Renderizando vista compacta')}
              <TestCompactBoleteria
                selectedFuncion={selectedFuncion}
                mapa={mapa}
              />
            </div>
          ) : (
            // Vista con mapa interactivo
            <>
              {console.log('🎫 [Boleteria] Renderizando vista mapa interactivo')}
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
            </>
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
