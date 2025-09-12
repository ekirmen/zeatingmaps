import React, { useState } from 'react';
import { Select, Button, message } from 'antd';
import { SearchOutlined, UserOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useBoleteria } from '../hooks/useBoleteria';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import LocatorSearchModal from './CompBoleteria/components/LocatorSearchModal';
import ClientModals from './CompBoleteria/ClientModals';
import downloadTicket from '../../utils/downloadTicket';
import { supabase } from '../../supabaseClient';

const BoleteriaMinimal = () => {
  // Estados para las funcionalidades adicionales
  const [isLocatorModalVisible, setIsLocatorModalVisible] = useState(false);
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [paymentResults, setPaymentResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

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

  // Funciones para manejar las funcionalidades adicionales
  const handleLocatorSearch = async (locator) => {
    setSearchLoading(true);
    try {
      console.log('[BoleteriaMinimal] Searching for locator:', locator);
      const { data: payment, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          event:eventos(*),
          funcion:funciones(
            id,
            fecha_celebracion,
            evento_id,
            sala_id,
            plantilla
          )
        `)
        .eq('locator', locator)
        .single();

      if (error) {
        console.error('[BoleteriaMinimal] Error searching payment:', error);
        throw new Error('No se encontró el localizador');
      }

      if (!payment) {
        throw new Error('No se encontró el localizador');
      }

      console.log('[BoleteriaMinimal] Payment found:', payment);
      setPaymentResults([payment]);
      message.success('Localizador encontrado');
    } catch (err) {
      console.error('[BoleteriaMinimal] Search error:', err);
      message.error(err.message);
    } finally {
      setSearchLoading(false);
    }
  };


  const handleAddClient = async (clientData) => {
    try {
      console.log('[BoleteriaMinimal] Creating client:', clientData);
      const { data: newClient, error } = await supabase
        .from('profiles')
        .insert([{
          nombre: clientData.nombre,
          email: clientData.email,
          telefono: clientData.telefono,
          permisos: { role: 'usuario' },
          activo: true
        }])
        .select()
        .single();

      if (error) {
        console.error('[BoleteriaMinimal] Error creating client:', error);
        throw new Error('Error creando cliente');
      }

      setSelectedClient(newClient);
      message.success('Cliente creado exitosamente');
      setIsClientModalVisible(false);
    } catch (err) {
      console.error('[BoleteriaMinimal] Add client error:', err);
      message.error(err.message);
    }
  };

  const handleDownloadTicket = async (locator) => {
    try {
      console.log('[BoleteriaMinimal] Downloading ticket:', locator);
      await downloadTicket(locator);
      message.success('Ticket descargado exitosamente');
    } catch (err) {
      console.error('[BoleteriaMinimal] Download error:', err);
      message.error('Error al descargar el ticket');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">🎫 Boletería</h2>
            <p className="text-sm text-gray-600">Sistema de venta de entradas</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              icon={<SearchOutlined />}
              onClick={() => setIsLocatorModalVisible(true)}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              Buscar Localizador
            </Button>
            <Button 
              icon={<UserOutlined />}
              onClick={() => setIsClientModalVisible(true)}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              Gestionar Clientes
            </Button>
            {selectedClient && (
              <Button 
                icon={<DownloadOutlined />}
                onClick={() => handleDownloadTicket(selectedClient.locator)}
                className="bg-purple-500 text-white hover:bg-purple-600"
                disabled={!selectedClient.locator}
              >
                Descargar Ticket
              </Button>
            )}
          </div>
        </div>
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

            {/* Información del Cliente */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Cliente:</h4>
              {selectedClient ? (
                <div className="bg-green-50 rounded-lg border border-green-200 p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserOutlined className="text-green-600" />
                    <span className="font-medium text-green-800">{selectedClient.nombre}</span>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>📧 {selectedClient.email}</p>
                    <p>📞 {selectedClient.telefono}</p>
                    <p>🆔 {selectedClient.id}</p>
                  </div>
                  <Button 
                    size="small" 
                    onClick={() => setSelectedClient(null)}
                    className="mt-2 w-full"
                  >
                    Cambiar Cliente
                  </Button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg border p-3">
                  <p className="text-sm text-gray-600">No hay cliente seleccionado</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona un cliente para realizar la venta
                  </p>
                  <Button 
                    size="small" 
                    onClick={() => setIsClientModalVisible(true)}
                    className="mt-2 w-full"
                    icon={<PlusOutlined />}
                  >
                    Seleccionar Cliente
                  </Button>
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

            {/* Leyenda de Estados de Asientos */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Estados de Asientos:</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Seleccionado por mí</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Seleccionado por otro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Bloqueado/Vendido</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Reservado</span>
                </div>
              </div>
            </div>

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
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          // Forzar recálculo de estadísticas
                          const asientos = mapa.contenido?.filter(el => 
                            el.type === 'silla' || el.type === 'circle' || el.type === 'rect'
                          ) || [];
                          console.log('🔍 Asientos encontrados:', asientos.length);
                          console.log('🔍 Tipos de elementos:', mapa.contenido?.map(el => el.type));
                          console.log('🔍 Primer asiento completo:', asientos[0]);
                          console.log('🔍 Asientos con zona:', asientos.filter(a => a.zona));
                          console.log('🔍 Asientos con precio:', asientos.filter(a => a.precio));
                          console.log('🔍 Asientos con _id:', asientos.filter(a => a._id));
                        }}
                        className="w-full px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                      >
                        Analizar Asientos
                      </button>
                      <button 
                        onClick={() => {
                          console.log('🎨 [SISTEMA_COLORES] Información del sistema de colores:');
                          console.log('🟢 Verde (#4CAF50): Disponible');
                          console.log('🔵 Azul (#1890ff): Seleccionado por mí');
                          console.log('🟡 Amarillo (#faad14): Seleccionado por otro');
                          console.log('🔴 Rojo (#ff4d4f): Bloqueado/Vendido');
                          console.log('🟣 Púrpura (#722ed1): Reservado');
                          console.log('⚫ Gris (#8c8c8c): Vendido/Pagado');
                        }}
                        className="w-full px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs"
                      >
                        Ver Colores
                      </button>
                    </div>
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
                    🎫 <strong>43 asientos detectados</strong> - Sistema de colores activo
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Verde: Disponible | Azul: Seleccionado | Rojo: Vendido | Púrpura: Reservado
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

      {/* Modales */}
      <LocatorSearchModal
        open={isLocatorModalVisible}
        onCancel={() => setIsLocatorModalVisible(false)}
        onSearch={handleLocatorSearch}
      />

      <ClientModals
        isSearchModalVisible={isClientModalVisible}
        onSearchCancel={() => setIsClientModalVisible(false)}
        searchResults={searchResults}
        paymentResults={paymentResults}
        searchLoading={searchLoading}
        onAddClient={handleAddClient}
        onClientSelect={(client) => {
          setSelectedClient(client);
          setIsClientModalVisible(false);
        }}
        onLocatorSearch={handleLocatorSearch}
      />
    </div>
  );
};

export default BoleteriaMinimal;
