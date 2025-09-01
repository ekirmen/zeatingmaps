import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs, Drawer, Form, Space, Typography, Tooltip, InputNumber } from 'antd';
import { SearchOutlined, UserOutlined, ShoppingCartOutlined, GiftOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SettingOutlined, EyeOutlined, UploadOutlined, ReloadOutlined, CloseOutlined, MoneyCollectOutlined, InfoCircleOutlined, QuestionCircleOutlined, FormOutlined, MailOutlined, BellOutlined, ArrowLeftOutlined, DownloadOutlined, HistoryOutlined, AimOutlined, CompressOutlined } from '@ant-design/icons';
import SimpleSeatingMap from './components/SimpleSeatingMap';
import DynamicPriceSelector from './components/DynamicPriceSelector';
import ZonesPanel from './components/ZonesPanel.jsx';
import ProductosWidget from '../../../store/components/ProductosWidget';
import PaymentModal from './PaymentModal';
import CustomFormBuilder from './components/CustomFormBuilder';
import MailChimpIntegration from './components/MailChimpIntegration';
import PushNotifications from './components/PushNotifications';
import DownloadTicketButton from './DownloadTicketButton';
import ServerDiagnostic from './ServerDiagnostic';
import { useBoleteria } from '../../hooks/useBoleteria';
import { useClientManagement } from '../../hooks/useClientManagement';
import { supabase } from '../../../supabaseClient';
import resolveImageUrl from '../../../utils/resolveImageUrl';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const BoleteriaMain = () => {
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);
  const hasMountedRef = useRef(false);
  
  // Debug: Track component mounting
  useEffect(() => {
    if (!hasMountedRef.current) {
      console.log('🚀 [BoleteriaMain] Componente montado por primera vez');
      hasMountedRef.current = true;
      setIsMounted(true);
    } else {
      console.log('🔄 [BoleteriaMain] Componente re-renderizado');
    }
    
    return () => {
      console.log('🧹 [BoleteriaMain] Componente desmontado');
      hasMountedRef.current = false;
      setIsMounted(false);
    };
  }, []);
  
  // Usar los hooks existentes
  const {
    eventos,
    funciones,
    selectedFuncion,
    selectedEvent,
    selectedPlantilla,
    setSelectedPlantilla,
    setSelectedEvent,
    setSelectedFuncion,
    handleEventSelect,
    handleFunctionSelect,
    mapa,
    zonas,
    loading: boleteriaLoading,
    error: boleteriaError,
    debugInfo
  } = useBoleteria();

  const {
    selectedClient,
    setSelectedClient
  } = useClientManagement();

  // Debug: Track map loading
  useEffect(() => {
    console.log('🗺️ [BoleteriaMain] Mapa actualizado:', {
      hasMapa: !!mapa,
      mapaType: typeof mapa,
      mapaContent: mapa?.contenido?.length || 0,
      loading: boleteriaLoading,
      error: boleteriaError
    });
  }, [mapa, boleteriaLoading, boleteriaError]);

  // Cargar bloqueos de asientos cuando cambie la función seleccionada
  useEffect(() => {
    const loadLockedSeats = async () => {
      if (!selectedFuncion?.id) {
        setLockedSeats([]);
        return;
      }

      try {
        const sessionId = localStorage.getItem('anonSessionId');
        const { data, error } = await supabase
          .from('seat_locks')
          .select('seat_id, session_id, locked_at, status, expires_at')
          .eq('funcion_id', selectedFuncion.id)
          .eq('session_id', sessionId)
          .eq('lock_type', 'seat');

        if (error) {
          console.error('Error cargando bloqueos:', error);
          setLockedSeats([]);
        } else {
          console.log('✅ Bloqueos cargados:', data?.length || 0);
          setLockedSeats(data || []);
          
          // Sincronizar selectedSeats con los bloqueos actuales
          const lockedSeatIds = (data || []).map(lock => lock.seat_id);
          console.log('🔄 [BoleteriaMain] Sincronizando selectedSeats con lockedSeats:', {
            lockedSeatIds,
            currentSelectedSeats: Array.isArray(prev) ? prev.map(s => s._id) : []
          });
          setSelectedSeats(prev => {
            const currentSeats = Array.isArray(prev) ? prev : [];
            // Mantener solo los asientos que están bloqueados en la BD
            const filteredSeats = currentSeats.filter(seat => lockedSeatIds.includes(seat._id));
            
            // Si hay bloqueos pero no hay asientos en el carrito, crear asientos básicos
            if (lockedSeatIds.length > 0 && filteredSeats.length === 0 && selectedPriceOption) {
              console.log('⚠️ [BoleteriaMain] Hay bloqueos pero no hay asientos en carrito, creando asientos básicos');
              const basicSeats = lockedSeatIds.map(seatId => ({
                _id: seatId,
                precio: selectedPriceOption?.precio || 0,
                precioInfo: selectedPriceOption ? {
                  entrada: selectedPriceOption.entrada,
                  zona: selectedPriceOption.zona,
                  comision: selectedPriceOption.comision,
                  precioOriginal: selectedPriceOption.precioOriginal,
                  category: selectedPriceOption.category
                } : null
              }));
              console.log('✅ [BoleteriaMain] Asientos básicos creados:', basicSeats.map(s => s._id));
              return basicSeats;
            }
            
            console.log('✅ [BoleteriaMain] Sincronización completada:', {
              antes: currentSeats.length,
              despues: filteredSeats.length,
              asientosFiltrados: filteredSeats.map(s => s._id)
            });
            return filteredSeats;
          });
        }
      } catch (error) {
        console.error('Error inesperado cargando bloqueos:', error);
        setLockedSeats([]);
      }
    };

    loadLockedSeats();
  }, [selectedFuncion?.id]);

  // Real-time subscription para seat_locks
  useEffect(() => {
    if (!selectedFuncion?.id) return;

    const sessionId = localStorage.getItem('anonSessionId');
    console.log('🔌 [BoleteriaMain] Iniciando suscripción real-time para seat_locks, función:', selectedFuncion.id);

    const channel = supabase
      .channel(`seat-locks-realtime-${selectedFuncion.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seat_locks',
          filter: `funcion_id=eq.${selectedFuncion.id}`
        },
        (payload) => {
          console.log('📡 [BoleteriaMain] Real-time update recibido:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Nuevo bloqueo creado
            const newLock = payload.new;
            if (newLock.session_id === sessionId) {
              // Es nuestro bloqueo, actualizar lockedSeats
              setLockedSeats(prev => {
                const filtered = prev.filter(lock => lock.seat_id !== newLock.seat_id);
                return [...filtered, newLock];
              });
              
              // También actualizar selectedSeats si no está ya ahí
              setSelectedSeats(prev => {
                const isAlreadySelected = prev.find(seat => seat._id === newLock.seat_id);
                if (!isAlreadySelected && selectedPriceOption) {
                  const seatWithPrice = {
                    _id: newLock.seat_id,
                    precio: selectedPriceOption?.precio || 0,
                    precioInfo: selectedPriceOption ? {
                      entrada: selectedPriceOption.entrada,
                      zona: selectedPriceOption.zona,
                      comision: selectedPriceOption.comision,
                      precioOriginal: selectedPriceOption.precioOriginal,
                      category: selectedPriceOption.category
                    } : null
                  };
                  return [...prev, seatWithPrice];
                }
                return prev;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Bloqueo eliminado
            const deletedLock = payload.old;
            if (deletedLock.session_id === sessionId) {
              // Es nuestro bloqueo, remover de lockedSeats
              setLockedSeats(prev => prev.filter(lock => lock.seat_id !== deletedLock.seat_id));
              
              // También remover de selectedSeats
              setSelectedSeats(prev => prev.filter(seat => seat._id !== deletedLock.seat_id));
            }
          } else if (payload.eventType === 'UPDATE') {
            // Bloqueo actualizado
            const updatedLock = payload.new;
            const oldLock = payload.old;
            
            if (updatedLock.session_id === sessionId) {
              // Es nuestro bloqueo, actualizar lockedSeats
              setLockedSeats(prev => {
                const filtered = prev.filter(lock => lock.seat_id !== updatedLock.seat_id);
                return [...filtered, updatedLock];
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [BoleteriaMain] Estado de suscripción real-time:', status);
      });

    return () => {
      console.log('🔌 [BoleteriaMain] Desconectando suscripción real-time');
      supabase.removeChannel(channel);
    };
  }, [selectedFuncion?.id, selectedPriceOption]);

  // Estados locales básicos
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [blockedSeats, setBlockedSeats] = useState([]);
  const [blockMode, setBlockMode] = useState(false);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [searchBySeatMode, setSearchBySeatMode] = useState(false);
  const [productosCarrito, setProductosCarrito] = useState([]);
  const [activeTab, setActiveTab] = useState('mapa');
  const [selectedPriceOption, setSelectedPriceOption] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [showEventSearch, setShowEventSearch] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showLocatorSearch, setShowLocatorSearch] = useState(false);
  const [showCartManagement, setShowCartManagement] = useState(false);
  const [showServerDiagnostic, setShowServerDiagnostic] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage');
  const [foundPayment, setFoundPayment] = useState(null);
  const [locatorSearchValue, setLocatorSearchValue] = useState('');
  const [locatorSearchLoading, setLocatorSearchLoading] = useState(false);
  const [userSearchValue, setUserSearchValue] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    empresa: '',
    telefono: ''
  });
  const [eventStats, setEventStats] = useState({
    totalSeats: 0,
    availableSeats: 0,
    soldSeats: 0,
    reservedSeats: 0
  });

  // Estados para el pan y zoom
  const mapContainerRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState(null);

  // Funciones básicas
  const resetMapView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const zoomToFit = () => {
    if (!mapa || !mapContainerRef.current) return;
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePanStart = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handlePanMove = (e) => {
    if (!isPanning || !lastPanPoint) return;
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    setLastPanPoint({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    setLastPanPoint(null);
  };

  // Event listeners para el pan
  useEffect(() => {
    if (!isMounted) return;
    
    const container = mapContainerRef.current;
    if (!container) return;

    const handleMouseDown = handlePanStart;
    const handleMouseMove = handlePanMove;
    const handleMouseUp = handlePanEnd;
    const handleMouseLeave = handlePanEnd;

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isMounted, isPanning, lastPanPoint]);

  // Funciones de cálculo
  const calculateTotal = () => {
    if (!selectedSeats || !Array.isArray(selectedSeats) || !productosCarrito || !Array.isArray(productosCarrito)) {
      return 0;
    }
    
    const seatsTotal = selectedSeats.reduce((sum, seat) => {
      const seatPrice = seat.precio || selectedPriceOption?.precio || 0;
      return sum + seatPrice;
    }, 0);
    const productsTotal = productosCarrito.reduce((sum, product) => sum + (product.precio * product.cantidad), 0);
    const subtotal = seatsTotal + productsTotal;
    
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
    if (!selectedSeats || !Array.isArray(selectedSeats) || !productosCarrito || !Array.isArray(productosCarrito)) {
      return 0;
    }
    
    const seatsTotal = selectedSeats.reduce((sum, seat) => {
      const seatPrice = seat.precio || selectedPriceOption?.precio || 0;
      return sum + seatPrice;
    }, 0);
    const productsTotal = productosCarrito.reduce((sum, product) => 
      sum + ((product.precio_especial || product.precio) * product.cantidad), 0);
    return seatsTotal + productsTotal;
  };

  // Funciones de manejo
  const clearCartCompletely = async () => {
    console.log('🧹 [BoleteriaMain] Limpiando carrito completamente');
    
    // Limpiar bloqueos de la base de datos
    if (selectedFuncion?.id) {
      try {
        const sessionId = localStorage.getItem('anonSessionId');
        if (sessionId) {
          const { error } = await supabase
            .from('seat_locks')
            .delete()
            .eq('funcion_id', selectedFuncion.id)
            .eq('session_id', sessionId)
            .eq('lock_type', 'seat');
          
          if (error) {
            console.error('❌ Error limpiando bloqueos:', error);
          } else {
            console.log('✅ Bloqueos limpiados de la base de datos');
          }
        }
      } catch (error) {
        console.error('❌ Error inesperado limpiando bloqueos:', error);
      }
    }
    
    // Limpiar estados locales
    setSelectedSeats([]);
    setProductosCarrito([]);
    setSelectedPriceOption(null);
    setActiveZoneId(null);
    setSelectedDiscount(null);
    setDiscountAmount(0);
    setLockedSeats([]);
    
    message.success('Carrito y bloqueos limpiados completamente');
  };

  const handlePriceOptionSelect = (priceOption) => {
    setSelectedPriceOption(priceOption);
    try {
      const zonaId = priceOption?.zona?.id || priceOption?.zonaId || priceOption?.zona;
      if (zonaId) {
        setActiveZoneId(String(zonaId));
      }
    } catch (e) {}
  };

  const handleSeatClick = (seat) => {
    if (searchBySeatMode) {
      message.warning('Selecciona un asiento vendido');
      return;
    }

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
      if (!selectedPriceOption) {
        message.error('Primero selecciona una zona y precio antes de elegir asientos');
        return;
      }

             setSelectedSeats(prev => {
         const currentSeats = Array.isArray(prev) ? prev : [];
         const isSelected = currentSeats.find(s => s._id === seat._id);
         let newSeats;
         
         if (isSelected) {
           // Deselección: el asiento ya fue desbloqueado en la BD por SimpleSeatingMap
           newSeats = currentSeats.filter(s => s._id !== seat._id);
           console.log('✅ [BoleteriaMain] Asiento removido del carrito:', seat._id, 'Nuevo estado:', newSeats.length, 'asientos');
         } else {
           // Selección: el asiento ya fue bloqueado en la BD por SimpleSeatingMap
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
           newSeats = [...currentSeats, seatWithPrice];
           console.log('✅ [BoleteriaMain] Asiento agregado al carrito:', seat._id, 'Nuevo estado:', newSeats.length, 'asientos');
         }
         
         return newSeats;
       });
    }
  };

  // Callback para manejar cambios en bloqueos desde SimpleSeatingMap
  const handleLockChange = (action, seatId, lockData) => {
    console.log('🔄 [BoleteriaMain] handleLockChange llamado:', { action, seatId, lockData });
    
    if (action === 'lock') {
      // Agregar el bloqueo al estado local
      setLockedSeats(prev => {
        const filtered = prev.filter(lock => lock.seat_id !== seatId);
        const newState = [...filtered, lockData];
        console.log('✅ [BoleteriaMain] Bloqueo agregado. Nuevo estado:', newState.length, 'bloqueos');
        return newState;
      });
    } else if (action === 'unlock') {
      console.log('🔄 [BoleteriaMain] Procesando unlock para seatId:', seatId);
      console.log('🔄 [BoleteriaMain] Estado actual lockedSeats:', lockedSeats.map(ls => ls.seat_id));
      console.log('🔄 [BoleteriaMain] Estado actual selectedSeats:', selectedSeats.map(s => s._id));
      
      // Remover el bloqueo del estado local
      setLockedSeats(prev => {
        const newState = prev.filter(lock => lock.seat_id !== seatId);
        console.log('✅ [BoleteriaMain] Bloqueo removido. Nuevo estado:', newState.length, 'bloqueos');
        return newState;
      });
      
      // También remover el asiento del carrito si está ahí
      setSelectedSeats(prev => {
        const newState = prev.filter(seat => seat._id !== seatId);
        console.log('✅ [BoleteriaMain] Asiento removido del carrito. Nuevo estado:', newState.length, 'asientos');
        return newState;
      });
    }
  };

  // Función para sincronizar manualmente el carrito con los bloqueos
  const syncCartWithLocks = () => {
    console.log('🔄 [BoleteriaMain] Sincronizando manualmente carrito con bloqueos');
    console.log('🔄 [BoleteriaMain] LockedSeats:', lockedSeats.map(ls => ls.seat_id));
    console.log('🔄 [BoleteriaMain] SelectedSeats:', selectedSeats.map(s => s._id));
    
    const lockedSeatIds = lockedSeats.map(lock => lock.seat_id);
    
    setSelectedSeats(prev => {
      const currentSeats = Array.isArray(prev) ? prev : [];
      // Mantener solo los asientos que están bloqueados en la BD
      const filteredSeats = currentSeats.filter(seat => lockedSeatIds.includes(seat._id));
      
      // Si hay bloqueos pero no hay asientos en el carrito, crear asientos básicos
      if (lockedSeatIds.length > 0 && filteredSeats.length === 0 && selectedPriceOption) {
        console.log('⚠️ [BoleteriaMain] Hay bloqueos pero no hay asientos en carrito, creando asientos básicos');
        const basicSeats = lockedSeatIds.map(seatId => ({
          _id: seatId,
          precio: selectedPriceOption?.precio || 0,
          precioInfo: selectedPriceOption ? {
            entrada: selectedPriceOption.entrada,
            zona: selectedPriceOption.zona,
            comision: selectedPriceOption.comision,
            precioOriginal: selectedPriceOption.precioOriginal,
            category: selectedPriceOption.category
          } : null
        }));
        console.log('✅ [BoleteriaMain] Asientos básicos creados:', basicSeats.map(s => s._id));
        return basicSeats;
      }
      
      console.log('✅ [BoleteriaMain] Sincronización manual completada:', {
        antes: currentSeats.length,
        despues: filteredSeats.length,
        asientosFiltrados: filteredSeats.map(s => s._id)
      });
      return filteredSeats;
    });
    
    message.success('Carrito sincronizado con bloqueos de asientos');
  };

  // Función para forzar la deselección de un asiento específico
  const forceDeselectSeat = async (seatId) => {
    console.log('🔄 [BoleteriaMain] Forzando deselección del asiento:', seatId);
    
    const sessionId = localStorage.getItem('anonSessionId');
    
    // Remover de la base de datos
    const { error: unlockError } = await supabase
      .from('seat_locks')
      .delete()
      .eq('seat_id', seatId)
      .eq('funcion_id', parseInt(selectedFuncion.id))
      .eq('session_id', sessionId)
      .eq('lock_type', 'seat');

    if (unlockError) {
      console.error('❌ Error al desbloquear asiento:', unlockError);
      message.error('Error al deseleccionar el asiento');
      return;
    }
    
    // Remover del estado local
    setLockedSeats(prev => prev.filter(lock => lock.seat_id !== seatId));
    setSelectedSeats(prev => prev.filter(seat => seat._id !== seatId));
    
    message.success(`Asiento ${seatId} deseleccionado forzadamente`);
  };

  const handleBlockModeToggle = (checked) => {
    if (checked && ((selectedSeats && selectedSeats.length > 0) || (productosCarrito && productosCarrito.length > 0))) {
      message.warning('El modo bloqueo solo se puede activar cuando el carrito está vacío');
      return;
    }
    setBlockMode(checked);
    if (!checked) {
      setBlockedSeats([]);
    }
  };

  const handleSearchBySeatToggle = (checked) => {
    setSearchBySeatMode(checked);
    if (checked) {
      setBlockMode(false);
    }
  };

  const handlePaymentClick = () => {
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
    if (!selectedSeats || selectedSeats.length === 0) {
      message.warning('Selecciona al menos un asiento antes de continuar');
      return;
    }
    
    setIsPaymentModalVisible(true);
  };

  const handleProductAdded = (producto) => {
    setProductosCarrito(prev => {
      const currentProducts = Array.isArray(prev) ? prev : [];
      const existingProduct = currentProducts.find(p => p.id === producto.id);
      if (existingProduct) {
        return currentProducts.map(p => 
          p.id === producto.id 
            ? { ...p, cantidad: p.cantidad + producto.cantidad }
            : p
        );
      }
      return [...currentProducts, { ...producto, cantidad: producto.cantidad }];
    });
  };

  const handleProductQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setProductosCarrito(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== productId) : []));
    } else {
      setProductosCarrito(prev => (Array.isArray(prev) ? prev.map(p => 
        p.id === productId 
          ? { ...p, cantidad: newQuantity }
          : p
      ) : []));
    }
  };

  const handleProductRemove = (productId) => {
    setProductosCarrito(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== productId) : []));
    message.success('Producto removido del carrito');
  };

  // Obtener imágenes del evento
  const getEventImages = () => {
    if (!selectedEvent?.imagenes) return {};
    
    try {
      if (typeof selectedEvent.imagenes === 'string') {
        return JSON.parse(selectedEvent.imagenes);
      }
      return selectedEvent.imagenes;
    } catch (e) {
      console.error('Error parsing event images:', e);
      return {};
    }
  };

  const images = getEventImages();
  const thumbnailImage = images.portada || images.obraImagen || images.banner;

  // Tab items
  const tabItems = [
    {
      key: 'mapa',
      label: 'Mapa',
      children: (
        <div className="flex h-full">
          {/* Panel izquierdo - Zonas y precios */}
          {selectedFuncion && (
            <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Zonas y Precios</h3>
                <ZonesPanel
                  selectedFuncion={selectedFuncion}
                  selectedPlantilla={selectedPlantilla}
                  mapa={mapa}
                  onSelectPrice={handlePriceOptionSelect}
                  selectedPriceId={selectedPriceOption?.id}
                  selectedZonaId={activeZoneId}
                  onSelectZona={(zonaId) => setActiveZoneId(String(zonaId))}
                  onPricesLoaded={(zonasArray) => {
                    console.log('🎯 onPricesLoaded llamado con:', zonasArray);
                  }}
                />
              </div>
              
              {!blockMode && !selectedPriceOption && (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
                  Primero selecciona una zona y precio antes de elegir asientos
                </div>
              )}
              
              {/* Instrucciones de navegación */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">🗺️ Navegación:</span>
                  <span>• <kbd className="bg-white px-1 rounded">Rueda</kbd> Zoom</span>
                  <span>• <kbd className="bg-white px-1 rounded">Click + Arrastrar</kbd> Pan</span>
                </div>
              </div>
            </div>
          )}

          {/* Panel derecho - Mapa */}
          <div className="flex-1 relative bg-white">
            {/* Indicador de Pan */}
            {isPanning && (
              <div className="absolute top-4 left-4 z-20 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                🖱️ Arrastrando mapa...
              </div>
            )}
            
            {/* Controles de zoom en la esquina inferior izquierda */}
            <div className="absolute bottom-4 left-4 z-10 flex space-x-2 items-center">
              <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))} title="Zoom Out" />
              <Button size="small" icon={<ZoomInOutlined />} onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))} title="Zoom In" />
              <Button size="small" icon={<CompressOutlined />} onClick={resetMapView} title="Reset" />
              <Button size="small" icon={<AimOutlined />} onClick={zoomToFit} title="Fit" />
              <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                {Math.round(zoomLevel * 100)}%
              </span>
              
              {/* Información de Navegación */}
              <Tooltip
                title={
                  <div className="text-xs">
                    <div className="font-semibold mb-1">🗺️ Navegación del Mapa:</div>
                    <div className="flex items-center space-x-2"><kbd className="bg-white px-1 rounded">Rueda del mouse</kbd><span>Zoom</span></div>
                    <div className="flex items-center space-x-2"><kbd className="bg-white px-1 rounded">Click + Arrastrar</kbd><span>Pan</span></div>
                    <div className="flex items-center space-x-2"><kbd className="bg-white px-1 rounded">Botones</kbd><span>Controles adicionales</span></div>
                  </div>
                }
                placement="top"
              >
                <Button size="small" icon={<QuestionCircleOutlined />} />
              </Tooltip>
              
              {/* Leyenda de Asientos */}
              <Tooltip
                title={
                  <div className="text-xs">
                    <div className="font-semibold mb-1">Estado de Asientos</div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Disponible</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>Seleccionado</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Bloqueado por mí</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Bloqueado por otro</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-gray-500"></div><span>Vendido</span></div>
                    <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-yellow-400"></div><span>Reservado</span></div>
                  </div>
                }
                placement="top"
              >
                <Button size="small" icon={<InfoCircleOutlined />} />
              </Tooltip>
            </div>
            
            {/* Contenedor del mapa */}
            <div className="h-full p-4">
              {blockMode && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-800">Modo Bloqueo Activo</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Haz clic en los asientos para seleccionarlos para bloquear. Los asientos seleccionados aparecerán en rojo.
                  </p>
                </div>
              )}
              <div 
                ref={mapContainerRef}
                className="relative overflow-hidden cursor-grab active:cursor-grabbing h-full"
                style={{ 
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`, 
                  transformOrigin: '0 0'
                }}
              >
                <SimpleSeatingMap
                  selectedFuncion={selectedFuncion}
                  onSeatClick={handleSeatClick}
                  selectedSeats={selectedSeats}
                  blockedSeats={blockedSeats}
                  blockMode={blockMode}
                  selectedPlantilla={selectedPlantilla}
                  selectedPriceOption={selectedPriceOption}
                  selectedZonaId={activeZoneId}
                  mapa={mapa}
                  lockedSeats={lockedSeats}
                  onLockChange={handleLockChange}
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'productos',
      label: 'Productos y Extras',
      children: (
        <div className="p-4">
          <ProductosWidget 
            eventoId={selectedEvent?.id} 
            onProductAdded={handleProductAdded} 
          />
        </div>
      )
    }
  ];

  // Si el componente no está montado, no renderizar nada
  if (!isMounted) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  return (
    <div>
      <div className="h-screen flex bg-gray-100">
        {/* Sidebar izquierda */}
        <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
          {/* Botón de Atrás */}
          <Tooltip title="Volver atrás" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => window.history.back()}>
              <ArrowLeftOutlined className="text-xl mb-1" />
              <div>Atrás</div>
            </div>
          </Tooltip>
          
          <Tooltip title="Paso 1: Buscar y seleccionar evento" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowEventSearch(true)}>
              <SearchOutlined className="text-xl mb-1" />
              <div>Eventos</div>
            </div>
          </Tooltip>

          <Tooltip title="Aplicar descuentos y códigos" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowDiscountModal(true)}>
              <MoneyCollectOutlined className="text-xl mb-1" />
              <div>Descuentos</div>
            </div>
          </Tooltip>
          
          <Tooltip title="Mapa de productos disponibles" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setActiveTab('productos')}>
              <GiftOutlined className="text-xl mb-1" />
              <div>Mapa Productos</div>
            </div>
          </Tooltip>
          
          <Tooltip title="Buscar por localizador" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowLocatorSearch(true)}>
              <SearchOutlined className="text-xl mb-1" />
              <div>Localizador</div>
            </div>
          </Tooltip>

          <Tooltip title="Gestionar carritos guardados" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowCartManagement(true)}>
              <ShoppingCartOutlined className="text-xl mb-1" />
              <div>Carritos</div>
            </div>
          </Tooltip>
          
          <Tooltip title="Diagnóstico del servidor" placement="right">
            <div className="text-white text-xs text-center cursor-pointer hover:bg-gray-700 p-2 rounded" onClick={() => setShowServerDiagnostic(true)}>
              <InfoCircleOutlined className="text-xl mb-1" />
              <div>Diagnóstico</div>
            </div>
          </Tooltip>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col">
          {/* Header - Compacto */}
          {selectedFuncion && (
            <div className="bg-white shadow-sm border-b px-3 py-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    {selectedEvent && (thumbnailImage || selectedEvent.imagen_url) ? (
                      <img 
                        src={thumbnailImage ? resolveImageUrl(thumbnailImage) : selectedEvent.imagen_url} 
                        alt={selectedEvent.nombre}
                        className="w-8 h-8 object-cover rounded mr-2"
                        onError={(e) => {
                          e.target.src = '/assets/logo.png';
                        }}
                      />
                    ) : (
                      <Avatar size="small" src="/assets/logo.png" alt="Event" />
                    )}
                    <div className="text-xs">
                      <div className="font-medium">{selectedEvent ? selectedEvent.nombre : 'Selecciona un evento'}</div>
                      <div className="text-gray-500 text-xs">
                        {selectedEvent && selectedEvent.fecha_evento && !isNaN(new Date(selectedEvent.fecha_evento).getTime())
                          ? new Date(selectedEvent.fecha_evento).toLocaleDateString('es-ES')
                          : 'N/A'} | 
                        {selectedFuncion && selectedFuncion.fecha_celebracion && !isNaN(new Date(selectedFuncion.fecha_celebracion).getTime())
                          ? ` ${new Date(selectedFuncion.fecha_celebracion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                          : ' N/A'} | 
                        Sala: {selectedFuncion.sala_id || selectedFuncion.sala?.id || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Bloqueo:</span>
                    <input type="checkbox" checked={blockMode} onChange={(e) => handleBlockModeToggle(e.target.checked)} className="rounded" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <input type="checkbox" checked={searchBySeatMode} onChange={(e) => handleSearchBySeatToggle(e.target.checked)} className="rounded" />
                    <span className="text-gray-500">Buscar venta</span>
                  </div>
                  <span className="text-gray-500">{zoomLevel.toFixed(1)}X</span>
                  <Tooltip title={<div className="text-xs"><div className="font-medium mb-2">Atajos de Teclado:</div><div>• <strong>Ctrl+E:</strong> Buscar eventos</div><div>• <strong>Ctrl+U:</strong> Buscar usuarios</div><div>• <strong>Ctrl+L:</strong> Búsqueda por localizador</div><div>• <strong>Ctrl+X:</strong> Exportar datos</div><div>• <strong>Escape:</strong> Cerrar modales</div></div>} placement="bottom">
                    <QuestionCircleOutlined className="text-gray-400 hover:text-blue-500 cursor-help" />
                  </Tooltip>
                </div>
              </div>
            </div>
          )}

          {/* Área principal */}
          <div className="flex-1 flex">
            {/* Contenido central */}
            <div className="flex-1 flex flex-col">
              {/* Pestañas */}
              <div className="bg-white border-b border-gray-200">
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={tabItems}
                  className="px-4"
                />
              </div>
              
              {/* Contenido de las pestañas */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'mapa' && tabItems[0].children}
                {activeTab === 'productos' && tabItems[1].children}
              </div>
            </div>

            {/* Panel lateral derecho */}
            <div className="w-80 bg-white shadow-lg flex flex-col">
              <div className="p-4 flex-1 overflow-y-auto">
                
                {/* Información del Cliente */}
                <div className="mb-2 p-2 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                  {selectedClient ? (
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Nombre:</span> {selectedClient.nombre || selectedClient.login || 'N/A'}</div>
                      <div><span className="font-medium">Email:</span> {selectedClient.email || selectedClient.login || 'N/A'}</div>
                      <div><span className="font-medium">Teléfono:</span> {selectedClient.telefono || 'N/A'}</div>
                      <div className="mt-2">
                        <Button 
                          size="small" 
                          type="default"
                          onClick={() => setShowUserSearch(true)}
                        >
                          Cambiar Usuario
                        </Button>
                      </div>
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
                
                {/* Asientos seleccionados */}
                {selectedSeats.length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-medium text-gray-900 mb-2">Asientos Seleccionados</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedSeats.map((seat, index) => (
                        <div key={seat._id || index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {seat.nombre || `Asiento ${seat._id}`}
                            </div>
                            <div className="text-xs text-gray-600">
                              {selectedPriceOption ? 
                                `${selectedPriceOption.entrada.nombre_entrada} - ${selectedPriceOption.zona.nombre}` : 
                                'Selecciona zona y precio'
                              }
                            </div>
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
                  {/* Boletos */}
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                    <span className="flex items-center gap-2">
                      <span className="text-blue-600">🎫</span>
                      <span className="font-medium">Boletos:</span>
                    </span>
                    <span className="font-semibold text-blue-700">
                      {selectedSeats?.length || 0} × ${(selectedSeats && Array.isArray(selectedSeats) ? selectedSeats.reduce((sum, seat) => {
                        const seatPrice = seat.precio || selectedPriceOption?.precio || 0;
                        return sum + seatPrice;
                      }, 0) : 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Productos */}
                  {productosCarrito && Array.isArray(productosCarrito) && productosCarrito.length > 0 && (
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <span className="text-green-600">🛍️</span>
                        Productos en Carrito
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {productosCarrito && Array.isArray(productosCarrito) && productosCarrito.map((producto) => (
                          <div key={producto.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-green-800">{producto.nombre}</div>
                              <div className="text-xs text-green-600">
                                ${(producto.precio_especial || producto.precio).toFixed(2)} c/u
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <InputNumber
                                size="small"
                                min={1}
                                value={producto.cantidad}
                                onChange={(value) => handleProductQuantityChange(producto.id, value)}
                                style={{ width: 60 }}
                                className="border-green-300"
                              />
                              <Button 
                                size="small" 
                                type="text" 
                                danger
                                onClick={() => handleProductRemove(producto.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    
                  {/* Resumen de Productos */}
                  {productosCarrito && Array.isArray(productosCarrito) && productosCarrito.length > 0 && (
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200">
                      <span className="flex items-center gap-2">
                        <span className="text-green-600">🛒</span>
                        <span className="font-medium">Productos:</span>
                      </span>
                      <span className="font-semibold text-green-700">
                        {(productosCarrito && Array.isArray(productosCarrito) ? productosCarrito.reduce((sum, p) => sum + p.cantidad, 0) : 0)} × ${(productosCarrito && Array.isArray(productosCarrito) ? productosCarrito.reduce((sum, product) => sum + ((product.precio_especial || product.precio) * product.cantidad), 0) : 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                   
                  {/* Subtotal */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <span className="text-gray-600">🛒</span>
                        <span className="font-medium">Subtotal:</span>
                      </span>
                      <span className="font-semibold text-gray-700">${calculateSubtotal().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Descuento */}
                  {selectedDiscount && (
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200">
                      <span className="flex items-center gap-2">
                        <span className="text-green-600">🎁</span>
                        <span className="font-medium">Descuento ({discountType === 'percentage' ? `${discountAmount}%` : `$${discountAmount}`}):</span>
                      </span>
                      <span className="font-semibold text-green-600">-${discountType === 'percentage' ? 
                        ((calculateSubtotal() * discountAmount) / 100).toFixed(2) : 
                        discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center p-3 bg-blue-600 rounded-lg">
                      <span className="flex items-center gap-2 text-white">
                        <span className="text-yellow-300">💰</span>
                        <span className="font-bold text-lg">Total:</span>
                      </span>
                      <span className="font-bold text-2xl text-white">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                 
                  {blockMode && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-800">Modo Bloqueo Activo</span>
                      </div>
                      <p className="text-xs text-red-600">
                        Selecciona asientos en el mapa para bloquearlos. Los asientos bloqueados se marcarán como reservados.
                      </p>
                      {blockedSeats.length > 0 && (
                        <div className="mt-2 text-xs text-red-700">
                          <strong>{blockedSeats.length} asiento(s) seleccionado(s) para bloquear</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botones fijos en la parte inferior */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="space-y-2">
                                     <div className="flex space-x-2">
                     <Button 
                       size="small"
                       onClick={clearCartCompletely}
                       disabled={selectedSeats.length === 0 && productosCarrito.length === 0}
                     >
                       Limpiar Todo
                     </Button>
                     <Button 
                       size="small"
                       onClick={() => {
                         console.log('🧹 Limpiando cache del navegador...');
                         localStorage.removeItem('anonSessionId');
                         message.success('Cache limpiado. Recarga la página.');
                         setTimeout(() => window.location.reload(), 1000);
                       }}
                     >
                       Limpiar Cache
                     </Button>
                     <Button 
                       size="small"
                       type="default"
                       onClick={syncCartWithLocks}
                     >
                       Sincronizar Carrito
                     </Button>
                     <Button 
                       size="small"
                       type="default"
                       danger
                       onClick={() => forceDeselectSeat('silla_1755825682843_3')}
                       disabled={!lockedSeats.some(ls => ls.seat_id === 'silla_1755825682843_3')}
                     >
                       Deseleccionar Silla 15
                     </Button>
                    {blockMode && blockedSeats.length > 0 && (
                      <Button 
                        size="small"
                        type="primary"
                        danger
                        onClick={() => {
                          message.success(`${blockedSeats.length} asiento(s) bloqueado(s) correctamente`);
                          setBlockedSeats([]);
                          setBlockMode(false);
                        }}
                      >
                        Bloquear ({blockedSeats.length})
                      </Button>
                    )}
                  </div>
                  
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
                       !selectedPriceOption ? 'Selecciona zona y precio' :
                       selectedSeats.length === 0 ? 'Selecciona asientos' :
                       'Procesar Pago'}
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales básicos */}
      {/* Modal de búsqueda de eventos */}
      <Modal
        title="Buscar Evento"
        open={showEventSearch}
        onCancel={() => setShowEventSearch(false)}
        footer={null}
        width={800}
      >
        <div className="text-center text-gray-500 py-8">
          Funcionalidad en desarrollo
        </div>
      </Modal>

      {/* Modal de búsqueda de usuarios */}
      <Modal
        title="Buscar o Crear Usuario"
        open={showUserSearch}
        onCancel={() => setShowUserSearch(false)}
        footer={null}
        width={600}
      >
        <div className="text-center text-gray-500 py-8">
          Funcionalidad en desarrollo
        </div>
      </Modal>

      {/* Modal de descuentos */}
      <Modal
        title="Aplicar Descuentos"
        open={showDiscountModal}
        onCancel={() => setShowDiscountModal(false)}
        footer={null}
        width={600}
      >
        <div className="text-center text-gray-500 py-8">
          Funcionalidad en desarrollo
        </div>
      </Modal>

      {/* Modal de búsqueda por localizador */}
      <Modal
        title="Buscar por Localizador"
        open={showLocatorSearch}
        onCancel={() => setShowLocatorSearch(false)}
        footer={null}
        width={800}
      >
        <div className="text-center text-gray-500 py-8">
          Funcionalidad en desarrollo
        </div>
      </Modal>

      {/* Modal de pago */}
      <PaymentModal
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        carrito={[...selectedSeats, ...productosCarrito]}
        selectedClient={selectedClient}
        selectedEvent={selectedEvent}
        selectedFuncion={selectedFuncion}
        selectedPriceOption={selectedPriceOption}
        selectedDiscount={selectedDiscount}
        discountType={discountType}
        discountAmount={discountAmount}
        total={calculateTotal()}
        subtotal={calculateSubtotal()}
        onSuccess={() => {
          setIsPaymentModalVisible(false);
          clearCartCompletely();
          message.success('Pago procesado exitosamente');
        }}
      />

      {/* Drawer de gestión de carritos */}
      <Drawer
        title="Gestión de Carritos Guardados"
        open={showCartManagement}
        onClose={() => setShowCartManagement(false)}
        width={600}
      >
        <div className="text-center text-gray-500 py-8">
          Funcionalidad en desarrollo
        </div>
      </Drawer>

             {/* Drawer de diagnóstico del servidor */}
       <Drawer
         title="Diagnóstico del Servidor"
         open={showServerDiagnostic}
         onClose={() => setShowServerDiagnostic(false)}
         width={800}
       >
         <ServerDiagnostic selectedFuncion={selectedFuncion} />
       </Drawer>
    </div>
  );
};

export default BoleteriaMain;
