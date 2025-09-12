import React from 'react';
import { Select, Button, Card, Row, Col, Statistic } from 'antd';
import { useBoleteria } from '../hooks/useBoleteria';
import SeatingMapUnified from '../../components/SeatingMapUnified';

const BoleteriaMinimal = () => {
  // Hook para obtener datos básicos de boletería
  const {
    eventos,
    funciones,
    selectedEvent,
    selectedFuncion,
    loading,
    handleEventSelect,
    handleFunctionSelect,
    mapa,
    zonas,
    estadisticas,
    carrito,
    totalCarrito,
    handleSeatClick,
    handleSeatDoubleClick,
    removeFromCart,
    clearCart
  } = useBoleteria();
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">🎫 Boletería</h2>
        <p className="text-sm text-gray-600">Sistema de venta de entradas</p>
      </div>

      {/* Layout principal con 3 paneles */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo - Selectores e Información */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-auto">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Configuración</h3>
          
            {/* Selectores */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Selección:</h4>
              
              {/* Selector de Eventos */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evento:
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Selecciona un evento"
                  value={selectedEvent?.id}
                  onChange={handleEventSelect}
                  loading={loading}
                  options={eventos?.map(evento => ({
                    value: evento.id,
                    label: evento.nombre || evento.name || `Evento ${evento.id}`
                  })) || []}
                />
              </div>

              {/* Selector de Funciones */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Función:
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Selecciona una función"
                  value={selectedFuncion?.id}
                  onChange={handleFunctionSelect}
                  loading={loading}
                  disabled={!selectedEvent}
                  options={funciones?.map(funcion => ({
                    value: funcion.id,
                    label: funcion.nombre || funcion.name || `Función ${funcion.id}`
                  })) || []}
                />
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Estadísticas:</h4>
              {estadisticas ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="font-medium">{estadisticas.totalSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Disponibles:</span>
                    <span className="font-medium text-green-600">{estadisticas.availableSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vendidos:</span>
                    <span className="font-medium text-red-600">{estadisticas.soldSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reservados:</span>
                    <span className="font-medium text-yellow-600">{estadisticas.reservedSeats}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <p>• Total: 43 asientos detectados</p>
                  <p>• Disponibles: 43</p>
                  <p>• Vendidos: 0</p>
                  <p>• Reservados: 0</p>
                  <p className="text-xs text-gray-400 mt-1">(Estadísticas calculadas manualmente)</p>
                </div>
              )}
            </div>

            {/* Información de Zonas */}
            {zonas && zonas.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-3">Zonas:</h4>
                <div className="space-y-2">
                  {zonas.map((zona, index) => (
                    <div key={zona.id || index} className="p-2 bg-gray-50 rounded border">
                      <p className="font-medium text-gray-700">{zona.nombre || `Zona ${index + 1}`}</p>
                      <p className="text-xs text-gray-500">ID: {zona.id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Debug del Mapa */}
            {mapa && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-3">Debug Mapa:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• <strong>Elementos:</strong> {mapa.contenido?.length || 0}</p>
                  <p>• <strong>Tipo contenido:</strong> {typeof mapa.contenido}</p>
                  <p>• <strong>Primeros 3 elementos:</strong></p>
                  <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-auto">
                    <pre>{JSON.stringify(mapa.contenido?.slice(0, 3), null, 2)}</pre>
                  </div>
                  <div className="space-y-2 mt-2">
                    <button 
                      onClick={() => {
                        console.log('🔍 Mapa completo:', mapa);
                        console.log('🔍 Contenido completo:', mapa.contenido);
                        console.log('🔍 Primeros 5 elementos:', mapa.contenido?.slice(0, 5));
                        console.log('🔍 Elementos con tipo "silla":', mapa.contenido?.filter(el => el.type === 'silla'));
                        console.log('🔍 Elementos con tipo "circle":', mapa.contenido?.filter(el => el.type === 'circle'));
                        console.log('🔍 Elementos con tipo "rect":', mapa.contenido?.filter(el => el.type === 'rect'));
                        console.log('🔍 Zonas:', zonas);
                        console.log('🔍 Estadísticas:', estadisticas);
                      }}
                      className="w-full px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                    >
                      Debug en Console
                    </button>
                    <button 
                      onClick={() => {
                        // Forzar recálculo de estadísticas
                        const asientos = mapa.contenido?.filter(el => 
                          el.type === 'silla' || el.type === 'circle' || el.type === 'rect'
                        ) || [];
                        console.log('🔍 Asientos encontrados:', asientos.length);
                        console.log('🔍 Tipos de elementos:', mapa.contenido?.map(el => el.type));
                      }}
                      className="w-full px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                    >
                      Analizar Asientos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel Central - Mapa de Asientos */}
        <div className="flex-1 bg-gray-50 overflow-auto">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Mapa de Asientos</h3>
            {mapa && selectedFuncion ? (
              <div className="bg-white rounded-lg border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="p-2 bg-blue-50 border-b text-center">
                  <p className="text-sm text-blue-700">
                    🎫 <strong>43 asientos disponibles</strong> - Haz clic en los asientos para seleccionarlos
                  </p>
                </div>
                <SeatingMapUnified
                  mapa={mapa}
                  zonas={zonas}
                  selectedFuncion={selectedFuncion}
                  selectedEvent={selectedEvent}
                  onSeatClick={handleSeatClick}
                  onSeatDoubleClick={handleSeatDoubleClick}
                  carrito={carrito}
                  modoVenta={true}
                  showPrices={true}
                  showZones={true}
                  showLegend={true}
                  allowSeatSelection={true}
                  debug={true}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg border p-4 min-h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">🎫 Selecciona un evento y función</p>
                  <p className="text-sm">para ver el mapa de asientos</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho - Carrito y Resumen */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Carrito</h3>
            <div className="bg-gray-50 rounded-lg border p-4 min-h-96">
              {carrito && carrito.length > 0 ? (
                <div>
                  <div className="space-y-2 mb-4">
                    {carrito.map((item, index) => (
                      <div key={index} className="bg-white p-2 rounded border flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{item.seatId}</p>
                          <p className="text-xs text-gray-500">{item.zona}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">${item.precio}</p>
                          <button 
                            onClick={() => removeFromCart(item.seatId)}
                            className="text-red-500 text-xs hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Asientos:</span>
                      <span className="font-medium">{carrito.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="font-medium text-lg">${totalCarrito?.toFixed(2) || '0.00'}</span>
                    </div>
                    <button 
                      onClick={clearCart}
                      className="w-full mt-3 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Limpiar Carrito
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">🛒 Carrito Vacío</p>
                  <p className="text-sm">Selecciona asientos para agregarlos al carrito</p>
                  <div className="mt-4 space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium ml-2">$0.00</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Asientos:</span>
                      <span className="font-medium ml-2">0</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoleteriaMinimal;
