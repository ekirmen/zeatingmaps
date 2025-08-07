import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs, Drawer, Form, Space, Typography, Tooltip } from 'antd';
import { SearchOutlined, UserOutlined, ShoppingCartOutlined, GiftOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SettingOutlined, EyeOutlined, UploadOutlined, ReloadOutlined, CloseOutlined, MoneyCollectOutlined, InfoCircleOutlined } from '@ant-design/icons';
import SimpleSeatingMap from './components/SimpleSeatingMap';
import DynamicPriceSelector from './components/DynamicPriceSelector';
import ProductosWidget from '../../../store/components/ProductosWidget';
import PaymentModal from './PaymentModal';
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
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);

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
  const [newUserData, setNewUserData] = useState({
    email: '',
    empresa: '',
    telefono: ''
  });
  
  // Estados para estadísticas
  const [eventStats, setEventStats] = useState({
    totalSeats: 0,
    availableSeats: 0,
    soldSeats: 0,
    reservedSeats: 0
  });

  // Estados para descuentos
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' o 'fixed'

  // Estados para búsqueda avanzada
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    zona: '',
    precioMin: '',
    precioMax: '',
    tipoEntrada: '',
    disponibilidad: 'all' // 'all', 'available', 'sold', 'reserved'
  });

  useEffect(() => {
    loadAvailableEvents();
    loadPlantillasPrecios();
  }, []);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl/Cmd + E: Buscar eventos
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        setShowEventSearch(true);
      }
      // Ctrl/Cmd + U: Buscar usuarios
      if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        event.preventDefault();
        setShowUserSearch(true);
      }
      // Ctrl/Cmd + P: Productos
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        setShowProducts(true);
      }
      // Ctrl/Cmd + D: Descuentos
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        setShowDiscountModal(true);
      }
      // Ctrl/Cmd + F: Búsqueda avanzada
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setShowAdvancedSearch(true);
      }
      // Ctrl/Cmd + X: Exportar datos
      if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
        event.preventDefault();
        exportEventData();
      }
      // Escape: Cerrar modales
      if (event.key === 'Escape') {
        setShowEventSearch(false);
        setShowUserSearch(false);
        setShowProducts(false);
        setShowDiscountModal(false);
        setShowAdvancedSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
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

  const loadEventStats = async (funcionId) => {
    if (!funcionId) return;
    
    try {
      // Cargar estadísticas del evento
      const { data: seats, error: seatsError } = await supabase
        .from('asientos')
        .select('*')
        .eq('funcion_id', funcionId);

      if (seatsError) {
        console.error('Error loading seats:', seatsError);
        return;
      }

      const totalSeats = seats?.length || 0;
      const soldSeats = seats?.filter(seat => seat.estado === 'vendido').length || 0;
      const reservedSeats = seats?.filter(seat => seat.estado === 'reservado').length || 0;
      const availableSeats = totalSeats - soldSeats - reservedSeats;

      setEventStats({
        totalSeats,
        availableSeats,
        soldSeats,
        reservedSeats
      });

      // Notificaciones de disponibilidad
      if (availableSeats <= 5 && availableSeats > 0) {
        message.warning(`⚠️ Solo quedan ${availableSeats} asientos disponibles`);
      } else if (availableSeats === 0) {
        message.error('❌ No hay asientos disponibles');
      } else if (availableSeats <= 10) {
        message.info(`ℹ️ Quedan ${availableSeats} asientos disponibles`);
      }
    } catch (error) {
      console.error('Error loading event stats:', error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.email) {
      message.error('El email es obligatorio');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          login: newUserData.email,
          empresa: newUserData.empresa,
          telefono: newUserData.telefono,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setSelectedClient(data);
      setNewUserData({ email: '', empresa: '', telefono: '' });
      setShowCreateUser(false);
      message.success('Usuario creado y seleccionado correctamente');
    } catch (error) {
      console.error('Error creating user:', error);
      message.error('Error al crear el usuario');
    }
  };

  const exportEventData = () => {
    if (!selectedEvent || !selectedFuncion) {
      message.warning('Selecciona un evento para exportar');
      return;
    }

    const exportData = {
      evento: selectedEvent,
      funcion: selectedFuncion,
      estadisticas: eventStats,
      cliente: selectedClient,
      asientosSeleccionados: selectedSeats,
      productos: productosCarrito,
      precioSeleccionado: selectedPriceOption,
      subtotal: calculateSubtotal(),
      descuento: selectedDiscount ? {
        tipo: discountType,
        cantidad: discountAmount,
        valor: discountType === 'percentage' ? 
          (calculateSubtotal() * discountAmount) / 100 : 
          discountAmount
      } : null,
      total: calculateTotal(),
      fechaExportacion: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evento_${selectedEvent.nombre}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    message.success('Datos exportados correctamente');
  };

  const handlePaymentClick = () => {
    console.log('handlePaymentClick called', {
      selectedClient,
      selectedFuncion,
      selectedPriceOption,
      selectedSeats: selectedSeats.length
    });
    
    if (!selectedClient) {
      message.warning('Selecciona un cliente antes de continuar');
      return;
    }
    if (!selectedFuncion) {
      message.warning('Selecciona un evento antes de continuar');
      return;
    }
    if (!selectedPriceOption) {
      message.warning('Selecciona una zona y precio antes de continuar');
      return;
    }
    if (selectedSeats.length === 0) {
      message.warning('Selecciona al menos un asiento antes de continuar');
      return;
    }
    console.log('Opening payment modal');
    setIsPaymentModalVisible(true);
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
    const subtotal = seatsTotal + productsTotal;
    
    // Aplicar descuento
    let discount = 0;
    if (selectedDiscount) {
      if (discountType === 'percentage') {
        discount = (subtotal * discountAmount) / 100;
      } else {
        discount = discountAmount;
      }
    }
    
    return Math.max(0, subtotal - discount);
  };

  const calculateSubtotal = () => {
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
    loadEventStats(functionId);
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
        <Tooltip title="Paso 1: Buscar y seleccionar evento" placement="right">
          <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowEventSearch(true)}>
            <SearchOutlined className="text-xl mb-1" />
            <div>Eventos</div>
          </div>
        </Tooltip>
        <Tooltip title="Paso 2: Buscar o crear cliente" placement="right">
          <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowUserSearch(true)}>
            <UserOutlined className="text-xl mb-1" />
            <div>Usuarios</div>
          </div>
        </Tooltip>
        <Tooltip title="Paso 3: Seleccionar cliente para la venta" placement="right">
          <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowConfig(true)}>
            <SettingOutlined className="text-xl mb-1" />
            <div>Config</div>
          </div>
        </Tooltip>
        <Tooltip title="Agregar productos adicionales" placement="right">
          <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowProducts(true)}>
            <GiftOutlined className="text-xl mb-1" />
            <div>Productos</div>
          </div>
        </Tooltip>
        <Tooltip title="Aplicar descuentos y códigos" placement="right">
          <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowDiscountModal(true)}>
            <MoneyCollectOutlined className="text-xl mb-1" />
            <div>Descuentos</div>
          </div>
        </Tooltip>
        <Tooltip title="Búsqueda avanzada de asientos" placement="right">
          <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowAdvancedSearch(true)}>
            <SearchOutlined className="text-xl mb-1" />
            <div>Búsqueda</div>
          </div>
        </Tooltip>
        <Tooltip title="Exportar datos del evento" placement="right">
          <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={exportEventData}>
            <UploadOutlined className="text-xl mb-1" />
            <div>Exportar</div>
          </div>
        </Tooltip>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {selectedEvent && selectedEvent.imagen_url ? (
                  <img 
                    src={selectedEvent.imagen_url} 
                    alt={selectedEvent.nombre}
                    className="w-6 h-6 rounded object-cover"
                    onError={(e) => {
                      e.target.src = '/assets/logo.png';
                    }}
                  />
                ) : (
                  <Avatar size="small" src="/assets/logo.png" alt="Event" />
                )}
                <div className="text-xs">
                  <div className="font-medium">
                    {selectedEvent ? selectedEvent.nombre : 'Selecciona un evento'}
                  </div>
                  <div className="text-gray-600">
                    <span>Fecha: {selectedEvent ? new Date(selectedEvent.fecha_evento).toLocaleDateString('es-ES') : 'N/A'}</span>
                    <span className="ml-2">Hora: {selectedFuncion ? new Date(selectedFuncion.fecha_celebracion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                  </div>
                  {selectedFuncion?.plantilla && (
                    <div className="text-xs text-green-600">
                      ✓ Plantilla: {selectedFuncion.plantilla.nombre}
                    </div>
                  )}
                  {selectedPriceOption && (
                    <div className="text-xs text-blue-600">
                      ✓ Precio: {selectedPriceOption.entrada.nombre_entrada} - {selectedPriceOption.zona.nombre}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{zoomLevel.toFixed(1)}X</span>
              <div className="text-xs text-gray-400">
                <span className="hidden md:inline">Atajos: Ctrl+E (Eventos) | Ctrl+U (Usuarios) | Ctrl+D (Descuentos) | Ctrl+X (Exportar)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Área principal */}
        <div className="flex-1 flex">
          {/* Contenido central */}
          <div className="flex-1 p-6">
            {/* Selección de precios dinámica */}
            {selectedFuncion && (
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
              
              {/* Información del Cliente */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                {selectedClient ? (
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Nombre:</span> {selectedClient.nombre}</div>
                    <div><span className="font-medium">Email:</span> {selectedClient.email}</div>
                    <div><span className="font-medium">Teléfono:</span> {selectedClient.telefono}</div>
                  </div>
                ) : (
                                     <div className="text-center">
                     <Tooltip title="Paso 2: Buscar o crear cliente para continuar">
                       <Button 
                         type="primary" 
                         size="small"
                         icon={<UserOutlined />}
                         onClick={() => setShowUserSearch(true)}
                       >
                         Seleccionar Cliente
                       </Button>
                     </Tooltip>
                     <div className="text-xs text-gray-500 mt-1">
                       Cliente requerido para continuar
                     </div>
                   </div>
                )}
              </div>
              
              {/* Estadísticas del Evento - Ahora en botón */}
              {selectedFuncion && (
                <div className="mb-4">
                  <Tooltip title="Ver estadísticas detalladas del evento">
                    <Button 
                      type="default" 
                      size="small"
                      icon={<InfoCircleOutlined />}
                      onClick={() => {
                        Modal.info({
                          title: 'Estadísticas del Evento',
                          content: (
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <span>Total Asientos:</span>
                                <span className="font-medium">{eventStats.totalSeats}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Disponibles:</span>
                                <span className="font-medium text-green-600">{eventStats.availableSeats}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Vendidos:</span>
                                <span className="font-medium text-red-600">{eventStats.soldSeats}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Reservados:</span>
                                <span className="font-medium text-orange-600">{eventStats.reservedSeats}</span>
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex justify-between">
                                  <span>Ocupación:</span>
                                  <span className="font-medium">
                                    {eventStats.totalSeats > 0 
                                      ? `${Math.round(((eventStats.soldSeats + eventStats.reservedSeats) / eventStats.totalSeats) * 100)}%`
                                      : '0%'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          ),
                          width: 400,
                        });
                      }}
                    >
                      Info Evento
                    </Button>
                  </Tooltip>
                </div>
              )}
              
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
                   <div className="flex justify-between">
                     <span>Subtotal:</span>
                     <span>${calculateSubtotal().toFixed(2)}</span>
                   </div>
                 </div>
                 
                 {selectedDiscount && (
                   <div className="flex justify-between text-green-600">
                     <span>Descuento ({discountType === 'percentage' ? `${discountAmount}%` : `$${discountAmount}`}):</span>
                     <span>-${discountType === 'percentage' ? 
                       ((calculateSubtotal() * discountAmount) / 100).toFixed(2) : 
                       discountAmount.toFixed(2)}</span>
                   </div>
                 )}
                 
                 <div className="border-t pt-2">
                   <div className="flex justify-between font-bold text-lg">
                     <span>Total:</span>
                     <span>${calculateTotal().toFixed(2)}</span>
                   </div>
                 </div>
               </div>
              
                             <div className="mt-6">
                 <Tooltip title="Paso 6: Procesar pago y completar venta">
                   <Button 
                     type="primary" 
                     size="large" 
                     block
                     className="bg-purple-600 hover:bg-purple-700"
                     onClick={handlePaymentClick}
                     disabled={!selectedFuncion || !selectedPriceOption || selectedSeats.length === 0 || !selectedClient}
                   >
                     {!selectedFuncion ? 'Selecciona un evento' :
                      !selectedClient ? 'Selecciona un cliente' :
                      !selectedPriceOption ? 'Selecciona una zona y precio' : 
                      selectedSeats.length === 0 ? 'Selecciona asientos' : 
                      `Pagar $${calculateTotal().toFixed(2)}`}
                   </Button>
                 </Tooltip>
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

      {/* Modal de búsqueda de usuarios */}
      <Modal
        title="Buscar/Agregar Usuario"
        open={showUserSearch}
        onCancel={() => setShowUserSearch(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por email</label>
            <Input.Search
              placeholder="Ingresa el email del usuario"
              value={userSearchValue}
              onChange={(e) => setUserSearchValue(e.target.value)}
              onSearch={async (value) => {
                if (!value) return;
                setUserSearchLoading(true);
                try {
                  const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('login', `%${value}%`)
                    .limit(10);
                  
                  if (error) throw error;
                  setUserSearchResults(data || []);
                } catch (error) {
                  console.error('Error searching users:', error);
                  message.error('Error al buscar usuarios');
                } finally {
                  setUserSearchLoading(false);
                }
              }}
              loading={userSearchLoading}
            />
          </div>
          
          {userSearchResults.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resultados</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userSearchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{user.login}</div>
                      <div className="text-sm text-gray-500">{user.empresa || 'Sin empresa'}</div>
                    </div>
                                         <Button 
                       size="small" 
                       type="primary"
                       onClick={() => {
                         setSelectedClient(user);
                         message.success(`Usuario seleccionado: ${user.login}`);
                         setShowUserSearch(false);
                       }}
                     >
                       Seleccionar
                     </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border-t pt-4">
            <Button 
              type="dashed" 
              block
              onClick={() => setShowCreateUser(true)}
            >
              Crear Nuevo Usuario
            </Button>
          </div>
        </div>
      </Modal>

             {/* Modal para crear usuario */}
       <Modal
         title="Crear Nuevo Usuario"
         open={showCreateUser}
         onCancel={() => setShowCreateUser(false)}
         footer={null}
         width={500}
       >
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
             <Input 
               placeholder="usuario@ejemplo.com"
               value={newUserData.email}
               onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Empresa (opcional)</label>
             <Input 
               placeholder="Nombre de la empresa"
               value={newUserData.empresa}
               onChange={(e) => setNewUserData(prev => ({ ...prev, empresa: e.target.value }))}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono (opcional)</label>
             <Input 
               placeholder="+1 234 567 8900"
               value={newUserData.telefono}
               onChange={(e) => setNewUserData(prev => ({ ...prev, telefono: e.target.value }))}
             />
           </div>
           <div className="flex space-x-2">
             <Button 
               type="primary"
               onClick={handleCreateUser}
             >
               Crear Usuario
             </Button>
             <Button onClick={() => setShowCreateUser(false)}>
               Cancelar
             </Button>
           </div>
         </div>
               </Modal>

        {/* Modal de Descuentos */}
        <Modal
          title="Aplicar Descuento"
          open={showDiscountModal}
          onCancel={() => setShowDiscountModal(false)}
          footer={null}
          width={500}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Descuento</label>
              <Select
                value={discountType}
                onChange={setDiscountType}
                style={{ width: '100%' }}
              >
                <Option value="percentage">Porcentaje (%)</Option>
                <Option value="fixed">Monto Fijo ($)</Option>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {discountType === 'percentage' ? 'Porcentaje de Descuento' : 'Monto de Descuento'}
              </label>
              <Input
                type="number"
                placeholder={discountType === 'percentage' ? '10' : '50.00'}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                addonAfter={discountType === 'percentage' ? '%' : '$'}
              />
            </div>
            
            {discountAmount > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Descuento:</span>
                    <span>-${discountType === 'percentage' ? 
                      ((calculateSubtotal() * discountAmount) / 100).toFixed(2) : 
                      discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                type="primary"
                onClick={() => {
                  if (discountAmount > 0) {
                    setSelectedDiscount(true);
                    message.success('Descuento aplicado correctamente');
                    setShowDiscountModal(false);
                  } else {
                    message.error('Ingresa un valor válido para el descuento');
                  }
                }}
              >
                Aplicar Descuento
              </Button>
              <Button 
                onClick={() => {
                  setSelectedDiscount(null);
                  setDiscountAmount(0);
                  setShowDiscountModal(false);
                }}
              >
                Remover Descuento
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de Búsqueda Avanzada */}
        <Modal
          title="Búsqueda Avanzada"
          open={showAdvancedSearch}
          onCancel={() => setShowAdvancedSearch(false)}
          footer={null}
          width={600}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona</label>
                <Input
                  placeholder="Filtrar por zona"
                  value={searchFilters.zona}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, zona: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Entrada</label>
                <Select
                  placeholder="Seleccionar tipo"
                  value={searchFilters.tipoEntrada}
                  onChange={(value) => setSearchFilters(prev => ({ ...prev, tipoEntrada: value }))}
                  style={{ width: '100%' }}
                >
                  <Option value="">Todos</Option>
                  <Option value="regular">Regular</Option>
                  <Option value="vip">VIP</Option>
                  <Option value="cortesia">Cortesía</Option>
                  <Option value="premium">Premium</Option>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio Mínimo</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={searchFilters.precioMin}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, precioMin: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio Máximo</label>
                <Input
                  type="number"
                  placeholder="1000.00"
                  value={searchFilters.precioMax}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, precioMax: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidad</label>
              <Select
                value={searchFilters.disponibilidad}
                onChange={(value) => setSearchFilters(prev => ({ ...prev, disponibilidad: value }))}
                style={{ width: '100%' }}
              >
                <Option value="all">Todos los asientos</Option>
                <Option value="available">Solo disponibles</Option>
                <Option value="sold">Solo vendidos</Option>
                <Option value="reserved">Solo reservados</Option>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                type="primary"
                onClick={() => {
                  message.success('Filtros aplicados');
                  setShowAdvancedSearch(false);
                }}
              >
                Aplicar Filtros
              </Button>
              <Button 
                onClick={() => {
                  setSearchFilters({
                    zona: '',
                    precioMin: '',
                    precioMax: '',
                    tipoEntrada: '',
                    disponibilidad: 'all'
                  });
                  message.info('Filtros limpiados');
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </Modal>

      {/* PaymentModal */}
      <PaymentModal
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        carrito={selectedSeats}
        selectedClient={selectedClient}
        selectedFuncion={selectedFuncion}
        selectedEvent={selectedEvent}
        selectedAffiliate={null}
      />

    </div>
  );
};

export default BoleteriaMain; 