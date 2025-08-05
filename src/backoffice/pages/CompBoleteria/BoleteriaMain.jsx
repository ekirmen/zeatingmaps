import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs, Drawer, Form, Space, Typography } from 'antd';
import { SearchOutlined, UserOutlined, ShoppingCartOutlined, GiftOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SettingOutlined, EyeOutlined, UploadOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import SimpleSeatingMap from './components/SimpleSeatingMap';
import DynamicPriceSelector from './components/DynamicPriceSelector';
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
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    setSelectedEvent,
    setSelectedFuncion
  } = useBoleteria();

  const {
    selectedClient,
    setSelectedClient
  } = useClientManagement();

  // Estados locales
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [blockMode, setBlockMode] = useState(false);
  const [productosCarrito, setProductosCarrito] = useState([]);
  const [activeTab, setActiveTab] = useState('mapa');
  const [selectedPriceOption, setSelectedPriceOption] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Estados para funcionalidades
  const [showEventSearch, setShowEventSearch] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showBox, setShowBox] = useState(false);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [availableFunctions, setAvailableFunctions] = useState([]);
  const [selectedEventForSearch, setSelectedEventForSearch] = useState(null);
  const [selectedFunctionForSearch, setSelectedFunctionForSearch] = useState(null);
  const [plantillasPrecios, setPlantillasPrecios] = useState([]);
  
  // Estados para búsqueda de usuarios
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchValue, setUserSearchValue] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);

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
        .select('*, sala(*)')
        .eq('evento', eventId)
        .order('fecha_celebracion', { ascending: true });

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
        .from('plantillas')
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
          // Asegurar que el asiento tenga el precio correcto
          const seatWithPrice = {
            ...seat,
            precio: selectedPriceOption?.precio || 0,
            precioInfo: selectedPriceOption ? {
              entrada: selectedPriceOption.entrada,
              zona: selectedPriceOption.zona,
              comision: selectedPriceOption.comision,
              precioOriginal: selectedPriceOption.precioOriginal,
              category: selectedPriceOption.category
            } : null
          };
          newSeats = [...prev, seatWithPrice];
        }
        
        // Guardar en localStorage
        localStorage.setItem('selectedSeats', JSON.stringify(newSeats));
        return newSeats;
      });
    }
  };

  const calculateTotal = () => {
    const seatsTotal = selectedSeats.reduce((sum, seat) => {
      const seatPrice = seat.precio || selectedPriceOption?.precio || 0;
      return sum + seatPrice;
    }, 0);
    const productsTotal = productosCarrito.reduce((sum, product) => sum + (product.precio * product.cantidad), 0);
    return seatsTotal + productsTotal;
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

  const handlePriceOptionSelect = (priceOption) => {
    setSelectedPriceOption(priceOption);
    message.success(`Precio seleccionado: ${priceOption.nombre} - $${priceOption.precio.toFixed(2)}`);
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
      key: 'mapa',
      label: 'Mapa',
      children: (
        <div className="relative">
          <div className="absolute bottom-4 left-4 z-10 flex space-x-2">
            <Button size="small" icon={<ZoomInOutlined />} onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))} />
            <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))} />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm overflow-hidden">
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}>
              <SimpleSeatingMap
                selectedFuncion={selectedFuncion}
                onSeatClick={handleSeatClick}
                selectedSeats={selectedSeats}
                blockedSeats={blockedSeats}
                blockMode={blockMode}
                selectedPlantilla={selectedPlantilla}
                selectedPriceOption={selectedPriceOption}
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
    }
  ];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar izquierda */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
        <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowEventSearch(true)}>
          <SearchOutlined className="text-xl mb-1" />
          <div>Eventos</div>
        </div>
        <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowUserSearch(true)}>
          <UserOutlined className="text-xl mb-1" />
          <div>Usuarios</div>
        </div>
        <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowConfig(true)}>
          <SettingOutlined className="text-xl mb-1" />
          <div>Config</div>
        </div>
        <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowProducts(true)}>
          <GiftOutlined className="text-xl mb-1" />
          <div>Productos</div>
        </div>
        <div className="bg-green-500 text-white text-xs text-center px-2 py-1 rounded cursor-pointer hover:bg-green-600" onClick={() => setShowBox(true)}>
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
                                       {selectedFuncion?.plantilla && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Plantilla: {selectedFuncion.plantilla.nombre}
                      </div>
                    )}
                   {selectedPriceOption && (
                     <div className="text-xs text-blue-600 mt-1">
                       ✓ Precio: {selectedPriceOption.entrada.nombre_entrada} - {selectedPriceOption.zona.nombre}
                     </div>
                   )}
                 </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{zoomLevel.toFixed(1)}X</span>
            </div>
          </div>
        </div>

        {/* Área principal */}
        <div className="flex-1 flex">
          {/* Contenido central */}
          <div className="flex-1 p-6">
            {/* Selección de precios dinámica */}
            {!selectedFuncion ? (
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Paso 1: Selecciona un Evento</h3>
                  <p className="text-blue-700 mb-4">Primero debes seleccionar un evento y función para ver las opciones de precio</p>
                  <Button 
                    type="primary" 
                    onClick={() => setShowEventSearch(true)}
                    icon={<SearchOutlined />}
                  >
                    Seleccionar Evento
                  </Button>
                </div>
              </div>
                         ) : (
               <DynamicPriceSelector
                 selectedFuncion={selectedFuncion}
                 onPriceSelect={handlePriceOptionSelect}
                 selectedPriceId={selectedPriceOption?.id}
               />
             )}

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
              
              {selectedPriceOption && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Precio Seleccionado</h4>
                  <div className="text-sm space-y-1">
                                         <div><span className="font-medium">Entrada:</span> {selectedPriceOption.entrada.nombre_entrada}</div>
                    <div><span className="font-medium">Zona:</span> {selectedPriceOption.zona.nombre}</div>
                    <div><span className="font-medium">Precio:</span> ${selectedPriceOption.precio.toFixed(2)}</div>
                    {selectedPriceOption.comision > 0 && (
                      <div><span className="font-medium">Comisión:</span> ${selectedPriceOption.comision.toFixed(2)}</div>
                    )}
                    <div className="mt-2">
                      <Badge 
                        count={selectedPriceOption.category === 'cortesia' ? 'Cortesía' : 
                               selectedPriceOption.category === 'vip' ? 'VIP' : 
                               selectedPriceOption.category === 'premium' ? 'Premium' : 'Regular'} 
                        style={{ 
                          backgroundColor: selectedPriceOption.category === 'cortesia' ? '#52c41a' : 
                                         selectedPriceOption.category === 'vip' ? '#faad14' : 
                                         selectedPriceOption.category === 'premium' ? '#722ed1' : '#1890ff'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Asientos seleccionados */}
              {selectedSeats.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Asientos Seleccionados</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedSeats.map((seat, index) => (
                      <div key={seat._id || index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {seat.nombre || `Asiento ${seat._id}`}
                          </div>
                          {seat.precioInfo && (
                                                         <div className="text-xs text-gray-600">
                               {seat.precioInfo.entrada.nombre_entrada} - {seat.precioInfo.zona.nombre}
                             </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">
                            ${(seat.precio || selectedPriceOption?.precio || 0).toFixed(2)}
                          </div>
                          <Button 
                            size="small" 
                            type="text" 
                            danger
                            onClick={() => {
                              setSelectedSeats(prev => prev.filter(s => s._id !== seat._id));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Boletos:</span>
                  <span>{selectedSeats.length}, ${selectedSeats.reduce((sum, seat) => {
                    const seatPrice = seat.precio || selectedPriceOption?.precio || 0;
                    return sum + seatPrice;
                  }, 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Productos:</span>
                  <span>{productosCarrito.reduce((sum, p) => sum + p.cantidad, 0)}, ${productosCarrito.reduce((sum, product) => sum + (product.precio * product.cantidad), 0).toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handlePaymentClick}
                  disabled={!selectedFuncion || !selectedPriceOption || selectedSeats.length === 0}
                >
                  {!selectedFuncion ? 'Selecciona un evento' :
                   !selectedPriceOption ? 'Selecciona una zona y precio' : 
                   selectedSeats.length === 0 ? 'Selecciona asientos' : 
                   `Pagar $${calculateTotal().toFixed(2)}`}
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
            <div className="space-y-3">
              <Select
                placeholder="Selecciona una plantilla"
                style={{ width: '100%' }}
                onChange={(value) => {
                  const plantilla = plantillasPrecios.find(p => p.id === value);
                  setSelectedPlantilla(plantilla);
                  setSelectedPriceOption(null);
                  message.success(`Plantilla seleccionada: ${plantilla?.nombre}`);
                }}
                value={selectedPlantilla?.id}
              >
                {plantillasPrecios.map(plantilla => (
                  <Option key={plantilla.id} value={plantilla.id}>
                    {plantilla.nombre}
                  </Option>
                ))}
              </Select>
            </div>
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