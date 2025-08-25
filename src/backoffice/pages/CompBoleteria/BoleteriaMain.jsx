import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { message, Input, Button, Modal, Select, Card, Avatar, Badge, Tabs, Drawer, Form, Space, Typography, Tooltip, InputNumber } from 'antd';
import { SearchOutlined, UserOutlined, ShoppingCartOutlined, GiftOutlined, ZoomInOutlined, ZoomOutOutlined, FullscreenOutlined, SettingOutlined, EyeOutlined, UploadOutlined, ReloadOutlined, CloseOutlined, MoneyCollectOutlined, InfoCircleOutlined, QuestionCircleOutlined, FormOutlined, MailOutlined, BellOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import SimpleSeatingMap from './components/SimpleSeatingMap';
import DynamicPriceSelector from './components/DynamicPriceSelector';
import ZonesPanel from './components/ZonesPanel.jsx';
import ProductosWidget from '../../../store/components/ProductosWidget';
import PaymentModal from './PaymentModal';
import CustomFormBuilder from './components/CustomFormBuilder';
import MailChimpIntegration from './components/MailChimpIntegration';
import PushNotifications from './components/PushNotifications';
import { useBoleteria } from '../../hooks/useBoleteria';
import { useClientManagement } from '../../hooks/useClientManagement';
import { supabase } from '../../../supabaseClient';
import resolveImageUrl from '../../../utils/resolveImageUrl';

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
    setSelectedFuncion,
    handleEventSelect,
    handleFunctionSelect,
    mapa,
    zonas,
    loading: boleteriaLoading
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
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [persistedPriceId, setPersistedPriceId] = useState(null);
  
  // Estados para funcionalidades
  const [showEventSearch, setShowEventSearch] = useState(false);
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

  // Estados para búsqueda por localizador
  const [showLocatorSearch, setShowLocatorSearch] = useState(false);
  const [locatorSearchValue, setLocatorSearchValue] = useState('');
  const [locatorSearchLoading, setLocatorSearchLoading] = useState(false);

  // Estados para gestión de carritos
  const [showCartManagement, setShowCartManagement] = useState(false);
  const [savedCarts, setSavedCarts] = useState([]);

  // Estados para formularios personalizados y MailChimp
  const [showCustomForms, setShowCustomForms] = useState(false);
  const [showMailChimp, setShowMailChimp] = useState(false);
  const [showPushNotifications, setShowPushNotifications] = useState(false);

  // Estado para el mapa
  const [mapaLocal, setMapaLocal] = useState(null);

  // Función para obtener las imágenes del evento
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

  useEffect(() => {
    loadAvailableEvents();
    loadPlantillasPrecios();
    loadPersistedData();
    loadSavedCarts();
    loadLastSelection(); // Cargar última selección
  }, []);

  // Cargar datos persistidos
  const loadPersistedData = () => {
    try {
      const savedSeats = localStorage.getItem('selectedSeats');
      if (savedSeats) {
        setSelectedSeats(JSON.parse(savedSeats));
      }
      
      const savedProducts = localStorage.getItem('productosCarrito');
      if (savedProducts) {
        setProductosCarrito(JSON.parse(savedProducts));
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  // Cargar última selección de evento y función
  const loadLastSelection = async () => {
    try {
      const lastEventId = localStorage.getItem('boleteriaEventId');
      const lastFunctionId = localStorage.getItem('boleteriaFunctionId');
      
      console.log('🔄 [loadLastSelection] Cargando última selección:', { lastEventId, lastFunctionId });
      
      if (lastEventId) {
        // Cargar evento
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', lastEventId)
          .single();
        
        if (!eventoError && eventoData) {
          console.log('✅ [loadLastSelection] Evento cargado:', eventoData);
          setSelectedEvent(eventoData);
          
          // Si también hay función guardada, cargarla
          if (lastFunctionId) {
            const { data: funcionData, error: funcionError } = await supabase
              .from('funciones')
              .select('*, plantilla(*)')
              .eq('id', lastFunctionId)
              .single();
            
            if (!funcionError && funcionData) {
              console.log('✅ [loadLastSelection] Función cargada:', funcionData);
              setSelectedFuncion(funcionData);
              
              // Cargar plantilla si existe
              if (funcionData.plantilla) {
                setSelectedPlantilla(funcionData.plantilla);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [loadLastSelection] Error cargando última selección:', error);
    }
  };

  // Guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
  }, [selectedSeats]);

  useEffect(() => {
    localStorage.setItem('productosCarrito', JSON.stringify(productosCarrito));
  }, [productosCarrito]);

  // Persistir selección de evento/función para mantener tras recarga
  useEffect(() => {
    try {
      if (selectedEvent?.id) {
        localStorage.setItem('boleteriaEventId', String(selectedEvent.id));
      } else {
        localStorage.removeItem('boleteriaEventId');
      }
    } catch {}
  }, [selectedEvent]);

  useEffect(() => {
    try {
      if (selectedFuncion?.id) {
        localStorage.setItem('boleteriaFunctionId', String(selectedFuncion.id));
        // Si hay un priceId persistido, reintentar seleccionarlo
        const savedPriceId = localStorage.getItem('boleteriaSelectedPriceId');
        if (savedPriceId) setPersistedPriceId(savedPriceId);
      } else {
        localStorage.removeItem('boleteriaFunctionId');
      }
    } catch {}
  }, [selectedFuncion]);

  // Cargar funciones cuando se selecciona un evento
  useEffect(() => {
    if (selectedEvent) {
      loadFunctionsForEvent(selectedEvent.id);
    }
  }, [selectedEvent]);

  // Cargar mapa y plantilla cuando se selecciona una función
  useEffect(() => {
    if (selectedFuncion) {
      loadMapaForFunction(selectedFuncion);
      loadPlantillaForFunction(selectedFuncion);
    }
  }, [selectedFuncion]);

  // Sincronizar mapa del hook con estado local
  useEffect(() => {
    if (mapa) {
      setMapaLocal(mapa);
      console.log('🔄 [useEffect] Mapa sincronizado desde hook:', mapa);
    }
  }, [mapa]);

  // Recalcular estadísticas cuando el mapa efectivo esté disponible
  useEffect(() => {
    if (selectedFuncion?.id) {
      loadEventStats(selectedFuncion.id);
    }
  }, [mapaLocal, selectedFuncion?.id]);

  const loadSavedCarts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_carts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading saved carts:', error);
        return;
      }

      setSavedCarts(data || []);
    } catch (error) {
      console.error('Error loading saved carts:', error);
    }
  };

  const saveCurrentCart = async () => {
    if (!selectedClient) {
      message.error('Selecciona un cliente antes de guardar el carrito');
      return;
    }

    try {
      const cartData = {
        client_id: selectedClient.id,
        event_id: selectedEvent?.id,
        function_id: selectedFuncion?.id,
        seats: selectedSeats,
        products: productosCarrito,
        total: calculateTotal(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('saved_carts')
        .insert([cartData])
        .select()
        .single();

      if (error) throw error;

      message.success('Carrito guardado correctamente');
      loadSavedCarts();
    } catch (error) {
      console.error('Error saving cart:', error);
      message.error('Error al guardar el carrito');
    }
  };

  const loadSavedCart = async (cartId) => {
    try {
      const { data, error } = await supabase
        .from('saved_carts')
        .select('*')
        .eq('id', cartId)
        .single();

      if (error) throw error;

      // Cargar cliente
      if (data.client_id) {
        const { data: client } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.client_id)
          .single();
        setSelectedClient(client);
      }

      // Cargar evento y función
      if (data.event_id) {
        const { data: event } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', data.event_id)
          .single();
        setSelectedEvent(event);
      }

      if (data.function_id) {
        const { data: func } = await supabase
          .from('funciones')
          .select('*, salas(*)')
          .eq('id', data.function_id)
          .single();
        setSelectedFuncion(func);
      }

      // Cargar asientos y productos
      setSelectedSeats(data.seats || []);
      setProductosCarrito(data.products || []);

      message.success('Carrito cargado correctamente');
    } catch (error) {
      console.error('Error loading saved cart:', error);
      message.error('Error al cargar el carrito');
    }
  };

  const clearCart = () => {
    setSelectedSeats([]);
    setProductosCarrito([]);
    setSelectedPriceOption(null);
    setSelectedDiscount(null);
    setDiscountAmount(0);
    message.success('Carrito limpiado');
  };

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
      
      // Ctrl/Cmd + D: Descuentos
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        setShowDiscountModal(true);
      }
             // Ctrl/Cmd + L: Búsqueda por localizador
       if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
         event.preventDefault();
         setShowLocatorSearch(true);
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
          setShowDiscountModal(false);
          setShowLocatorSearch(false);
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
        .select('*, salas(*), plantilla(*)')
        .eq('evento_id', eventId)
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

  // Cargar mapa para una función específica
  const loadMapaForFunction = async (funcion) => {
    try {
      if (!funcion.sala_id && !funcion.sala?.id) {
        console.warn('⚠️ [loadMapaForFunction] No hay sala_id disponible');
        return;
      }

      const salaId = funcion.sala_id || funcion.sala?.id;
      console.log('🔍 [loadMapaForFunction] Cargando mapa para sala:', salaId);

      // Importar dinámicamente el servicio
      const { fetchMapa } = await import('../../../services/supabaseServices');
      const mapData = await fetchMapa(salaId);
      
      console.log('📊 [loadMapaForFunction] Mapa cargado:', mapData);
      
      // Actualizar el estado del mapa local
      if (mapData) {
        setMapaLocal(mapData);
        console.log('✅ [loadMapaForFunction] Mapa actualizado en estado local');
      }
    } catch (error) {
      console.error('❌ [loadMapaForFunction] Error cargando mapa:', error);
    }
  };

  // Cargar plantilla para una función específica
  const loadPlantillaForFunction = async (funcion) => {
    try {
      // Usar plantilla embebida si existe
      if (funcion.plantilla && typeof funcion.plantilla === 'object') {
        console.log('✅ [loadPlantillaForFunction] Usando plantilla embebida en función');
        setSelectedPlantilla(funcion.plantilla);
        return;
      }

      let plantillaId = funcion.plantilla?.id || funcion.plantilla_id || funcion.plantilla_entradas;
      if (!plantillaId) {
        console.warn('⚠️ [loadPlantillaForFunction] No hay identificador de plantilla en la función. Reintentando cargar función con plantilla...');
        // Intentar recuperar la función con su relación de plantilla
        if (funcion.id) {
          const { data: funcionData, error: funcionError } = await supabase
            .from('funciones')
            .select('*, plantilla(*)')
            .eq('id', funcion.id)
            .single();
          if (!funcionError && funcionData?.plantilla) {
            setSelectedPlantilla(funcionData.plantilla);
            return;
          }
        }
        setSelectedPlantilla(null);
        return;
      }

      console.log('🔍 [loadPlantillaForFunction] Cargando plantilla:', plantillaId);

      const { data: plantillaData, error: plantillaError } = await supabase
        .from('plantillas')
        .select('*')
        .eq('id', plantillaId)
        .single();

      if (plantillaError) {
        console.error('❌ [loadPlantillaForFunction] Error cargando plantilla:', plantillaError);
        setSelectedPlantilla(null);
        return;
      }

      if (plantillaData) {
        console.log('✅ [loadPlantillaForFunction] Plantilla cargada:', plantillaData);
        setSelectedPlantilla(plantillaData);
      } else {
        setSelectedPlantilla(null);
      }
    } catch (error) {
      console.error('❌ [loadPlantillaForFunction] Error cargando plantilla:', error);
      setSelectedPlantilla(null);
    }
  };

  const loadEventStats = async (funcionId) => {
    if (!funcionId) return;
    
    try {
      // Usar el mapa efectivo disponible
      const effectiveMap = mapaLocal || mapa;
      let totalSeats = 0;
      let availableSeats = 0;
      let soldSeats = 0;
      let reservedSeats = 0;
      
      // Si tenemos un mapa cargado, calcular estadísticas desde ahí
      if (effectiveMap && effectiveMap.contenido && Array.isArray(effectiveMap.contenido)) {
        console.log('📊 [loadEventStats] Calculando estadísticas desde el mapa:', effectiveMap.contenido);
        
        effectiveMap.contenido.forEach(elemento => {
          if (elemento.sillas && Array.isArray(elemento.sillas)) {
            totalSeats += elemento.sillas.length;
            
            elemento.sillas.forEach(silla => {
              switch (silla.estado) {
                case 'pagado':
                case 'vendido':
                  soldSeats++;
                  break;
                case 'reservado':
                  reservedSeats++;
                  break;
                case 'disponible':
                default:
                  availableSeats++;
                  break;
              }
            });
          }
        });
        
        console.log('✅ [loadEventStats] Estadísticas calculadas desde mapa:', {
          totalSeats,
          availableSeats,
          soldSeats,
          reservedSeats
        });
      } else {
        console.log('⚠️ [loadEventStats] No hay mapa disponible, consultando tabla asientos como fallback');
        
        // Fallback: consultar tabla asientos si no hay mapa
        const { data: seats, error: seatsError } = await supabase
          .from('asientos')
          .select('*')
          .eq('funcion_id', funcionId);

        if (seatsError) {
          console.error('Error loading seats:', seatsError);
          return;
        }

        totalSeats = seats?.length || 0;
        soldSeats = seats?.filter(seat => seat.estado === 'vendido').length || 0;
        reservedSeats = seats?.filter(seat => seat.estado === 'reservado').length || 0;
        availableSeats = totalSeats - soldSeats - reservedSeats;
        
        console.log('📊 [loadEventStats] Estadísticas desde tabla asientos:', {
          totalSeats,
          availableSeats,
          soldSeats,
          reservedSeats
        });
      }

      setEventStats({
        totalSeats,
        availableSeats,
        soldSeats,
        reservedSeats
      });

      // Notificaciones de disponibilidad (solo si existen asientos)
      if (totalSeats > 0) {
        if (availableSeats <= 5 && availableSeats > 0) {
          message.warning(`⚠️ Solo quedan ${availableSeats} asientos disponibles`);
        } else if (availableSeats === 0) {
          message.error('❌ No hay asientos disponibles');
        } else if (availableSeats <= 10) {
          message.info(`ℹ️ Quedan ${availableSeats} asientos disponibles`);
        }
      }
    } catch (error) {
      console.error('Error loading event stats:', error);
    }
  };

  const handleLocatorSearch = async () => {
    if (!locatorSearchValue) {
      message.error('Ingresa un localizador');
      return;
    }

    setLocatorSearchLoading(true);
    try {
      // Buscar el pago por localizador
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          user:profiles!user_id(*),
          event:eventos(*),
          funcion:funciones(*)
        `)
        .eq('locator', locatorSearchValue)
        .single();

      if (error) {
        message.error('Localizador no encontrado');
        return;
      }

      // Cargar los datos del pago
      setSelectedClient(payments.user);
      setSelectedEvent(payments.event);
      setSelectedFuncion(payments.funcion);
      
      // Cargar los asientos del pago
      const { data: seats, error: seatsError } = await supabase
        .from('asientos')
        .select('*')
        .eq('payment_id', payments.id);

      if (!seatsError && seats) {
        setSelectedSeats(seats);
        message.success(`Pago encontrado: ${payments.event.nombre}`);
      }

      setShowLocatorSearch(false);
      setLocatorSearchValue('');
    } catch (error) {
      console.error('Error searching by locator:', error);
      message.error('Error al buscar por localizador');
    } finally {
      setLocatorSearchLoading(false);
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

  // Función para manejar el bloqueo de asientos
  const handleBlockSeats = async () => {
    if (blockedSeats.length === 0) {
      message.warning('No hay asientos seleccionados para bloquear');
      return;
    }

    try {
      // Marcar asientos como reservados en la base de datos
      for (const seat of blockedSeats) {
        const { error } = await supabase
          .from('sillas')
          .update({ 
            estado: 'reservado',
            user_id: selectedClient?.id || null,
            bloqueado: true
          })
          .eq('_id', seat._id);

        if (error) {
          console.error('Error al bloquear asiento:', error);
          message.error(`Error al bloquear asiento ${seat.nombre}`);
        }
      }

      message.success(`${blockedSeats.length} asiento(s) bloqueado(s) correctamente. Los asientos ahora están reservados y no pueden ser seleccionados por otros usuarios.`);
      
      // Limpiar asientos bloqueados y desactivar modo bloqueo
      setBlockedSeats([]);
      setBlockMode(false);
      
      // Recargar el mapa para mostrar los cambios
      if (selectedFuncion?.sala?.id) {
        // Aquí podrías recargar el mapa si es necesario
        console.log('Asientos bloqueados exitosamente');
      }
      
    } catch (error) {
      console.error('Error al bloquear asientos:', error);
      message.error('Error al bloquear asientos');
    }
  };

  // Función para activar modo bloqueo solo cuando el carrito está vacío
  const handleBlockModeToggle = (checked) => {
    if (checked && (selectedSeats.length > 0 || productosCarrito.length > 0)) {
      message.warning('El modo bloqueo solo se puede activar cuando el carrito está vacío');
      return;
    }
    setBlockMode(checked);
    if (!checked) {
      setBlockedSeats([]); // Limpiar asientos bloqueados al desactivar
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
    const productsTotal = productosCarrito.reduce((sum, product) => 
      sum + ((product.precio_especial || product.precio) * product.cantidad), 0);
    return seatsTotal + productsTotal;
  };

  const handleProductAdded = (producto) => {
    setProductosCarrito(prev => {
      const existingProduct = prev.find(p => p.id === producto.id);
      if (existingProduct) {
        return prev.map(p => 
          p.id === producto.id 
            ? { ...p, cantidad: p.cantidad + producto.cantidad }
            : p
        );
      }
      return [...prev, { ...producto, cantidad: producto.cantidad }];
    });
  };

  const handleProductQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setProductosCarrito(prev => prev.filter(p => p.id !== productId));
    } else {
      setProductosCarrito(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, cantidad: newQuantity }
          : p
      ));
    }
  };

  const handleProductRemove = (productId) => {
    setProductosCarrito(prev => prev.filter(p => p.id !== productId));
    message.success('Producto removido del carrito');
  };

  const handlePriceOptionSelect = (priceOption) => {
    setSelectedPriceOption(priceOption);
    // Al seleccionar precio, fijar la zona activa para filtrar asientos
    try {
      const zonaId = priceOption?.zona?.id || priceOption?.zonaId || priceOption?.zona;
      if (zonaId) {
        setActiveZoneId(String(zonaId));
      }
      if (priceOption?.id) {
        localStorage.setItem('boleteriaSelectedPriceId', String(priceOption.id));
      }
    } catch (e) {}
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
    // Recalcular estadísticas cuando el mapa/función terminen de cargar
    message.success(`Evento seleccionado: ${selectedEventForSearch?.nombre} - ${func?.sala?.nombre || 'Sala sin nombre'}`);
  };

  const tabItems = [
    {
      key: 'mapa',
      label: 'Mapa',
      children: (
        <div className="relative">
          {/* Zonas y precios al estilo panel agrupado */}
          {selectedFuncion && (
            <div className="mb-3">
              <ZonesPanel
                selectedFuncion={selectedFuncion}
                selectedPlantilla={selectedPlantilla}
                mapa={mapaLocal}
                onSelectPrice={handlePriceOptionSelect}
                selectedPriceId={selectedPriceOption?.id}
                selectedZonaId={activeZoneId}
                onSelectZona={(zonaId) => setActiveZoneId(String(zonaId))}
                onPricesLoaded={(map) => {
                  // Intentar restaurar precio/zone seleccionado si existe en storage
                  const savedPriceId = localStorage.getItem('boleteriaSelectedPriceId');
                  if (savedPriceId) {
                    for (const zonaId of Object.keys(map || {})) {
                      const opt = (map[zonaId]?.options || []).find(o => String(o.id) === String(savedPriceId));
                      if (opt) {
                        setActiveZoneId(String(zonaId));
                        setSelectedPriceOption(opt);
                        break;
                      }
                    }
                  }
                }}
              />
              {!blockMode && !selectedPriceOption && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  Primero selecciona una zona y precio antes de elegir asientos
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-4 left-4 z-10 flex space-x-2">
            <Button size="small" icon={<ZoomInOutlined />} onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))} />
            <Button size="small" icon={<ZoomOutOutlined />} onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))} />
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm overflow-hidden">
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
            <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: '0 0' }}>
              <SimpleSeatingMap
                selectedFuncion={selectedFuncion}
                onSeatClick={handleSeatClick}
                selectedSeats={selectedSeats}
                blockedSeats={blockedSeats}
                blockMode={blockMode}
                selectedPlantilla={selectedPlantilla}
                selectedPriceOption={selectedPriceOption}
                selectedZonaId={activeZoneId}
              />
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
          {/* Mensajes informativos condensos en header */}
          {selectedFuncion && (
            <div className="bg-white shadow-sm border-b px-4 py-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {selectedEvent && (thumbnailImage || selectedEvent.imagen_url) ? (
                      <img 
                        src={thumbnailImage ? resolveImageUrl(thumbnailImage) : selectedEvent.imagen_url} 
                        alt={selectedEvent.nombre}
                        className="w-16 h-16 object-cover rounded-lg mr-3"
                        onError={(e) => {
                          e.target.src = '/assets/logo.png';
                        }}
                      />
                    ) : (
                      <Avatar size="large" src="/assets/logo.png" alt="Event" />
                    )}
                    <div className="text-xs">
                      <div className="font-medium">{selectedEvent ? selectedEvent.nombre : 'Selecciona un evento'}</div>
                      <div className="text-gray-600">
                        <span>
                          Fecha: {selectedEvent && selectedEvent.fecha_evento && !isNaN(new Date(selectedEvent.fecha_evento).getTime())
                            ? new Date(selectedEvent.fecha_evento).toLocaleDateString('es-ES')
                            : 'N/A'}
                        </span>
                        <span className="ml-2">
                          Hora: {selectedFuncion && selectedFuncion.fecha_celebracion && !isNaN(new Date(selectedFuncion.fecha_celebracion).getTime())
                            ? new Date(selectedFuncion.fecha_celebracion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="text-gray-500 mt-1">
                        <span>Sala: {selectedFuncion.sala_id || selectedFuncion.sala?.id || 'Sin sala'}</span>
                        <span className="ml-2">Plantilla: {selectedPlantilla ? selectedPlantilla.nombre : 'Sin plantilla'}</span>
                        <span className="ml-2">Mapa: {mapaLocal ? 'Cargado' : 'No cargado'}</span>
                      </div>
                    </div>
                  </div>
                  <Button type="default" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()} className="ml-4" title="Volver atrás">Atrás</Button>
                  {selectedFuncion && (
                    <Button
                      type="primary"
                      icon={<ReloadOutlined />}
                      onClick={() => { if (selectedFuncion) { loadMapaForFunction(selectedFuncion); loadPlantillaForFunction(selectedFuncion); } }}
                      className="ml-2"
                      title="Recargar mapa y plantilla"
                      loading={boleteriaLoading}
                    >
                      Recargar
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Modo bloqueo:</span>
                    <input type="checkbox" checked={blockMode} onChange={(e) => handleBlockModeToggle(e.target.checked)} className="rounded" />
                  </div>
                  <span className="text-xs text-gray-500">{zoomLevel.toFixed(1)}X</span>
                  <Tooltip title={<div className="text-xs"><div className="font-medium mb-2">Atajos de Teclado:</div><div>• <strong>Ctrl+E:</strong> Buscar eventos</div><div>• <strong>Ctrl+U:</strong> Buscar usuarios</div><div>• <strong>Ctrl+L:</strong> Búsqueda por localizador</div><div>• <strong>Ctrl+X:</strong> Exportar datos</div><div>• <strong>Escape:</strong> Cerrar modales</div></div>} placement="bottom">
                    <QuestionCircleOutlined className="text-gray-400 hover:text-blue-500 cursor-help text-sm ml-2" />
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
          

        {/* Resumen de Compra eliminado: el resumen vive en el panel derecho */}

        {/* Área principal */}
        <div className="flex-1 flex">
          {/* Contenido central */}
          <div className="flex-1 p-4">
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
            <div className="p-4">
              
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
              
              {/* Estadísticas del Evento - Ahora en botón */}
              {selectedFuncion && (
                <div className="mb-2">
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
                <div className="flex justify-between">
                  <span>Boletos:</span>
                  <span>{selectedSeats.length}, ${selectedSeats.reduce((sum, seat) => {
                    const seatPrice = seat.precio || selectedPriceOption?.precio || 0;
                    return sum + seatPrice;
                  }, 0).toFixed(2)}</span>
                </div>
                
                                {productosCarrito.length > 0 && (
                  <div className="mb-2">
                    <h4 className="font-medium text-gray-900 mb-2">Productos en Carrito</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {productosCarrito.map((producto) => (
                        <div key={producto.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{producto.nombre}</div>
                            <div className="text-xs text-gray-600">
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
                            />
                            <Button 
                              size="small" 
                              type="text" 
                              danger
                              onClick={() => handleProductRemove(producto.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  
                  <div className="flex justify-between">
                    <span>Productos:</span>
                    <span>{productosCarrito.reduce((sum, p) => sum + p.cantidad, 0)}, ${productosCarrito.reduce((sum, product) => sum + ((product.precio_especial || product.precio) * product.cantidad), 0).toFixed(2)}</span>
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
              
              <div className="mt-6 space-y-2">
                <div className="flex space-x-2">
                    <Button 
                      size="small"
                      onClick={saveCurrentCart}
                      disabled={!selectedClient || (selectedSeats.length === 0 && productosCarrito.length === 0)}
                    >
                      Guardar Carrito
                    </Button>
                    <Button 
                      size="small"
                      onClick={clearCart}
                      disabled={selectedSeats.length === 0 && productosCarrito.length === 0}
                    >
                      Limpiar
                    </Button>
                    {blockMode && blockedSeats.length > 0 && (
                      <Button 
                        size="small"
                        type="primary"
                        danger
                        onClick={handleBlockSeats}
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

                 {/* Modal de Búsqueda por Localizador */}
         <Modal
           title="Buscar por Localizador"
           open={showLocatorSearch}
           onCancel={() => setShowLocatorSearch(false)}
           footer={null}
           width={500}
         >
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Localizador</label>
               <Input.Search
                 placeholder="Ingresa el localizador del pago"
                 value={locatorSearchValue}
                 onChange={(e) => setLocatorSearchValue(e.target.value)}
                 onSearch={handleLocatorSearch}
                 loading={locatorSearchLoading}
                 enterButton="Buscar"
               />
             </div>
             
             <div className="text-sm text-gray-600">
               <p>• Busca pagos existentes por su localizador</p>
               <p>• Carga automáticamente el evento, cliente y asientos</p>
               <p>• Útil para consultas y modificaciones</p>
             </div>
           </div>
         </Modal>

             {/* Modal de Gestión de Carritos */}
       <Modal
         title="Gestión de Carritos Guardados"
         open={showCartManagement}
         onCancel={() => setShowCartManagement(false)}
         footer={null}
         width={800}
       >
         <div className="space-y-4">
           <div className="flex justify-between items-center">
             <h3 className="text-lg font-medium">Carritos Guardados</h3>
             <Button 
               type="primary" 
               onClick={saveCurrentCart}
               disabled={!selectedClient || (selectedSeats.length === 0 && productosCarrito.length === 0)}
             >
               Guardar Carrito Actual
             </Button>
           </div>
           
           {savedCarts.length === 0 ? (
             <div className="text-center py-8">
               <Text type="secondary">No hay carritos guardados</Text>
             </div>
           ) : (
             <div className="space-y-3 max-h-96 overflow-y-auto">
               {savedCarts.map((cart) => (
                 <div key={cart.id} className="border rounded-lg p-4 hover:bg-gray-50">
                   <div className="flex justify-between items-start">
                     <div className="flex-1">
                       <div className="font-medium">
                         Cliente: {cart.client_id ? `ID: ${cart.client_id}` : 'N/A'}
                       </div>
                       <div className="text-sm text-gray-600">
                         Evento: {cart.event_id ? `ID: ${cart.event_id}` : 'N/A'}
                       </div>
                       <div className="text-sm text-gray-600">
                         Asientos: {cart.seats?.length || 0} | Productos: {cart.products?.length || 0}
                       </div>
                       <div className="text-sm font-medium text-green-600">
                         Total: ${cart.total?.toFixed(2) || '0.00'}
                       </div>
                       <div className="text-xs text-gray-500">
                         {new Date(cart.created_at).toLocaleString('es-ES')}
                       </div>
                     </div>
                     <div className="flex space-x-2">
                       <Button 
                         size="small" 
                         type="primary"
                         onClick={() => loadSavedCart(cart.id)}
                       >
                         Cargar
                       </Button>
                       <Button 
                         size="small" 
                         danger
                         onClick={async () => {
                           try {
                             await supabase
                               .from('saved_carts')
                               .delete()
                               .eq('id', cart.id);
                             message.success('Carrito eliminado');
                             loadSavedCarts();
                           } catch (error) {
                             message.error('Error al eliminar el carrito');
                           }
                         }}
                       >
                         Eliminar
                       </Button>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </Modal>

       {/* Modal de formularios personalizados */}
       <Modal
         title="Formularios Personalizados"
         open={showCustomForms}
         onCancel={() => setShowCustomForms(false)}
         footer={null}
         width={1200}
         style={{ top: 20 }}
       >
         <CustomFormBuilder 
           eventId={selectedEvent?.id}
           onSave={(form) => {
             message.success('Formulario guardado correctamente');
             setShowCustomForms(false);
           }}
         />
       </Modal>

       {/* Modal de integración MailChimp */}
       <Modal
         title="Integración con MailChimp"
         open={showMailChimp}
         onCancel={() => setShowMailChimp(false)}
         footer={null}
         width={800}
       >
         <MailChimpIntegration eventId={selectedEvent?.id} />
       </Modal>

       {/* Modal de notificaciones push */}
       <Modal
         title="Notificaciones Push"
         open={showPushNotifications}
         onCancel={() => setShowPushNotifications(false)}
         footer={null}
         width={800}
       >
         <PushNotifications eventId={selectedEvent?.id} />
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