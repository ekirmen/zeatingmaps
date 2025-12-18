import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, Spin } from '../../utils/antdComponents';
import { ShoppingCartOutlined } from '@ant-design/icons';
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

  // Filtrar items del carrito que pertenecen a esta funci³n (memoizado)
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
      setError('Funci³n inv¡lida');
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
          throw new Error('Funci³n inv¡lida');
        }

        // Optimizar: hacer una sola query con join
        const { data: funcionData, error: funcionError } = await supabase
          .from('funciones')
          .select('evento_id, eventos!inner(slug)')
          .eq('id', funcionNumeric)
          .maybeSingle();

        if (funcionError) throw funcionError;

        const eventSlug = funcionData?.eventos?.slug;
        if (!eventSlug) {
          throw new Error('El evento no tiene un slug configurado');
        }

        navigate(`/store/eventos/${eventSlug}/map?funcion=${funcionNumeric}`, { replace: true });
      } catch (redirectError) {
        console.error('[SeatSelectionPage] Error preparando redirecci³n:', redirectError);
        setError(redirectError.message || 'No se pudo redirigir al mapa del evento');
        setRedirectFailed(true);
        setLoading(true);
      } finally {
        setIsRedirecting(false);
      }
    };

    attemptRedirect();
  }, [autoRedirectToEventMap, funcionId, navigate]);

  // Suscribirse a funci³n
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
        setMapLoadStage('cargandoDatos');
        setMapLoadProgress(10);

        const funcionNumeric = parseInt(funcionId, 10);

        // Precargar m³dulos cr­ticos en paralelo con la carga del mapa
        const preloadModules = Promise.all([
          import('../../services/seatPaymentChecker'),
          import('../../components/seatLockStore')
        ]).catch(err => {
        });

        setMapLoadProgress(15);

        // Cargar funci³n y precargar m³dulos en paralelo
        const funcionQuery = supabase
          .from('funciones')
          .select('sala_id, plantilla')
          .eq('id', funcionNumeric)
          .single();

        // Iniciar ambas operaciones en paralelo (no esperamos preloadModules)
        const funcionResult = await funcionQuery;
        preloadModules.catch(() => { }); // Precargar en segundo plano

        setMapLoadProgress(30);

        const { data: funcion, error: funcionError } = funcionResult;
        if (funcionError) throw funcionError;

        // Cargar mapa y plantilla en paralelo con cache
        setMapLoadStage('cargandoMapa');
        setMapLoadProgress(40);

        // Intentar cargar mapa desde cache primero
        const mapaCacheKey = `mapa_${funcion.sala_id}`;
        const cachedMapa = sessionStorage.getItem(mapaCacheKey);
        let mapaData = null;

        if (cachedMapa) {
          try {
            mapaData = JSON.parse(cachedMapa);
            setMapa(mapaData);
            setMapLoadProgress(60);
          } catch (e) {
          }
        }

        // Cargar mapa y plantilla en paralelo
        const mapaQuery = supabase
          .from('mapas')
          .select('id, sala_id, nombre, contenido, zonas, estado, settings')
          .eq('sala_id', funcion.sala_id)
          .eq('estado', 'active')
          .single();

        const plantillaQuery = funcion.plantilla && typeof funcion.plantilla === 'number'
          ? supabase
            .from('plantillas')
            .select('id, nombre, detalles')
            .eq('id', funcion.plantilla)
            .maybeSingle()
          : Promise.resolve({ data: funcion.plantilla || null, error: null });

        // Cargar mapa y plantilla en paralelo para reducir tiempo total
        const [mapaResult, plantillaResult] = await Promise.all([
          mapaQuery,
          plantillaQuery
        ]);

        setMapLoadProgress(75);

        const { data: mapaDataFromAPI, error: mapaError } = mapaResult;
        if (mapaError) throw mapaError;

        // Actualizar mapa si se carg³ desde API (puede ser m¡s reciente que el cache)
        if (mapaDataFromAPI) {
          setMapa(mapaDataFromAPI);
          // Guardar en cache
          sessionStorage.setItem(mapaCacheKey, JSON.stringify(mapaDataFromAPI));
        } else if (!mapaData) {
          // Si no hay datos ni en cache ni en API, establecer null
          setMapa(null);
        }
        setMapLoadProgress(85);

        // Procesar plantilla
        setMapLoadStage('cargandoPrecios');
        const { data: plantillaData } = plantillaResult;
        setPlantillaPrecios(plantillaData || null);

        setMapLoadProgress(95);
        setMapLoadStage('finalizando');

        // Mostrar 100% inmediatamente
        setMapLoadProgress(100);

        // Ocultar loading r¡pidamente despu©s de mostrar 100%
        setTimeout(() => {
          setLoading(false);
        }, 100);
      } catch (err) {
        // Error silencioso - ya se muestra en la UI
        setError(err.message);
        setMapLoadProgress(0);
        setLoading(false);
      }
    };

    loadMapa();
  }, [funcionId, redirectFailed, isRedirecting]);

  // Funci³n optimizada para obtener datos del asiento (con cache)
  const getSeatData = useCallback((seat) => {
    const seatId = seat._id || seat.id || seat.sillaId;
    if (!seatId) return null;

    // Verificar cache primero
    if (seatDataCache.current.has(seatId)) {
      return seatDataCache.current.get(seatId);
    }

    // Obtener zona del asiento (simplificado para m³vil)
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
        // Silenciar error en m³vil para mejor performance
        if (!isMobile) {
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
    // Obtener datos del asiento (usar cache si est¡ disponible)
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

    // En m³vil, no esperar respuesta completa (optimistic update)
    if (isMobile) {
      toggleSeat(seatWithData).catch(err => {
        console.error('Error toggling seat:', err);
      });
    } else {
      await toggleSeat(seatWithData);
    }
  }, [getSeatData, toggleSeat, funcionId, isMobile]);

  // Estado para rastrear el progreso de carga del mapa
  const [mapLoadProgress, setMapLoadProgress] = useState(0);
  const [mapLoadStage, setMapLoadStage] = useState('cargandoDatos');

  if (isRedirecting || loading) {
    // Mostrar skeleton inmediatamente para mejorar FCP y LCP
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '20px'
      }}>
        {/* Skeleton del header - se muestra inmediatamente */}
        <div style={{
          height: '60px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          marginBottom: '20px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />

        {/* Skeleton del mapa - placeholder grande para LCP */}
        <div style={{
          flex: 1,
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '500px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: '#666' }}>
              {isRedirecting ? 'Redirigiendo...' : (mapLoadStage === 'cargandoMapa' ? 'Cargando mapa...' : mapLoadStage === 'cargandoPrecios' ? 'Cargando precios...' : 'Cargando...')}
            </div>
            {loading && mapLoadProgress > 0 && (
              <div style={{ marginTop: '8px', width: '200px', margin: '8px auto 0' }}>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${mapLoadProgress}%`,
                    height: '100%',
                    backgroundColor: '#1890ff',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>{mapLoadProgress}%</div>
              </div>
            )}
          </div>
        </div>
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
    <div className="seat-selection-page store-container" style={{
      padding: isMobile ? '12px' : '24px',
      paddingBottom: isMobile ? '24px' : '24px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '16px' : '24px',
      height: isMobile ? 'auto' : 'calc(100vh - 100px)',
      overflow: isMobile ? 'visible' : 'hidden',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      {/* Mapa de asientos */}
      <div className="store-card" style={{
        marginBottom: isMobile ? '24px' : '0',
        flex: isMobile ? '0 0 auto' : '1 1 60%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isMobile ? '400px' : '100%',
        maxHeight: isMobile ? '60vh' : '100%',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%'
      }}>
        <div className="store-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingCartOutlined style={{ fontSize: '20px', color: 'var(--store-primary)' }} />
            <h2 className="store-card-title" style={{ margin: 0 }}>
              Selecci³n de Asientos
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
              description="No se encontr³ un mapa de asientos para esta funci³n."
              type="warning"
              showIcon
            />
          )}
        </div>
      </div>

      {/* Carrito - Siempre visible, debajo del mapa en mobile */}
      <div
        className="store-card"
        style={{
          position: 'relative',
          width: isMobile ? '100%' : 'auto',
          flex: isMobile ? '0 0 auto' : '0 0 400px',
          minWidth: isMobile ? '100%' : '350px',
          maxWidth: isMobile ? '100%' : '400px',
          marginTop: isMobile ? '16px' : '0',
          borderRadius: 'var(--store-radius-xl)',
          boxShadow: 'var(--store-shadow-lg)',
          maxHeight: isMobile ? 'none' : '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          border: funcionCartItems.length > 0 && isMobile ? '2px solid var(--store-primary)' : '1px solid var(--store-border-light)'
        }}
      >
        {funcionCartItems.length > 0 && isMobile && (
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--store-primary)',
            color: 'white',
            padding: '4px 16px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 10,
            animation: 'bounce 2s infinite'
          }}>
            {funcionCartItems.length} asiento{funcionCartItems.length > 1 ? 's' : ''} seleccionado{funcionCartItems.length > 1 ? 's' : ''}
          </div>
        )}
        <Cart selectedFunctionId={funcionId} hideCheckoutButton={false} />
      </div>
    </div>
  );
};

export default SeatSelectionPage;


