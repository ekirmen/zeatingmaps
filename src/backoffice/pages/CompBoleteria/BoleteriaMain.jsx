import React, { useState, useEffect } from 'react';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs } from 'antd';
import { SearchOutlined, UserOutlined, QrcodeOutlined, ShoppingCartOutlined, GiftOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined } from '@ant-design/icons';
import CartWithTimer from '../../components/CartWithTimer';
import SeatAnimation from '../../components/SeatAnimation';
import ZonesAndPrices from './ZonesAndPrices';
import SimpleSeatingMap from './components/SimpleSeatingMap';
import PrintTicketButton from '../../components/PrintTicketButton';
import ProductosWidget from '../../../store/components/ProductosWidget';
import { useBoleteria } from '../../hooks/useBoleteria';
import { useClientManagement } from '../../hooks/useClientManagement';

const { Search } = Input;
const { Option } = Select;

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
    // Aquí implementarías la búsqueda por localizador
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
            <Button size="small" icon={<ZoomInOutlined />} />
            <Button size="small" icon={<FullscreenOutlined />} />
            <Button size="small" icon={<ZoomOutOutlined />} />
          </div>
          
          {/* Mapa de asientos */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
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
        <div className="text-white text-xs text-center">
          <SearchOutlined className="text-xl mb-1" />
          <div>Buscar</div>
        </div>
        <div className="text-white text-xs text-center">
          <UserOutlined className="text-xl mb-1" />
          <div>Config</div>
        </div>
        <div className="text-white text-xs text-center">
          <GiftOutlined className="text-xl mb-1" />
          <div>Productos</div>
        </div>
        <div className="bg-green-500 text-white text-xs text-center px-2 py-1 rounded">
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
                <div className="font-medium">CHICHIRIVICHE FESTIVAL MUSICAL 2025 CON NELSON VÉLAZQUEZ 14 DE AGOSTO PARQUE FERIAL LOS CAPRILES CHICHIRIVICHE</div>
                <div className="text-gray-600">
                  <span>Fecha: jueves 14/08/2025</span>
                  <span className="ml-4">Hora: 23:30</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button className="p-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
              <button className="p-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <span className="text-xs text-gray-500">1X</span>
              <button className="p-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="p-1 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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
    </div>
  );
};

export default BoleteriaMain; 