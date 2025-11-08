import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Spin } from 'antd';
import { ShoppingCartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import LazySeatingMap from '../../components/LazySeatingMap';
import { useSeatLockStore } from '../../components/seatLockStore';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../supabaseClient';
import Cart from './Cart';
import { useResponsive } from '../../hooks/useResponsive';
import '../styles/store-design.css';

const SeatSelectionPage = ({ initialFuncionId, autoRedirectToEventMap = true }) => {
  const params = useParams();
  const funcionIdFromParams = params?.funcionId;
  const funcionId = initialFuncionId ?? funcionIdFromParams;
  const navigate = useNavigate();
  const [mapa, setMapa] = useState(null);
  const [plantillaPrecios, setPlantillaPrecios] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(autoRedirectToEventMap);
  const [redirectFailed, setRedirectFailed] = useState(!autoRedirectToEventMap);
  
  // Cache para zona/mesa/precio por asiento (evitar recalcular en cada click)
  const seatDataCache = React.useRef(new Map());

  const toggleSeat = useCartStore((state) => state.toggleSeat);
  const cartItems = useCartStore((state) => state.items);
  const timeLeft = useCartStore((state) => state.timeLeft);
  const { isMobile } = useResponsive();
  
  const {
    subscribeToFunction,
    unsubscribe,
    isSeatLocked,
    isSeatLockedByMe,
    isTableLocked,
    isTableLockedByMe,
    isAnySeatInTableLocked,
    areAllSeatsInTableLockedByMe
  } = useSeatLockStore();
  const lockedSeats = useSeatLockStore((state) => state.lockedSeats);
  
  // Filtrar items del carrito que pertenecen a esta función (memoizado)
  const funcionCartItems = useMemo(() => 
    cartItems.filter(item => 
      String(item.functionId || item.funcionId) === String(funcionId)
    ), [cartItems, funcionId]
  );
  
  // Limpiar cache cuando cambia el mapa o plantilla
  useEffect(() => {
    seatDataCache.current.clear();
  }, [mapa, plantillaPrecios]);
  
  // Memoizar selectedSeats para evitar re-renders innecesarios
  const selectedSeats = useMemo(() => 
    cartItems.map(item => item.sillaId || item.id || item._id),
    [cartItems]
  );
  
  // Formatear tiempo restante
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Obtener color del temporizador
  const getTimerColor = () => {
    if (!timeLeft || timeLeft <= 0) return '#999';
    if (timeLeft <= 60) return '#ff4d4f'; // Rojo últimos 60 segundos
    if (timeLeft <= 300) return '#faad14'; // Amarillo últimos 5 minutos
    return '#52c41a'; // Verde por defecto
  };

  const ensureSessionId = useCallback(() => {
    if (typeof window === 'undefined') return;
    const storedSessionId = window.localStorage.getItem('anonSessionId');
    if (!storedSessionId) {
      try {
        const newSessionId = window.crypto?.randomUUID?.();
        if (newSessionId) {
          window.localStorage.setItem('anonSessionId', newSessionId);
        }
      } catch (sessionError) {
        console.warn('[SeatSelectionPage] No se pudo inicializar session_id:', sessionError);
      }
    }
  }, []);

  useEffect(() => {
    ensureSessionId();
  }, [ensureSessionId]);

  useEffect(() => {
    if (!funcionId) {
      setIsRedirecting(false);
      setRedirectFailed(true);
      setError('Función inválida');
      setLoading(false);
      return;
    }

    if (!autoRedirectToEventMap) {
      setIsRedirecting(false);
      setRedirectFailed(true);
      return;
    }

    const attemptRedirect = async () => {
      setError(null);
      try {
        const funcionNumeric = parseInt(funcionId, 10);
        if (!Number.isFinite(funcionNumeric) || funcionNumeric <= 0) {
          throw new Error('Función inválida');
        }

        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('evento_id')
          .eq('id', funcionNumeric)
          .maybeSingle();

        if (funcionError) throw funcionError;

        const eventoId = funcionData?.evento_id;
        if (!eventoId) {
          throw new Error('La función no tiene un evento asociado');
        }

        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('slug')
          .eq('id', eventoId)
          .maybeSingle();

        if (eventoError) throw eventoError;

        const eventSlug = eventoData?.slug;
        if (!eventSlug) {
          throw new Error('El evento no tiene un slug configurado');
        }

        navigate(`/store/eventos/${eventSlug}/map?funcion=${funcionNumeric}`, { replace: true });
      } catch (redirectError) {
        console.error('[SeatSelectionPage] Error preparando redirección:', redirectError);
        setError(redirectError.message || 'No se pudo redirigir al mapa del evento');
        setRedirectFailed(true);
        setLoading(true);
      } finally {
        setIsRedirecting(false);
      }
    };

    attemptRedirect();
  }, [autoRedirectToEventMap, funcionId, navigate]);

  // Suscribirse a función
  useEffect(() => {
    if (isRedirecting || !redirectFailed || !funcionId) {
      return undefined;
    }

    subscribeToFunction(funcionId);
    return () => unsubscribe();
  }, [funcionId, subscribeToFunction, unsubscribe, isRedirecting, redirectFailed]);

  // Cargar mapa
  useEffect(() => {
    if (isRedirecting || !redirectFailed || !funcionId) {
      return;
    }

    const loadMapa = async () => {
      try {
        setLoading(true);
        setError(null);

        const funcionNumeric = parseInt(funcionId, 10);
        
        // Precargar módulos críticos en paralelo con la carga del mapa
        const preloadModules = Promise.all([
          import('../services/seatPaymentChecker'),
          import('../components/seatLockStore')
        ]).catch(err => {
          console.warn('Error precargando módulos:', err);
        });

        // Cargar datos del mapa y función en paralelo con precarga de módulos
        const [funcionResult] = await Promise.all([
          supabase
            .from('funciones')
            .select('sala_id, plantilla_id, plantilla')
            .eq('id', funcionNumeric)
            .single(),
          preloadModules // Precargar módulos en paralelo (no necesitamos el resultado)
        ]);

        const { data: funcion, error: funcionError } = funcionResult;
        if (funcionError) throw funcionError;

        // Obtener mapa
        const { data: mapaData, error: mapaError } = await supabase
          .from('mapas')
          .select('*')
          .eq('sala_id', funcion.sala_id)
          .eq('estado', 'active')
          .single();

        if (mapaError) throw mapaError;

        setMapa(mapaData);

        // Cargar plantilla de precios
        let plantillaData = null;
        if (funcion.plantilla) {
          plantillaData = funcion.plantilla;
        } else if (funcion.plantilla_id) {
          const { data: plantilla, error: plantillaError } = await supabase
            .from('plantillas')
            .select('*')
            .eq('id', funcion.plantilla_id)
            .maybeSingle();
          
          if (!plantillaError && plantilla) {
            plantillaData = plantilla;
          }
        }
        setPlantillaPrecios(plantillaData);
      } catch (err) {
        console.error('Error cargando mapa:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMapa();
  }, [funcionId, redirectFailed, isRedirecting]);

  // Función optimizada para obtener datos del asiento (con cache)
  const getSeatData = useCallback((seat) => {
    const seatId = seat._id || seat.id || seat.sillaId;
    if (!seatId) return null;
    
    // Verificar cache primero
    if (seatDataCache.current.has(seatId)) {
      return seatDataCache.current.get(seatId);
    }
    
    // Obtener zona del asiento (simplificado para móvil)
    const zona = mapa?.zonas?.find(z => z.asientos?.some(a => a._id === seatId)) ||
                 mapa?.contenido?.find(el => el.sillas?.some(a => a._id === seatId) && (el.zona || el.zonaId)) ||
                 seat.zona || {};
    
    const zonaId = zona?.id || zona?.zonaId || seat.zonaId;
    const nombreZona = zona?.nombre || seat.nombreZona || seat.zona?.nombre || 'Zona';
    
    // Obtener mesa del asiento
    const mesa = seat.mesa || seat.mesaId || seat.tableId || null;
    const nombreMesa = seat.nombreMesa || seat.mesa?.nombre || (mesa ? `Mesa ${mesa}` : null);
    
    // Obtener precio de la plantilla (cachear resultado)
    let precio = seat.precio || 0;
    if (plantillaPrecios && plantillaPrecios.detalles) {
      try {
        const detalles = typeof plantillaPrecios.detalles === 'string'
          ? JSON.parse(plantillaPrecios.detalles)
          : plantillaPrecios.detalles;
        
        const precioZona = detalles.find(d =>
          d.zona_id === zonaId ||
          d.zonaId === zonaId ||
          d.zona_nombre === nombreZona ||
          d.zonaNombre === nombreZona
        );
        
        if (precioZona) {
          precio = precioZona.precio || precio;
        }
      } catch (e) {
        // Silenciar error en móvil para mejor performance
        if (!isMobile) {
          console.warn('[SeatSelectionPage] Error parsing detalles:', e);
        }
      }
    }
    
    const seatData = {
      zonaId,
      nombreZona,
      mesaId: mesa,
      nombreMesa,
      precio
    };
    
    // Guardar en cache
    seatDataCache.current.set(seatId, seatData);
    
    return seatData;
  }, [mapa, plantillaPrecios, isMobile]);

  const handleSeatToggle = useCallback(async (seat) => {
    // Obtener datos del asiento (usar cache si está disponible)
    const seatData = getSeatData(seat);
    if (!seatData) {
      // Si no se pueden obtener datos, usar valores por defecto
      await toggleSeat({
        ...seat,
        funcionId,
        precio: seat.precio || 0,
        nombreZona: seat.nombreZona || 'Zona'
      });
      return;
    }
    
    // Preparar asiento con todos los datos
    const seatWithData = {
      ...seat,
      funcionId,
      ...seatData
    };
    
    // En móvil, no esperar respuesta completa (optimistic update)
    if (isMobile) {
      toggleSeat(seatWithData).catch(err => {
        console.error('Error toggling seat:', err);
      });
    } else {
      await toggleSeat(seatWithData);
    }
  }, [getSeatData, toggleSeat, funcionId, isMobile]);

  if (isRedirecting || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className={`seat-selection-page store-container ${funcionCartItems.length > 0 && isMobile ? 'seat-selection-page-with-cart' : ''}`} style={{ 
      padding: isMobile ? '12px' : '24px',
      paddingBottom: funcionCartItems.length > 0 ? (isMobile ? '120px' : '24px') : (isMobile ? '24px' : '24px'),
      display: 'flex',
      flexDirection: isMobile ? 'column' : (funcionCartItems.length > 0 ? 'row' : 'column'),
      gap: isMobile ? '16px' : '24px',
      height: isMobile ? 'auto' : (funcionCartItems.length > 0 ? 'calc(100vh - 100px)' : 'auto'),
      overflow: isMobile ? 'visible' : 'hidden',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      {/* Mapa de asientos */}
      <div className="store-card" style={{ 
        marginBottom: isMobile ? (funcionCartItems.length > 0 ? '24px' : '0') : '0',
        flex: isMobile ? '0 0 auto' : (funcionCartItems.length > 0 ? '1 1 60%' : '1 1 100%'),
        display: 'flex',
        flexDirection: 'column',
        minHeight: isMobile ? '400px' : (funcionCartItems.length > 0 ? '100%' : '500px'),
        maxHeight: isMobile ? '60vh' : (funcionCartItems.length > 0 ? '100%' : '70vh'),
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%'
      }}>
        <div className="store-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingCartOutlined style={{ fontSize: '20px', color: 'var(--store-primary)' }} />
            <h2 className="store-card-title" style={{ margin: 0 }}>
              Selección de Asientos
            </h2>
          </div>
        </div>
        <div className="store-card-body" style={{ 
          padding: isMobile ? '12px' : '24px',
          flex: '1 1 auto',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {mapa ? (
            <div className="store-seating-map" style={{
              width: '100%',
              height: '100%',
              flex: '1 1 auto',
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <LazySeatingMap
                mapa={mapa}
                funcionId={funcionId}
                selectedSeats={selectedSeats}
                onSeatToggle={handleSeatToggle}
                isSeatLocked={isSeatLocked}
                isSeatLockedByMe={isSeatLockedByMe}
                isTableLocked={isTableLocked}
                isTableLockedByMe={isTableLockedByMe}
                isAnySeatInTableLocked={isAnySeatInTableLocked}
                areAllSeatsInTableLockedByMe={areAllSeatsInTableLockedByMe}
                lockedSeats={lockedSeats}
              />
            </div>
          ) : (
            <Alert
              message="No hay mapa disponible"
              description="No se encontró un mapa de asientos para esta función."
              type="warning"
              showIcon
            />
          )}
        </div>
      </div>

      {/* Carrito - Se muestra cuando hay items en el carrito */}
      {funcionCartItems.length > 0 && (
        <div 
          className={`store-card ${isMobile ? 'store-cart-floating' : ''}`}
          style={{
            position: isMobile ? 'fixed' : 'relative',
            bottom: isMobile ? 0 : 'auto',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 'auto',
            width: isMobile ? '100%' : 'auto',
            flex: isMobile ? '0 0 auto' : '0 0 400px',
            minWidth: isMobile ? '100%' : '350px',
            maxWidth: isMobile ? '100%' : '400px',
            margin: isMobile ? 0 : '0',
            borderRadius: isMobile ? '16px 16px 0 0' : 'var(--store-radius-xl)',
            boxShadow: isMobile ? '0 -4px 20px rgba(0, 0, 0, 0.15)' : 'var(--store-shadow-lg)',
            zIndex: isMobile ? 1000 : 'auto',
            maxHeight: isMobile ? '50vh' : '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white'
          }}
        >
          <div className="store-card-header" style={{ 
            position: isMobile ? 'sticky' : 'relative',
            top: 0,
            background: 'white',
            zIndex: 10,
            borderBottom: '1px solid var(--store-gray-200)',
            padding: isMobile ? '12px 16px' : '16px 24px',
            display: 'flex',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            alignItems: 'center',
            flexShrink: 0,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? '8px' : '0'
          }}>
            {timeLeft && timeLeft > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: isMobile ? '6px 10px' : '4px 12px',
                borderRadius: '20px',
                background: timeLeft <= 60 ? '#fff1f0' : '#f5f5f5',
                border: timeLeft <= 60 ? '2px solid #ff4d4f' : 'none',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 700,
                color: getTimerColor(),
                animation: timeLeft <= 60 ? 'pulse 2s infinite' : 'none'
              }}>
                <ClockCircleOutlined />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            {/* Botón directo a pagar en móvil */}
            {isMobile && funcionCartItems.length > 0 && (
              <button
                onClick={() => navigate('/store/payment')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--store-primary)',
                  color: 'white',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: timeLeft && timeLeft > 0 ? '8px' : '0'
                }}
              >
                Ir a Pagar
              </button>
            )}
          </div>
          <div className="store-card-body" style={{ 
            padding: isMobile ? '12px 16px' : '16px 24px',
            flex: '1 1 auto',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <Cart selectedFunctionId={funcionId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelectionPage;
