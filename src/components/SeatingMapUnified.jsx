import React, { useRef, useCallback, useMemo, useState, useEffect, memo } from 'react';
import { Stage, Layer, Circle, Rect, Text, Line, Image } from 'react-konva';
import { Button, Space } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSeatLockStore } from './seatLockStore';
import { useCartStore } from '../store/cartStore';
import { useSeatColors } from '../hooks/useSeatColors';
import { useMapaSeatsSync } from '../hooks/useMapaSeatsSync';
import seatPaymentChecker from '../services/seatPaymentChecker';
import SeatStatusLegend from './SeatStatusLegend';
import SeatLockDebug from './SeatLockDebug';
import SeatWithTooltip from './SeatWithTooltip';
// import VisualNotifications from '../utils/VisualNotifications'; // Removido por no usarse
import resolveImageUrl from '../utils/resolveImageUrl';
import logger from '../utils/logger';
import { getWebPUrl, preloadOptimizedImage } from '../utils/imageOptimizer';
import clickThrottle from '../utils/clickThrottle';

// Cache global para imágenes de fondo para evitar recargas constantes
const backgroundImageCache = new Map();

// Función para precargar imágenes de fondo
const preloadBackgroundImage = (url) => {
  if (!url || backgroundImageCache.has(url)) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = url.startsWith('data:') ? undefined : 'anonymous';
    image.loading = 'eager';
    image.decoding = 'sync';
    
    image.onload = () => {
      backgroundImageCache.set(url, image);
      resolve(image);
    };
    
    image.onerror = reject;
    image.src = url;
  });
};

// Componente BackgroundImage memoizado para evitar re-renders innecesarios
const BackgroundImage = React.memo(({ config }) => {
  // Resolver la URL desde múltiples posibles campos
  const rawUrl = useMemo(() => {
    let url = config.imageUrl
      || config.url
      || config.src
      || config.image?.url
      || config.image?.publicUrl
      || config.imageData
      || config.image?.data
      || '';

    // Si es una ruta relativa de Storage, construir la URL pública (bucket 'productos')
    if (url && !/^https?:\/\//i.test(url) && !/^data:/i.test(url)) {
      url = resolveImageUrl(url, 'productos') || url;
    }
    
    // Optimizar a WebP si está disponible
    return getWebPUrl(url);
  }, [config.imageUrl, config.url, config.src, config.image?.url, config.image?.publicUrl, config.imageData, config.image?.data]);

  const [bgImg, setBgImg] = React.useState(() => {
    // Intentar obtener la imagen del cache primero
    if (rawUrl && backgroundImageCache.has(rawUrl)) {
      return backgroundImageCache.get(rawUrl);
    }
    return null;
  });

  React.useEffect(() => {
    if (!rawUrl) {
      setBgImg(null);
      return;
    }
    
    // Si ya está en cache, usar la imagen cacheada inmediatamente
    if (backgroundImageCache.has(rawUrl)) {
      const cachedImage = backgroundImageCache.get(rawUrl);
      // Verificar que la imagen cacheada esté completamente cargada
      if (cachedImage.complete && cachedImage.naturalWidth > 0) {
        setBgImg(cachedImage);
        return;
      }
    }
    
    const image = new window.Image();
    
    // Configurar la imagen para evitar problemas de cache
    image.crossOrigin = rawUrl.startsWith('data:') ? undefined : 'anonymous';
    image.loading = 'eager'; // Cargar inmediatamente, no lazy
    image.decoding = 'sync'; // Decodificar sincrónicamente para evitar parpadeos
    
    const onLoad = () => {
      // Verificar que la imagen se cargó correctamente
      if (image.complete && image.naturalWidth > 0) {
        // Guardar en cache
        backgroundImageCache.set(rawUrl, image);
        setBgImg(image);
      }
    };
    
    const onError = (error) => {
      logger.error('Error cargando imagen de fondo:', error);
      setBgImg(null);
    };
    
    // Agregar listeners antes de establecer src
    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
    
    // Establecer src después de los listeners
    image.src = rawUrl;
    
    // Si la imagen ya está en cache del navegador, puede disparar load inmediatamente
    if (image.complete) {
      onLoad();
    }
    
    return () => {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
    };
  }, [rawUrl]);
  
  const imageProps = useMemo(() => ({
    x: config.position?.x || config.posicion?.x || 0,
    y: config.position?.y || config.posicion?.y || 0,
    scaleX: config.scale || 1,
    scaleY: config.scale || 1,
    opacity: config.opacity ?? 1,
    listening: false
  }), [config.position?.x, config.posicion?.x, config.position?.y, config.posicion?.y, config.scale, config.opacity]);

  if (!bgImg) return null;
  
  return (
    <Image image={bgImg} {...imageProps} />
  );
});

// Agregar displayName para mejor debugging
BackgroundImage.displayName = 'BackgroundImage';

