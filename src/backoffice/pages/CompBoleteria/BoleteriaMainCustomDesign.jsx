import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs, Drawer, Form, Space, Typography, Tooltip, InputNumber, Spin, Progress } from 'antd';
import { SearchOutlined, UserOutlined, ShoppingCartOutlined, GiftOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SettingOutlined, EyeOutlined, UploadOutlined, ReloadOutlined, CloseOutlined, MoneyCollectOutlined, InfoCircleOutlined, QuestionCircleOutlined, FormOutlined, MailOutlined, BellOutlined, ArrowLeftOutlined, DownloadOutlined, HistoryOutlined, AimOutlined, CompressOutlined } from '@ant-design/icons';
import LazySimpleSeatingMap from './LazySimpleSeatingMap';
import DynamicPriceSelector from './components/DynamicPriceSelector';
import ZonesPanel from './components/ZonesPanel.jsx';
import GridSaleMode from './components/GridSaleMode';
import ProductosWidget from '../../../store/components/ProductosWidget';
import PaymentModal from './PaymentModal';
import ClientModals from './ClientModals';
import CustomFormBuilder from './components/CustomFormBuilder';
import MailChimpIntegration from './components/MailChimpIntegration';
import PushNotifications from './components/PushNotifications';
import DownloadTicketButton from './DownloadTicketButton';
import ServerDiagnostic from './ServerDiagnostic';
import LocatorSearchModal from './components/LocatorSearchModal';
import ValidationWidget from '../../../components/ValidationWidget';
import VisualNotifications from '../../../utils/VisualNotifications';
import EventImage from '../../../store/components/EventImage';
import { getEstadoVentaInfo } from '../../../utils/estadoVenta';
import { useCountdown, formatCountdown, findNextStart } from '../../../utils/countdown';
import { useBoleteria } from '../../hooks/useBoleteria';
import { useClientManagement } from '../../hooks/useClientManagement';
import { useTenant } from '../../../contexts/TenantContext';
import { supabase } from '../../../supabaseClient';
import resolveImageUrl from '../../../utils/resolveImageUrl';
import useSelectedSeatsStore from '../../../stores/useSelectedSeatsStore';
import '../../../styles/design-system.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const BoleteriaMainCustomDesign = () => {
  const location = useLocation();
  const { currentTenant } = useTenant();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('mapa');
  const [showEventSearch, setShowEventSearch] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLocatorSearch, setShowLocatorSearch] = useState(false);
  const [showCartManagement, setShowCartManagement] = useState(false);
  const [showServerDiagnostic, setShowServerDiagnostic] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [blockMode, setBlockMode] = useState(false);
  // Las variables del store unificado ahora vienen del hook useBoleteria
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [paymentData, setPaymentData] = useState(null);
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
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [funcionesForCountdown, setFuncionesForCountdown] = useState([]);
  const [showSeatLegend, setShowSeatLegend] = useState(false);

  const {
    eventos,
    funciones,
    selectedPlantilla,
    mapa,
    carrito,
    setCarrito,
    handleEventSelect,
    handleFunctionSelect,
    setSelectedPlantilla,
    zonas,
    loading,
    error,
    debugInfo,
    // Variables del store unificado
    selectedFuncion,
    selectedEvent,
    setSelectedEvent,
    setSelectedFuncion,
    selectedClient,
    setSelectedClient,
    selectedAffiliate,
    setSelectedAffiliate,
    selectedSeats,
    setSelectedSeats,
    addSeat,
    removeSeat,
    clearSeats,
    getSeatCount,
    getTotalPrice,
    isSeatSelected,
    syncWithSeatLocks
  } = useBoleteria();

  // Normalizar detalles de la plantilla para evitar ReferenceError
  const detallesPlantilla = React.useMemo(() => {
    try {
      const raw = selectedPlantilla?.detalles;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  }, [selectedPlantilla]);

  const {
    searchResults,
    paymentResults,
    searchLoading,
    handleUnifiedSearch,
    handleAddClient,
    clearSearchResults
  } = useClientManagement();

  useEffect(() => {
    setIsMounted(true);
    
    // Cargar todos los asientos bloqueados para mostrar colores correctos
    const loadAllLockedSeats = async () => {
      if (!selectedFuncion?.id) return;
      
      try {
        const { data: allLockedSeats, error } = await supabase
          .from('seat_locks')
          .select('*')
          .eq('funcion_id', selectedFuncion.id)
                .in('status', ['locked', 'seleccionado', 'seleccionado_por_otro', 'vendido', 'reservado', 'anulado']);
        
        if (error) {
          console.error('Error cargando todos los asientos bloqueados:', error);
        } else {
          console.log('✅ Todos los asientos bloqueados cargados:', allLockedSeats?.length || 0);
          console.log('✅ Asientos con locator:', allLockedSeats?.filter(s => s.locator).length || 0);
          setLockedSeats(allLockedSeats || []);
        }
      } catch (e) {
        console.error('Error cargando asientos bloqueados:', e);
      }
    };
    
    loadAllLockedSeats();
    
    // Listener para cargar transacciones pendientes desde el localizador
    const handleLoadPendingTransaction = async (event) => {
      const transactionData = event.detail;
      console.log('🔄 Cargando transacción pendiente:', transactionData);
      
      try {
        // Cargar evento y función
        if (transactionData.event) {
          setSelectedEvent(transactionData.event);
          console.log('✅ Evento cargado:', transactionData.event.nombre);
        }
        
        if (transactionData.funcion) {
          setSelectedFuncion(transactionData.funcion);
          console.log('✅ Función cargada:', transactionData.funcion.id);
        }
        
        // Cargar asientos
        if (transactionData.seats && transactionData.seats.length > 0) {
          setSelectedSeats(transactionData.seats);
          message.success(`${transactionData.seats.length} asientos cargados desde la transacción pendiente`);
          console.log('✅ Asientos cargados:', transactionData.seats);
        } else {
          console.log('⚠️ No hay asientos en la transacción');
          message.warning('Esta transacción no tiene asientos asociados');
        }
        
        // Cargar información del cliente si está disponible
        if (transactionData.user_id) {
          try {
            // Buscar el usuario por ID
            const { data: user, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', transactionData.user_id)
              .single();
            
            if (error) {
              console.error('Error fetching user:', error);
              message.warning('Cliente ID: ' + transactionData.user_id + ' (información no disponible)');
            } else if (user) {
              setSelectedClient(user);
              message.success(`Cliente cargado: ${user.nombre || user.name || user.email}`);
              console.log('✅ Cliente cargado:', user);
            }
          } catch (e) {
            console.error('Error loading client:', e);
            message.warning('Cliente ID: ' + transactionData.user_id + ' (error al cargar)');
          }
        }
        
        // Mostrar información de la transacción
        message.success(`Transacción pendiente cargada: ${transactionData.locator}`);
        console.log('✅ Transacción completamente cargada');
        
      } catch (error) {
        console.error('Error loading pending transaction:', error);
        message.error('Error al cargar la transacción pendiente');
      }
    };
    
          window.addEventListener('loadPendingTransaction', handleLoadPendingTransaction);
          
          // Listener para cargar asientos desde el localizador
          const handleLoadSeatToCart = async (event) => {
            const { seat, seats, transaction, action, clickedSeat } = event.detail;
            console.log('🛒 Cargando asiento(s) en carrito:', { seat, seats, action, clickedSeat });
            
            try {
              if (action === 'loadCompleteTransaction' && seats) {
                // 🎯 CARGAR TODA LA TRANSACCIÓN COMPLETA
                console.log(`🎫 Cargando transacción completa desde localizador ${transaction.locator}`);
                console.log(`🎯 Asiento clickeado: ${clickedSeat}`);
                console.log(`📋 Total de asientos a cargar: ${seats.length}`);
                
                // Limpiar carrito actual y cargar toda la transacción
                setSelectedSeats(seats);
                
                // Cargar cliente si está disponible
                if (transaction.user_id) {
                  try {
                    const { data: user, error } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', transaction.user_id)
                      .single();
                    
                    if (!error && user) {
                      setSelectedClient(user);
                      console.log('✅ Cliente cargado:', user.nombre || user.name || user.email);
                    }
                  } catch (e) {
                    console.error('Error loading client:', e);
                  }
                }
                
                // Cargar evento y función si están disponibles
                if (transaction.event) {
                  setSelectedEvent(transaction.event);
                  console.log('✅ Evento cargado:', transaction.event.nombre);
                }
                
                if (transaction.funcion) {
                  setSelectedFuncion(transaction.funcion);
                  console.log('✅ Función cargada:', transaction.funcion.id);
                }
                
                console.log('🎉 Transacción completa cargada exitosamente');
                VisualNotifications.show('purchaseComplete', 'Transacción cargada exitosamente');
                
              } else if (action === 'addSeat' && seat) {
                // Agregar asiento individual (funcionalidad anterior)
                if (isSeatSelected(seat._id)) {
                  message.warning('Este asiento ya está en el carrito');
                  VisualNotifications.show('seatBlocked', 'Este asiento ya está en el carrito');
                } else {
                  addSeat(seat);
                }
                
                // Cargar cliente si está disponible
                if (transaction.user_id) {
                  try {
                    const { data: user, error } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', transaction.user_id)
                      .single();
                    
                    if (!error && user) {
                      setSelectedClient(user);
                    }
                  } catch (e) {
                    console.error('Error loading client:', e);
                  }
                }
                
              } else if (action === 'addAllSeats' && seats) {
                // Agregar todos los asientos (funcionalidad anterior)
                setSelectedSeats(seats);
                
                // Cargar cliente si está disponible
                if (transaction.user_id) {
                  try {
                    const { data: user, error } = await supabase
                      .from('profiles')
                      .select('*')
                      .eq('id', transaction.user_id)
                      .single();
                    
                    if (!error && user) {
                      setSelectedClient(user);
                    }
                  } catch (e) {
                    console.error('Error loading client:', e);
                  }
                }
              }
              
            } catch (error) {
              console.error('Error loading seat to cart:', error);
              message.error('Error al cargar el asiento en el carrito');
            }
          };
          
          window.addEventListener('loadSeatToCart', handleLoadSeatToCart);
          
          return () => {
            window.removeEventListener('loadPendingTransaction', handleLoadPendingTransaction);
            window.removeEventListener('loadSeatToCart', handleLoadSeatToCart);
          };
  }, [selectedFuncion?.id]);

  // Preparar countdown para "Próximamente con cuenta atrás"
  useEffect(() => {
    try {
      const funcs = Array.isArray(funciones) ? funciones : [];
      setFuncionesForCountdown(funcs);
    } catch {}
  }, [funciones]);

  const countdownTarget = (() => {
    if (selectedEvent?.estadoVenta === 'proximamente-countdown') {
      return findNextStart(funcionesForCountdown, 'internet') || findNextStart(funcionesForCountdown, 'boxOffice');
    }
    return null;
  })();
  const cd = useCountdown(countdownTarget);

  // Función para manejar selección de precios
  const handlePriceOptionSelect = (priceOption) => {
    setSelectedPriceOption(priceOption);
    message.success(`Precio seleccionado: ${priceOption.entrada.nombre_entrada} - $${priceOption.precio}`);
  };

  // Función para manejar clics en asientos
  const handleSeatClick = (seat) => {
    
    if (!selectedFuncion) {
      message.warning('Por favor selecciona una función primero');
      return;
    }

    if (blockMode) {
      // En modo bloqueo, manejar bloqueo/desbloqueo permanente en seat_locks
      const isCurrentlyBlocked = lockedSeats.some(ls => 
        ls.seat_id === seat._id && ls.status === 'locked'
      );
      
      if (isCurrentlyBlocked) {
        // Desbloquear permanentemente
        handleUnlockSeat(seat._id);
        message.success(`Asiento ${seat.nombre || seat._id} desbloqueado permanentemente`);
      } else {
        // Bloquear permanentemente
        handleLockSeat(seat._id);
        message.success(`Asiento ${seat.nombre || seat._id} bloqueado permanentemente`);
      }
    } else {
      // En modo normal, manejar selección para carrito
      if (isSeatSelected(seat._id)) {
        // Deselección: el asiento ya fue desbloqueado en la BD por LazySimpleSeatingMap
        removeSeat(seat._id);
      } else {
        // Selección: el asiento ya fue bloqueado en la BD por LazySimpleSeatingMap
        // Calcular precio basado en plantilla y descuentos
        const zonaId = seat?.zona?.id || seat?.zonaId || seat?.zona;
        // Buscar detalle de precio por zona en la plantilla seleccionada
        const detalleZona = Array.isArray(detallesPlantilla)
          ? detallesPlantilla.find(d => {
              const id = d.zonaId || (typeof d.zona === 'object' ? d.zona?._id : d.zona);
              return String(id) === String(zonaId);
            })
          : null;

        const basePrice = detalleZona?.precio ?? selectedPriceOption?.precio ?? 0;
        let finalPrice = basePrice;
        let tipoPrecio = 'normal';
        let descuentoNombre = '';

        // Aplicar descuento si corresponde (comentado hasta implementar appliedDiscount)
        // if (appliedDiscount?.detalles && zonaId != null) {
        //   const d = appliedDiscount.detalles.find(dt => {
        //     const id = typeof dt.zona === 'object' ? dt.zona?._id : dt.zona;
        //     return String(id) === String(zonaId);
        //   });
        //   if (d) {
        //     if (d.tipo === 'porcentaje') {
        //       finalPrice = Math.max(0, basePrice - (basePrice * d.valor) / 100);
        //     } else {
        //       finalPrice = Math.max(0, basePrice - d.valor);
        //     }
        //     tipoPrecio = 'descuento';
        //     descuentoNombre = appliedDiscount.nombreCodigo;
        //   }
        // }

        const seatWithPrice = {
          ...seat,
          precio: finalPrice,
          precioInfo: {
            base: basePrice,
            tipoPrecio,
            descuentoNombre,
            zonaId: zonaId || null,
          }
        };
        
        addSeat(seatWithPrice);
      }
    }
  };

  // Funciones para manejar bloqueo permanente de asientos
  const handleLockSeat = async (seatId) => {
    try {
      const sessionId = localStorage.getItem('anonSessionId') || crypto.randomUUID();
      
      const lockData = {
        seat_id: seatId,
        funcion_id: parseInt(selectedFuncion.id),
        session_id: sessionId,
        locked_at: new Date().toISOString(),
        expires_at: null, // Sin expiración para bloqueo permanente
        status: 'locked', // Estado permanente
        lock_type: 'seat',
        locator: null // Sin locator para bloqueo permanente
      };

      // Agregar tenant_id si está disponible
      if (currentTenant?.id) {
        lockData.tenant_id = currentTenant.id;
      }

      const { error: lockError } = await supabase
        .from('seat_locks')
        .upsert(lockData);

      if (lockError) {
        console.error('Error al bloquear asiento permanentemente:', lockError);
        message.error('Error al bloquear el asiento');
      } else {
        console.log('✅ Asiento bloqueado permanentemente en la base de datos');
        // Recargar lockedSeats para reflejar el cambio
        const { data: updatedLocks } = await supabase
          .from('seat_locks')
          .select('*')
          .eq('funcion_id', selectedFuncion.id)
          .in('status', ['locked', 'seleccionado', 'seleccionado_por_otro', 'vendido', 'reservado', 'anulado']);
        
        setLockedSeats(updatedLocks || []);
      }
    } catch (error) {
      console.error('Error inesperado bloqueando asiento:', error);
      message.error('Error al bloquear el asiento');
    }
  };

  const handleUnlockSeat = async (seatId) => {
    try {
      const { error: unlockError } = await supabase
        .from('seat_locks')
        .delete()
        .eq('seat_id', seatId)
        .eq('funcion_id', parseInt(selectedFuncion.id))
        .eq('status', 'locked'); // Solo desbloquear los permanentes

      if (unlockError) {
        console.error('Error al desbloquear asiento permanentemente:', unlockError);
        message.error('Error al desbloquear el asiento');
      } else {
        console.log('✅ Asiento desbloqueado permanentemente de la base de datos');
        // Recargar lockedSeats para reflejar el cambio
        const { data: updatedLocks } = await supabase
          .from('seat_locks')
          .select('*')
          .eq('funcion_id', selectedFuncion.id)
          .in('status', ['locked', 'seleccionado', 'seleccionado_por_otro', 'vendido', 'reservado', 'anulado']);
        
        setLockedSeats(updatedLocks || []);
      }
    } catch (error) {
      console.error('Error inesperado desbloqueando asiento:', error);
      message.error('Error al desbloquear el asiento');
    }
  };

  // Callback para manejar cambios en bloqueos desde LazySimpleSeatingMap
  const handleLockChange = (action, seatId, lockData) => {
    
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

  // Evitar parpadeo: mostrar loader mientras carga o restaura selección
  if (loading) {
    const step = debugInfo?.step || '';
    const progressMap = {
      'Starting to fetch eventos': 15,
      'handleEventSelect': 30,
      'handleFunctionSelect': 45,
      'fetchMapa': 65,
      'loadReservedSeats': 80,
      'fetchZonasPorSala': 90
    };
    const base = loading ? 10 : 0;
    const computed = progressMap[step] ?? base;
    const percent = (!loading && selectedFuncion) ? 100 : Math.min(99, computed);

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Spin size="large" />
          <div className="text-gray-600">Cargando…</div>
          <Progress type="circle" percent={percent} width={80} />
        </div>
      </div>
    );
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
                {selectedEvent && (
                  <div className="hidden md:flex items-center gap-xs px-sm py-xs bg-gray-50 border border-gray-200 rounded-md">
                    {(() => {
                      const ev = getEstadoVentaInfo(selectedEvent.estadoVenta);
                      return (
                        <>
                          <span className="text-gray-600">Estado:</span>
                          <span className="font-medium">{ev.label}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">Boletería:</span>
                          <span className="font-medium">{ev.boleteria.icon} {ev.boleteria.message}</span>
                          {selectedEvent?.estadoVenta === 'proximamente-countdown' && countdownTarget && cd.remaining > 0 && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">Comienza en:</span>
                              <span className="font-medium">{formatCountdown(cd)}</span>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
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
            {/* Panel izquierdo - Zonas y Precios (solo para modo mapa) */}
            {selectedEvent?.modoVenta !== 'grid' && (
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
            )}

            {/* Área del mapa o modo grid */}
            <div className="flex-1 relative bg-white">
              {!getEstadoVentaInfo(selectedEvent?.estadoVenta)?.boleteria?.canAccessBoleteria ? (
                <div className="flex items-center justify-center h-96 w-full">
                  <div className="text-center text-gray-600">
                    <div className="text-lg font-medium mb-2">No disponible</div>
                    <div className="text-sm">Este evento no está habilitado para boletería ({getEstadoVentaInfo(selectedEvent?.estadoVenta)?.label}).</div>
                  </div>
                </div>
              ) : selectedEvent?.modoVenta === 'grid' ? (
                // Modo Grid - Venta sin mapa
                <div className="p-4">
                  <GridSaleMode
                    evento={selectedEvent}
                    funcion={selectedFuncion}
                    onAddToCart={(item) => {
                      // Convertir item del modo grid al formato del carrito
                      const cartItem = {
                        sillaId: item.id,
                        nombre: item.descripcion,
                        precio: item.precio,
                        nombreZona: item.zona_nombre,
                        functionId: item.funcion_id,
                        cantidad: item.cantidad,
                        tipo: 'grid'
                      };
                      addSeat(cartItem);
                    }}
                    onRemoveFromCart={(itemId) => {
                      removeSeat(itemId);
                    }}
                    cartItems={selectedSeats}
                    loading={loading}
                    selectedClient={selectedClient}
                    onClientSelect={() => setShowClientModal(true)}
                  />
                </div>
              ) : mapa ? (
                <div
                  style={{ 
                    transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`, 
                    transformOrigin: '0 0'
                  }}
                >
                  <LazySimpleSeatingMap
                    selectedFuncion={selectedFuncion}
                    selectedEvent={selectedEvent}
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
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="text-gray-500 mb-2">
                      {selectedEvent?.modoVenta === 'grid' 
                        ? 'Modo Grid activado - No se requiere mapa'
                        : 'No hay mapa disponible'
                      }
                    </div>
                    <div className="text-sm text-gray-400">
                      {selectedEvent?.modoVenta === 'grid'
                        ? 'Las entradas se venden por zona sin selección específica de asientos'
                        : 'Este evento no tiene un mapa de asientos configurado'
                      }
                    </div>
                  </div>
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

              {/* Botón para mostrar/ocultar leyenda */}
              <div className="fixed bottom-4 left-4 z-20 md:bottom-6 md:left-6">
                <Button 
                  size="small" 
                  onClick={() => setShowSeatLegend(v => !v)}
                  className="shadow-lg"
                >
                  {showSeatLegend ? 'Ocultar estado' : 'Estado asientos'}
                </Button>
              </div>

              {/* Leyenda de asientos (colapsable) */}
              {showSeatLegend && (
                <div className="fixed bottom-16 left-4 z-20 bg-white p-4 rounded-lg shadow-lg md:bottom-20 md:left-6">
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
              )}

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
                      <Button 
                        size="small" 
                        type="primary"
                        onClick={() => {
                          console.log('🔍 [BOLETERIA] Abriendo modal de cliente');
                          setShowClientModal(true);
                        }}
                      >
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
                  <h4 className="font-medium text-gray-900 mb-sm flex items-center justify-between">
                    <span>Asientos Seleccionados</span>
                    {/* Descargar todos los tickets juntos (bulk) */}
                    {locator && (
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/payments/${locator}/download?mode=bulk`, { headers: { Accept: 'application/pdf' } });
                            if (!res.ok) throw new Error('Descarga fallida');
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `tickets-${locator}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch (e) {
                            message.error('Error al descargar tickets');
                          }
                        }}
                      >
                        Descargar todos
                      </Button>
                    )}
                  </h4>
                  {selectedSeats.length > 0 ? (
                    <div className="space-y-sm">
                      {selectedSeats.map((seat, index) => (
                        <div key={seat._id || index} className="flex items-center justify-between p-sm bg-info-light rounded-md">
                          <div>
                            <div className="font-medium text-sm">{seat.nombre || seat._id}</div>
                            <div className="text-xs text-gray-500">Zona: {seat.zona?.nombre || 'Sin zona'}</div>
                          </div>
                          <div className="flex items-center gap-sm">
                            {locator && (seat.isPaid || seat.status === 'vendido' || seat.pagado === true) ? (
                              <Tooltip title="Imprimir ticket">
                                <Button
                                  type="text"
                                  className="text-green-600"
                                  icon={<DownloadOutlined className="text-green-600" />}
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/payments/${locator}/download?mode=full`, { headers: { Accept: 'application/pdf' } });
                                      if (!res.ok) throw new Error('Descarga fallida');
                                      const blob = await res.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `ticket-${locator}-${seat._id || index}.pdf`;
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                    } catch (e) {
                                      message.error('Error al descargar ticket');
                                    }
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Disponible tras pago">
                                <Button type="text" icon={<DownloadOutlined />} disabled />
                              </Tooltip>
                            )}
                            <div className="text-right">
                              <div className="font-bold text-sm">${seat.precio?.toFixed(2) || '0.00'}</div>
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
                    onClick={() => setShowPaymentModal(true)}
                    disabled={selectedSeats.length === 0 || !selectedClient}
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
        width={800}
      >
        <div className="space-y-4">
          <Search
            placeholder="Buscar eventos por nombre, fecha o ubicación..."
            allowClear
            enterButton="Buscar"
            size="large"
            onSearch={(value) => {
              console.log('Buscando eventos:', value);
              message.info(`Buscando eventos: "${value}"`);
            }}
          />
          
          <div className="max-h-96 overflow-y-auto">
            {eventos && eventos.length > 0 ? (
              <div className="space-y-2">
                {eventos.map((evento) => (
                  <Card
                    key={evento.id}
                    size="small"
                    hoverable
                    onClick={() => {
                      setSelectedEvent(evento);
                      setShowEventSearch(false);
                      message.success(`Evento seleccionado: ${evento.nombre}`);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <EventImage
                          event={evento}
                          imageType="logoHorizontal"
                          className="w-full h-full object-cover"
                          showDebug={false}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{evento.nombre}</div>
                        <div className="text-sm text-gray-500">
                          {evento.fecha_evento && new Date(evento.fecha_evento).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {evento.descripcion && evento.descripcion.substring(0, 100)}...
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No hay eventos disponibles
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="Aplicar Descuentos"
        open={showDiscountModal}
        onCancel={() => setShowDiscountModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDiscountModal(false)}>
            Cancelar
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={() => {
              if (discountValue > 0) {
                setSelectedDiscount({
                  type: discountType,
                  amount: discountValue,
                  description: discountType === 'percentage' ? `${discountValue}% de descuento` : `$${discountValue} de descuento`
                });
                setShowDiscountModal(false);
                message.success('Descuento aplicado correctamente');
              } else {
                message.warning('Ingresa un valor de descuento válido');
              }
            }}
          >
            Aplicar Descuento
          </Button>
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Descuento</label>
            <Select
              value={discountType}
              onChange={setDiscountType}
              style={{ width: '100%' }}
              options={[
                { value: 'percentage', label: 'Porcentaje (%)' },
                { value: 'fixed', label: 'Monto Fijo ($)' }
              ]}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Valor del Descuento {discountType === 'percentage' ? '(%)' : '($)'}
            </label>
            <InputNumber
              value={discountValue}
              onChange={setDiscountValue}
              min={0}
              max={discountType === 'percentage' ? 100 : undefined}
              style={{ width: '100%' }}
              placeholder={discountType === 'percentage' ? 'Ej: 10' : 'Ej: 5.00'}
            />
          </div>
          
          {discountValue > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm text-blue-800">
                <strong>Resumen del Descuento:</strong>
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {discountType === 'percentage' 
                  ? `${discountValue}% de descuento`
                  : `$${discountValue.toFixed(2)} de descuento`
                }
              </div>
              {selectedPriceOption && (
                <div className="text-xs text-blue-600 mt-2">
                  Precio original: ${selectedPriceOption.precio}
                  <br />
                  Precio con descuento: ${discountType === 'percentage' 
                    ? (selectedPriceOption.precio * (1 - discountValue / 100)).toFixed(2)
                    : Math.max(0, selectedPriceOption.precio - discountValue).toFixed(2)
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <LocatorSearchModal
        open={showLocatorSearch}
        onCancel={() => setShowLocatorSearch(false)}
        onSearch={(locator) => {
          // Recargar la búsqueda del localizador
          setLocatorSearchValue(locator);
        }}
      />

      <Modal
        title="Gestión de Carrito"
        open={showCartManagement}
        onCancel={() => setShowCartManagement(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Carritos Guardados</h3>
            <Button
              type="primary"
              onClick={() => {
                // Guardar carrito actual
                const cartData = {
                  id: Date.now(),
                  timestamp: new Date().toISOString(),
                  event: selectedEvent?.nombre,
                  function: selectedFuncion?.nombre,
                  seats: selectedSeats,
                  total: selectedSeats.reduce((sum, seat) => sum + (selectedPriceOption?.precio || 0), 0),
                  status: 'guardado'
                };
                
                // Guardar en localStorage
                const savedCarts = JSON.parse(localStorage.getItem('savedCarts') || '[]');
                savedCarts.push(cartData);
                localStorage.setItem('savedCarts', JSON.stringify(savedCarts));
                
                message.success('Carrito guardado correctamente');
              }}
            >
              Guardar Carrito Actual
            </Button>
          </div>
          
          <div className="space-y-2">
            {(() => {
              const savedCarts = JSON.parse(localStorage.getItem('savedCarts') || '[]');
              return savedCarts.length > 0 ? (
                savedCarts.map((cart) => (
                  <Card key={cart.id} size="small" className="hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{cart.event}</div>
                        <div className="text-sm text-gray-500">{cart.function}</div>
                        <div className="text-xs text-gray-400">
                          {cart.seats.length} asientos • ${cart.total}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(cart.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="small"
                          onClick={() => {
                            // Cargar carrito
                            setSelectedSeats(cart.seats);
                            message.success('Carrito cargado');
                            setShowCartManagement(false);
                          }}
                        >
                          Cargar
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={() => {
                            // Eliminar carrito
                            const updatedCarts = savedCarts.filter(c => c.id !== cart.id);
                            localStorage.setItem('savedCarts', JSON.stringify(updatedCarts));
                            message.success('Carrito eliminado');
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No hay carritos guardados
                </div>
              );
            })()}
          </div>
        </div>
      </Modal>

      <Modal
        title="Diagnóstico del Servidor"
        open={showServerDiagnostic}
        onCancel={() => setShowServerDiagnostic(false)}
        footer={null}
        width={800}
      >
        <ServerDiagnostic selectedFuncion={selectedFuncion} />
      </Modal>


      {/* Widget de Validación en Tiempo Real */}
      <ValidationWidget
        selectedSeats={selectedSeats}
        selectedClient={selectedClient}
        paymentData={paymentData}
        onValidationChange={(validation) => {
          // Callback para manejar cambios en la validación
          if (validation.errors.length > 0) {
            VisualNotifications.show('error', validation.errors[0]);
          } else if (validation.warnings.length > 0) {
            VisualNotifications.show('validationWarning', validation.warnings[0]);
          }
        }}
        showNotifications={true}
        position="bottom-right"
      />

      {/* Modales de Cliente y Pago */}
      <ClientModals
        isSearchModalVisible={showClientModal}
        searchResults={searchResults}
        paymentResults={paymentResults}
        searchLoading={searchLoading}
        onSearchCancel={() => setShowClientModal(false)}
        onClientSelect={(client) => {
          setSelectedClient(client);
          setShowClientModal(false);
        }}
        onAddClient={handleAddClient}
        handleUnifiedSearch={handleUnifiedSearch}
        clearSearchResults={clearSearchResults}
      />

      <PaymentModal
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        carrito={selectedSeats}
        selectedClient={selectedClient}
        selectedFuncion={selectedFuncion}
        selectedAffiliate={selectedAffiliate}
        selectedEvent={selectedEvent}
        onPaymentComplete={() => {
          setShowPaymentModal(false);
          setSelectedSeats([]);
          setSelectedClient(null);
          message.success('Pago completado exitosamente');
        }}
      />
    </div>
  );
};

export default BoleteriaMainCustomDesign;
