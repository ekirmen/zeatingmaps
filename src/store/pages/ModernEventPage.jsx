import React, { useState, useEffect, useMemo, useRef } from 'react';
import logger from '../../utils/logger';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button, Card, message, Spin, Alert, Badge, Tag, Descriptions, Statistic } from 'antd';
import { SeatMapSkeleton, PageSkeleton } from '../../components/SkeletonLoaders';
import SeatListView from '../../components/SeatListView';
import { useResponsive } from '../../hooks/useResponsive';
import { useMapaSeatsSync } from '../../hooks/useMapaSeatsSync';
import { useSeatWorker, useZonesWorker } from '../../hooks/useSeatWorker';
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  ShoppingCartOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
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
// useSeatLocksArray eliminado - usar useSeatLockStore en su lugar
import LazySeatingMap from '../../components/LazySeatingMap';
import Cart from './Cart';
import EventImage from '../components/EventImage';
import GridSaleMode from '../components/GridSaleMode';
import { getEstadoVentaInfo } from '../../utils/estadoVenta';
import buildAddress from '../../utils/address';
import { useCountdown, formatCountdown, findNextStart } from '../../utils/countdown';
import NotFound from './NotFound';
import indexedDBCache from '../../utils/indexedDBCache';


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
  
  // Debug logs eliminados
  const [mapa, setMapa] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [venueInfo, setVenueInfo] = useState(null);
  const { user } = useAuth();
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [funcionesForCountdown, setFuncionesForCountdown] = useState([]);
  const { isMobile } = useResponsive();
  const [viewMode, setViewMode] = useState('map'); // 'map' o 'list'

  // Extraer asientos del mapa usando el hook de sincronización
  const { seatsData: syncedSeats } = useMapaSeatsSync(mapa, selectedFunctionId);
  
  // Procesar asientos usando Web Worker si hay muchos (50+)
  // Para listas pequeñas, el overhead del worker no vale la pena
  const { processedSeats: workerProcessedSeats } = useSeatWorker(
    syncedSeats && syncedSeats.length >= 50 ? syncedSeats : [],
    {
      normalizePositions: true,
      calculateBounds: false,
      groupByZone: false
    }
  );
  
  // Calcular zonas usando Web Worker si hay muchos asientos
  const { zones: calculatedZones } = useZonesWorker(
    syncedSeats && syncedSeats.length >= 50 ? syncedSeats : []
  );
  
  // Preparar asientos para la vista de lista
  const seatsForList = useMemo(() => {
    if (!syncedSeats || syncedSeats.length === 0) return [];
    
    // Si usamos el worker, usar los asientos procesados
    const seatsToProcess = (syncedSeats.length >= 50 && workerProcessedSeats && workerProcessedSeats.length > 0)
      ? workerProcessedSeats
      : syncedSeats;
    
    return seatsToProcess.map(seat => ({
      ...seat,
      _id: seat._id || seat.id || seat.sillaId,
      nombre: seat.nombre || seat.numero || `Asiento ${seat._id || seat.id}`,
      precio: seat.precio || 0,
      zonaId: seat.zonaId || seat.zona?.id,
      nombreZona: seat.nombreZona || seat.zona?.nombre || 'General'
    }));
  }, [syncedSeats, workerProcessedSeats]);

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

  // useSeatLocksArray eliminado - usar useSeatLockStore en su lugar
  // const { lockedSeats: realLockedSeats } = useSeatLockStore();
  
  // Debug: Log de seat_locks cargados (usando useSeatLockStore)
  useEffect(() => {
    const { lockedSeats } = useSeatLockStore.getState();
    if (lockedSeats && lockedSeats.length > 0) {
      logger.log('🔒 [MODERN_EVENT] Seat locks cargados:', lockedSeats);
    }
  }, [selectedFunctionId]);

  // Sincronización automática con seat_locks (usando useSeatLockStore)
  useEffect(() => {
    const { lockedSeats } = useSeatLockStore.getState();
    if (lockedSeats && lockedSeats.length > 0) {
      logger.log('🔒 [MODERN_EVENT] Sincronizando con seat locks:', lockedSeats);
      syncWithSeatLocks(lockedSeats);
    }
  }, [syncWithSeatLocks]);

  const venueAddress = useMemo(() => {
    if (!venueInfo) return '';
    if (venueInfo.direccion) return venueInfo.direccion;
    return buildAddress({
      direccionLinea1: venueInfo.direccionLinea1 || venueInfo.direccionlinea1 || '',
      ciudad: venueInfo.ciudad || '',
      codigoPostal: venueInfo.codigoPostal || venueInfo.codigopostal || '',
      estado: venueInfo.estado || '',
      pais: venueInfo.pais || '',
    });
  }, [venueInfo]);

  const venueLatitude = useMemo(() => {
    if (!venueInfo) return null;
    const lat = parseFloat(venueInfo.latitud ?? venueInfo.latitude);
    return Number.isFinite(lat) ? lat : null;
  }, [venueInfo]);

  const venueLongitude = useMemo(() => {
    if (!venueInfo) return null;
    const lon = parseFloat(venueInfo.longitud ?? venueInfo.longitude);
    return Number.isFinite(lon) ? lon : null;
  }, [venueInfo]);

  const venueMapUrl = useMemo(() => {
    if (venueLatitude !== null && venueLongitude !== null) {
      return `https://maps.google.com/maps?q=${venueLatitude},${venueLongitude}&ie=UTF8&output=embed`;
    }
    if (venueAddress) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(venueAddress)}&ie=UTF8&output=embed`;
    }
    return '';
  }, [venueLatitude, venueLongitude, venueAddress]);

  const venueDirections = venueInfo?.comollegar || '';

  // Cargar evento y funciones
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Intentar obtener del caché primero
        let eventData = await indexedDBCache.getEvento(eventSlug);
        
        if (!eventData) {
          // Si no está en caché, cargar desde la API
          // Usar .eq() para búsqueda exacta (case-sensitive) ya que los slugs deben ser únicos
          const { data, error: eventError } = await supabase
            .from('eventos')
            .select('*')
            .eq('slug', eventSlug)
            .maybeSingle();

          if (eventError) {
            console.error('[ModernEventPage] Error consultando evento:', eventError);
            throw eventError;
          }
          if (!data) {
            console.warn('[ModernEventPage] Evento no encontrado con slug:', eventSlug);
            throw new Error('Evento no encontrado');
          }
          
          eventData = data;
          // Guardar en caché
          await indexedDBCache.setEvento(eventData);
        }
        
        setEvento(eventData);

        // Cargar recinto
        const recintoId = eventData.recinto_id || eventData.recinto || null;
        if (recintoId) {
          const { data: recData, error: recErr } = await supabase
            .from('recintos')
            .select('id, nombre, direccion, capacidad, comollegar, latitud, longitud, pais, estado, ciudad, codigopostal, direccionlinea1')
            .eq('id', recintoId)
            .maybeSingle();
          if (!recErr) setVenueInfo(recData || null);
        }

        // Intentar obtener funciones del caché
        let funcionesData = await indexedDBCache.getFunciones(eventData.id);
        
        if (!funcionesData || funcionesData.length === 0) {
          // Si no están en caché, cargar desde la API
          funcionesData = await getFunciones(eventData.id);
          // Guardar en caché
          if (funcionesData && funcionesData.length > 0) {
            await indexedDBCache.setFunciones(eventData.id, funcionesData);
          }
        }
        
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
        logger.error('Error cargando evento:', err);
        setError(err);
        // Mejorar el mensaje de error
        const errorMessage = err?.message || 'Error desconocido';
        if (errorMessage.includes('Evento no encontrado') || errorMessage.includes('not found')) {
          message.error('El evento no existe o no está disponible');
        } else {
          message.error(`Error al cargar el evento: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (eventSlug && eventSlug.trim() !== '') {
      fetchData();
    } else {
      setError(new Error('Slug de evento inválido'));
      setLoading(false);
    }
  }, [eventSlug, searchParams]);

  // Cargar perfil para conocer permisos (tenant_admin)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user?.id) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (!error && data?.role) {
          setIsTenantAdmin(String(data.role).toLowerCase() === 'tenant_admin');
        }
      } catch (e) {
        // ignore silently
      }
    };
    loadProfile();
  }, [user]);

  // Suscribirse a función
  useEffect(() => {
    if (!selectedFunctionId) return;
    subscribeToFunction(selectedFunctionId);
    return () => unsubscribe();
  }, [selectedFunctionId, subscribeToFunction, unsubscribe]);

  // Cargar mapa cuando estemos en la vista del mapa
  useEffect(() => {
    
    
    if (!isMapView || !selectedFunctionId) {
      
      return;
    }
    
    const fetchMapa = async () => {
      try {
        setMapLoading(true);
        

        // Obtener sala_id de la función seleccionada (soporta esquemas nuevo y antiguo)
        const selectedFuncion = funciones.find(f => (f.id || f._id) === selectedFunctionId);
        const salaId = selectedFuncion?.sala_id ?? selectedFuncion?.sala;

        if (!salaId) {
          
          setMapa(null);
          setMapLoading(false);
          return;
        }

        // Intentar obtener del caché primero
        let mapaData = await indexedDBCache.getMapa(salaId);
        
        if (!mapaData) {
          // Si no está en caché, cargar desde la API
          const { data, error: mapaError } = await supabase
            .from('mapas')
            .select('*')
            .eq('sala_id', salaId)
            .maybeSingle();

          if (mapaError) throw mapaError;
          
          if (data) {
            mapaData = data;
            // Guardar en caché para próximas veces
            await indexedDBCache.setMapa(salaId, data, data.id);
          }
        }

        if (mapaData) {
          setMapa(mapaData);
        } else {
          setMapa(null);
        }
      } catch (err) {
        logger.error('Error cargando mapa:', err);
        message.error('Error al cargar el mapa de asientos');
      } finally {
        setMapLoading(false);
      }
    };

    fetchMapa();
  }, [isMapView, selectedFunctionId, funciones]);

  // Función para manejar la selección de función
  // Si estamos en la vista del evento (no mapa), navegar al mapa
  // Si ya estamos en el mapa, solo actualizar la función seleccionada
  const handleFunctionSelect = (functionId) => {
    setSelectedFunctionId(functionId);
    
    // Si NO estamos en la vista del mapa, navegar al mapa con la función seleccionada
    if (!isMapView) {
      navigate(`/store/eventos/${eventSlug}/map?funcion=${functionId}`, { replace: false });
    }
  };

  // Cache para restricciones de múltiplos por función
  const quantityStepCache = useRef(new Map());

  // Cargar restricción de múltiplos en paralelo cuando cambia la función
  useEffect(() => {
    if (!selectedFunctionId || !evento) return;

    const loadQuantityStep = async () => {
      try {
        const cacheKey = selectedFunctionId;
        if (quantityStepCache.current.has(cacheKey)) {
          return; // Ya está en cache
        }

        // Obtener recinto_id desde evento (más rápido que consultar función)
        const recintoId = evento.recinto_id || evento.recinto;
        
        if (!recintoId) return;

        // Consulta optimizada: solo obtener el máximo quantity_step
        const { data: entradasData, error: entradasError } = await supabase
          .from('entradas')
          .select('quantity_step')
          .eq('recinto', recintoId)
          .eq('activo_store', true)
          .not('quantity_step', 'is', null)
          .limit(100); // Limitar resultados para eficiencia

        if (!entradasError && entradasData && entradasData.length > 0) {
          const quantityStep = Math.max(...entradasData.map(e => e.quantity_step || 0));
          if (quantityStep > 0) {
            quantityStepCache.current.set(cacheKey, quantityStep);
          }
        } else {
          // Cachear null para evitar consultas repetidas
          quantityStepCache.current.set(cacheKey, null);
        }
      } catch (error) {
        logger.warn('Error cargando restricción de múltiplos:', error);
        quantityStepCache.current.set(selectedFunctionId, null);
      }
    };

    loadQuantityStep();
  }, [selectedFunctionId, evento]);

  const handleSeatToggle = async (seatOrId) => {
    if (!selectedFunctionId) return;

    const seatId = typeof seatOrId === 'string' ? seatOrId : (seatOrId?._id || seatOrId?.id);
    if (!seatId) {
      
      return;
    }

    // Verificación rápida de bloqueo (sin await para no bloquear)
    const isLockedPromise = isSeatLocked(seatId, selectedFunctionId);
    const isLockedByMePromise = isSeatLockedByMe(seatId, selectedFunctionId);

    const exists = selectedSeats.some(seat => seat._id === seatId);

    if (exists) {
      // Optimistic update: remover inmediatamente de la UI
      removeSeatFromUnified(seatId);
      removeFromCart(seatId);
      // Desbloquear en background
      unlockSeat(seatId, selectedFunctionId).catch(err => {
        logger.warn('Error desbloqueando asiento:', err);
      });
    } else {
      // Validar restricción de múltiplos (sincrónico, desde cache)
      const quantityStep = quantityStepCache.current.get(selectedFunctionId);
      if (quantityStep && quantityStep > 0) {
        const currentSeatCount = selectedSeats.length;
        const newSeatCount = currentSeatCount + 1;

        if (newSeatCount % quantityStep !== 0) {
          const nextValidCount = Math.ceil(newSeatCount / quantityStep) * quantityStep;
          message.warning(
            `Solo puedes seleccionar múltiplos de ${quantityStep}. ` +
            `Tienes ${currentSeatCount} asiento${currentSeatCount !== 1 ? 's' : ''} seleccionado${currentSeatCount !== 1 ? 's' : ''}. ` +
            `Puedes seleccionar hasta ${nextValidCount} asiento${nextValidCount !== 1 ? 's' : ''}.`
          );
          return;
        }
      }

      // Verificar bloqueo en paralelo
      const [isLocked, isLockedByMe] = await Promise.all([isLockedPromise, isLockedByMePromise]);
      if (isLocked && !isLockedByMe) {
        message.warning('Este asiento ya está seleccionado por otro usuario');
        return;
      }

      // Optimistic update: agregar inmediatamente a la UI
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

      // Bloquear en background (no bloquear la UI)
      lockSeat(seatId, 'seleccionado', selectedFunctionId).then(ok => {
        if (!ok) {
          // Si falla el bloqueo, revertir el cambio optimista
          removeSeatFromUnified(seatId);
          removeFromCart(seatId);
          message.error('No se pudo seleccionar el asiento. Por favor, intenta nuevamente.');
        }
      }).catch(err => {
        logger.error('Error bloqueando asiento:', err);
        removeSeatFromUnified(seatId);
        removeFromCart(seatId);
        message.error('Error al seleccionar el asiento');
      });
    }
  };

  const handleTableToggle = (table) => {
    
    // Por ahora solo mostrar información de la mesa
    // En el futuro se puede implementar lógica para seleccionar toda la mesa
  };


  // Funciones para parsear campos JSON
  const parseJsonField = (field) => {
    if (!field) return null;
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (e) {
      
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

  // const getDatosBoleto = () => {
  //   return parseJsonField(evento.datosBoleto) || {};
  // };

  // const getDatosComprador = () => {
  //   return parseJsonField(evento.datosComprador) || {};
  // };

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
    return <PageSkeleton rows={6} />;
  }

  if (error || (!evento && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full px-4">
          <Alert
            message="Error al cargar el evento"
            description={
              <div>
                <p className="mb-2">
                  {error?.message?.includes('Evento no encontrado') || error?.message?.includes('not found')
                    ? 'El evento solicitado no existe o no está disponible.'
                    : error?.message || 'No se pudo cargar el evento. Por favor, verifica que la URL sea correcta.'}
                </p>
                {eventSlug && (
                  <p className="text-sm text-gray-500 mt-2">
                    Slug buscado: <code className="bg-gray-100 px-2 py-1 rounded">{eventSlug}</code>
                  </p>
                )}
                <div className="mt-4">
                  <Button type="primary" onClick={() => navigate('/store')}>
                    Volver al inicio
                  </Button>
                </div>
              </div>
            }
            type="error"
            showIcon
          />
        </div>
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
                  <div 
                    className="w-12 h-8 bg-cover bg-center bg-no-repeat rounded"
                    style={{
                      backgroundImage: `url(${(() => {
                        try {
                          if (evento?.imagenes) {
                            const images = typeof evento.imagenes === 'string' 
                              ? JSON.parse(evento.imagenes) 
                              : evento.imagenes;
                            const bannerImage = images.banner || images.portada || images.obraImagen;
                            if (bannerImage?.url || bannerImage?.publicUrl) {
                              return bannerImage.publicUrl || bannerImage.url;
                            }
                          }
                        } catch (e) {
                          logger.error('Error parsing event images:', e);
                        }
                        return `https://placehold.co/48x32/E0F2F7/000?text=${evento?.nombre?.charAt(0) || 'E'}`;
                      })()})`
                    }}
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

          {/* Layout del mapa y carrito - Responsive */}
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 min-h-[600px]">
            {/* Mapa de asientos - 2/3 del ancho en desktop, 100% en móvil */}
            <div className="flex-1 lg:flex-[2] min-w-0 w-full lg:w-auto">
              <Card 
                title={
                  <div className="flex items-center">
                    <ShoppingCartOutlined className="text-blue-500 mr-2" />
                    <span className="font-semibold text-sm md:text-base">
                      {evento?.modoVenta === 'grid' ? 'Selección de Entradas' : 'Selección de Asientos'}
                    </span>
                  </div>
                }
                className="shadow-lg border-0 h-full"
                bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)', overflow: 'auto' }}
              >
                <div className="w-full h-full min-h-[400px] md:min-h-[500px]">
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
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <SeatMapSkeleton />
                    </div>
                  ) : mapa ? (
                    <div className="w-full h-full overflow-auto store-seating-map">
                      {/* Toggle entre mapa y lista en móvil */}
                      {isMobile && (
                        <div className="flex gap-2 p-2 bg-white border-b">
                          <Button
                            type={viewMode === 'map' ? 'primary' : 'default'}
                            onClick={() => setViewMode('map')}
                            size="small"
                          >
                            Mapa
                          </Button>
                          <Button
                            type={viewMode === 'list' ? 'primary' : 'default'}
                            onClick={() => setViewMode('list')}
                            size="small"
                          >
                            Lista
                          </Button>
                        </div>
                      )}
                      
                      {viewMode === 'list' && isMobile ? (
                        seatsForList.length === 0 ? (
                          <SeatMapSkeleton />
                        ) : (
                          <SeatListView
                            seats={seatsForList}
                            funcionId={selectedFunctionId}
                            selectedSeats={selectedSeats.map(seat => seat._id || seat.id)}
                            onSeatToggle={handleSeatToggle}
                            isSeatLocked={isSeatLocked}
                            isSeatLockedByMe={isSeatLockedByMe}
                            zonas={mapa?.zonas || []}
                          />
                        )
                      ) : (
                        <LazySeatingMap
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
                          // lockedSeats se obtiene automáticamente del useSeatLockStore
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
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

            {/* Carrito - 1/3 del ancho en desktop, 100% en móvil */}
            <div className="flex-1 lg:flex-[1] w-full lg:w-auto lg:max-w-[400px]">
              <div className="sticky top-4">
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
      </div>
    );
  }
  // const datosBoleto = getDatosBoleto();
  // const datosComprador = getDatosComprador();
  // const otrasOpciones = getOtrasOpciones();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 store-event-page">
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
        
        {/* Contenido del hero - Solo título */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-4 pb-6">
            <div className="max-w-7xl mx-auto w-full">
              <div className="text-white">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                      {evento.nombre}
                    </h1>
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
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {/* Información del evento (fecha, lugar, tags) - Movido desde el hero */}
            <Card className="mb-6 shadow-sm border border-gray-200 rounded-xl">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center bg-blue-50 rounded-lg px-4 py-2">
                    <CalendarOutlined className="text-blue-600 mr-2" />
                    <span className="font-medium text-gray-800">{formatDateString(evento.fecha_evento)}</span>
                  </div>
                  {selectedFunctionId && funciones.find(f => f.id === selectedFunctionId) && (
                    <div className="flex items-center bg-green-50 rounded-lg px-4 py-2">
                      <ClockCircleOutlined className="text-green-600 mr-2" />
                      <span className="font-medium text-gray-800">{funciones.find(f => f.id === selectedFunctionId).hora}</span>
                    </div>
                  )}
                  {venueInfo && (
                    <div className="flex items-center bg-purple-50 rounded-lg px-4 py-2">
                      <EnvironmentOutlined className="text-purple-600 mr-2" />
                      <span className="font-medium text-gray-800">{venueInfo.nombre}</span>
                    </div>
                  )}
                  {venueInfo && (venueInfo.direccion || venueAddress) && (
                    <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2">
                      <EnvironmentOutlined className="text-gray-600 mr-2" />
                      <span className="font-medium text-gray-800 text-sm">{venueInfo.direccion || venueAddress}</span>
                    </div>
                  )}
                  {evento.sector && (
                    <div className="flex items-center bg-orange-50 rounded-lg px-4 py-2">
                      <TeamOutlined className="text-orange-600 mr-2" />
                      <span className="font-medium text-gray-800">{evento.sector}</span>
                    </div>
                  )}
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    {tags.map((tag, index) => (
                      <Tag key={index} color="blue" className="text-sm py-1">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Descripción del evento */}
            {evento.descripcion && (
              <Card className="mb-6 shadow-sm border border-gray-200 rounded-xl">
                <div className="prose max-w-none">
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    {evento.descripcion}
                  </p>
                </div>
              </Card>
            )}

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
                      className={`p-4 md:p-6 border-2 rounded-xl transition-all duration-200 ${
                        selectedFunctionId === (funcion.id || funcion._id)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start md:items-center space-x-4 flex-1">
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                            {(() => { try { const d = new Date(funcion.fechaCelebracion || funcion.fecha_celebracion || funcion.fecha); return isNaN(d.getTime()) ? '' : d.getDate(); } catch(_) { return ''; } })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-1">
                              {formatDateString(funcion.fechaCelebracion || funcion.fecha_celebracion || funcion.fecha)}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <div className="flex items-center">
                                <ClockCircleOutlined className="mr-1 text-green-600" />
                                <span>{(() => { if (funcion.hora) return funcion.hora; const raw = funcion.fechaCelebracion || funcion.fecha_celebracion || funcion.fecha; if (!raw) return '--:--'; try { const d = new Date(raw); if (isNaN(d.getTime())) return '--:--'; const hh = String(d.getHours()).padStart(2,'0'); const mm = String(d.getMinutes()).padStart(2,'0'); return `${hh}:${mm}`; } catch(_) { return '--:--'; } })()}</span>
                              </div>
                              {venueInfo && (
                                <div className="flex items-center">
                                  <EnvironmentOutlined className="mr-1 text-purple-600" />
                                  <span className="truncate">{venueInfo.nombre}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Botón Continuar */}
                        <div className="flex-shrink-0 w-full md:w-auto">
                          <Button
                            type="primary"
                            size="large"
                            block={isMobile}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFunctionSelect(funcion.id || funcion._id);
                              const fid = funcion.id || funcion._id;
                              const url = fid
                                ? `/store/eventos/${eventSlug}/map?funcion=${fid}`
                                : `/store/eventos/${eventSlug}/map`;
                              navigate(url);
                            }}
                            className="md:min-w-[120px]"
                          >
                            Continuar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>


            {/* Configuración del Comprador eliminada */}

            {/* Otras opciones - solo admin */}
            {isTenantAdmin && Object.keys(getOtrasOpciones()).length > 0 && (
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
                  {Object.entries(getOtrasOpciones()).map(([key, value]) => (
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
      {venueMapUrl && (
        <section className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              ¿Dónde será el evento?
            </h2>
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
              <iframe
                width="100%"
                height="360"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                title="Ubicación del recinto"
                src={venueMapUrl}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
            {(venueAddress || venueDirections) && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                {venueAddress && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Dirección</h3>
                    <p className="leading-relaxed">{venueAddress}</p>
                  </div>
                )}
                {venueDirections && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Cómo llegar</h3>
                    <p className="leading-relaxed">{venueDirections}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
      </div>
    </>
  );
};

export default ModernEventPage;
