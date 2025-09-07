import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs, Drawer, Form, Space, Typography, Tooltip, InputNumber } from 'antd';
import { SearchOutlined, UserOutlined, ShoppingCartOutlined, GiftOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SettingOutlined, EyeOutlined, UploadOutlined, ReloadOutlined, CloseOutlined, MoneyCollectOutlined, InfoCircleOutlined, QuestionCircleOutlined, FormOutlined, MailOutlined, BellOutlined, ArrowLeftOutlined, DownloadOutlined, HistoryOutlined, AimOutlined, CompressOutlined } from '@ant-design/icons';
import LazySimpleSeatingMap from './LazySimpleSeatingMap';
import DynamicPriceSelector from './components/DynamicPriceSelector';
import ZonesPanel from './components/ZonesPanel.jsx';
import ProductosWidget from '../../../store/components/ProductosWidget';
import PaymentModal from './PaymentModal';
import CustomFormBuilder from './components/CustomFormBuilder';
import MailChimpIntegration from './components/MailChimpIntegration';
import PushNotifications from './components/PushNotifications';
import DownloadTicketButton from './DownloadTicketButton';
import ServerDiagnostic from './ServerDiagnostic';
import LocatorSearchModal from './components/LocatorSearchModal';
import { useBoleteria } from '../../hooks/useBoleteria';
import { useClientManagement } from '../../hooks/useClientManagement';
import { supabase } from '../../../supabaseClient';
import resolveImageUrl from '../../../utils/resolveImageUrl';
import '../../../styles/design-system.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const BoleteriaMainCustomDesign = () => {
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('mapa');
  const [showEventSearch, setShowEventSearch] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLocatorSearch, setShowLocatorSearch] = useState(false);
  const [showCartManagement, setShowCartManagement] = useState(false);
  const [showServerDiagnostic, setShowServerDiagnostic] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [blockMode, setBlockMode] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [foundPayment, setFoundPayment] = useState(null);
  const [locatorSearchValue, setLocatorSearchValue] = useState('');
  const [locatorSearchLoading, setLocatorSearchLoading] = useState(false);
  const [userSearchValue, setUserSearchValue] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserData, setNewUserData] = useState({});
  const [eventStats, setEventStats] = useState({});
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [selectedPriceOption, setSelectedPriceOption] = useState(null);
  const [activeZoneId, setActiveZoneId] = useState(null);

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
    setSelectedEvent,
    setSelectedFuncion,
    setSelectedPlantilla,
    zonas,
    loading,
    error,
    debugInfo
  } = useBoleteria();

  const {
    selectedClient,
    setSelectedClient,
    searchUsers,
    createUser,
    loading: clientLoading
  } = useClientManagement();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Función para manejar selección de precios
  const handlePriceOptionSelect = (priceOption) => {
    console.log('🎯 [BoleteriaMainCustomDesign] handlePriceOptionSelect llamado con:', priceOption);
    setSelectedPriceOption(priceOption);
    message.success(`Precio seleccionado: ${priceOption.entrada.nombre_entrada} - $${priceOption.precio}`);
  };

  // Función para manejar clics en asientos
  const handleSeatClick = (seat) => {
    console.log('🎯 [BoleteriaMain] handleSeatClick llamado con:', seat);
    
    if (!selectedFuncion) {
      message.warning('Por favor selecciona una función primero');
      return;
    }

    if (blockMode) {
      // En modo bloqueo, manejar bloqueo/desbloqueo
      const isCurrentlyBlocked = blockedSeats.find(s => s._id === seat._id);
      
      if (isCurrentlyBlocked) {
        // Desbloquear
        setBlockedSeats(prev => prev.filter(s => s._id !== seat._id));
        message.success(`Asiento ${seat.nombre || seat._id} desbloqueado`);
      } else {
        // Bloquear
        setBlockedSeats(prev => [...prev, seat]);
        message.success(`Asiento ${seat.nombre || seat._id} bloqueado`);
      }
    } else {
      // En modo normal, manejar selección para carrito
      setSelectedSeats(prev => {
        const currentSeats = Array.isArray(prev) ? prev : [];
        const isSelected = currentSeats.find(s => s._id === seat._id);
        let newSeats;
        
        if (isSelected) {
          // Deselección: el asiento ya fue desbloqueado en la BD por LazySimpleSeatingMap
          newSeats = currentSeats.filter(s => s._id !== seat._id);
          console.log('✅ [BoleteriaMain] Asiento removido del carrito:', seat._id, 'Nuevo estado:', newSeats.length, 'asientos');
        } else {
          // Selección: el asiento ya fue bloqueado en la BD por LazySimpleSeatingMap
          const seatWithPrice = {
            ...seat,
            precio: 0,
            precioInfo: null
          };
          newSeats = [...currentSeats, seatWithPrice];
          console.log('✅ [BoleteriaMain] Asiento agregado al carrito:', seat._id, 'Nuevo estado:', newSeats.length, 'asientos');
        }
        
        return newSeats;
      });
    }
  };

  // Callback para manejar cambios en bloqueos desde LazySimpleSeatingMap
  const handleLockChange = (action, seatId, lockData) => {
    console.log('🔄 [BoleteriaMain] handleLockChange llamado:', { action, seatId, lockData });
    
    if (action === 'lock') {
      // Agregar el bloqueo al estado local
      setLockedSeats(prev => {
        const existingLock = prev.find(lock => lock.seatId === seatId);
        if (existingLock) {
          return prev.map(lock => 
            lock.seatId === seatId ? { ...lock, ...lockData } : lock
          );
        } else {
          return [...prev, { seatId, ...lockData }];
        }
      });
    } else if (action === 'unlock') {
      // Remover el bloqueo del estado local
      setLockedSeats(prev => prev.filter(lock => lock.seatId !== seatId));
    }
  };

  // Función para manejar zoom
  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  // Función para manejar pan
  const handlePanStart = (e) => {
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handlePanMove = (e) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Función para calcular totales
  const calculateSubtotal = () => {
    return selectedSeats.reduce((total, seat) => total + (seat.precio || 0), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    } else {
      return Math.min(discountValue, subtotal);
    }
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">Error: {error}</div>;
  }

  if (!selectedFuncion) {
    return <div className="flex items-center justify-center min-h-screen">Por favor selecciona una función</div>;
  }

  return (
    <div>
      <div className="min-h-screen flex bg-gray-100">
        {/* Sidebar izquierda */}
        <div className="w-16 bg-gray-800 flex flex-col items-center py-md space-y-md">
          {/* Botón de Atrás */}
          <Tooltip title="Volver atrás" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-sm rounded-md transition-normal" onClick={() => window.history.back()}>
              <ArrowLeftOutlined className="text-xl mb-xs" />
              <div>Atrás</div>
            </div>
          </Tooltip>

          {/* Buscar Eventos */}
          <Tooltip title="Buscar eventos" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-sm rounded-md transition-normal" onClick={() => setShowEventSearch(true)}>
              <SearchOutlined className="text-xl mb-xs" />
              <div>Eventos</div>
            </div>
          </Tooltip>

          {/* Descuentos */}
          <Tooltip title="Aplicar descuentos" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-sm rounded-md transition-normal" onClick={() => setShowDiscountModal(true)}>
              <MoneyCollectOutlined className="text-xl mb-xs" />
              <div>Descuentos</div>
            </div>
          </Tooltip>

          {/* Productos */}
          <Tooltip title="Productos adicionales" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-sm rounded-md transition-normal" onClick={() => setActiveTab('productos')}>
              <GiftOutlined className="text-xl mb-xs" />
              <div>Productos</div>
            </div>
          </Tooltip>

          {/* Buscar por Localizador */}
          <Tooltip title="Buscar por localizador" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-sm rounded-md transition-normal" onClick={() => setShowLocatorSearch(true)}>
              <SearchOutlined className="text-xl mb-xs" />
              <div>Localizador</div>
            </div>
          </Tooltip>

          {/* Gestión de Carrito */}
          <Tooltip title="Gestión de carrito" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-sm rounded-md transition-normal" onClick={() => setShowCartManagement(true)}>
              <ShoppingCartOutlined className="text-xl mb-xs" />
              <div>Carrito</div>
            </div>
          </Tooltip>

          {/* Diagnóstico del Servidor */}
          <Tooltip title="Diagnóstico del servidor" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-sm rounded-md transition-normal" onClick={() => setShowServerDiagnostic(true)}>
              <InfoCircleOutlined className="text-xl mb-xs" />
              <div>Diagnóstico</div>
            </div>
          </Tooltip>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm border-b border-gray-200 px-md py-sm">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-semibold m-0">
                  {selectedEvent?.nombre || 'Selecciona un evento'}
                </h1>
                {selectedFuncion && (
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">
                      {selectedFuncion.nombre} - {new Date(selectedFuncion.fecha).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-sm text-xs">
                <div className="flex items-center gap-sm text-xs">
                  <span className="text-gray-500">Bloqueo:</span>
                  <Button 
                    size="small" 
                    type={blockMode ? "primary" : "default"}
                    onClick={() => setBlockMode(!blockMode)}
                  >
                    {blockMode ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
                <div className="flex items-center gap-sm">
                  <span className="text-gray-500">Buscar venta</span>
                </div>
                <span className="text-gray-500">{zoomLevel.toFixed(1)}X</span>
                <Tooltip title={<div className="text-xs"><div className="font-medium mb-sm">Atajos de Teclado:</div><div>• <strong>Ctrl+E:</strong> Buscar eventos</div><div>• <strong>Ctrl+U:</strong> Buscar usuarios</div><div>• <strong>Ctrl+L:</strong> Búsqueda por localizador</div><div>• <strong>Ctrl+X:</strong> Exportar datos</div><div>• <strong>Escape:</strong> Cerrar modales</div></div>} placement="bottom">
                  <QuestionCircleOutlined className="text-gray-400 hover:text-primary cursor-help transition-normal" />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Área de trabajo */}
          <div className="flex-1 flex">
            {/* Panel izquierdo - Zonas y Precios */}
            <div className="w-80 bg-white border-r border-gray-200 p-md overflow-y-auto">
              <h3 className="text-sm font-semibold mb-md text-gray-700">Zonas y Precios</h3>
              
              {!selectedFuncion ? (
                <div className="mb-md p-sm bg-warning-light border border-warning rounded-md text-warning-dark text-xs">
                  ⚠️ Selecciona una función para ver las zonas disponibles
                </div>
              ) : (
                <div className="mb-md p-sm bg-info-light border border-info rounded-md text-info-dark text-xs">
                  ✅ Función seleccionada: {selectedFuncion.nombre}
                  <div className="mt-xs">
                    <span>• <kbd className="bg-white px-xs rounded-sm">Rueda</kbd> Zoom</span>
                    <span>• <kbd className="bg-white px-xs rounded-sm">Click + Arrastrar</kbd> Pan</span>
                  </div>
                </div>
              )}

              <ZonesPanel 
                selectedFuncion={selectedFuncion}
                selectedPlantilla={selectedPlantilla}
                selectedZonaId={activeZoneId}
                onSelectZona={(zonaId) => setActiveZoneId(String(zonaId))}
                onSelectPrice={handlePriceOptionSelect}
                selectedPriceId={selectedPriceOption?.id}
                mapa={mapa}
                onPricesLoaded={(zonasArray) => {
                  console.log('🎯 onPricesLoaded llamado con:', zonasArray);
                }}
              />
              
              {!blockMode && !selectedPriceOption && (
                <div className="mb-md p-sm bg-warning-light border border-warning rounded-md text-warning-dark text-xs">
                  ⚠️ Primero selecciona una zona y precio antes de elegir asientos
                </div>
              )}
            </div>

            {/* Área del mapa */}
            <div className="flex-1 relative bg-white">
              {mapa && (
                <div
                  style={{ 
                    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`, 
                    transformOrigin: '0 0'
                  }}
                >
                  <LazySimpleSeatingMap
                    selectedFuncion={selectedFuncion}
                    onSeatClick={handleSeatClick}
                    selectedSeats={selectedSeats}
                    blockedSeats={blockedSeats}
                    blockMode={blockMode}
                    zonas={zonas}
                    selectedPlantilla={selectedPlantilla}
                    selectedPriceOption={selectedPriceOption}
                    selectedZonaId={activeZoneId}
                    mapa={mapa}
                    lockedSeats={lockedSeats}
                    onLockChange={handleLockChange}
                  />
                </div>
              )}

              {/* Controles de zoom */}
              <div className="absolute top-md right-md z-20">
                <div className="flex flex-col gap-xs">
                  <Button 
                    size="small" 
                    icon={<ZoomInOutlined />}
                    onClick={() => handleZoom(0.1)}
                  />
                  <Button 
                    size="small" 
                    icon={<ZoomOutOutlined />}
                    onClick={() => handleZoom(-0.1)}
                  />
                </div>
              </div>

              {/* Leyenda de asientos */}
              <div className="absolute bottom-md left-md z-20 bg-white p-md rounded-lg shadow-lg">
                <div className="text-xs">
                  <div className="font-medium mb-sm">Estado de Asientos:</div>
                  <div className="text-xs">
                    <div className="flex items-center gap-sm"><div className="w-3 h-3 rounded-full bg-info"></div><span>Disponible</span></div>
                    <div className="flex items-center gap-sm"><div className="w-3 h-3 rounded-full bg-warning"></div><span>Seleccionado</span></div>
                    <div className="flex items-center gap-sm"><div className="w-3 h-3 rounded-full bg-warning-dark"></div><span>Bloqueado por mí</span></div>
                    <div className="flex items-center gap-sm"><div className="w-3 h-3 rounded-full bg-error"></div><span>Bloqueado por otro</span></div>
                    <div className="flex items-center gap-sm"><div className="w-3 h-3 rounded-full bg-gray-500"></div><span>Vendido</span></div>
                    <div className="flex items-center gap-sm"><div className="w-3 h-3 rounded-full bg-warning-light"></div><span>Reservado</span></div>
                  </div>
                </div>
              </div>

              {/* Indicador de modo bloqueo */}
              {blockMode && (
                <div className="absolute top-md left-md z-20 bg-error-light border border-error rounded-lg p-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 bg-error rounded-full"></div>
                    <span className="text-sm font-medium text-error-dark">Modo Bloqueo Activo</span>
                  </div>
                  <p className="text-xs text-error mt-xs">
                    Haz clic en los asientos para bloquearlos/desbloquearlos
                  </p>
                </div>
              )}
            </div>

            {/* Panel derecho - Carrito */}
            <div className="w-80 bg-white shadow-lg flex flex-col">
              {/* Header del carrito */}
              <div className="p-md border-b border-gray-200">
                <h2 className="text-lg font-semibold m-0">Carrito de Compras</h2>
              </div>

              {/* Contenido del carrito */}
              <div className="flex-1 p-md overflow-y-auto">
                {/* Información del cliente */}
                <div className="mb-sm p-sm bg-info-light rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-sm">Cliente</h4>
                  {selectedClient ? (
                    <div className="text-sm">
                      <div className="font-medium">{selectedClient.nombre}</div>
                      <div className="text-xs text-gray-500 mt-xs">
                        {selectedClient.email}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button size="small" type="primary">
                        Seleccionar Cliente
                      </Button>
                      <div className="text-xs text-gray-500 mt-xs">
                        Sin cliente seleccionado
                      </div>
                    </div>
                  )}
                </div>

                {/* Asientos seleccionados */}
                <div className="mb-md">
                  <h4 className="font-medium text-gray-900 mb-sm">Asientos Seleccionados</h4>
                  {selectedSeats.length > 0 ? (
                    <div className="space-y-sm">
                      {selectedSeats.map((seat, index) => (
                        <div key={seat._id || index} className="flex items-center justify-between p-sm bg-info-light rounded-md">
                          <div>
                            <div className="font-medium text-sm">
                              {seat.nombre || seat._id}
                            </div>
                            <div className="text-xs text-gray-500">
                              Zona: {seat.zona?.nombre || 'Sin zona'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">
                              ${seat.precio?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm">
                      No hay asientos seleccionados
                    </div>
                  )}
                </div>

                {/* Productos adicionales */}
                <div className="mb-md">
                  <h4 className="font-medium text-gray-900 mb-sm flex items-center gap-sm">
                    <span className="text-success">🛍️</span>
                    Productos Adicionales
                  </h4>
                  <ProductosWidget />
                </div>

                {/* Resumen de totales */}
                <div className="border-t border-gray-200 pt-md">
                  <div className="flex justify-between items-center p-sm bg-gray-50 rounded-lg">
                    <span className="flex items-center gap-sm">
                      <span className="text-gray-500">🛒</span>
                      <span>Subtotal:</span>
                    </span>
                    <span className="font-semibold text-gray-700">${calculateSubtotal().toFixed(2)}</span>
                  </div>

                  {discountValue > 0 && (
                    <div className="flex justify-between items-center p-sm bg-success-light rounded-lg border border-success">
                      <span className="flex items-center gap-sm">
                        <span className="text-success">🎁</span>
                        <span>Descuento:</span>
                      </span>
                      <span className="font-semibold text-success">-${calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-md">
                  <div className="flex justify-between items-center p-md bg-primary rounded-lg">
                    <span className="flex items-center gap-sm text-white">
                      <span className="text-warning">💰</span>
                      <span className="font-bold text-lg">Total:</span>
                    </span>
                    <span className="font-bold text-2xl text-white">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Botón de pago */}
                <div className="mt-md">
                  <Button 
                    type="primary" 
                    size="large" 
                    block
                    className="bg-secondary hover:bg-secondary-hover"
                  >
                    Proceder al Pago
                  </Button>
                </div>

                {/* Indicador de modo bloqueo */}
                {blockMode && (
                  <div className="mt-md p-md bg-error-light border border-error rounded-lg">
                    <div className="flex items-center gap-sm">
                      <div className="w-3 h-3 bg-error rounded-full"></div>
                      <span className="text-sm font-medium text-error-dark">Modo Bloqueo Activo</span>
                    </div>
                    <p className="text-xs text-error">
                      Los asientos se bloquean temporalmente al hacer clic
                    </p>
                    <div className="mt-sm text-xs text-error-dark">
                      <div>• Click en asiento = Bloquear</div>
                      <div>• Click en asiento bloqueado = Desbloquear</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer del carrito */}
              <div className="p-md border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Asientos: {selectedSeats.length}</span>
                  <span>Total: ${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <Modal
        title="Buscar Eventos"
        open={showEventSearch}
        onCancel={() => setShowEventSearch(false)}
        footer={null}
      >
        <div className="text-center text-gray-500 py-xl">
          Funcionalidad de búsqueda de eventos en desarrollo
        </div>
      </Modal>

      <Modal
        title="Aplicar Descuentos"
        open={showDiscountModal}
        onCancel={() => setShowDiscountModal(false)}
        footer={null}
      >
        <div className="text-center text-gray-500 py-xl">
          Funcionalidad de descuentos en desarrollo
        </div>
      </Modal>

      <LocatorSearchModal
        open={showLocatorSearch}
        onCancel={() => setShowLocatorSearch(false)}
      />

      <Modal
        title="Gestión de Carrito"
        open={showCartManagement}
        onCancel={() => setShowCartManagement(false)}
        footer={null}
      >
        <div className="text-center text-gray-500 py-xl">
          Funcionalidad de gestión de carrito en desarrollo
        </div>
      </Modal>

      <Modal
        title="Diagnóstico del Servidor"
        open={showServerDiagnostic}
        onCancel={() => setShowServerDiagnostic(false)}
        footer={null}
      >
        <div className="text-center text-gray-500 py-xl">
          Funcionalidad de diagnóstico en desarrollo
        </div>
      </Modal>
    </div>
  );
};

export default BoleteriaMainCustomDesign;
