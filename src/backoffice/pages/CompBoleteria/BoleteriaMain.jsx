import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import SimpleSeatingMap from '../../components/SimpleSeatingMap';
import CartWithTimer from '../../components/CartWithTimer';
import SeatAnimation from '../../components/SeatAnimation';

const BoleteriaMain = () => {
  const [eventos, setEventos] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFuncion, setSelectedFuncion] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [animatingSeats, setAnimatingSeats] = useState([]);
  const [showFunctions, setShowFunctions] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [blockMode, setBlockMode] = useState(false);
  const [blockedSeats, setBlockedSeats] = useState([]); // Nuevo estado para asientos bloqueados

  // Simular datos de eventos (reemplazar con datos reales)
  useEffect(() => {
    // Aquí cargarías los eventos desde tu API
    setEventos([
      {
        id: '1',
        nombre: 'Concierto de Rock',
        imagenes: { logoCuadrado: null }
      },
      {
        id: '2', 
        nombre: 'Teatro Clásico',
        imagenes: { logoCuadrado: null }
      }
    ]);
  }, []);

  // Simular funciones cuando se selecciona un evento
  useEffect(() => {
    if (selectedEvent) {
      setFunciones([
        {
          id: '1',
          fechaCelebracion: '2024-12-25T20:00:00',
          sala: { _id: 'sala1' }
        },
        {
          id: '2',
          fechaCelebracion: '2024-12-26T20:00:00', 
          sala: { _id: 'sala1' }
        }
      ]);
    }
  }, [selectedEvent]);

  // Simular plantilla de precios
  useEffect(() => {
    if (selectedFuncion) {
      setSelectedPlantilla({
        detalles: [
          {
            zonaId: 'zona1',
            zona: { _id: 'zona1', nombre: 'VIP' },
            precio: 77.00
          },
          {
            zonaId: 'zona2', 
            zona: { _id: 'zona2', nombre: 'Regular' },
            precio: 17.00
          }
        ]
      });
    }
  }, [selectedFuncion]);

  const handleEventSelect = (eventId) => {
    const event = eventos.find(e => e.id === eventId);
    setSelectedEvent(event);
    setSelectedFuncion(null);
    setCarrito([]);
  };

  const handleShowFunctions = () => {
    setShowFunctions(true);
  };

  const handleFunctionSelect = (funcion) => {
    setSelectedFuncion(funcion);
    setShowFunctions(false);
  };

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

  const handleSeatClick = (seat) => {
    if (!selectedClient) {
      message.info('Selecciona un cliente antes de agregar asientos');
      return;
    }

    if (blockMode) {
      // Modo bloqueo - alternar selección de asientos para bloquear
      if (selectedSeats.includes(seat.id)) {
        setSelectedSeats(prev => prev.filter(id => id !== seat.id));
        message.success(`Asiento ${seat.number} removido de la selección`);
      } else {
        setSelectedSeats(prev => [...prev, seat.id]);
        message.success(`Asiento ${seat.number} seleccionado para bloquear`);
      }
      return;
    }

    // Modo normal - agregar al carrito
    const newSeat = {
      _id: seat.id,
      nombre: `Asiento ${seat.number}`,
      nombreMesa: 'Mesa Principal',
      zona: selectedPlantilla?.detalles[0]?.zona?.nombre || 'General',
      precio: selectedPlantilla?.detalles[0]?.precio || 0,
      tipoPrecio: 'normal',
      descuentoNombre: '',
      funcionId: selectedFuncion?.id,
      funcionFecha: selectedFuncion?.fechaCelebracion,
    };

    setCarrito(prev => [...prev, newSeat]);
    handleSeatAnimation(newSeat);
    message.success(`Asiento ${seat.number} agregado al carrito`);
  };

  // Función para aplicar bloqueos
  const handleApplyBlocks = () => {
    if (selectedSeats.length === 0) {
      message.warning('No hay asientos seleccionados para bloquear');
      return;
    }

    setBlockedSeats(prev => [...prev, ...selectedSeats]);
    setSelectedSeats([]);
    setBlockMode(false);
    message.success(`${selectedSeats.length} asientos bloqueados correctamente`);
  };

  // Función para desbloquear asientos
  const handleUnblockSeats = () => {
    if (blockedSeats.length === 0) {
      message.warning('No hay asientos bloqueados');
      return;
    }

    setBlockedSeats([]);
    message.success('Todos los asientos han sido desbloqueados');
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Event Selection & Pricing */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Selección de Evento</h2>
              
              {/* Event Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evento
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={selectedEvent?.id || ''}
                  onChange={(e) => handleEventSelect(e.target.value)}
                >
                  <option value="">Seleccionar evento</option>
                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Function Selection */}
              {funciones.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Función
                  </label>
                  <div className="space-y-2">
                    {funciones.map((funcion) => (
                      <button
                        key={funcion.id}
                        onClick={() => handleFunctionSelect(funcion)}
                        className={`w-full text-left p-3 rounded-lg border ${
                          selectedFuncion?.id === funcion.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium">
                          {new Date(funcion.fechaCelebracion).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Buttons */}
              {selectedPlantilla && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Precios</h3>
                  {selectedPlantilla.detalles.map((detalle) => (
                    <button
                      key={detalle.zonaId}
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      {detalle.zona.nombre} - ${detalle.precio.toFixed(2)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Seating Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Controls */}
              <div className="mb-6 flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={blockMode}
                    onChange={(e) => setBlockMode(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">🔒 Modo bloqueo</span>
                </label>
                
                {blockMode && (
                  <>
                    <button
                      onClick={handleApplyBlocks}
                      disabled={selectedSeats.length === 0}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Aplicar Bloqueos ({selectedSeats.length})
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSeats([]);
                        setBlockMode(false);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </>
                )}

                {!blockMode && blockedSeats.length > 0 && (
                  <button
                    onClick={handleUnblockSeats}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700"
                  >
                    Desbloquear Todos ({blockedSeats.length})
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedClient({ id: '1', nombre: 'Cliente Demo' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedClient 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {selectedClient ? `Cliente: ${selectedClient.nombre}` : 'Seleccionar Cliente'}
                </button>
              </div>

              {/* Seating Map */}
              <SimpleSeatingMap
                onSeatClick={handleSeatClick}
                selectedSeats={selectedSeats}
                blockMode={blockMode}
                blockedSeats={blockedSeats}
              />
            </div>
          </div>
        </div>
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