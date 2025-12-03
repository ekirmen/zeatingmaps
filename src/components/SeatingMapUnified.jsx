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
import MapLoadingProgress from './MapLoadingProgress';
import resolveImageUrl from '../utils/resolveImageUrl';
import logger from '../utils/logger';
import { getWebPUrl } from '../utils/imageOptimizer';
import clickThrottle from '../utils/clickThrottle';
import { debounce } from '../utils/debounce';
import { isMobileDevice, getCanvasConfig, getOptimizedStageSize } from '../utils/mobileOptimizations';

// Cache global para imágenes de fondo para evitar recargas constantes
const backgroundImageCache = new Map();

// Callbacks para reportar progreso de carga
let progressCallbacks = new Set();

// Registrar callback de progreso
export const registerProgressCallback = (callback) => {
  progressCallbacks.add(callback);
  return () => progressCallbacks.delete(callback);
};

// Reportar progreso
const reportProgress = (stage, progress) => {
  progressCallbacks.forEach(callback => {
    try {
      callback(stage, progress);
    } catch (err) {
      console.error('Error en callback de progreso:', err);
    }
  });
};

// Función para precargar imágenes de fondo con progreso
const preloadBackgroundImage = (url, onProgress) => {
  if (!url || backgroundImageCache.has(url)) {
    if (onProgress) onProgress(100);
    return Promise.resolve(backgroundImageCache.get(url));
  }
  
  return new Promise((resolve, reject) => {
    // Si es una data URL, cargar directamente
    if (url.startsWith('data:')) {
      const image = new window.Image();
      image.crossOrigin = undefined;
      image.loading = 'eager';
      image.decoding = 'sync';
      
      image.onload = () => {
        backgroundImageCache.set(url, image);
        if (onProgress) onProgress(100);
        resolve(image);
      };
      
      image.onerror = reject;
      image.src = url;
      return;
    }

    // Para URLs HTTP, usar fetch para rastrear progreso
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (!response.body) {
          throw new Error('ReadableStream not supported');
        }

        const reader = response.body.getReader();
        const chunks = [];
        let receivedLength = 0;

        const readChunk = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              // Crear blob y cargar imagen
              const blob = new Blob(chunks);
              const blobUrl = URL.createObjectURL(blob);
              
              const image = new window.Image();
              image.crossOrigin = 'anonymous';
              image.loading = 'eager';
              image.decoding = 'sync';
              
              image.onload = () => {
                backgroundImageCache.set(url, image);
                URL.revokeObjectURL(blobUrl);
                if (onProgress) onProgress(100);
                resolve(image);
              };
              
              image.onerror = (err) => {
                URL.revokeObjectURL(blobUrl);
                reject(err);
              };
              
              image.src = blobUrl;
              return;
            }

            chunks.push(value);
            receivedLength += value.length;
            
            // Reportar progreso
            if (total > 0 && onProgress) {
              const progress = Math.round((receivedLength / total) * 100);
              onProgress(progress);
            } else if (onProgress && receivedLength > 0) {
              // Si no conocemos el tamaño total, estimar progreso
              onProgress(Math.min(50, (receivedLength / 100000) * 50));
            }
            
            readChunk();
          }).catch(reject);
        };

        readChunk();
      })
      .catch(error => {
        // Fallback a método tradicional si fetch falla
        console.warn('Fetch falló, usando método tradicional:', error);
        const image = new window.Image();
        image.crossOrigin = url.startsWith('data:') ? undefined : 'anonymous';
        image.loading = 'eager';
        image.decoding = 'sync';
        
        if (onProgress) onProgress(50); // Progreso estimado
        
        image.onload = () => {
          backgroundImageCache.set(url, image);
          if (onProgress) onProgress(100);
          resolve(image);
        };
        
        image.onerror = reject;
        image.src = url;
      });
  });
};

