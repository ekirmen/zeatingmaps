import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadAvailableEvents();
    loadPlantillasPrecios();
  }, []);

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
      const { data, error } = await supabase
        .from('funciones')
        .select('*, salas(*)')
        .eq('evento_id', eventId)
        .order('fechaCelebracion', { ascending: true });

      if (error) {
        console.error('Error loading functions:', error);
        return;
      }

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
        const isBlocked = prev.find(s => s.id === seat.id);
        if (isBlocked) {
          return prev.filter(s => s.id !== seat.id);
        } else {
          return [...prev, seat];
        }
      });
    } else {
      setSelectedSeats(prev => {
        const isSelected = prev.find(s => s.id === seat.id);
        if (isSelected) {
          return prev.filter(s => s.id !== seat.id);
        } else {
          return [...prev, seat];
        }
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
    message.success(`Evento seleccionado: ${selectedEventForSearch?.nombre} - ${func?.sala?.nombre}`);
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
          <div className="bg-white p-6 rounded-lg shadow-sm" style={{ transform: `scale(${zoomLevel})` }}>
            {/* Bloques de escenario */}
            <div className="text-center mb-4">
              <div className="bg-black text-white py-2 px-4 rounded inline-block">
                ESCENARIO
              </div>
            </div>
            
            {/* Asientos */}
            <div className="grid grid-cols-10 gap-1 mb-4">
              {Array.from({ length: 80 }, (_, i) => (
                <div
                  key={i + 1}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs cursor-pointer
                    ${selectedSeats.find(s => s.id === i + 1) 
                      ? 'bg-blue-500 text-white' 
                      : blockedSeats.find(s => s.id === i + 1)
                      ? 'bg-gray-400 text-white'
                      : 'bg-orange-300 hover:bg-orange-400'
                    }
                  `}
                  onClick={() => handleSeatClick({ id: i + 1, precio: 17 + (i % 3) * 20 })}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
              ))}
            </div>
            
            {/* Segundo bloque de escenario */}
            <div className="text-center mb-4">
              <div className="bg-black text-white py-2 px-4 rounded inline-block">
                ESCENARIO
              </div>
            </div>
            
            {/* Área General */}
            <div className="bg-blue-500 text-white py-8 text-center rounded">
              <h3 className="text-lg font-semibold">GENERAL</h3>
              <p className="text-sm">Área de pie</p>
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

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar izquierda */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
        <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={handleSearchClick}>
          <SearchOutlined className="text-xl mb-1" />
          <div>Buscar</div>
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
                <Avatar size="small" src="https://via.placeholder.com/32x32" />
                <span className="text-sm font-medium">chichiriviche</span>
              </div>
              <div className="text-sm">
                <div className="font-medium">
                  {selectedEvent ? selectedEvent.nombre : 'Selecciona un evento'}
                </div>
                <div className="text-gray-600">
                  <span>Fecha: {selectedEvent ? new Date(selectedEvent.fecha_evento).toLocaleDateString('es-ES') : 'N/A'}</span>
                  <span className="ml-4">Hora: {selectedFuncion ? new Date(selectedFuncion.fechaCelebracion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
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
                    {func.sala?.nombre} - {new Date(func.fechaCelebracion).toLocaleString('es-ES')}
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
    </div>
  );
};

export default BoleteriaMain; 