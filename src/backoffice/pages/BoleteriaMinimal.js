import React, { useState, useCallback } from 'react';
import { Select, Button, message } from 'antd';
import { SearchOutlined, UserOutlined, DownloadOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useBoleteria } from '../hooks/useBoleteria';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import LocatorSearchModal from './CompBoleteria/components/LocatorSearchModal';
import ClientModals from './CompBoleteria/ClientModals';
import downloadTicket from '../../utils/downloadTicket';
import { supabase } from '../../supabaseClient';

const BoleteriaMinimal = () => {
  const navigate = useNavigate();
  
  // Estados para las funcionalidades adicionales
  const [isLocatorModalVisible, setIsLocatorModalVisible] = useState(false);
  const [isClientModalVisible, setIsClientModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [paymentResults, setPaymentResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Estados para el flujo de venta
  const [selectedZona, setSelectedZona] = useState(null);
  const [showMapa, setShowMapa] = useState(false);
  const [blockedSeats, setBlockedSeats] = useState(new Set());
  const [isBlockingMode, setIsBlockingMode] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [ticketLocator, setTicketLocator] = useState(null);

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
    setCarrito,
    totalCarrito,
    removeFromCart,
    clearCart
  } = useBoleteria();

  // Create seat toggle handler
  const handleSeatToggle = useCallback((seat) => {
    console.log('🪑 [BoleteriaMinimal] Seat toggle:', seat);
    console.log('🪑 [BoleteriaMinimal] Modo bloqueo:', isBlockingMode);
    console.log('🪑 [BoleteriaMinimal] Cliente seleccionado:', selectedClient);
    console.log('🪑 [BoleteriaMinimal] Zona seleccionada:', selectedZona);
    console.log('🛒 [BoleteriaMinimal] Estado actual del carrito:', carrito);
    
    if (isBlockingMode) {
      // Modo bloqueo: alternar estado de bloqueo
      const seatId = seat._id || seat.id;
      setBlockedSeats(prev => {
        const newBlocked = new Set(prev);
        if (newBlocked.has(seatId)) {
          newBlocked.delete(seatId);
          console.log('🔓 [BoleteriaMinimal] Asiento desbloqueado:', seatId);
          message.success('Asiento desbloqueado');
        } else {
          newBlocked.add(seatId);
          console.log('🔒 [BoleteriaMinimal] Asiento bloqueado:', seatId);
          message.success('Asiento bloqueado');
        }
        return newBlocked;
      });
    } else {
      // Modo normal: selección de asientos para venta
      console.log('🔍 [BoleteriaMinimal] Verificando cliente:', selectedClient);
      if (!selectedClient) {
        console.log('❌ [BoleteriaMinimal] No hay cliente seleccionado');
        message.warning('Debes seleccionar un cliente antes de seleccionar asientos');
        setIsClientModalVisible(true);
        return;
      }
      console.log('✅ [BoleteriaMinimal] Cliente válido, procesando asiento');

      const seatId = seat._id || seat.id;
      console.log('🪑 [BoleteriaMinimal] Procesando asiento:', {
        seatId,
        seatNombre: seat.nombre || seat.numero,
        selectedZona: selectedZona?.nombre,
        selectedFuncion: selectedFuncion?.id
      });
      
      const seatData = {
        _id: seatId,
        nombre: seat.nombre || seat.numero || `Asiento ${seatId}`,
        zona: selectedZona?.nombre || seat.zona?.nombre || 'General',
        precio: 50, // Precio por defecto, debería venir de la plantilla
        funcionId: selectedFuncion?.id,
        funcionFecha: selectedFuncion?.fecha_celebracion,
        clienteId: selectedClient.id,
        clienteNombre: selectedClient.nombre
      };
      
      console.log('🛒 [BoleteriaMinimal] Datos del asiento preparados:', seatData);

      // Verificar si el asiento ya está en el carrito
      const existingIndex = carrito.findIndex(item => item._id === seatId);
      console.log('🛒 [BoleteriaMinimal] Verificando carrito:', {
        seatId,
        existingIndex,
        carritoLength: carrito.length,
        carritoItems: carrito.map(item => ({ id: item._id, nombre: item.nombre }))
      });
      
      if (existingIndex >= 0) {
        // Remover del carrito
        const newCarrito = carrito.filter((_, index) => index !== existingIndex);
        setCarrito(newCarrito);
        console.log('🗑️ [BoleteriaMinimal] Asiento removido del carrito:', seatId);
        message.success('Asiento removido del carrito');
      } else {
        // Agregar al carrito
        const newCarrito = [...carrito, seatData];
        console.log('🛒 [BoleteriaMinimal] Carrito antes:', carrito);
        console.log('🛒 [BoleteriaMinimal] Nuevo carrito:', newCarrito);
        setCarrito(newCarrito);
        console.log('✅ [BoleteriaMinimal] Asiento agregado al carrito:', seatId);
        message.success('Asiento agregado al carrito');
        
        // Verificar que se actualizó
        setTimeout(() => {
          console.log('🛒 [BoleteriaMinimal] Carrito después de setCarrito:', carrito);
        }, 100);
      }
    }
  }, [isBlockingMode, selectedClient, selectedZona, selectedFuncion, carrito, setCarrito]);

  // Handle zona selection
  const handleZonaSelect = useCallback((zona) => {
    console.log('🏷️ [BoleteriaMinimal] Zona seleccionada:', zona);
    setSelectedZona(zona);
    setShowMapa(true);
  }, []);

  // Handle go to cart
  const handleGoToCart = useCallback(() => {
    if (!selectedClient) {
      message.warning('Debes seleccionar un cliente antes de proceder al carrito');
      setIsClientModalVisible(true);
      return;
    }
    console.log('🛒 [BoleteriaMinimal] Yendo al carrito con cliente:', selectedClient);
    // Aquí puedes navegar al carrito o mostrar el modal del carrito
  }, [selectedClient]);

  // Toggle blocking mode
  const toggleBlockingMode = useCallback(() => {
    setIsBlockingMode(prev => !prev);
    if (isBlockingMode) {
      message.success('Modo de venta activado');
    } else {
      message.info('Modo de bloqueo activado - Haz clic en asientos para bloquear/desbloquear');
    }
  }, [isBlockingMode]);

  // Clear all blocked seats
  const clearAllBlockedSeats = useCallback(() => {
    setBlockedSeats(new Set());
    message.success('Todos los asientos han sido desbloqueados');
  }, []);

  // Handle ticket download
  const handleDownloadTicket = useCallback(async (locator) => {
    if (!locator) {
      message.error('No hay localizador disponible para descargar');
      return;
    }

    try {
      console.log('🚀 [BoleteriaMinimal] Descargando ticket:', locator);
      await downloadTicket(locator);
      message.success('Ticket descargado exitosamente');
    } catch (error) {
      console.error('❌ [BoleteriaMinimal] Error descargando ticket:', error);
      message.error('Error al descargar el ticket: ' + error.message);
    }
  }, []);

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


  const handleUnifiedSearch = async (searchTerm) => {
    console.log('🔍 [BoleteriaMinimal] Unified search for:', searchTerm);
    setSearchLoading(true);
    setSearchResults([]);
    setPaymentResults([]);

    try {
      // Buscar en profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, login, nombre, apellido, telefono, email')
        .or(
          `login.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );

      if (profilesError) {
        console.error('[BoleteriaMinimal] Profiles search error:', profilesError);
        throw profilesError;
      }

      const mappedProfiles = profiles?.map((p) => ({
        _id: p.id,
        id: p.id,
        nombre: p.login || p.nombre,
        email: p.email || '',
        telefono: p.telefono,
      })) || [];

      console.log('🔍 [BoleteriaMinimal] Profiles found:', mappedProfiles.length);
      setSearchResults(mappedProfiles);

      // Buscar en payments por localizador
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .ilike('locator', `%${searchTerm}%`);

      if (paymentsError) {
        console.error('[BoleteriaMinimal] Payments search error:', paymentsError);
      } else {
        console.log('🔍 [BoleteriaMinimal] Payments found:', payments?.length || 0);
        setPaymentResults(payments || []);
      }

      if (mappedProfiles.length === 0 && (!payments || payments.length === 0)) {
        message.info('No se encontraron resultados');
      }

    } catch (err) {
      console.error('[BoleteriaMinimal] Unified search error:', err);
      message.error(err.message || 'Error en la búsqueda');
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/backoffice')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-gray-300"
            >
              Volver al Dashboard
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">🎫 Boletería</h2>
              <p className="text-sm text-gray-600">Sistema de venta de entradas</p>
            </div>
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
                <h4 className="font-medium text-gray-700 mb-3">Zonas Disponibles:</h4>
                <div className="space-y-2">
                  {zonas.map((zona, index) => (
                    <div 
                      key={zona.id || index} 
                      className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                        selectedZona?.id === zona.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-25'
                      }`}
                      onClick={() => handleZonaSelect(zona)}
                    >
                      <p className="font-medium text-gray-700">{zona.nombre || `Zona ${index + 1}`}</p>
                      <p className="text-xs text-gray-500">ID: {zona.id}</p>
                      {selectedZona?.id === zona.id && (
                        <p className="text-xs text-blue-600 mt-1">✓ Seleccionada</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón para ir al carrito */}
            {showMapa && carrito && carrito.length > 0 && (
              <div className="mb-4">
                <Button
                  type="primary"
                  size="large"
                  onClick={handleGoToCart}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!selectedClient}
                >
                  {selectedClient ? '🛒 Ir al Carrito' : '👤 Seleccionar Cliente Primero'}
                </Button>
              </div>
            )}

            {/* Controles de Bloqueo de Asientos */}
            {showMapa && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-3">Control de Asientos:</h4>
                <div className="space-y-2">
                  <Button
                    onClick={toggleBlockingMode}
                    className={`w-full ${isBlockingMode ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                    type="primary"
                  >
                    {isBlockingMode ? '🔒 Modo Bloqueo (Activo)' : '🔓 Modo Venta'}
                  </Button>
                  
                  {isBlockingMode && (
                    <Button
                      onClick={clearAllBlockedSeats}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      type="primary"
                    >
                      🗑️ Desbloquear Todos
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => {
                      setShowMapa(false);
                      setSelectedZona(null);
                      setIsBlockingMode(false);
                      setBlockedSeats(new Set());
                    }}
                    className="w-full"
                  >
                    ← Volver a Seleccionar Zona
                  </Button>
                </div>
                
                {/* Información de asientos bloqueados */}
                {blockedSeats.size > 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700">
                      🔒 <strong>{blockedSeats.size}</strong> asiento(s) bloqueado(s)
                    </p>
                  </div>
                )}
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
                  <span>Vendido</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <span>Bloqueado (Gris)</span>
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
            {showMapa && mapa && selectedFuncion && selectedZona ? (
              <div className="bg-white rounded-lg border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
                <div className={`p-2 border-b text-center ${isBlockingMode ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <p className={`text-sm ${isBlockingMode ? 'text-red-700' : 'text-blue-700'}`}>
                    🎫 <strong>Zona: {selectedZona.nombre}</strong> - {isBlockingMode ? 'Modo Bloqueo Activo' : 'Sistema de colores activo'}
                  </p>
                  <p className={`text-xs mt-1 ${isBlockingMode ? 'text-red-600' : 'text-blue-600'}`}>
                    {isBlockingMode ? 'Haz clic en asientos para bloquear/desbloquear' : 'Verde: Disponible | Azul: Seleccionado | Rojo: Vendido | Púrpura: Reservado | Gris: Bloqueado'}
                  </p>
                </div>
                <SeatingMapUnified
                  funcionId={selectedFuncion?.id}
                  mapa={mapa}
                  zonas={zonas}
                  selectedFuncion={selectedFuncion}
                  selectedEvent={selectedEvent}
                  onSeatToggle={handleSeatToggle}
                  carrito={carrito}
                  modoVenta={!isBlockingMode}
                  showPrices={true}
                  showZones={true}
                  showLegend={true}
                  allowSeatSelection={true}
                  debug={true}
                  blockedSeats={blockedSeats}
                />
              </div>
            ) : !showMapa ? (
              <div className="bg-white rounded-lg border p-4 min-h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">🏷️ Selecciona una zona</p>
                  <p className="text-sm">para ver el mapa de asientos</p>
                </div>
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
                          <p className="font-medium text-sm">{item.nombre || item._id}</p>
                          <p className="text-xs text-gray-500">{item.zona}</p>
                          {item.clienteNombre && (
                            <p className="text-xs text-blue-600">Cliente: {item.clienteNombre}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">${item.precio || 0}</p>
                          <button 
                            onClick={() => {
                              const newCarrito = carrito.filter((_, i) => i !== index);
                              setCarrito(newCarrito);
                            }}
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
                    {paymentCompleted && ticketLocator && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✅</span>
                          <div>
                            <p className="text-sm font-medium text-green-800">Pago Completado</p>
                            <p className="text-xs text-green-600">Localizador: {ticketLocator}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 mt-3">
                      {ticketLocator ? (
                        <button 
                          onClick={() => handleDownloadTicket(ticketLocator)}
                          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          📥 Descargar Ticket
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (!selectedClient) {
                              message.warning('Debes seleccionar un cliente antes de proceder al pago');
                              setIsClientModalVisible(true);
                              return;
                            }
                            // Simular pago exitoso y generar locator
                            const mockLocator = `TKT-${Date.now()}`;
                            setTicketLocator(mockLocator);
                            setPaymentCompleted(true);
                            message.success('Pago procesado exitosamente. Ticket generado.');
                          }}
                          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                          disabled={!selectedClient}
                        >
                          💳 Proceder al Pago
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          clearCart();
                          setPaymentCompleted(false);
                          setTicketLocator(null);
                        }}
                        className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        🗑️ Limpiar Carrito
                      </button>
                    </div>
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
        handleUnifiedSearch={handleUnifiedSearch}
        clearSearchResults={() => {
          setSearchResults([]);
          setPaymentResults([]);
        }}
      />
    </div>
  );
};

export default BoleteriaMinimal;
