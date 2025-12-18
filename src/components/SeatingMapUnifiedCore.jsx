import React, { useRef, useCallback, useMemo, useState, useEffect, memo } from 'react';
import { Stage, Image } from 'react-konva';
import { Button, Space, Spin } from '../utils/antdComponents';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons';
import { useSeatLockStore } from './seatLockStore';
import { useCartStore } from '../store/cartStore';
import { useSeatColors } from '../hooks/useSeatColors';
import { useMapaSeatsSync } from '../hooks/useMapaSeatsSync';
import seatPaymentChecker from '../services/seatPaymentChecker';
import SeatStatusLegend from './SeatStatusLegend';
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
      image.loading = 'lazy';
      image.decoding = 'async';

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
              image.loading = 'lazy';
              image.decoding = 'async';

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
        const image = new window.Image();
        image.crossOrigin = url.startsWith('data:') ? undefined : 'anonymous';
        image.loading = 'lazy';
        image.decoding = 'async';

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

    // Usar requestIdleCallback para no bloquear el render inicial
    let cancelled = false;
    const loadImage = () => {
      if (cancelled) return;

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
    };

    // Deferir carga de imágenes de fondo para no bloquear FCP
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(loadImage, { timeout: 1000 });
    } else {
      // Fallback: usar setTimeout para no bloquear
      setTimeout(loadImage, 100);
    }

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

    //
    //
    //

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
    //
    return result;
  }, [lockedSeatsState, lockedSeats, forceRefresh]);


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

      // Las imágenes se cargarán individualmente a través de BackgroundImage (deferidas)
      // El callback handleImageLoadProgress actualizará el progreso
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(initImageLoading, { timeout: 500 });
      return () => {
        cancelled = true;
        try { window.cancelIdleCallback && window.cancelIdleCallback(id); } catch (e) { }
      };
    }

    const t = setTimeout(initImageLoading, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [backgroundElements]);

  const handleSeatClick = useCallback(
    async (seat) => {
      if (!seat || !seat._id) {
        logger.warn('❌ [SEATING_MAP] Asiento inválido:', seat);
        return;
      }

      const seatId = (seat._id || seat.id || seat.sillaId)?.toString();
      if (!disableSeatClickThrottle) {
        if (!clickThrottle.canClick(seatId)) {
          if (onSeatError) {
            onSeatError('Por favor, espera un momento antes de hacer clic nuevamente en este asiento.');
          }
          return;
        }

        clickThrottle.registerClick(seatId);
      } else {
        clickThrottle.clearSeat(seatId);
      }

      if (!modoVenta) {
        const currentSessionId = localStorage.getItem('anonSessionId');
        const paymentCheck = await seatPaymentChecker.isSeatPaidByUser(seat._id, normalizedFuncionId, currentSessionId);

        if (paymentCheck.isPaid) {
          if (onSeatError) {
            onSeatError('Este asiento ya ha sido comprado y no puede ser seleccionado');
          }
          return;
        }

        if (seat.estado === 'vendido' || seat.estado === 'reservado' || seat.estado === 'locked') {
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

        if (onSeatToggle) {
          onSeatToggle({ ...seat, funcionId: normalizedFuncionId });
        }
        if (onSeatInfo) onSeatInfo(seat);
        return;
      }

      const storeState = seatStates?.[seat._id];
      const isSelectedByOtherInStore = storeState === 'seleccionado_por_otro';

      const isLockedByOther = allLockedSeats && Array.isArray(allLockedSeats) && allLockedSeats.some(lock => {
        const lockSeatId = lock.seat_id || lock.seatId;
        const currentSessionId = localStorage.getItem('anonSessionId');
        return lockSeatId === seat._id && lock.session_id !== currentSessionId && lock.status === 'seleccionado';
      });

      if (isSelectedByOtherInStore || isLockedByOther || seat.estado === 'seleccionado_por_otro') {
        logger.warn('❌ [SEATING_MAP] Asiento seleccionado por otro usuario, no se puede interactuar');
        if (onSeatError) {
          onSeatError('Este asiento está siendo seleccionado por otro usuario. Por favor, elige otro asiento.');
        }
        return;
      }
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

  const getDistance = useCallback((touch1, touch2) => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touch1, touch2) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }, []);

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

        const pointer = {
          x: (centerPoint.x - stage.x()) / oldScale,
          y: (centerPoint.y - stage.y()) / oldScale
        };

        stage.scale({ x: newScale, y: newScale });

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

  const handleWheelInternal = useCallback((e) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.3, Math.min(3, newScale));

    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    stage.position(newPos);
    stage.batchDraw();
  }, []);

  /* 
     Eliminado debounce porque causaba que el zoom no funcionara durante el scroll continuo.
     El evento wheel debe ser manejado inmediatamente.
  */
  const handleWheel = handleWheelInternal;

  const allSeats = memoizedSeats;

  const validatedZonas = useMemo(() => {
    if (zonas && zonas.length > 0) {
      return zonas;
    }

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

  const validatedMesas = useMemo(() => (
    mesas
      .filter(mesa => mesa && mesa._id)
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

  const validatedSeats = allSeats;

  const maxDimensions = useMemo(() => {
    let maxX = 800;
    let maxY = 600;

    if (validatedSeats.length > 0) {
      maxX = Math.max(...validatedSeats.map((s) => (s.x || 0) + (s.ancho || 30)), 800);
      maxY = Math.max(...validatedSeats.map((s) => (s.y || 0) + (s.alto || 30)), 600);
    } else if (validatedMesas.length > 0) {
      maxX = Math.max(...validatedMesas.map((m) => (m.posicion?.x || 0) + (m.width || 100)), 800);
      maxY = Math.max(...validatedMesas.map((m) => (m.posicion?.y || 0) + (m.height || 80)), 600);
    }

    return { maxX, maxY };
  }, [validatedSeats, validatedMesas]);

  const stageDimensions = useMemo(() => {
    const isMobile = isMobileDevice();
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const containerHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

    if (isMobile) {
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

  const canvasConfig = useMemo(() => getCanvasConfig(), []);

  if (!mapa) {
    return <div>No map data available</div>;
  }

  // Mostrar skeleton mientras se cargan los asientos para mejorar FCP
  if (seatsLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>Sincronizando asientos...</div>
        </div>
      </div>
    );
  }

  if (seatsError) {
    logger.error('[SYNC] Error en sincronización:', seatsError);
    return <div className="text-center p-4 text-red-600">Error al cargar asientos</div>;
  }

  if (validatedSeats.length === 0) {
    return <div className="text-center p-4">No hay asientos disponibles en este mapa</div>;
  }

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
      {imagesLoading && (
        <MapLoadingProgress
          loading={imagesLoading}
          progress={imageLoadProgress}
          stage={imageLoadStage}
          showDetails={true}
        />
      )}


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
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          draggable={!isMobileDevice() || canvasConfig.listening}
          ref={stageRef}
          imageSmoothingEnabled={canvasConfig.imageSmoothingEnabled}
          hitGraphEnabled={canvasConfig.hitGraphEnabled}
          listening={canvasConfig.listening}
        >
          <BackgroundLayer
            backgroundElements={backgroundElements}
            onImageLoadProgress={handleImageLoadProgress}
          />

          <TableLayer mesas={validatedMesas} />

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

          <MapElementsLayer mapa={mapa} />
        </Stage>
      </div>
    </div>
  );
};

export default memo(SeatingMapUnified);