// Componente BackgroundImage memoizado para evitar re-renders innecesarios
const BackgroundImage = React.memo(({ config, onLoadProgress }) => {
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
      const cached = backgroundImageCache.get(rawUrl);
      if (cached.complete && cached.naturalWidth > 0) {
        if (onLoadProgress) onLoadProgress(100);
        return cached;
      }
    }
    return null;
  });

  React.useEffect(() => {
    if (!rawUrl) {
      setBgImg(null);
      return;
    }
    
    // Si ya está en cache y completamente cargada, usar inmediatamente
    if (backgroundImageCache.has(rawUrl)) {
      const cachedImage = backgroundImageCache.get(rawUrl);
      if (cachedImage.complete && cachedImage.naturalWidth > 0) {
        setBgImg(cachedImage);
        if (onLoadProgress) onLoadProgress(100);
        return;
      }
    }
    
    // Usar la función de precarga con progreso
    let cancelled = false;
    
    preloadBackgroundImage(rawUrl, (progress) => {
      if (!cancelled && onLoadProgress) {
        onLoadProgress(progress);
      }
    })
    .then((image) => {
      if (!cancelled && image) {
        setBgImg(image);
      }
    })
    .catch((error) => {
      if (!cancelled) {
        logger.error('Error cargando imagen de fondo:', error);
        setBgImg(null);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, [rawUrl, onLoadProgress]);
  
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
  modoVenta = false,
  allowSearchSeatSelection = false,
  allowBlockedSeatSelection = false,
  disableSeatClickThrottle = false
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
  // Obtener funciones de suscripción del store
  const subscribeToFunction = useSeatLockStore(state => state.subscribeToFunction);
  const unsubscribe = useSeatLockStore(state => state.unsubscribe);
  
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

  const foundSeatIds = useMemo(() => {
    if (!Array.isArray(foundSeats)) return [];
    return foundSeats
      .map(seat => seat?._id || seat?.sillaId || seat?.id || seat?.seat_id)
      .filter(Boolean)
      .map(id => id.toString());
  }, [foundSeats]);
  
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
    
    // 4. Asientos encontrados por búsqueda (resaltado)
    const searchSeatIds = foundSeatIds;

    // Combinar todas las fuentes
    const allSeatIds = [...new Set([...propSeatIds, ...cartSeatIds, ...lockSeatIds, ...searchSeatIds])];

    return new Set(allSeatIds);
  }, [selectedSeats, modoVenta, lockedSeatsState, lockedSeats, forceRefresh, cartItems, foundSeatIds]);

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

  // Estado para rastrear el progreso de carga de imágenes
  const [imageLoadProgress, setImageLoadProgress] = React.useState(0);
  const [imageLoadStage, setImageLoadStage] = React.useState('inicializando');
  const [imagesLoading, setImagesLoading] = React.useState(false);
  const imageProgressMap = React.useRef(new Map());

  // Callback para recibir progreso de carga de imágenes individuales
  const handleImageLoadProgress = useCallback((imageIndex, progress, totalImages) => {
    imageProgressMap.current.set(imageIndex, progress);
    
    // Calcular progreso total inmediatamente
    let totalProgress = 0;
    let loadedCount = 0;
    imageProgressMap.current.forEach((imgProgress) => {
      totalProgress += imgProgress;
      if (imgProgress >= 100) {
        loadedCount++;
      }
    });
    
    const averageProgress = totalImages > 0 ? totalProgress / totalImages : 0;
    const finalProgress = Math.min(Math.max(averageProgress, 0), 100);
    setImageLoadProgress(finalProgress);
    
    // Actualizar etapa basada en el progreso
    if (finalProgress < 30) {
      setImageLoadStage('cargandoImagen');
    } else if (finalProgress < 70) {
      setImageLoadStage('cargandoImagen');
    } else if (finalProgress < 95) {
      setImageLoadStage('cargandoAsientos');
    } else if (loadedCount >= totalImages) {
      setImageLoadStage('finalizando');
      setImageLoadProgress(100);
      // Marcar como completado después de un pequeño delay
      setTimeout(() => {
        setImagesLoading(false);
      }, 300);
    } else {
      setImageLoadStage('cargandoAsientos');
    }
  }, []);

  // Inicializar estado de carga cuando cambian los elementos de fondo
  useEffect(() => {
    if (backgroundElements.length === 0) {
      setImageLoadProgress(100);
      setImageLoadStage('finalizando');
      setImagesLoading(false);
      imageProgressMap.current.clear();
      return;
    }
    // Deferir la inicialización de la carga de imágenes para no bloquear
    // el primer paint. Usar requestIdleCallback si está disponible.
    let cancelled = false;
    const initImageLoading = () => {
      if (cancelled) return;
      // Inicializar estado de carga
      setImagesLoading(true);
      setImageLoadStage('cargandoImagen');
      setImageLoadProgress(0);
      imageProgressMap.current.clear();

      // Inicializar progreso para elementos sin URL (considerarlos como cargados)
      backgroundElements.forEach((bg, index) => {
        const url = bg.imageUrl || bg.url || bg.src || bg.image?.url || bg.image?.publicUrl || bg.imageData || bg.image?.data;
        if (!url) {
          imageProgressMap.current.set(index, 100);
        } else {
          imageProgressMap.current.set(index, 0);
        }
      });

      // Las imágenes se cargarán individualmente a través de BackgroundImage
      // El callback handleImageLoadProgress actualizará el progreso
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(initImageLoading, { timeout: 500 });
      return () => {
        cancelled = true;
        try { window.cancelIdleCallback && window.cancelIdleCallback(id); } catch (e) {}
      };
    }

    const t = setTimeout(initImageLoading, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
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
      if (!disableSeatClickThrottle) {
        if (!clickThrottle.canClick(seatId)) {
          if (onSeatError) {
            onSeatError('Por favor, espera un momento antes de hacer clic nuevamente en este asiento.');
          }
          return;
        }

        // Registrar el click para throttling
        clickThrottle.registerClick(seatId);
      } else {
        // Permitir cambios rápidos de acción limpiando el estado previo
        clickThrottle.clearSeat(seatId);
      }

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
      if (isLocallyBlocked && !allowBlockedSeatSelection) {
        logger.warn('❌ [SEATING_MAP] Asiento bloqueado localmente, no se puede seleccionar');
        return;
      }

      // Verificar si está vendido, reservado o bloqueado permanentemente
      const isLockedSeat = seat.estado === 'locked' || seat.estado === 'bloqueado';
      const isUnavailable = seat.estado === 'vendido' || seat.estado === 'reservado' || (!allowBlockedSeatSelection && isLockedSeat);

      if (!allowSearchSeatSelection && isUnavailable) {
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
        
        if (
          isSelectedByOtherInStore ||
          isLockedByOther ||
          seat.estado === 'seleccionado_por_otro' ||
          (!allowSearchSeatSelection && (seat.estado === 'vendido' || seat.estado === 'reservado'))
        ) {
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
    [
      onSeatToggle,
      onSeatInfo,
      onSeatError,
      selectedSeatIds,
      normalizedFuncionId,
      blockedSeats,
      modoVenta,
      allowSearchSeatSelection,
      allowBlockedSeatSelection
    ]
  );



  // Estado para gestos táctiles (zoom con pellizco)
  const touchStateRef = useRef({
    lastDistance: 0,
    lastCenter: null,
    isPinching: false
  });

  // Función para calcular distancia entre dos puntos táctiles
  const getDistance = useCallback((touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Función para calcular el centro entre dos puntos táctiles
  const getCenter = useCallback((touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }, []);

  // Función para manejar gestos táctiles (zoom con pellizco)
  const handleTouchStart = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return;

    const touches = e.evt.touches;
    if (touches && touches.length === 2) {
      e.evt.preventDefault();
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = getDistance(touch1, touch2);
      const center = getCenter(touch1, touch2);
      
      // Convertir coordenadas de pantalla a coordenadas del stage
      const stageBox = stage.container().getBoundingClientRect();
      const centerPoint = {
        x: center.x - stageBox.left,
        y: center.y - stageBox.top
      };
      
      touchStateRef.current = {
        lastDistance: distance,
        lastCenter: centerPoint,
        isPinching: true
      };
    }
  }, [getDistance, getCenter]);

  // Función para manejar el movimiento de gestos táctiles
  const handleTouchMove = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage || !touchStateRef.current.isPinching) return;

    const touches = e.evt.touches;
    if (touches && touches.length === 2) {
      e.evt.preventDefault();
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = getDistance(touch1, touch2);
      const center = getCenter(touch1, touch2);
      
      // Convertir coordenadas de pantalla a coordenadas del stage
      const stageBox = stage.container().getBoundingClientRect();
      const centerPoint = {
        x: center.x - stageBox.left,
        y: center.y - stageBox.top
      };
      
      const { lastDistance, lastCenter } = touchStateRef.current;
      
      if (lastDistance > 0 && lastCenter) {
        const scaleChange = distance / lastDistance;
        const oldScale = stage.scaleX();
        const newScale = Math.max(0.3, Math.min(3, oldScale * scaleChange));
        
        // Calcular el punto en el stage antes del zoom
        const pointer = {
          x: (centerPoint.x - stage.x()) / oldScale,
          y: (centerPoint.y - stage.y()) / oldScale
        };
        
        // Aplicar el zoom
        stage.scale({ x: newScale, y: newScale });
        
        // Ajustar la posición para mantener el punto centrado
        const newPos = {
          x: centerPoint.x - pointer.x * newScale,
          y: centerPoint.y - pointer.y * newScale
        };
        
        stage.position(newPos);
        stage.batchDraw();
      }
      
      touchStateRef.current.lastDistance = distance;
      touchStateRef.current.lastCenter = centerPoint;
    }
  }, [getDistance, getCenter]);

  // Función para manejar el fin de gestos táctiles
  const handleTouchEnd = useCallback((e) => {
    const touches = e.evt.touches;
    if (!touches || touches.length < 2) {
      touchStateRef.current = {
        lastDistance: 0,
        lastCenter: null,
        isPinching: false
      };
    }
  }, []);

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

  // Calcular dimensiones máximas de manera segura (antes de cualquier return)
  const maxDimensions = useMemo(() => {
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
    
    return { maxX, maxY };
  }, [validatedSeats, validatedMesas]);

  // Memoizar dimensiones del Stage optimizadas para mobile
  const stageDimensions = useMemo(() => {
    const isMobile = isMobileDevice();
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    
    if (isMobile) {
      // En mobile, usar tamaño optimizado (más pequeño para mejor rendimiento)
      const optimized = getOptimizedStageSize(
        Math.min(maxDimensions.maxX + 50, containerWidth - 20),
        Math.min(maxDimensions.maxY + 50, containerHeight - 250)
      );
      return optimized;
    }
    
    return {
      width: maxDimensions.maxX + 50,
      height: maxDimensions.maxY + 50
    };
  }, [maxDimensions]);
  
  // Configuración del canvas optimizada para mobile
  const canvasConfig = useMemo(() => getCanvasConfig(), []);

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

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      maxWidth: '100%'
    }}>
      {/* Barra de progreso de carga de imágenes */}
      {imagesLoading && (
        <MapLoadingProgress
          loading={imagesLoading}
          progress={imageLoadProgress}
          stage={imageLoadStage}
          showDetails={true}
        />
      )}
      
      {shouldShowSeatLockDebug && <SeatLockDebug funcionId={normalizedFuncionId} />}

      {/* Controles de zoom */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 20,
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <Space direction="vertical" size="small" align="center">
          <SeatStatusLegend
            inline
            buttonType="default"
            placement="left"
            style={{ width: '100%' }}
          />
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
            margin: '0 auto',
            // Optimizaciones para mobile
            touchAction: 'none', // Prevenir gestos del navegador que interfieren
            WebkitTapHighlightColor: 'transparent' // Eliminar highlight en mobile
          }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          draggable={!isMobileDevice() || canvasConfig.listening} // Deshabilitar drag en mobile si es necesario
          ref={stageRef}
          // Optimizaciones de rendimiento para mobile
          imageSmoothingEnabled={canvasConfig.imageSmoothingEnabled}
          hitGraphEnabled={canvasConfig.hitGraphEnabled}
          listening={canvasConfig.listening}
        >
          {/* Background Layer - Separado para mejor performance */}
          <BackgroundLayer 
            backgroundElements={backgroundElements}
            onImageLoadProgress={handleImageLoadProgress}
          />

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
