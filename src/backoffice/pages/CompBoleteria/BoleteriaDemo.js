import React, { useState } from 'react';
import ZonesAndPrices from './ZonesAndPrices';
import Cart from './Cart';

const BoleteriaDemo = () => {
  const [carrito, setCarrito] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFuncion, setSelectedFuncion] = useState(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Datos de ejemplo
  const eventos = [
    {
      id: '1',
      nombre: 'Concierto de Rock',
      imagenes: {
        logoCuadrado: '/assets/logo.png'
      }
    }
  ];

  const funciones = [
    {
      id: '1',
      fechaCelebracion: '2024-12-25T20:00:00Z',
      sala: {
        _id: 'sala1',
        nombre: 'Sala Principal'
      }
    }
  ];

  const plantillaPrecios = {
    detalles: [
      {
        zona: { _id: 'zona1', nombre: 'VIP' },
        zonaId: 'zona1',
        precio: 100.00
      },
      {
        zona: { _id: 'zona2', nombre: 'General' },
        zonaId: 'zona2',
        precio: 50.00
      },
      {
        zona: { _id: 'zona3', nombre: 'Económica' },
        zonaId: 'zona3',
        precio: 25.00
      }
    ]
  };

  const handleEventSelect = (eventId) => {
    const evento = eventos.find(e => e.id === eventId);
    setSelectedEvent(evento);
    setSelectedFuncion(funciones[0]);
    setSelectedPlantilla(plantillaPrecios);
  };

  const handlePaymentClick = () => {
    console.log('Proceder al pago con:', carrito);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎫 Sistema de Boletería
          </h1>
          <p className="text-gray-600">
            Sistema mejorado con selección de mesa completa y agrupación por zonas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Selección de asientos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Selección de Asientos</h2>
              
              <ZonesAndPrices
                eventos={eventos}
                selectedEvent={selectedEvent}
                onEventSelect={handleEventSelect}
                funciones={funciones}
                selectedFuncion={selectedFuncion}
                carrito={carrito}
                setCarrito={setCarrito}
                selectedPlantilla={selectedPlantilla}
                selectedClient={selectedClient}
                showSeatingMap={true}
              />
            </div>
          </div>

          {/* Panel derecho - Carrito */}
          <div className="lg:col-span-1">
            <Cart
              carrito={carrito}
              setCarrito={setCarrito}
              onPaymentClick={handlePaymentClick}
              setSelectedClient={setSelectedClient}
            />
          </div>
        </div>

        {/* Información de características */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">✨ Nuevas Características</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <span className="text-blue-600 text-lg">🗺️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Vista de Mapa</h3>
                  <p className="text-gray-600 text-sm">
                    Selecciona asientos individuales o usa el botón "Mesa completa" 
                    para seleccionar todas las sillas de una mesa automáticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <span className="text-green-600 text-lg">📋</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Vista de Zonas</h3>
                  <p className="text-gray-600 text-sm">
                    Selecciona zonas y cantidades para agregar múltiples asientos 
                    de la misma zona al carrito de una vez.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 p-2 rounded-full">
                  <span className="text-purple-600 text-lg">🛒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Carrito Agrupado</h3>
                  <p className="text-gray-600 text-sm">
                    Los asientos se agrupan automáticamente por zona y precio, 
                    mostrando la cantidad total y el precio por grupo.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <span className="text-orange-600 text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Selección Rápida</h3>
                  <p className="text-gray-600 text-sm">
                    Hover sobre una mesa para ver el botón "Mesa completa" 
                    y seleccionar todos los asientos disponibles de una vez.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoleteriaDemo; 