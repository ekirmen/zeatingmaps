import React, { useState } from 'react';
import { message } from 'antd';
import CartWithTimer from '../../components/CartWithTimer';
import SeatAnimation from '../../components/SeatAnimation';
import ZonesAndPrices from './ZonesAndPrices';
import { useBoleteria } from '../../hooks/useBoleteria';
import { useClientManagement } from '../../hooks/useClientManagement';

const BoleteriaMain = () => {
  // Usar los hooks existentes
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
  });

  // Estados locales adicionales
  const [animatingSeats, setAnimatingSeats] = useState([]);
  const [showFunctions, setShowFunctions] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);

  // Los datos ahora vienen de los hooks

  const handlePaymentClick = () => {
    if (!selectedClient) {
      message.warning('Selecciona un cliente antes de continuar');
      return;
    }
    message.success('Redirigiendo a pagos...');
  };

  const handleSeatAnimation = (seat) => {
    setAnimatingSeats(prev => [...prev, seat]);
  };

  const handleAnimationComplete = (seatId) => {
    setAnimatingSeats(prev => prev.filter(seat => seat._id !== seatId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Boletería</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-600">Usuario</span>
              </div>
              <div className="w-6 h-6 text-gray-400">⭐</div>
              <div className="w-6 h-6 text-gray-400">ℹ️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button className="py-4 px-2 border-b-2 border-purple-600 text-purple-600 font-medium">
              Mapa
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
              Zonas
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
              Productos
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
              Otros
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <ZonesAndPrices
          eventos={eventos}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
          funciones={funciones}
          onShowFunctions={() => setShowFunctions(true)}
          selectedFuncion={selectedFuncion}
          carrito={carrito}
          setCarrito={setCarrito}
          selectedPlantilla={selectedPlantilla}
          selectedClient={selectedClient}
          abonos={[]}
          selectedAffiliate={selectedAffiliate}
          setSelectedAffiliate={setSelectedAffiliate}
          showSeatingMap={true}
        />
      </div>

      {/* Carrito con temporizador */}
      <CartWithTimer
        carrito={carrito}
        setCarrito={setCarrito}
        onPaymentClick={handlePaymentClick}
        selectedClient={selectedClient}
        selectedAffiliate={selectedAffiliate}
      />

      {/* Animaciones de asientos */}
      {animatingSeats.map((seat) => (
        <SeatAnimation
          key={`${seat._id}-${Date.now()}`}
          seat={seat}
          onAnimationComplete={handleAnimationComplete}
        />
      ))}
    </div>
  );
};

export default BoleteriaMain; 