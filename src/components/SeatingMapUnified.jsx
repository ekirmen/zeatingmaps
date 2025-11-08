import React, { useRef, useCallback, useMemo, useState, useEffect, memo } from 'react';
import { Stage, Image } from 'react-konva';
import { Button, Space } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSeatLockStore } from './seatLockStore';
import { useCartStore } from '../store/cartStore';
import { useSeatColors } from '../hooks/useSeatColors';
import { useMapaSeatsSync } from '../hooks/useMapaSeatsSync';
import seatPaymentChecker from '../services/seatPaymentChecker';
import SeatStatusLegend from './SeatStatusLegend';
import SeatLockDebug from './SeatLockDebug';
import SeatLayer from './SeatLayer';
import TableLayer from './TableLayer';
import BackgroundLayer from './BackgroundLayer';
import MapElementsLayer from './MapElementsLayer';
import resolveImageUrl from '../utils/resolveImageUrl';
import logger from '../utils/logger';
import { getWebPUrl } from '../utils/imageOptimizer';
import clickThrottle from '../utils/clickThrottle';
import { debounce } from '../utils/debounce';

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

// Exportar BackgroundImage para uso en BackgroundLayer
export { BackgroundImage };

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

  // Estado para controles de zoom (optimizado: actualizar directamente en el Stage)
  const stageRef = useRef(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Funciones para controles de zoom (actualizar directamente en el Stage para mejor performance)
  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const currentScale = stage.scaleX();
    const newScale = Math.min(currentScale * 1.2, 3);
    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
  }, []);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const currentScale = stage.scaleX();
    const newScale = Math.max(currentScale / 1.2, 0.3);
    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
  }, []);

  const handleResetZoom = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.batchDraw();
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
  const seatStatesMapForColor = useMemo(
    () => seatStatesMapRaw instanceof Map ? seatStatesMapRaw : new Map(),
    [seatStatesMapRaw]
  );
  
  // Hook de colores (memoizado por funcionId)
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

  // Obtener items del carrito usando selector específico (optimizado)
  // Memoizar para evitar re-renders cuando los items no cambian realmente
  const cartItemsRaw = useCartStore(state => state.items);
  const cartItems = useMemo(() => {
    // Retornar referencia estable si no hay cambios reales
    return cartItemsRaw;
  }, [cartItemsRaw?.length, cartItemsRaw?.map(item => item.sillaId || item.id || item._id).join(',')]);
  
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



  // Función para manejar el zoom del mapa (con debounce para mejor performance)
  const handleWheelInternal = useCallback((e) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return; // Evitar errores si no hay posición del puntero
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.3, Math.min(3, newScale)); // Limitar zoom entre 0.3x y 3x
    
    stage.scale({ x: clampedScale, y: clampedScale });
    
    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    
    stage.position(newPos);
    stage.batchDraw();
  }, []);

  // Debounce del zoom para evitar re-renders excesivos (16ms = ~60fps)
  const handleWheel = useMemo(
    () => debounce(handleWheelInternal, 16),
    [handleWheelInternal]
  );

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

  // Memoizar dimensiones del Stage (solo recalcular si cambian las dimensiones máximas)
  const stageDimensions = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    return {
      width: isMobile ? Math.min(maxX + 50, window.innerWidth - 40) : maxX + 50,
      height: isMobile ? Math.min(maxY + 50, window.innerHeight - 200) : maxY + 50
    };
  }, [maxX, maxY]);

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
          width={stageDimensions.width}
          height={stageDimensions.height}
          style={{ 
            border: '1px solid #ccc',
            maxWidth: '100%',
            margin: '0 auto'
          }}
          onWheel={handleWheel}
          draggable
          ref={stageRef}
        >
          {/* Background Layer - Separado para mejor performance */}
          <BackgroundLayer backgroundElements={backgroundElements} />

          {/* Table Layer - Separado para mejor performance */}
          <TableLayer mesas={validatedMesas} />

          {/* Seat Layer - Separado para mejor performance */}
          <SeatLayer
            seats={validatedSeats}
            selectedSeatIds={selectedSeatIds}
            seatStates={seatStates}
            seatStatesMapForColor={seatStatesMapForColor}
            validatedZonas={validatedZonas}
            selectedSeatList={selectedSeatList}
            onSeatClick={handleSeatClick}
            getSeatColor={getSeatColor}
            getBorderColor={getBorderColor}
            allLockedSeats={allLockedSeats}
            blockedSeats={blockedSeats}
          />

          {/* Map Elements Layer - Separado para mejor performance */}
          <MapElementsLayer mapa={mapa} />
        </Stage>
      </div>
    </div>
  );
};

export default memo(SeatingMapUnified);