const SeatingMapUnified = ({
  funcionId,
  mapa,
  zonas = [],
  lockSeat,
  unlockSeat,
  lockTable,
  unlockTable,
  isSeatLocked,
  isSeatLockedByMe,
  isTableLocked,
  isTableLockedByMe,
  isAnySeatInTableLocked,
  areAllSeatsInTableLockedByMe,
  onSeatToggle,
  onTableToggle,
  onSeatInfo,
  onSeatError,
  foundSeats = [],
  selectedSeats = [],
  lockedSeats = [],
  blockedSeats = null,
  modoVenta = false
}) => {
  // Validar y normalizar funcionId
  const normalizedFuncionId = useMemo(() => {
    logger.log('🔍 [SEATING_MAP] Normalizando funcionId:', { funcionId, type: typeof funcionId });
    
    if (typeof funcionId === 'number') {
      logger.log('✅ [SEATING_MAP] funcionId es número:', funcionId);
      return funcionId;
    }
    if (typeof funcionId === 'string') {
      const parsed = parseInt(funcionId, 10);
      const result = isNaN(parsed) ? null : parsed;
      logger.log('🔍 [SEATING_MAP] funcionId string parseado:', { original: funcionId, parsed, result });
      return result;
    }
    if (funcionId && typeof funcionId === 'object') {
      // Si es un objeto, intentar extraer el ID
      const id = funcionId.id || funcionId._id || funcionId.funcion_id;
      logger.log('🔍 [SEATING_MAP] funcionId objeto, extrayendo ID:', { funcionId, extractedId: id });
      if (typeof id === 'number') {
        return id;
      }
      if (typeof id === 'string') {
        const parsed = parseInt(id, 10);
        const result = isNaN(parsed) ? null : parsed;
        logger.log('🔍 [SEATING_MAP] ID extraído parseado:', { original: id, parsed, result });
        return result;
      }
    }
    logger.warn('⚠️ [SEATING_MAP] funcionId inválido:', funcionId);
    return null;
  }, [funcionId]);

  // Estado para controles de zoom
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Funciones para controles de zoom
  const handleZoomIn = useCallback(() => {
    setScale(prevScale => Math.min(prevScale * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prevScale => Math.max(prevScale / 1.2, 0.3));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // const channel = useSeatLockStore(state => state.channel); // Removido por no usarse
  const setMapa = useSeatLockStore(state => state.setMapa);
  // Obtener el Map directamente del store y el contador de versión
  // Separar los selectores para evitar crear objetos nuevos en cada render
  const lockedSeatsState = useSeatLockStore(state => state.lockedSeats);
  const seatStatesMapRaw = useSeatLockStore(state => state.seatStates);
  const seatStatesVersion = useSeatLockStore(state => state.seatStatesVersion);
  
  // Convertir Map a objeto para que React detecte cambios
  // seatStatesVersion cambia cada vez que se actualiza seatStates, forzando re-render
  const seatStates = useMemo(() => {
    if (!seatStatesMapRaw || !(seatStatesMapRaw instanceof Map)) {
      return {};
    }
    const obj = {};
    seatStatesMapRaw.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [seatStatesMapRaw, seatStatesVersion]);
  
  // Usar directamente el Map del store en lugar de crear uno nuevo
  const seatStatesMapForColor = seatStatesMapRaw instanceof Map ? seatStatesMapRaw : new Map();
  const subscribeToFunction = useSeatLockStore(state => state.subscribeToFunction);
  const unsubscribe = useSeatLockStore(state => state.unsubscribe);
  const { getSeatColor, getBorderColor } = useSeatColors(normalizedFuncionId);

  // Suscribirse a cambios en tiempo real cuando el componente se monta (optimizado)
  const prevFuncionId = useRef(null);
  useEffect(() => {
    // Solo suscribirse si cambió la función
    if (normalizedFuncionId && normalizedFuncionId !== prevFuncionId.current && subscribeToFunction) {
      // Desuscribirse de la función anterior si existe
      if (prevFuncionId.current && unsubscribe) {
        logger.log('🔔 [SEATING_MAP] Desuscribiéndose de función anterior:', prevFuncionId.current);
        unsubscribe();
      }
      
      logger.log('🔔 [SEATING_MAP] Suscribiéndose a función:', normalizedFuncionId);
      subscribeToFunction(normalizedFuncionId);
      prevFuncionId.current = normalizedFuncionId;
    }

    return () => {
      if (unsubscribe && prevFuncionId.current) {
        logger.log('🔔 [SEATING_MAP] Desuscribiéndose de función:', prevFuncionId.current);
        unsubscribe();
        prevFuncionId.current = null;
      }
    };
  }, [normalizedFuncionId, subscribeToFunction, unsubscribe]);

  // Listener para el evento de carrito limpiado
  useEffect(() => {
    const handleCartCleared = (event) => {
      logger.log('🧹 [SEATING_MAP] Carrito limpiado, forzando actualización de estado visual');
      logger.log('🧹 [SEATING_MAP] Asientos limpiados:', event.detail?.clearedSeats);
      
      // Forzar una actualización inmediata del estado de los asientos
      setForceRefresh(prev => prev + 1);
      
      // También disparar un evento para otros componentes que puedan necesitarlo
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceSeatStateRefresh', {
          detail: { clearedSeats: event.detail?.clearedSeats || [] }
        }));
      }, 100);
    };

    const handleForceRefresh = (event) => {
      logger.log('🔄 [SEATING_MAP] Forzando actualización de estado de asientos');
      setForceRefresh(prev => prev + 1);
    };

    const handleSeatRemovedFromCart = (event) => {
      logger.log('🗑️ [SEATING_MAP] Asiento eliminado del carrito, forzando actualización:', event.detail);
      setForceRefresh(prev => prev + 1);
    };

    window.addEventListener('cartCleared', handleCartCleared);
    window.addEventListener('forceSeatStateRefresh', handleForceRefresh);
    window.addEventListener('seatRemovedFromCart', handleSeatRemovedFromCart);
    
    return () => {
      window.removeEventListener('cartCleared', handleCartCleared);
      window.removeEventListener('forceSeatStateRefresh', handleForceRefresh);
      window.removeEventListener('seatRemovedFromCart', handleSeatRemovedFromCart);
    };
  }, []);

  // Obtener items del carrito usando el hook para que se actualice automáticamente
  const cartItems = useCartStore(state => state.items);
  
  const selectedSeatIds = useMemo(() => {
    // Obtener asientos seleccionados desde diferentes fuentes
    let propSeatIds = [];
    let cartSeatIds = [];
    let lockSeatIds = [];
    
    // 1. Asientos de las props (común para ambos modos)
    if (selectedSeats) {
      if (selectedSeats instanceof Set) {
        propSeatIds = Array.from(selectedSeats).map(id => id?.toString()).filter(Boolean);
      } else if (Array.isArray(selectedSeats)) {
        if (selectedSeats.length > 0 && typeof selectedSeats[0] === 'object') {
          propSeatIds = selectedSeats
            .map(seat => seat?._id || seat?.sillaId || seat?.id)
            .filter(Boolean)
            .map(id => id.toString());
        } else {
          propSeatIds = selectedSeats.map(id => id?.toString()).filter(Boolean);
        }
      }
    }
    
    // 2. Asientos del carrito (solo modo store)
    if (!modoVenta) {
      cartSeatIds = (cartItems || []).map(item => (item.sillaId || item.id || item._id)?.toString()).filter(Boolean);
    }
    
    // 3. Asientos bloqueados/seleccionados en la base de datos (común para ambos modos)
    const tempLocks = Array.isArray(lockedSeatsState) ? lockedSeatsState : [];
    const permanentLocks = Array.isArray(lockedSeats) ? lockedSeats : [];
    const allLocks = [...tempLocks, ...permanentLocks];
    
    // Filtrar solo los locks que están en estado 'seleccionado' (no 'locked', 'vendido', etc.)
    lockSeatIds = allLocks
      .filter(lock => lock && lock.status === 'seleccionado' && lock.seat_id)
      .map(lock => lock.seat_id.toString())
      .filter(Boolean);
    
    // Combinar todas las fuentes
    const allSeatIds = [...new Set([...propSeatIds, ...cartSeatIds, ...lockSeatIds])];
    
    return new Set(allSeatIds);
  }, [selectedSeats, modoVenta, lockedSeatsState, lockedSeats, forceRefresh, cartItems]);

  const selectedSeatList = useMemo(() => Array.from(selectedSeatIds), [selectedSeatIds]);

  // Combinar locks temporales del store con locks permanentes de la BD
  const allLockedSeats = useMemo(() => {
    const tempLocks = Array.isArray(lockedSeatsState) ? lockedSeatsState : [];
    const permanentLocks = Array.isArray(lockedSeats) ? lockedSeats : [];
    
    // console.log('🎫 [SEATING_MAP] Temp locks:', tempLocks.length);
    // console.log('🎫 [SEATING_MAP] Permanent locks:', permanentLocks.length);
    // console.log('🎫 [SEATING_MAP] Permanent locks data:', permanentLocks);
    
    // Crear un mapa para evitar duplicados
    const lockMap = new Map();
    
    // Agregar locks temporales primero (tienen prioridad)
    tempLocks.forEach(lock => {
      if (lock && lock.seat_id) {
        lockMap.set(lock.seat_id, lock);
      }
    });
    
    // Agregar locks permanentes si no existen temporales
    permanentLocks.forEach(lock => {
      if (lock && lock.seat_id && !lockMap.has(lock.seat_id)) {
        lockMap.set(lock.seat_id, lock);
      }
    });
    
    const result = Array.from(lockMap.values());
    // console.log('🎫 [SEATING_MAP] Combined locks:', result.length);
    return result;
  }, [lockedSeatsState, lockedSeats, forceRefresh]);

  // Controlar visibilidad del panel de depuración de locks (oculto por defecto)
  const shouldShowSeatLockDebug =
    typeof window !== 'undefined' && window.__SHOW_SEAT_LOCK_DEBUG === true;
  
  // Referencia al stage de Konva
  const stageRef = useRef(null);
  
  // Usar hook de sincronización para obtener asientos con estado real
  // SOLO usar el mapa original para evitar re-renders innecesarios
  // El storeMapa se usa solo para actualizaciones de estado de asientos individuales
  const { seatsData: syncedSeats, loading: seatsLoading, error: seatsError } = useMapaSeatsSync(mapa, normalizedFuncionId);
  
  // Combinar asientos del mapa original con estados actualizados del store
  const memoizedSeats = useMemo(() => {
    if (!syncedSeats) return syncedSeats;
    
    // Actualizar estados de asientos con la información del store
    return syncedSeats.map(seat => {
      const updatedState = seatStates?.[seat._id] || 
        (seatStatesMapForColor instanceof Map ? seatStatesMapForColor.get(seat._id) : null);
      if (updatedState && updatedState !== seat.estado) {
        return { ...seat, estado: updatedState };
      }
      // No forzar a 'disponible' cuando no hay entrada en seatStates; conservar estado original
      return seat;
    });
  }, [syncedSeats, seatStates, seatStatesVersion]);

  // Establecer el mapa en el store para que pueda ser actualizado cuando se bloquean asientos
  // Solo establecer si el mapa realmente cambió (por ID)
  useEffect(() => {
    if (mapa && mapa.id) {
      setMapa(mapa);
    }
  }, [mapa, setMapa]); // Mantener dependencias completas para evitar warnings

  // Ya no necesitamos sincronizar con storeMapa porque usamos seatStates individuales

  // Background images - memoized to prevent unnecessary re-renders
  // Usar solo el ID del mapa para evitar re-renders cuando cambia el contenido
  const backgroundElements = useMemo(() => {
    if (!mapa) return [];
    return Array.isArray(mapa?.contenido)
      ? mapa.contenido.filter(el => el.type === 'background' && el.showInWeb !== false)
      : mapa?.contenido?.elementos?.filter(el => el.type === 'background' && el.showInWeb !== false) || [];
  }, [mapa]); // Mantener dependencia completa para evitar warnings

  // Precargar imágenes de fondo para evitar parpadeos
  useEffect(() => {
    if (backgroundElements.length > 0) {
      backgroundElements.forEach(bg => {
        const url = bg.imageUrl || bg.url || bg.src || bg.image?.url || bg.image?.publicUrl || bg.imageData || bg.image?.data;
        if (url) {
          let resolvedUrl = url;
          if (!/^https?:\/\//i.test(url) && !/^data:/i.test(url)) {
            resolvedUrl = resolveImageUrl(url, 'productos') || url;
          }
          preloadBackgroundImage(resolvedUrl).catch(err => {
            logger.warn('Error precargando imagen de fondo:', err);
          });
        }
      });
    }
  }, [backgroundElements]);

  // const [mapImage, setMapImage] = React.useState(null); // Removido por no usarse
  
  // React.useEffect(() => {
  //   if (!mapa?.imagen_fondo) {
  //     setMapImage(null);
  //     return;
  //   }
  //   
  //   const url = resolveImageUrl(mapa.imagen_fondo);
  //   
  //   // Verificar si la imagen ya está en cache
  //   const cachedImage = new window.Image();
  //   cachedImage.src = url;
  //   
  //   if (cachedImage.complete) {
  //     setMapImage(cachedImage);
  //     return;
  //   }
  //   
  //   const image = new window.Image();
  //   // Habilitar cache de CDN y uso de canvas seguro
  //   image.crossOrigin = 'anonymous';
  //   image.loading = 'lazy'; // Lazy loading para mejor rendimiento
  //   
  //   const handleLoad = () => {
  //     setMapImage(image);
  //   };
  //   
  //   const handleError = () => {
  //     console.warn('Error loading background image:', url);
  //     setMapImage(null);
  //   };
  //   
  //   image.addEventListener('load', handleLoad);
  //   image.addEventListener('error', handleError);
  //   
  //   image.src = url;
  //   
  //   return () => {
  //     image.removeEventListener('load', handleLoad);
  //     image.removeEventListener('error', handleError);
  //   };
  // }, [mapa?.imagen_fondo]); // Removido por no usarse

  const handleSeatClick = useCallback(
    async (seat) => {
      // Debug info removed for performance

      // Verificar que el asiento sea válido
      if (!seat || !seat._id) {
        logger.warn('❌ [SEATING_MAP] Asiento inválido:', seat);
        return;
      }

      // Throttling: Verificar si el click está permitido
      const seatId = (seat._id || seat.id || seat.sillaId)?.toString();
      if (!clickThrottle.canClick(seatId)) {
        if (onSeatError) {
          onSeatError('Por favor, espera un momento antes de hacer clic nuevamente en este asiento.');
        }
        return;
      }

      // Registrar el click para throttling
      clickThrottle.registerClick(seatId);

      // En modo store, verificar estado antes de delegar al onSeatToggle
      if (!modoVenta) {
        // Verificando estado del asiento
        
        // Verificar si el asiento ya está pagado antes de permitir cualquier interacción
        const currentSessionId = localStorage.getItem('anonSessionId');
        const paymentCheck = await seatPaymentChecker.isSeatPaidByUser(seat._id, normalizedFuncionId, currentSessionId);
        
        if (paymentCheck.isPaid) {
          // Asiento ya pagado
          if (onSeatError) {
            onSeatError('Este asiento ya ha sido comprado y no puede ser seleccionado');
          }
          return;
        }
        
        // Verificar si está vendido, reservado o bloqueado permanentemente
        if (seat.estado === 'vendido' || seat.estado === 'reservado' || seat.estado === 'locked') {
          // Asiento no disponible
          if (onSeatError) {
            const errorMessage = seat.estado === 'vendido' 
              ? 'Este asiento ya está vendido.' 
              : seat.estado === 'reservado' 
              ? 'Este asiento está reservado.' 
              : 'Este asiento no está disponible.';
            onSeatError(errorMessage);
          }
          return;
        }
        
        // Delegando a onSeatToggle
        if (onSeatToggle) {
          onSeatToggle({ ...seat, funcionId: normalizedFuncionId });
        }
        if (onSeatInfo) onSeatInfo(seat);
        return;
      }

      // Verificar si está seleccionado por otro usuario (usando seatStates del store)
      const storeState = seatStates?.[seat._id];
      const isSelectedByOtherInStore = storeState === 'seleccionado_por_otro';
      
      // Verificar si está bloqueado/seleccionado por otro usuario
      const isLockedByOther = allLockedSeats && Array.isArray(allLockedSeats) && allLockedSeats.some(lock => {
        const lockSeatId = lock.seat_id || lock.seatId;
        const currentSessionId = localStorage.getItem('anonSessionId');
        return lockSeatId === seat._id && lock.session_id !== currentSessionId && lock.status === 'seleccionado';
      });
      
      if (isSelectedByOtherInStore || isLockedByOther || seat.estado === 'seleccionado_por_otro') {
        logger.warn('❌ [SEATING_MAP] Asiento seleccionado por otro usuario, no se puede interactuar');
        // Mostrar mensaje al usuario
        if (onSeatError) {
          onSeatError('Este asiento está siendo seleccionado por otro usuario. Por favor, elige otro asiento.');
        }
        return;
      }

      // Verificar si está bloqueado localmente (desde props)
      const isLocallyBlocked = blockedSeats && blockedSeats.has && blockedSeats.has(seat._id);
      if (isLocallyBlocked) {
        logger.warn('❌ [SEATING_MAP] Asiento bloqueado localmente, no se puede seleccionar');
        return;
      }

      // Verificar si está vendido, reservado o bloqueado permanentemente
      if (seat.estado === 'vendido' || seat.estado === 'reservado' || seat.estado === 'locked') {
        logger.warn('❌ [SEATING_MAP] Asiento no disponible para selección:', seat.estado);
        if (onSeatError) {
          const errorMessage = seat.estado === 'vendido' 
            ? 'Este asiento ya está vendido.' 
            : seat.estado === 'reservado' 
            ? 'Este asiento está reservado.' 
            : 'Este asiento no está disponible.';
          onSeatError(errorMessage);
        }
        return;
      }

      // Verificar si está seleccionado por el usuario actual
      const isSelectedByMe = selectedSeatIds.has((seat._id || '').toString());
      
      // LÓGICA SIMPLIFICADA: Solo 2 estados - seleccionado o no seleccionado
      if (isSelectedByMe) {
        // DESELECCIONAR: Solo verificar que no esté comprado
        const currentSessionId = localStorage.getItem('anonSessionId');
        const paymentCheck = await seatPaymentChecker.isSeatPaidByUser(seat._id, normalizedFuncionId, currentSessionId);
        
        if (paymentCheck.isPaid) {
          // No se puede deseleccionar asiento comprado
          if (onSeatError) {
            onSeatError('Este asiento ya ha sido comprado y no puede ser deseleccionado');
          }
          return;
        }
        
        // Deseleccionando asiento
        if (onSeatToggle) {
          onSeatToggle({ ...seat, funcionId: normalizedFuncionId });
        }
      } else {
        // SELECCIONAR: Solo verificar que no esté comprado o bloqueado por otro
        const currentSessionId = localStorage.getItem('anonSessionId');
        const paymentCheck = await seatPaymentChecker.isSeatPaidByUser(seat._id, normalizedFuncionId, currentSessionId);
        
        if (paymentCheck.isPaid) {
          // Asiento ya pagado
          if (onSeatError) {
            onSeatError('Este asiento ya ha sido comprado');
          }
          return;
        }
        
        // Verificar si está bloqueado por otro usuario (usando seatStates del store)
        const storeState = seatStates?.[seat._id];
        const isSelectedByOtherInStore = storeState === 'seleccionado_por_otro';
        
        // Verificar si está bloqueado/seleccionado por otro usuario
        const isLockedByOther = allLockedSeats && Array.isArray(allLockedSeats) && allLockedSeats.some(lock => {
          const lockSeatId = lock.seat_id || lock.seatId;
          const currentSessionId = localStorage.getItem('anonSessionId');
          return lockSeatId === seat._id && lock.session_id !== currentSessionId && lock.status === 'seleccionado';
        });
        
        if (isSelectedByOtherInStore || isLockedByOther || seat.estado === 'seleccionado_por_otro' || seat.estado === 'vendido' || seat.estado === 'reservado') {
          // Asiento no disponible
          if (onSeatError) {
            const errorMessage = seat.estado === 'vendido' 
              ? 'Este asiento ya está vendido.' 
              : seat.estado === 'reservado' 
              ? 'Este asiento está reservado.' 
              : 'Este asiento está siendo seleccionado por otro usuario.';
            onSeatError(errorMessage);
          }
          return;
        }
        
        // Seleccionando asiento
        if (onSeatToggle) {
          onSeatToggle({ ...seat, funcionId: normalizedFuncionId });
        }
      }

      // Llamar a la función de información del asiento si existe
      if (onSeatInfo) onSeatInfo(seat);
    },
    [onSeatToggle, onSeatInfo, onSeatError, selectedSeatIds, normalizedFuncionId, blockedSeats, modoVenta]
  );



  // Función para manejar el zoom del mapa
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    
    stage.scale({ x: newScale, y: newScale });
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    
    stage.position(newPos);
    stage.batchDraw();
  }, []);

     // Usar asientos sincronizados del hook
  const allSeats = memoizedSeats;
  
  // Debug logs removed for performance
  
  // Usar zonas reales de la base de datos o crear zonas automáticamente si no hay
  const validatedZonas = useMemo(() => {
    if (zonas && zonas.length > 0) {
      return zonas;
    }
    
    // Fallback: crear zonas basadas en los asientos sincronizados
    if (allSeats.length > 0) {
      const zonasMap = new Map();
      
      allSeats.forEach(seat => {
        const zonaId = seat.zonaId || seat.zona?.id || 'zona_principal';
        if (!zonasMap.has(zonaId)) {
          zonasMap.set(zonaId, {
            id: zonaId,
            nombre: seat.zona?.nombre || `Zona ${zonaId}`,
            color: seat.zona?.color || '#4CAF50',
            asientos: []
          });
        }
        zonasMap.get(zonaId).asientos.push(seat);
      });
      
      return Array.from(zonasMap.values());
    }
    
    return [];
  }, [zonas, allSeats]);
  
  // Obtener mesas del mapa con validaciones adicionales para evitar elementos falsos positivos
  const rawMapElements = useMemo(() => {
    if (!mapa?.contenido) {
      return [];
    }

    if (Array.isArray(mapa.contenido)) {
      return mapa.contenido;
    }

    const elementos = [];

    if (Array.isArray(mapa.contenido.elementos)) {
      elementos.push(...mapa.contenido.elementos);
    }

    if (Array.isArray(mapa.contenido.mesas)) {
      elementos.push(...mapa.contenido.mesas);
    }

    return elementos;
  }, [mapa]);

  const mesas = useMemo(() => {
    const mesasMap = new Map();

    rawMapElements.forEach(elemento => {
      if (!elemento || !elemento._id) {
        return;
      }

      const typeCandidates = [
        elemento.type,
        elemento.elementType,
        elemento.element_type,
        elemento.componentType,
        elemento.category
      ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase());

      const hasMesaType = typeCandidates.some(type => type.includes('mesa'));
      const hasSeatCollection = Array.isArray(elemento.sillas) && elemento.sillas.length > 0;

      if (!hasMesaType && !hasSeatCollection) {
        return;
      }

      const mesaId = String(elemento._id);
      const existingMesa = mesasMap.get(mesaId) || {};
      mesasMap.set(mesaId, { ...existingMesa, ...elemento });
    });

    return Array.from(mesasMap.values());
  }, [rawMapElements]);

  // Validar y normalizar las mesas
  const validatedMesas = useMemo(() => (
    mesas
      .filter(mesa => mesa && mesa._id) // Filtrar mesas válidas
      .map(mesa => ({
        ...mesa,
        posicion: {
          x: mesa.posicion?.x ?? mesa.x ?? 0,
          y: mesa.posicion?.y ?? mesa.y ?? 0
        },
        width: mesa.width ?? mesa.ancho ?? 100,
        height: mesa.height ?? mesa.alto ?? 80,
        radius: mesa.radius ?? 50
      }))
  ), [mesas]);

  // Los asientos ya vienen validados del hook de sincronización
  const validatedSeats = allSeats;

  // Calcular dimensiones máximas de manera segura
  let maxX = 800;
  let maxY = 600;
  
  if (validatedSeats.length > 0) {
    maxX = Math.max(...validatedSeats.map((s) => (s.x || 0) + (s.ancho || 30)), 800);
    maxY = Math.max(...validatedSeats.map((s) => (s.y || 0) + (s.alto || 30)), 600);
  } else if (validatedMesas.length > 0) {
    // Si no hay asientos, usar las mesas para calcular dimensiones
    maxX = Math.max(...validatedMesas.map((m) => (m.posicion?.x || 0) + (m.width || 100)), 800);
    maxY = Math.max(...validatedMesas.map((m) => (m.posicion?.y || 0) + (m.height || 80)), 600);
  }

  if (!mapa) {
    return <div>No map data available</div>;
  }
  
     // Mostrar loading mientras se sincronizan los asientos
   if (seatsLoading) {
     return <div className="text-center p-4">Sincronizando asientos...</div>;
   }

   // Mostrar error si hay problema de sincronización
   if (seatsError) {
     logger.error('[SYNC] Error en sincronización:', seatsError);
     return <div className="text-center p-4 text-red-600">Error al cargar asientos</div>;
   }

   // Si no hay asientos sincronizados, mostrar mensaje
   if (validatedSeats.length === 0) {
     return <div className="text-center p-4">No hay asientos disponibles en este mapa</div>;
   }

  // Validar que haya mesas válidas
  if (validatedMesas.length === 0) {
    logger.warn('No valid tables found in the map');
  }

  // Create a set of found seat IDs for quick lookup

  // Detectar si es móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  // Ajustar dimensiones del Stage para móvil
  const stageWidth = isMobile ? Math.min(maxX + 50, window.innerWidth - 40) : maxX + 50;
  const stageHeight = isMobile ? Math.min(maxY + 50, window.innerHeight - 200) : maxY + 50;

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%',
      overflow: 'hidden',
      maxWidth: '100%'
    }}>
      <SeatStatusLegend />
      {shouldShowSeatLockDebug && <SeatLockDebug funcionId={normalizedFuncionId} />}
      
      {/* Controles de zoom */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <Space direction="vertical" size="small">
          <Button 
            icon={<ZoomInOutlined />} 
            onClick={handleZoomIn}
            size="small"
            title="Zoom In"
          />
          <Button 
            icon={<ZoomOutOutlined />} 
            onClick={handleZoomOut}
            size="small"
            title="Zoom Out"
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleResetZoom}
            size="small"
            title="Reset Zoom"
          />
        </Space>
      </div>

      <div style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}>
        <Stage
          width={stageWidth}
          height={stageHeight}
          style={{ 
            border: '1px solid #ccc',
            maxWidth: '100%',
            margin: '0 auto'
          }}
          onWheel={handleWheel}
          draggable
          ref={stageRef}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
        >
        <Layer>
          {/* Background images */}
          {backgroundElements.map(bg => (
            <BackgroundImage 
              key={`bg_${bg._id || bg.id || bg.imageUrl || bg.url || bg.src}`} 
              config={bg} 
            />
          ))}

          {/* Renderizar mesas primero (para que estén detrás de las sillas) */}
          {validatedMesas.map((mesa) => {
            if (mesa.shape === 'circle') {
              const centerX = mesa.x || mesa.posicion?.x || 0;
              const centerY = mesa.y || mesa.posicion?.y || 0;
              const radius = mesa.radius || (mesa.width || 60) / 2;
              return (
                <React.Fragment key={`mesa_${mesa._id}`}>
                  <Circle
                    x={centerX}
                    y={centerY}
                    radius={radius}
                    fill="#f0f0f0"
                    stroke="#666"
                    strokeWidth={2}
                    opacity={0.8}
                  />
                  <Text
                    x={centerX - radius}
                    y={centerY - 7}
                    width={radius * 2}
                    align="center"
                    text={mesa.nombre || ''}
                    fontSize={14}
                    fill="#000"
                  />
                </React.Fragment>
              );
            } else if (mesa.shape === 'rect') {
              const x = mesa.x || mesa.posicion?.x || 0;
              const y = mesa.y || mesa.posicion?.y || 0;
              const width = mesa.width || 120;
              const height = mesa.height || 80;
              return (
                <React.Fragment key={`mesa_${mesa._id}`}>
                  <Rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="#f0f0f0"
                    stroke="#666"
                    strokeWidth={2}
                    opacity={0.8}
                  />
                  <Text
                    x={x}
                    y={y + height / 2 - 7}
                    width={width}
                    align="center"
                    text={mesa.nombre || ''}
                    fontSize={14}
                    fill="#000"
                  />
                </React.Fragment>
              );
            }
            return null;
          })}

          {/* Renderizar asientos */}
          {validatedSeats.map((seat) => {
            const isSelected = selectedSeatIds.has((seat._id || '').toString());
            const locked = false; // Se maneja a través de seatStates
            const lockedByMe = false; // Simplificado - se maneja a través de seatStates

            // Determinar estado visual - priorizar seatStates del store para sincronización en tiempo real
            let seatEstado = seat.estado;
            
            // Verificar si hay un estado actualizado en el store (tiempo real)
            const storeState = seatStates?.[seat._id] || 
              (seatStatesMapForColor instanceof Map ? seatStatesMapForColor.get(seat._id) : null);
            if (storeState) {
              // Usando estado del store para asiento
              seatEstado = storeState;
            } else {
              // Fallback a la lógica original si no hay estado en el store
              // Verificar si está bloqueado localmente (desde props)
              const isLocallyBlocked = blockedSeats && blockedSeats.has && blockedSeats.has(seat._id);
              
              if (isLocallyBlocked) {
                seatEstado = 'locked'; // Bloqueo local
              } else if (locked) {
                const lock = Array.isArray(allLockedSeats)
                  ? allLockedSeats.find(l => l.seat_id === seat._id)
                  : null;
                const lockStatus = lock?.status || 'locked';
                
                // Usar estados estándar consistentes con boleteria
                if (lockStatus === 'seleccionado') {
                  seatEstado = lockedByMe ? 'seleccionado' : 'seleccionado_por_otro';
                } else if (lockStatus === 'locked') {
                  seatEstado = 'locked'; // Bloqueo permanente
               } else if (lockStatus === 'vendido') {
                 seatEstado = 'vendido';
               } else if (lockStatus === 'reservado') {
                 seatEstado = 'reservado';
               } else if (lockStatus === 'anulado') {
                 seatEstado = 'anulado';
               } else {
                 seatEstado = lockedByMe ? 'seleccionado' : 'seleccionado_por_otro';
               }
             }
            }

             // Debug logs removed for performance

            const seatData = { ...seat, estado: seatEstado };
            
            // Buscar la zona del asiento con guardas para evitar errores cuando falten zonas/asientos
            const seatZona = (
              Array.isArray(validatedZonas)
                ? validatedZonas.find(z => Array.isArray(z?.asientos) && z.asientos.some(a => a._id === seat._id))
                : null
            ) || (Array.isArray(validatedZonas) ? validatedZonas[0] : null);
            
            // Usar directamente el Map del store para getSeatColor
            const seatStatesForColor = seatStatesMapForColor;
            
            const seatColor = getSeatColor(
              seatData,
              seatZona,
              isSelected,
              selectedSeatList,
              allLockedSeats,
              seatStatesForColor
            );
            
            // Determinar si está seleccionado por mí basado en seatStates (más confiable que isSelected del carrito)
            const isSelectedByMe = storeState === 'seleccionado';
            const isSelectedByOther = storeState === 'seleccionado_por_otro';
            
            // Usar el color del store para determinar el borde también
            const borderColor = getBorderColor({
              isSelected: isSelectedByMe || isSelected,
              zona: seatZona,
              seatColor
            });
            const highlightStroke = (isSelectedByMe || isSelectedByOther || isSelected)
              ? seatColor
              : borderColor;
            const highlightShadowColor = (isSelectedByMe || isSelectedByOther || isSelected)
              ? seatColor
              : 'rgba(0, 0, 0, 0.3)';
            const seatName = seat.nombre || seat.numero || seat._id || 'Asiento';

            return (
              <SeatWithTooltip
                key={`seat_${seat._id}`}
                seat={seatData}
                seatColor={seatColor}
                highlightStroke={highlightStroke}
                strokeWidth={(isSelectedByMe || isSelectedByOther || isSelected) ? 3 : 2}
                shadowColor={highlightShadowColor}
                shadowBlur={(isSelectedByMe || isSelectedByOther || isSelected) ? 12 : 5}
                shadowOffset={{ x: 2, y: 2 }}
                shadowOpacity={(isSelectedByMe || isSelectedByOther || isSelected) ? 0.45 : 0.3}
                seatName={seatName}
                onSeatClick={() => handleSeatClick(seatData)}
                x={seat.x || seat.posicion?.x || 0}
                y={seat.y || seat.posicion?.y || 0}
                radius={seat.width ? seat.width / 2 : 10}
              />
            );
          })}

          {/* Renderizar otros elementos del mapa */}
          {(Array.isArray(mapa?.contenido) ? mapa.contenido : mapa?.contenido?.elementos || []).map((elemento, index) => {
            // Filtrar elementos que ya se renderizaron como mesas o asientos
            if (elemento.type === 'mesa' || elemento.shape === 'circle' || elemento.shape === 'rect') {
              return null;
            }
            
            // Filtrar elementos de fondo que no deberían ser clickeables
            if (elemento._id && (
              elemento._id.startsWith('bg_') || 
              elemento._id.startsWith('txt_') || 
              elemento.type === 'background' ||
              elemento.type === 'text'
            )) {
              return null;
            }
            
            // Renderizar elementos de texto
            if (elemento.type === 'Text' || elemento.text) {
              return (
                <Text
                  key={`text_${index}`}
                  x={elemento.x || elemento.posicion?.x || 0}
                  y={elemento.y || elemento.posicion?.y || 0}
                  text={elemento.text || elemento.nombre || ''}
                  fontSize={elemento.fontSize || 14}
                  fill={elemento.fill || '#000'}
                  fontFamily={elemento.fontFamily || 'Arial'}
                />
              );
            }
            
            // Renderizar líneas
            if (elemento.type === 'Line' || elemento.points) {
              return (
                <Line
                  key={`line_${index}`}
                  points={elemento.points || [0, 0, 100, 100]}
                  stroke={elemento.stroke || '#000'}
                  strokeWidth={elemento.strokeWidth || 1}
                />
              );
            }
            
            // Renderizar formas geométricas (herramientas del plano)
            if (elemento._id && elemento._id.startsWith('shape_')) {
              // Círculo
              if (elemento.type === 'Circle' || elemento.shape === 'circle') {
                return (
                  <Circle
                    key={`shape_circle_${index}`}
                    x={elemento.x || elemento.posicion?.x || 0}
                    y={elemento.y || elemento.posicion?.y || 0}
                    radius={elemento.radius || (elemento.width ? elemento.width / 2 : 20)}
                    fill={elemento.fill || '#e0e0e0'}
                    stroke={elemento.stroke || '#999'}
                    strokeWidth={elemento.strokeWidth || 2}
                    opacity={elemento.opacity || 0.8}
                    listening={false} // No clickeable
                  />
                );
              }
              
              // Rectángulo/Cuadrado
              if (elemento.type === 'Rect' || elemento.shape === 'rect' || elemento.shape === 'square') {
                return (
                  <Rect
                    key={`shape_rect_${index}`}
                    x={elemento.x || elemento.posicion?.x || 0}
                    y={elemento.y || elemento.posicion?.y || 0}
                    width={elemento.width || 40}
                    height={elemento.height || 40}
                    fill={elemento.fill || '#e0e0e0'}
                    stroke={elemento.stroke || '#999'}
                    strokeWidth={elemento.strokeWidth || 2}
                    opacity={elemento.opacity || 0.8}
                    listening={false} // No clickeable
                  />
                );
              }
              
              // Triángulo (usando Line para simular)
              if (elemento.shape === 'triangle') {
                const x = elemento.x || elemento.posicion?.x || 0;
                const y = elemento.y || elemento.posicion?.y || 0;
                const size = elemento.width || 40;
                const points = [
                  x, y - size/2,           // Punto superior
                  x - size/2, y + size/2,  // Punto inferior izquierdo
                  x + size/2, y + size/2,  // Punto inferior derecho
                  x, y - size/2            // Cerrar el triángulo
                ];
                return (
                  <Line
                    key={`shape_triangle_${index}`}
                    points={points}
                    fill={elemento.fill || '#e0e0e0'}
                    stroke={elemento.stroke || '#999'}
                    strokeWidth={elemento.strokeWidth || 2}
                    closed={true}
                    opacity={elemento.opacity || 0.8}
                    listening={false} // No clickeable
                  />
                );
              }
            }
            
            // Renderizar círculos genéricos
            if (elemento.type === 'Circle' && !elemento.shape) {
              return (
                <Circle
                  key={`circle_${index}`}
                  x={elemento.x || elemento.posicion?.x || 0}
                  y={elemento.y || elemento.posicion?.y || 0}
                  radius={elemento.radius || elemento.width ? elemento.width / 2 : 20}
                  fill={elemento.fill || '#ccc'}
                  stroke={elemento.stroke || '#666'}
                  strokeWidth={elemento.strokeWidth || 1}
                />
              );
            }
            
            // Renderizar rectángulos genéricos
            if (elemento.type === 'Rect' && !elemento.shape) {
              return (
                <Rect
                  key={`rect_${index}`}
                  x={elemento.x || elemento.posicion?.x || 0}
                  y={elemento.y || elemento.posicion?.y || 0}
                  width={elemento.width || 100}
                  height={elemento.height || 100}
                  fill={elemento.fill || '#ccc'}
                  stroke={elemento.stroke || '#666'}
                  strokeWidth={elemento.strokeWidth || 1}
                />
              );
            }
            
            return null;
          })}
        </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default memo(SeatingMapUnified);
