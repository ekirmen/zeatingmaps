import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button, Card, message, Spin, Alert, Badge, Tag, Descriptions, Statistic } from 'antd';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  ShoppingCartOutlined,
  ShareAltOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  UserOutlined,
  SettingOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  TeamOutlined,
  TagsOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { getFunciones } from '../services/apistore';
import formatDateString from '../../utils/formatDateString';
import { useCartStore } from '../../store/cartStore';
import { useSeatLockStore } from '../../components/seatLockStore';
import useSelectedSeatsStore from '../../stores/useSelectedSeatsStore';
import useCartRestore from '../../store/hooks/useCartRestore';
import useSeatLocksArray from '../hooks/useSeatLocksArray';
import SeatingMapUnified from '../../components/SeatingMapUnified';
import Cart from './Cart';
import EventImage from '../components/EventImage';
import GridSaleMode from '../components/GridSaleMode';
import { getEstadoVentaInfo } from '../../utils/estadoVenta';
import { useCountdown, formatCountdown, findNextStart } from '../../utils/countdown';
import NotFound from './NotFound';


const ModernEventPage = () => {
  useCartRestore();
  const { eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Detectar si estamos en la vista del mapa
  const isMapView = location.pathname.includes('/map');

  // Flag de depuración global (desactivado por defecto)
  const DEBUG = typeof window !== 'undefined' && window.__DEBUG === true;

  const [evento, setEvento] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState(null);
  
  // Debug logs (controlados por flag)
  if (DEBUG) {
    console.log('🔍 [ModernEventPage] Debug info:', {
      isMapView,
      selectedFunctionId,
      eventSlug,
      pathname: location.pathname,
      searchParams: searchParams.toString()
    });
  }
  const [mapa, setMapa] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [venueInfo, setVenueInfo] = useState(null);
  const { user } = useAuth();
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [funcionesForCountdown, setFuncionesForCountdown] = useState([]);

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const cartItems = useCartStore((state) => state.items);
  const getItemCount = useCartStore((state) => state.getItemCount);
  
  // Store unificado para sincronización con boletería
  const {
    selectedSeats,
    addSeat: addSeatToUnified,
    removeSeat: removeSeatFromUnified,
    syncWithSeatLocks
  } = useSelectedSeatsStore();

  const {
    subscribeToFunction,
    unsubscribe,
    lockSeat,
    unlockSeat,
    isSeatLocked,
    isSeatLockedByMe,
    isTableLocked,
    isTableLockedByMe,
    isAnySeatInTableLocked,
    areAllSeatsInTableLockedByMe
  } = useSeatLockStore();

  // Cargar datos reales de seat_locks desde la base de datos
  const { lockedSeats: realLockedSeats } = useSeatLocksArray(selectedFunctionId, null, !!selectedFunctionId);
  
  // Debug: Log de seat_locks cargados
  useEffect(() => {
    console.log('🎫 [STORE] Debug - realLockedSeats:', realLockedSeats);
    console.log('🎫 [STORE] Debug - selectedFunctionId:', selectedFunctionId);
    if (realLockedSeats && realLockedSeats.length > 0) {
      console.log('🎫 [STORE] Seat locks cargados:', realLockedSeats);
    } else {
      console.log('🎫 [STORE] No hay seat locks cargados para función:', selectedFunctionId);
    }
  }, [realLockedSeats, selectedFunctionId]);

  // Sincronización automática con seat_locks
  useEffect(() => {
    if (realLockedSeats && realLockedSeats.length > 0) {
      console.log('🔄 [STORE] Sincronizando con seat_locks:', realLockedSeats);
      syncWithSeatLocks(realLockedSeats);
    }
  }, [realLockedSeats, syncWithSeatLocks]);

  // Cargar evento y funciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: eventData, error: eventError } = await supabase
          .from('eventos')
          .select('*')
          .ilike('slug', eventSlug)
          .maybeSingle();

        if (eventError) throw eventError;
        if (!eventData) throw new Error('Evento no encontrado');
        
        setEvento(eventData);

        // Cargar recinto
        const recintoId = eventData.recinto_id || eventData.recinto || null;
        if (recintoId) {
          const { data: recData, error: recErr } = await supabase
            .from('recintos')
            .select('id, nombre, direccion, capacidad')
            .eq('id', recintoId)
            .maybeSingle();
          if (!recErr) setVenueInfo(recData || null);
        }

        // Obtener funciones
        const funcionesData = await getFunciones(eventData.id);
        setFunciones(funcionesData || []);
        setFuncionesForCountdown(funcionesData || []);

        // Seleccionar función automáticamente
        const funcionParam = searchParams.get('funcion');
        if (funcionParam && funcionesData) {
          const funcion = funcionesData.find(
            f => String(f.id) === funcionParam || String(f._id) === funcionParam
          );
          if (funcion) {
            const fid = funcion.id || funcion._id;
            setSelectedFunctionId(fid);
          }
        } else if (funcionesData && funcionesData.length === 1) {
          const fid = funcionesData[0].id || funcionesData[0]._id;
          setSelectedFunctionId(fid);
        }
      } catch (err) {
        console.error('Error fetching evento:', err);
        setError(err);
        message.error('Error al cargar el evento');
      } finally {
        setLoading(false);
      }
    };
    
    if (eventSlug) fetchData();
  }, [eventSlug, searchParams]);

  // Cargar perfil para conocer permisos (tenant_admin)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user?.id) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('perfil')
          .eq('id', user.id)
          .maybeSingle();
        if (!error && data?.perfil) {
          setIsTenantAdmin(String(data.perfil).toLowerCase() === 'tenant_admin');
        }
      } catch (e) {
        // ignore silently
      }
    };
    loadProfile();
  }, [user, supabase]);

  // Suscribirse a función
  useEffect(() => {
    if (!selectedFunctionId) return;
    subscribeToFunction(selectedFunctionId);
    return () => unsubscribe();
  }, [selectedFunctionId, subscribeToFunction, unsubscribe]);

  // Cargar mapa cuando estemos en la vista del mapa
  useEffect(() => {
    if (DEBUG) console.log('🔍 [ModernEventPage] useEffect mapa - isMapView:', isMapView, 'selectedFunctionId:', selectedFunctionId);
    
    if (!isMapView || !selectedFunctionId) {
      if (DEBUG) console.log('⚠️ [ModernEventPage] No cargando mapa - condiciones no cumplidas');
      return;
    }
    
    const fetchMapa = async () => {
      try {
        setMapLoading(true);
        if (DEBUG) console.log('🗺️ [ModernEventPage] Cargando mapa para función:', selectedFunctionId);

        // Obtener sala_id de la función seleccionada (soporta esquemas nuevo y antiguo)
        const selectedFuncion = funciones.find(f => (f.id || f._id) === selectedFunctionId);
        const salaId = selectedFuncion?.sala_id ?? selectedFuncion?.sala;

        if (!salaId) {
          console.warn('⚠️ [ModernEventPage] No se pudo determinar sala_id para la función:', selectedFunctionId);
          setMapa(null);
          setMapLoading(false);
          return;
        }

        const { data: mapaData, error: mapaError } = await supabase
          .from('mapas')
          .select('*')
          .eq('sala_id', salaId)
          .maybeSingle();

        if (DEBUG) console.log('🔍 [ModernEventPage] Respuesta de mapas:', { mapaData, mapaError });

        if (mapaError) throw mapaError;
        
        if (mapaData) {
          setMapa(mapaData);
          if (DEBUG) console.log('✅ [ModernEventPage] Mapa cargado:', mapaData.id);
        } else {
          if (DEBUG) console.log('⚠️ [ModernEventPage] No se encontró mapa para la función:', selectedFunctionId);
        }
      } catch (err) {
        console.error('❌ [ModernEventPage] Error cargando mapa:', err);
        message.error('Error al cargar el mapa de asientos');
      } finally {
        setMapLoading(false);
      }
    };

    fetchMapa();
  }, [isMapView, selectedFunctionId]);

  const handleFunctionSelect = (functionId) => {
    setSelectedFunctionId(functionId);
  };

  const handleSeatToggle = async (seatOrId) => {
    if (!selectedFunctionId) return;

    const seatId = typeof seatOrId === 'string' ? seatOrId : (seatOrId?._id || seatOrId?.id);
    if (!seatId) {
      console.warn('⚠️ [ModernEventPage] seatId inválido en handleSeatToggle:', seatOrId);
      return;
    }

    if (isSeatLocked(seatId) && !isSeatLockedByMe(seatId)) return;

    const exists = selectedSeats.some(seat => seat._id === seatId);

    if (exists) {
      await unlockSeat(seatId, selectedFunctionId);
      removeSeatFromUnified(seatId);
      removeFromCart(seatId); // Mantener compatibilidad con carrito existente
    } else {
      const ok = await lockSeat(seatId, 'seleccionado', selectedFunctionId);
      if (!ok) return;
      
      // Crear objeto de asiento para el store unificado
      const seatData = {
        _id: seatId,
        nombre: `Asiento ${seatId}`,
        precio: 50, // Precio por defecto
        zona: { nombre: 'General' },
        functionId: selectedFunctionId,
      };
      
      addSeatToUnified(seatData);
      toggleSeat({
        sillaId: seatId,
        nombre: `Asiento ${seatId}`,
        precio: 50, // Precio por defecto
        nombreZona: 'General',
        functionId: selectedFunctionId,
      });
    }
  };

  const handleTableToggle = (table) => {
    console.log('Mesa seleccionada:', table);
    // Por ahora solo mostrar información de la mesa
    // En el futuro se puede implementar lógica para seleccionar toda la mesa
  };


  // Funciones para parsear campos JSON
  const parseJsonField = (field) => {
    if (!field) return null;
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (e) {
      console.error('Error parsing JSON field:', e);
      return null;
    }
  };

  const getEventTags = () => {
    const tags = parseJsonField(evento.tags);
    return Array.isArray(tags) ? tags : [];
  };

  const getAnalytics = () => {
    return parseJsonField(evento.analytics) || {};
  };

  const getDatosBoleto = () => {
    return parseJsonField(evento.datosBoleto) || {};
  };

  const getDatosComprador = () => {
    return parseJsonField(evento.datosComprador) || {};
  };

  const getOtrasOpciones = () => {
    return parseJsonField(evento.otrasOpciones) || {};
  };


  // Función para obtener el estado visual del evento
  const getEventStatus = () => {
    if (evento.desactivado) return { status: 'error', text: 'Desactivado', icon: <CloseCircleOutlined /> };
    if (!evento.activo) return { status: 'warning', text: 'Inactivo', icon: <ExclamationCircleOutlined /> };
    const ev = getEstadoVentaInfo(evento.estadoVenta);
    const statusMap = {
      'A la venta': { status: 'success', icon: <CheckCircleOutlined /> },
      'Solo en taquilla': { status: 'processing', icon: <InfoCircleOutlined /> },
      'Agotado': { status: 'error', icon: <CloseCircleOutlined /> },
      'Próximamente': { status: 'processing', icon: <ClockCircleOutlined /> },
      'Próximamente con cuenta atrás': { status: 'processing', icon: <ClockCircleOutlined /> },
      'Estado personalizado': { status: 'default', icon: <InfoCircleOutlined /> },
    };
    const mapped = statusMap[ev.label] || { status: 'default', icon: <InfoCircleOutlined /> };
    return { status: mapped.status, text: ev.label, icon: mapped.icon };
  };

  // Función para obtener el modo de venta
  const getModoVenta = () => {
    const modos = {
      'normal': { text: 'Venta Normal', color: 'blue' },
      'preventa': { text: 'Preventa', color: 'orange' },
      'especial': { text: 'Venta Especial', color: 'purple' },
      'gratis': { text: 'Evento Gratuito', color: 'green' }
    };
    return modos[evento.modoVenta] || { text: evento.modoVenta || 'Normal', color: 'default' };
  };

  // Hook para countdown - debe estar antes de cualquier early return
  const countdownTarget = evento?.estadoVenta === 'proximamente-countdown' 
    ? (findNextStart(funcionesForCountdown, 'internet') || findNextStart(funcionesForCountdown, 'boxOffice'))
    : null;
  const cd = useCountdown(countdownTarget);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert
          message="Error"
          description="No se pudo cargar el evento"
          type="error"
          showIcon
        />
      </div>
    );
  }

  const eventStatus = getEventStatus();
  const modoVenta = getModoVenta();
  const tags = getEventTags();
  const analytics = getAnalytics();
  const canStoreAccess = (() => {
    const ev = getEstadoVentaInfo(evento.estadoVenta);
    return ev?.store?.icon === '✔';
  })();

  // Si estamos en la vista del mapa, mostrar el mapa y el carrito
  if (isMapView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header con información básica del evento */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate(`/store/eventos/${eventSlug}`)}
                >
                  Volver a Evento
                </Button>
                <div className="flex items-center space-x-3">
                  <EventImage
                    event={evento}
                    imageType="banner"
                    className="w-12 h-8 object-cover rounded"
                    showDebug={false}
                  />
                  <h1 className="text-2xl font-bold text-gray-900">{evento.nombre}</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge status={eventStatus.status} text={eventStatus.text} />
                <Tag color={modoVenta.color}>{modoVenta.text}</Tag>
              </div>
            </div>
            
            {/* Información de la función */}
            {(() => {
              const funcionSel = funciones.find(f => String(f.id) === String(selectedFunctionId));
              const fechaRaw = funcionSel?.fechaCelebracion || funcionSel?.fecha_celebracion || funcionSel?.fecha || evento?.fecha_evento || null;
              const fechaTxt = fechaRaw ? formatDateString(fechaRaw) : '—';
              const horaTxt = (() => {
                if (funcionSel?.hora) return funcionSel.hora;
                if (fechaRaw) {
                  try {
                    const d = new Date(fechaRaw);
                    if (!isNaN(d.getTime())) {
                      const hh = String(d.getHours()).padStart(2, '0');
                      const mm = String(d.getMinutes()).padStart(2, '0');
                      return `${hh}:${mm}`;
                    }
                  } catch (_) {}
                }
                return '--:--';
              })();
              const recintoTxt = venueInfo?.nombre || evento?.recintos?.nombre || evento?.recinto_nombre || 'Recinto no disponible';

              return (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <CalendarOutlined className="text-blue-500" />
                      <span className="font-medium">{fechaTxt}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ClockCircleOutlined className="text-green-500" />
                      <span className="font-medium">{horaTxt}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <EnvironmentOutlined className="text-red-500" />
                      <span className="font-medium">{recintoTxt}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Layout del mapa y carrito */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', minHeight: '600px' }}>
            {/* Mapa de asientos - 2/3 del ancho */}
            <div style={{ flex: '2', minWidth: '0' }}>
              <Card 
                title={
                  <div className="flex items-center">
                    <ShoppingCartOutlined className="text-blue-500 mr-2" />
                    <span className="font-semibold">
                      {evento?.modoVenta === 'grid' ? 'Selección de Entradas' : 'Selección de Asientos'}
                    </span>
                  </div>
                }
                className="shadow-lg border-0"
                style={{ height: '100%' }}
              >
                <div style={{ width: '100%', height: '100%' }}>
                {!canStoreAccess ? (
                  <NotFound title="404" message={`Este evento no está disponible (${eventStatus.text}).`} homePath="/store" />
                ) : evento?.modoVenta === 'grid' ? (
                  // Modo Grid - Venta sin mapa
                  <GridSaleMode
                    evento={evento}
                    funcion={funciones.find(f => f.id === selectedFunctionId)}
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
                      toggleSeat(cartItem);
                    }}
                    onRemoveFromCart={(itemId) => {
                      removeFromCart(itemId);
                    }}
                    cartItems={cartItems}
                    loading={mapLoading}
                  />
                ) : mapLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <Spin size="large" />
                    <span className="ml-3">Cargando mapa de asientos...</span>
                  </div>
                ) : mapa ? (
                  <SeatingMapUnified
                    mapa={mapa}
                    funcionId={selectedFunctionId}
                    selectedSeats={selectedSeats.map(seat => seat._id || seat.id)}
                    onSeatToggle={handleSeatToggle}
                    isSeatLocked={isSeatLocked}
                    isSeatLockedByMe={isSeatLockedByMe}
                    isTableLocked={isTableLocked}
                    isTableLockedByMe={isTableLockedByMe}
                    isAnySeatInTableLocked={isAnySeatInTableLocked}
                    areAllSeatsInTableLockedByMe={areAllSeatsInTableLockedByMe}
                    onTableToggle={handleTableToggle}
                    lockedSeats={realLockedSeats}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <Alert
                      message="No hay mapa disponible"
                      description="Este evento no tiene un mapa de asientos configurado."
                      type="warning"
                      showIcon
                    />
                  </div>
                )}
                </div>
              </Card>
            </div>

            {/* Carrito - 1/3 del ancho */}
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
              <Cart
                items={cartItems}
                removeFromCart={removeFromCart}
                getItemCount={getItemCount}
                selectedFunctionId={selectedFunctionId}
                evento={evento}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  const datosBoleto = getDatosBoleto();
  const datosComprador = getDatosComprador();
  const otrasOpciones = getOtrasOpciones();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <EventImage
          event={evento}
          imageType="logoHorizontal"
          className="w-full h-full object-cover"
          showDebug={DEBUG}
        />
        
        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Contenido del hero */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 pb-6">
            <div className="max-w-7xl mx-auto w-full">
              <div className="text-white">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                      {evento.nombre}
                    </h1>
                    {/* Información rápida */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <CalendarOutlined className="text-white mr-2" />
                        <span className="font-medium text-sm">{formatDateString(evento.fecha_evento)}</span>
                      </div>
                      {selectedFunctionId && funciones.find(f => f.id === selectedFunctionId) && (
                        <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <ClockCircleOutlined className="text-white mr-2" />
                          <span className="font-medium text-sm">{funciones.find(f => f.id === selectedFunctionId).hora}</span>
                        </div>
                      )}
                      {venueInfo && (
                        <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <EnvironmentOutlined className="text-white mr-2" />
                          <span className="font-medium text-sm">{venueInfo.nombre}</span>
                        </div>
                      )}
                      {venueInfo && venueInfo.direccion && (
                        <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <EnvironmentOutlined className="text-white mr-2" />
                          <span className="font-medium text-sm">{venueInfo.direccion}</span>
                        </div>
                      )}
                      {evento.sector && (
                        <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                          <TeamOutlined className="text-white mr-2" />
                          <span className="font-medium text-sm">{evento.sector}</span>
                        </div>
                      )}
                    </div>
                    {evento.descripcion && (
                      <p className="text-base md:text-lg max-w-2xl opacity-90 leading-relaxed mt-2">
                        {evento.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-stretch gap-3">
                    <div className="flex items-center gap-3 justify-end">
                      <Badge status={eventStatus.status} text={<span className="text-white">{eventStatus.text}</span>} className="text-white" />
                      <Tag color={modoVenta.color} className="text-sm">{modoVenta.text}</Tag>
                      {evento.estadoVenta === 'proximamente-countdown' && countdownTarget && cd.remaining > 0 && (
                        <Tag color="geekblue" className="text-sm">📅 {formatCountdown(cd)}</Tag>
                      )}
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<ShareAltOutlined />}
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          message.success('Enlace copiado al portapapeles');
                        }}
                      >
                        Compartir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Estado del evento (bajado desde el hero) */}
        <div className="flex items-center gap-4 mb-6">
          <Badge status={eventStatus.status} text={eventStatus.text} />
          <Tag color={modoVenta.color} className="text-sm">{modoVenta.text}</Tag>
          {evento.estadoVenta === 'proximamente-countdown' && countdownTarget && cd.remaining > 0 && (
            <Tag color="geekblue" className="text-sm">📅 {formatCountdown(cd)}</Tag>
          )}
          {evento.oculto && (
            <Tag color="red" icon={<EyeInvisibleOutlined />}>Oculto</Tag>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {/* Información básica del evento - solo admin (estilo tickera) */}
            {isTenantAdmin && (
              <Card 
                title={
                  <div className="flex items-center">
                    <InfoCircleOutlined className="text-blue-500 mr-2" />
                    <span className="text-xl font-semibold">Información del Evento</span>
                  </div>
                }
                className="mb-6 shadow-sm border border-gray-200 rounded-xl"
              >
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Nombre" span={2}>
                    <strong>{evento.nombre}</strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha del Evento">
                    {formatDateString(evento.fecha_evento)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Recinto">
                    {venueInfo ? venueInfo.nombre : `ID: ${evento.recinto}`}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sala">
                    {evento.sala ? `ID: ${evento.sala}` : 'No especificada'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sector">
                    {evento.sector || 'No especificado'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Estado de Venta">
                    <Badge status={eventStatus.status} text={eventStatus.text} />
                  </Descriptions.Item>
                  <Descriptions.Item label="Modo de Venta">
                    <Tag color={modoVenta.color}>{modoVenta.text}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Activo">
                    <Badge 
                      status={evento.activo ? 'success' : 'error'} 
                      text={evento.activo ? 'Sí' : 'No'} 
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Oculto">
                    <Badge 
                      status={evento.oculto ? 'error' : 'success'} 
                      text={evento.oculto ? 'Sí' : 'No'} 
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Desactivado">
                    <Badge 
                      status={evento.desactivado ? 'error' : 'success'} 
                      text={evento.desactivado ? 'Sí' : 'No'} 
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Creado">
                    {formatDateString(evento.created_at)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Descripción HTML */}
            {evento.descripcionHTML && (
              <Card 
                title={
                  <div className="flex items-center">
                    <FileTextOutlined className="text-green-500 mr-2" />
                    <span className="text-xl font-semibold">Descripción del Evento</span>
                  </div>
                }
                className="mb-6 shadow-sm border border-gray-200 rounded-xl"
              >
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: evento.descripcionHTML }}
                />
              </Card>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <Card 
                title={
                  <div className="flex items-center">
                    <TagsOutlined className="text-purple-500 mr-2" />
                    <span className="text-xl font-semibold">Etiquetas</span>
                  </div>
                }
                className="mb-6 shadow-sm border border-gray-200 rounded-xl"
              >
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Tag key={index} color="blue">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            {/* Funciones disponibles */}
            <Card 
              title={
                <div className="flex items-center">
                  <CalendarOutlined className="text-blue-500 mr-2" />
                  <span className="text-xl font-semibold">Funciones Disponibles</span>
                </div>
              }
              className="mb-6 shadow-sm border border-gray-200 rounded-xl"
            >
              {funciones.length === 0 ? (
                <Alert
                  message="No hay funciones disponibles"
                  description="Este evento no tiene funciones programadas."
                  type="warning"
                  showIcon
                />
              ) : (
                <div className="space-y-4">
                  {funciones.map((funcion) => (
                    <div 
                      key={funcion.id || funcion._id}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedFunctionId === (funcion.id || funcion._id)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        handleFunctionSelect(funcion.id || funcion._id);
                        const fid = funcion.id || funcion._id;
                        const url = fid
                          ? `/store/eventos/${eventSlug}/map?funcion=${fid}`
                          : `/store/eventos/${eventSlug}/map`;
                        navigate(url);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {(() => { try { const d = new Date(funcion.fechaCelebracion || funcion.fecha_celebracion || funcion.fecha); return isNaN(d.getTime()) ? '' : d.getDate(); } catch(_) { return ''; } })()}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">
                              {formatDateString(funcion.fechaCelebracion || funcion.fecha_celebracion || funcion.fecha)}
                            </h3>
                            <p className="text-gray-600 flex items-center">
                              <ClockCircleOutlined className="mr-1" />
                              {(() => { if (funcion.hora) return funcion.hora; const raw = funcion.fechaCelebracion || funcion.fecha_celebracion || funcion.fecha; if (!raw) return '--:--'; try { const d = new Date(raw); if (isNaN(d.getTime())) return '--:--'; const hh = String(d.getHours()).padStart(2,'0'); const mm = String(d.getMinutes()).padStart(2,'0'); return `${hh}:${mm}`; } catch(_) { return '--:--'; } })()}
                            </p>
                            {venueInfo && (
                              <p className="text-gray-500 text-sm flex items-center">
                                <EnvironmentOutlined className="mr-1" />
                                {venueInfo.nombre}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Botón retirado: navegación automática al seleccionar */}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>


            {/* Configuración del Comprador eliminada */}

            {/* Otras opciones - solo admin */}
            {isTenantAdmin && Object.keys(otrasOpciones).length > 0 && (
              <Card 
                title={
                  <div className="flex items-center">
                    <SettingOutlined className="text-gray-500 mr-2" />
                    <span className="text-xl font-semibold">Otras Opciones</span>
                  </div>
                }
                className="mb-6 shadow-sm border border-gray-200 rounded-xl"
              >
                <Descriptions column={2} bordered size="small">
                  {Object.entries(otrasOpciones).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'boolean' ? (
                        <Badge status={value ? 'success' : 'error'} text={value ? 'Sí' : 'No'} />
                      ) : typeof value === 'object' ? (
                        <pre className="text-xs bg-gray-100 p-2 rounded">
                          {JSON.stringify(value, null, 2)}
                        </pre>
                      ) : (
                        String(value)
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}

            {/* Analytics - solo admin */}
            {isTenantAdmin && Object.keys(analytics).length > 0 && (
              <Card 
                title={
                  <div className="flex items-center">
                    <BarChartOutlined className="text-green-500 mr-2" />
                    <span className="text-xl font-semibold">Analytics</span>
                  </div>
                }
                className="mb-6 shadow-sm border border-gray-200 rounded-xl"
              >
                <Descriptions column={2} bordered size="small">
                  {Object.entries(analytics).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'boolean' ? (
                        <Badge status={value ? 'success' : 'error'} text={value ? 'Sí' : 'No'} />
                      ) : (
                        String(value)
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}
          </div>

          {/* Panel lateral */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Estadísticas del evento - solo admin */}
              {isTenantAdmin && (
                <Card 
                  title={
                    <div className="flex items-center">
                      <TrophyOutlined className="text-yellow-500 mr-2" />
                      <span className="font-semibold">Estadísticas</span>
                    </div>
                  }
                  className="shadow-sm border border-gray-200 rounded-xl"
                >
                  <div className="space-y-4">
                    <Statistic 
                      title="Funciones" 
                      value={funciones.length} 
                      prefix={<CalendarOutlined />}
                    />
                    <Statistic 
                      title="Estado" 
                      value={eventStatus.text}
                      prefix={eventStatus.icon}
                    />
                    {venueInfo && (
                      <Statistic 
                        title="Recinto" 
                        value={venueInfo.nombre}
                        prefix={<EnvironmentOutlined />}
                      />
                    )}
                  </div>
                </Card>
              )}


              {/* Información técnica - solo admin */}
              {isTenantAdmin && (
                <Card 
                  title={
                    <div className="flex items-center">
                      <InfoCircleOutlined className="text-gray-500 mr-2" />
                      <span className="font-semibold">Información Técnica</span>
                    </div>
                  }
                  className="shadow-sm border border-gray-200 rounded-xl"
                >
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID del Evento:</span>
                      <code className="text-xs">{evento.id}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Slug:</span>
                      <code className="text-xs">{evento.slug}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tenant ID:</span>
                      <code className="text-xs">{evento.tenant_id}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usuario ID:</span>
                      <code className="text-xs">{evento.usuario_id}</code>
                    </div>
                  </div>
                </Card>
              )}

              {/* Video de YouTube */}
              {evento.url_video && (
                <Card 
                  title={
                    <div className="flex items-center">
                      <span className="text-xl font-semibold">Video del Evento</span>
                    </div>
                  }
                  className="mb-6 shadow-sm border border-gray-200 rounded-xl"
                >
                  <div className="aspect-video w-full">
                    <iframe
                      src={evento.url_video}
                      title="Video del Evento"
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernEventPage;
