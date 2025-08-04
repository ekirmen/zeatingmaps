import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs, Drawer, Form, Space, Typography } from 'antd';
import { SearchOutlined, UserOutlined, QrcodeOutlined, ShoppingCartOutlined, GiftOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SettingOutlined, EyeOutlined, UploadOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import CartWithTimer from '../../components/CartWithTimer';
import SeatAnimation from '../../components/SeatAnimation';
import ZonesAndPrices from './ZonesAndPrices';
import SimpleSeatingMap from './components/SimpleSeatingMap';
import PrintTicketButton from '../../components/PrintTicketButton';
import ProductosWidget from '../../../store/components/ProductosWidget';
import { useBoleteria } from '../../hooks/useBoleteria';
import { useClientManagement } from '../../hooks/useClientManagement';
import { supabase } from '../../../supabaseClient';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const BoleteriaMain = () => {
  const location = useLocation();
  
  // Usar los hooks existentes
  const {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    mapa,
    zonas,
    carrito,
    setCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedEvent,
    setSelectedFuncion
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

  // Estados locales
  const [animatingSeats, setAnimatingSeats] = useState([]);
  const [showFunctions, setShowFunctions] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [locatorValue, setLocatorValue] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showLocatorModal, setShowLocatorModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [blockMode, setBlockMode] = useState(false);
  const [productosCarrito, setProductosCarrito] = useState([]);
  const [activeTab, setActiveTab] = useState('mapa');
  const [selectedPriceType, setSelectedPriceType] = useState('regular');
  
  // Nuevos estados para funcionalidades
  const [showEventSearch, setShowEventSearch] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showBox, setShowBox] = useState(false);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const [selectedEventForSearch, setSelectedEventForSearch] = useState(null);
  const [selectedFunctionForSearch, setSelectedFunctionForSearch] = useState(null);
  const [plantillasPrecios, setPlantillasPrecios] = useState([]);
  const [selectedPlantillaPrecio, setSelectedPlantillaPrecio] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Estados para búsqueda de usuarios
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchValue, setUserSearchValue] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);

  useEffect(() => {
    loadAvailableEvents();
    loadPlantillasPrecios();
    
    // Cargar parámetros del buscador si existen
    if (location.state) {
      const { selectedEventId, selectedFunctionId } = location.state;
      
      if (selectedEventId) {
        loadEventAndFunctions(selectedEventId, selectedFunctionId);
      }
    }

    // Cargar asientos seleccionados del localStorage
    const savedSelectedSeats = localStorage.getItem('selectedSeats');
    if (savedSelectedSeats) {
      try {
        const parsedSeats = JSON.parse(savedSelectedSeats);
        setSelectedSeats(parsedSeats);
      } catch (error) {
        console.error('Error parsing saved seats:', error);
      }
    }
  }, [location.state]);

  const loadEventAndFunctions = async (eventId, functionId = null) => {
    try {
      // Cargar el evento
      const { data: eventData, error: eventError } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        console.error('Error loading event:', eventError);
        return;
      }

      // Cargar las funciones del evento
      const { data: functionsData, error: functionsError } = await supabase
        .from('funciones')
        .select('*')
        .eq('evento', eventId)
        .order('fecha', { ascending: true });

      if (functionsError) {
        console.error('Error loading functions:', eventError);
        return;
      }

      // Actualizar el estado
      setSelectedEvent(eventData);
      setAvailableFunctions(functionsData);

      // Si hay una función específica seleccionada, seleccionarla
      if (functionId && functionsData.length > 0) {
        const selectedFunc = functionsData.find(f => f.id === functionId);
        if (selectedFunc) {
          setSelectedFuncion(selectedFunc);
        }
      } else if (functionsData.length > 0) {
        // Si no hay función específica, seleccionar la primera
        setSelectedFuncion(functionsData[0]);
      }

      message.success(`Evento cargado: ${eventData.nombre}`);
    } catch (error) {
      console.error('Error loading event and functions:', error);
      message.error('Error al cargar el evento');
    }
  };

  const loadAvailableEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('activo', true)
        .order('fecha_evento', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      setAvailableEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadFunctionsForEvent = async (eventId) => {
    try {
      console.log('Loading functions for event:', eventId);
      
      const { data, error } = await supabase
        .from('funciones')
        .select('*, sala(*)')
        .eq('evento', eventId)
        .order('fecha_celebracion', { ascending: true });

      if (error) {
        console.error('Error loading functions:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          code: error.code
        });
        return;
      }

      console.log('Functions loaded successfully:', data);
      setAvailableFunctions(data || []);
    } catch (error) {
      console.error('Error loading functions:', error);
    }
  };

  const loadPlantillasPrecios = async () => {
    try {
      const { data, error } = await supabase
        .from('plantillas_precios')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error loading price templates:', error);
        return;
      }

      setPlantillasPrecios(data || []);
    } catch (error) {
      console.error('Error loading price templates:', error);
    }
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

  const handleLocatorSearchSubmit = () => {
    if (!locatorValue.trim()) {
      message.warning('Ingresa un localizador válido');
      return;
    }
    message.info(`Buscando localizador: ${locatorValue}`);
    setShowLocatorModal(false);
  };

  const handleClientSearch = (value) => {
    if (value.trim()) {
      handleUnifiedSearch(value);
    } else {
      clearSearchResults();
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setShowClientModal(false);
    message.success(`Cliente seleccionado: ${client.nombre}`);
  };

  const handleProductAdded = (producto) => {
    setProductosCarrito(prev => {
      const existingProduct = prev.find(p => p.id === producto.id);
      if (existingProduct) {
        return prev.map(p => 
          p.id === producto.id 
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const handleSeatClick = (seat) => {
    if (blockMode) {
      setBlockedSeats(prev => {
        const isBlocked = prev.find(s => s._id === seat._id);
        if (isBlocked) {
          return prev.filter(s => s._id !== seat._id);
        } else {
          return [...prev, seat];
        }
      });
    } else {
      setSelectedSeats(prev => {
        const isSelected = prev.find(s => s._id === seat._id);
        let newSeats;
        if (isSelected) {
          newSeats = prev.filter(s => s._id !== seat._id);
        } else {
          newSeats = [...prev, seat];
        }
        
        // Guardar en localStorage
        localStorage.setItem('selectedSeats', JSON.stringify(newSeats));
        return newSeats;
      });
    }
  };

  const calculateTotal = () => {
    const seatsTotal = selectedSeats.reduce((sum, seat) => sum + (seat.precio || 0), 0);
    const productsTotal = productosCarrito.reduce((sum, product) => sum + (product.precio * product.cantidad), 0);
    return seatsTotal + productsTotal;
  };

  // Funciones para los botones del sidebar
  const handleSearchClick = () => {
    setShowEventSearch(true);
  };

  const handleConfigClick = () => {
    setShowConfig(true);
  };

  const handleProductsClick = () => {
    setShowProducts(true);
  };

  const handleBoxClick = () => {
    setShowBox(true);
  };

  // Funciones para los botones del header
  const handleGridClick = () => {
    message.info('Vista de cuadrícula activada');
  };

  const handleUploadClick = () => {
    message.info('Función de subida activada');
  };

  const handleEyeClick = () => {
    message.info('Vista previa activada');
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    message.info(isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa activada');
  };

  const handleRefresh = () => {
    loadAvailableEvents();
    loadPlantillasPrecios();
    message.success('Datos actualizados');
  };

       const handleClose = () => {
    message.info('Cerrando aplicación');
  };

  // Funciones para búsqueda de usuarios
  const handleUserSearch = async (value) => {
    if (!value.trim()) {
      setUserSearchResults([]);
      return;
    }

    setUserSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${value}%,login.ilike.%${value}%,telefono.ilike.%${value}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        message.error('Error al buscar usuarios');
        return;
      }

      setUserSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      message.error('Error al buscar usuarios');
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        message.error('Error al crear usuario');
        return;
      }

      message.success('Usuario creado exitosamente');
      setShowCreateUser(false);
      setSelectedClient(data);
    } catch (error) {
      console.error('Error creating user:', error);
      message.error('Error al crear usuario');
    }
  };

  const handleSelectUser = (user) => {
    setSelectedClient(user);
    setShowUserSearch(false);
    message.success(`Usuario seleccionado: ${user.full_name || user.login}`);
  };

  const handleEventSelectForSearch = (eventId) => {
    const event = availableEvents.find(e => e.id === eventId);
    setSelectedEventForSearch(event);
    setSelectedFunctionForSearch(null);
    loadFunctionsForEvent(eventId);
  };

  const handleFunctionSelectForSearch = (functionId) => {
    const func = availableFunctions.find(f => f.id === functionId);
    setSelectedFunctionForSearch(func);
    setSelectedEvent(selectedEventForSearch);
    setSelectedFuncion(func);
    setShowEventSearch(false);
         message.success(`Evento seleccionado: ${selectedEventForSearch?.nombre} - ${func?.sala?.nombre || 'Sala sin nombre'}`);
  };

  const tabItems = [
    {
      key: 'zonas',
      label: 'Zonas',
      children: (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Zonas del Evento</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <h4 className="font-medium">General</h4>
              <p className="text-sm text-gray-600">$17.00 - $77.00</p>
            </Card>
            <Card className="text-center">
              <h4 className="font-medium">VIP</h4>
              <p className="text-sm text-gray-600">$77.00</p>
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'mapa',
      label: 'Mapa',
      children: (
        <div className="relative">
          {/* Controles de zoom */}
          <div className="absolute bottom-4 left-4 z-10 flex space-x-2">
            <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} />
            <Button size="small" icon={<FullscreenOutlined />} onClick={handleFullscreen} />
            <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          </div>
          
                                {/* Mapa de asientos */}
           <div className="bg-white p-6 rounded-lg shadow-sm overflow-hidden">
             <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
               <SimpleSeatingMap
                 selectedFuncion={selectedFuncion}
                 onSeatClick={handleSeatClick}
                 selectedSeats={selectedSeats}
                 blockedSeats={blockedSeats}
                 blockMode={blockMode}
                 zonas={zonas}
                 selectedPlantilla={selectedPlantilla}
               />
             </div>
           </div>
        </div>
      )
    },
    {
      key: 'productos',
      label: 'Productos',
      children: (
        <div className="p-4">
          <ProductosWidget onProductAdded={handleProductAdded} />
        </div>
      )
    },
    {
      key: 'otros',
      label: 'Otros',
      children: (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Otras Opciones</h3>
          <div className="space-y-4">
            <Card>
              <h4 className="font-medium">Descuentos</h4>
              <p className="text-sm text-gray-600">Aplicar códigos de descuento</p>
            </Card>
            <Card>
              <h4 className="font-medium">Abonos</h4>
              <p className="text-sm text-gray-600">Configurar abonos</p>
            </Card>
          </div>
        </div>
      )
    }
  ];

  const [loading, setLoading] = useState(false);

  const handleFixSeatConflicts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fixSeatConflicts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        message.success('Limpieza completada exitosamente');
        console.log('Resultado de limpieza:', result);
        // Recargar la página para ver los cambios
        window.location.reload();
      } else {
        message.error('Error en la limpieza: ' + result.error);
      }
    } catch (error) {
      console.error('Error al ejecutar limpieza:', error);
      message.error('Error al ejecutar la limpieza');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar izquierda */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
                 <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={handleSearchClick}>
           <SearchOutlined className="text-xl mb-1" />
           <div>Eventos</div>
         </div>
         <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowUserSearch(true)}>
           <UserOutlined className="text-xl mb-1" />
           <div>Usuarios</div>
         </div>
        <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={handleConfigClick}>
          <SettingOutlined className="text-xl mb-1" />
          <div>Config</div>
        </div>
        <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={handleProductsClick}>
          <GiftOutlined className="text-xl mb-1" />
          <div>Productos</div>
        </div>
        <div className="bg-green-500 text-white text-xs text-center px-2 py-1 rounded cursor-pointer hover:bg-green-600" onClick={handleBoxClick}>
          <ShoppingCartOutlined className="text-xl mb-1" />
          <div>BOX</div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                             <div className="flex items-center space-x-3">
                 {selectedEvent && selectedEvent.imagen_url ? (
                   <img 
                     src={selectedEvent.imagen_url} 
                     alt={selectedEvent.nombre}
                     className="w-8 h-8 rounded-lg object-cover"
                     onError={(e) => {
                       e.target.src = '/assets/logo.png';
                     }}
                   />
                 ) : (
                   <Avatar size="small" src="/assets/logo.png" alt="Event" />
                 )}
                 <div className="text-sm">
                   <div className="font-medium">
                     {selectedEvent ? selectedEvent.nombre : 'Selecciona un evento'}
                   </div>
                   <div className="text-gray-600">
                     <span>Fecha: {selectedEvent ? new Date(selectedEvent.fecha_evento).toLocaleDateString('es-ES') : 'N/A'}</span>
                     <span className="ml-4">Hora: {selectedFuncion ? new Date(selectedFuncion.fecha_celebracion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                   </div>
                 </div>
               </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600" 
                onClick={handleFixSeatConflicts}
                disabled={loading}
              >
                {loading ? 'Limpiando...' : '🔧 Limpiar Conflictos'}
              </button>
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" onClick={handleGridClick}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" onClick={handleUploadClick}>
                <UploadOutlined className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" onClick={handleEyeClick}>
                <EyeOutlined className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500">{zoomLevel.toFixed(1)}X</span>
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" onClick={handleRefresh}>
                <ReloadOutlined className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded" onClick={handleClose}>
                <CloseOutlined className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Área principal */}
        <div className="flex-1 flex">
          {/* Contenido central */}
          <div className="flex-1 p-6">
            {/* Selección de precios */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  className={`px-6 py-3 rounded-lg border-2 font-medium ${
                    selectedPriceType === 'regular' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedPriceType('regular')}
                >
                  <div className="text-left">
                    <div className="font-semibold">PRECIO REGULAR</div>
                    <div className="bg-purple-500 text-white px-3 py-1 rounded text-sm mt-1">
                      $17.00 - $77.00
                    </div>
                  </div>
                </button>
                <button
                  className={`px-6 py-3 rounded-lg border-2 font-medium ${
                    selectedPriceType === 'vip' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedPriceType('vip')}
                >
                  <div className="text-left">
                    <div className="font-semibold">VIP REGULAR</div>
                    <div className="bg-purple-500 text-white px-3 py-1 rounded text-sm mt-1">
                      $77.00
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Pestañas */}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="bg-white rounded-lg shadow-sm"
            />
          </div>

          {/* Panel lateral derecho */}
          <div className="w-80 bg-white shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resumen de Compra</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Boletos:</span>
                  <span>{selectedSeats.length}, ${selectedSeats.reduce((sum, seat) => sum + (seat.precio || 0), 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Productos:</span>
                  <span>{productosCarrito.reduce((sum, p) => sum + p.cantidad, 0)}, ${productosCarrito.reduce((sum, product) => sum + (product.precio * product.cantidad), 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Comisiones de transacción:</span>
                  <span>0, $0.00</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handlePaymentClick}
                >
                  Pagos/Detalles
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de búsqueda de eventos */}
      <Modal
        title="Seleccionar Evento y Función"
        open={showEventSearch}
        onCancel={() => setShowEventSearch(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Evento</label>
                         <Select
               placeholder="Selecciona un evento"
               style={{ width: '100%' }}
               onChange={handleEventSelectForSearch}
               value={selectedEventForSearch?.id}
             >
              {availableEvents.map(event => (
                <Option key={event.id} value={event.id}>
                  {event.nombre} - {new Date(event.fecha_evento).toLocaleDateString('es-ES')}
                </Option>
              ))}
            </Select>
          </div>
          
          {selectedEventForSearch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Función</label>
                             <Select
                 placeholder="Selecciona una función"
                 style={{ width: '100%' }}
                 onChange={handleFunctionSelectForSearch}
                 value={selectedFunctionForSearch?.id}
               >
                                 {availableFunctions.map(func => (
                   <Option key={func.id} value={func.id}>
                     {func.sala?.nombre || 'Sala sin nombre'} - {new Date(func.fecha_celebracion).toLocaleString('es-ES')}
                   </Option>
                 ))}
              </Select>
            </div>
          )}
        </div>
      </Modal>

      {/* Drawer de configuración */}
      <Drawer
        title="Configuración"
        placement="right"
        onClose={() => setShowConfig(false)}
        open={showConfig}
        width={400}
      >
        <div className="space-y-4">
          <Card title="Plantillas de Precios">
            <Select
              placeholder="Selecciona una plantilla"
              style={{ width: '100%' }}
              onChange={(value) => setSelectedPlantillaPrecio(value)}
            >
              {plantillasPrecios.map(plantilla => (
                <Option key={plantilla.id} value={plantilla.id}>
                  {plantilla.nombre}
                </Option>
              ))}
            </Select>
          </Card>
          
          <Card title="Configuración General">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Modo bloqueo</span>
                <input
                  type="checkbox"
                  checked={blockMode}
                  onChange={(e) => setBlockMode(e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>
          </Card>
        </div>
      </Drawer>

      {/* Drawer de productos */}
      <Drawer
        title="Gestión de Productos"
        placement="right"
        onClose={() => setShowProducts(false)}
        open={showProducts}
        width={600}
      >
        <ProductosWidget onProductAdded={handleProductAdded} />
      </Drawer>

      {/* Drawer de BOX */}
      <Drawer
        title="BOX - Gestión de Ventas"
        placement="right"
        onClose={() => setShowBox(false)}
        open={showBox}
        width={500}
      >
        <div className="space-y-4">
          <Card title="Carrito Actual">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Asientos seleccionados:</span>
                <span>{selectedSeats.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Productos:</span>
                <span>{productosCarrito.reduce((sum, p) => sum + p.cantidad, 0)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </Card>
          
          <Card title="Acciones">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block onClick={handlePaymentClick}>
                Procesar Pago
              </Button>
              <Button block onClick={() => {
                setSelectedSeats([]);
                setProductosCarrito([]);
                message.success('Carrito limpiado');
              }}>
                Limpiar Carrito
              </Button>
            </Space>
          </Card>
        </div>
             </Drawer>

       {/* Modal de búsqueda de usuarios */}
       <Modal
         title="Buscar o Crear Usuario"
         open={showUserSearch}
         onCancel={() => setShowUserSearch(false)}
         footer={null}
         width={600}
       >
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Usuario</label>
             <Search
               placeholder="Buscar por nombre, login o teléfono"
               value={userSearchValue}
               onChange={(e) => {
                 setUserSearchValue(e.target.value);
                 handleUserSearch(e.target.value);
               }}
               loading={userSearchLoading}
               onSearch={handleUserSearch}
             />
           </div>

           {userSearchResults.length > 0 && (
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Resultados</label>
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {userSearchResults.map(user => (
                   <div
                     key={user.id}
                     className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                     onClick={() => handleSelectUser(user)}
                   >
                     <div className="font-medium">{user.full_name || user.login}</div>
                     <div className="text-sm text-gray-600">{user.login}</div>
                     {user.telefono && (
                       <div className="text-sm text-gray-500">{user.telefono}</div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           )}

           <div className="border-t pt-4">
             <Button
               type="primary"
               block
               onClick={() => setShowCreateUser(true)}
               icon={<UserOutlined />}
             >
               Crear Nuevo Usuario
             </Button>
           </div>
         </div>
       </Modal>

       {/* Modal de creación de usuario */}
       <Modal
         title="Crear Nuevo Usuario"
         open={showCreateUser}
         onCancel={() => setShowCreateUser(false)}
         footer={null}
         width={500}
       >
             <Form
               layout="vertical"
               onFinish={handleCreateUser}
             >
            <Form.Item
              name="full_name"
              label="Nombre Completo"
              rules={[{ required: true, message: 'Por favor ingresa el nombre completo' }]}
            >
              <Input placeholder="Nombre completo" />
            </Form.Item>

            <Form.Item
              name="login"
              label="Login/Email"
              rules={[
                { required: true, message: 'Por favor ingresa el login' },
                { type: 'email', message: 'Por favor ingresa un email válido' }
              ]}
            >
              <Input placeholder="usuario@ejemplo.com" />
            </Form.Item>

            <Form.Item
              name="telefono"
              label="Teléfono"
            >
              <Input placeholder="+1234567890" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Crear Usuario
              </Button>
            </Form.Item>
          </Form>
       </Modal>
     </div>
   );
 };

export default BoleteriaMain; 