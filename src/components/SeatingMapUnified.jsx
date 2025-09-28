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
// import VisualNotifications from '../utils/VisualNotifications'; // Removido por no usarse
import resolveImageUrl from '../utils/resolveImageUrl';

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
    
    return url;
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
      console.error('Error cargando imagen de fondo:', error);
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
  // Estado para controles de zoom
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
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
  const lockedSeatsState = useSeatLockStore(state => state.lockedSeats);
  const setMapa = useSeatLockStore(state => state.setMapa);
  const seatStates = useSeatLockStore(state => state.seatStates);
  const subscribeToFunction = useSeatLockStore(state => state.subscribeToFunction);
  const unsubscribe = useSeatLockStore(state => state.unsubscribe);
  const { getSeatColor, getBorderColor } = useSeatColors(funcionId);

  // Suscribirse a cambios en tiempo real cuando el componente se monta
  useEffect(() => {
    if (funcionId && subscribeToFunction) {
      console.log('🔔 [SEATING_MAP] Suscribiéndose a función:', funcionId);
      subscribeToFunction(funcionId);
    }

    return () => {
      if (unsubscribe) {
        console.log('🔔 [SEATING_MAP] Desuscribiéndose de función:', funcionId);
        unsubscribe();
      }
    };
  }, [funcionId, subscribeToFunction, unsubscribe]);

  const selectedSeatIds = useMemo(() => {
    console.log('🔍 [SEATING_MAP] Debug modoVenta:', { modoVenta, tipo: typeof modoVenta });
    // Si estamos en modo boletería (modoVenta=true), usar selectedSeats de las props
    if (modoVenta) {
      let propSeatIds = [];
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
      console.log('🎯 [SEATING_MAP] Modo boletería - selectedSeatIds:', propSeatIds);
      return new Set(propSeatIds);
    }
    
    // Modo store: usar el carrito directamente para determinar asientos seleccionados
    const cartItems = useCartStore.getState().items || [];
    const cartSeatIds = cartItems.map(item => (item.sillaId || item.id || item._id)?.toString()).filter(Boolean);
    
    // También incluir selectedSeats de las props como fallback
    let propSeatIds = [];
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
    
    // Combinar ambos (carrito tiene prioridad)
    const allSeatIds = [...new Set([...cartSeatIds, ...propSeatIds])];
    console.log('🎯 [SEATING_MAP] Modo store - selectedSeatIds calculado:', {
      cartSeatIds,
      propSeatIds,
      allSeatIds
    });
    return new Set(allSeatIds);
  }, [selectedSeats, modoVenta]);

  const selectedSeatList = useMemo(() => Array.from(selectedSeatIds), [selectedSeatIds]);

  // Combinar locks temporales del store con locks permanentes de la BD
  const allLockedSeats = useMemo(() => {
    const tempLocks = lockedSeatsState || [];
    const permanentLocks = lockedSeats || [];
    
    // console.log('🎫 [SEATING_MAP] Temp locks:', tempLocks.length);
    // console.log('🎫 [SEATING_MAP] Permanent locks:', permanentLocks.length);
    // console.log('🎫 [SEATING_MAP] Permanent locks data:', permanentLocks);
    
    // Crear un mapa para evitar duplicados
    const lockMap = new Map();
    
    // Agregar locks temporales primero (tienen prioridad)
    tempLocks.forEach(lock => {
      lockMap.set(lock.seat_id, lock);
    });
    
    // Agregar locks permanentes si no existen temporales
    permanentLocks.forEach(lock => {
      if (!lockMap.has(lock.seat_id)) {
        lockMap.set(lock.seat_id, lock);
      }
    });
    
    const result = Array.from(lockMap.values());
    // console.log('🎫 [SEATING_MAP] Combined locks:', result.length);
    return result;
  }, [lockedSeatsState, lockedSeats]);

  // Controlar visibilidad del panel de depuración de locks (oculto por defecto)
  const shouldShowSeatLockDebug =
    typeof window !== 'undefined' && window.__SHOW_SEAT_LOCK_DEBUG === true;
  
  // Referencia al stage de Konva
  const stageRef = useRef(null);
  
  // Usar hook de sincronización para obtener asientos con estado real
  // SOLO usar el mapa original para evitar re-renders innecesarios
  // El storeMapa se usa solo para actualizaciones de estado de asientos individuales
  const { seatsData: syncedSeats, loading: seatsLoading, error: seatsError } = useMapaSeatsSync(mapa, funcionId);
  
  // Combinar asientos del mapa original con estados actualizados del store
  const memoizedSeats = useMemo(() => {
    if (!syncedSeats) return syncedSeats;
    
    // Actualizar estados de asientos con la información del store
    return syncedSeats.map(seat => {
      const updatedState = seatStates?.get(seat._id);
      if (updatedState && updatedState !== seat.estado) {
        return { ...seat, estado: updatedState };
      }
      // Si el asiento fue eliminado del seatStates, restaurar su estado original
      if (seatStates && !seatStates.has(seat._id) && seat.estado !== 'disponible') {
        return { ...seat, estado: 'disponible' };
      }
      return seat;
    });
  }, [syncedSeats, seatStates]);

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
            console.warn('Error precargando imagen de fondo:', err);
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
      console.log('🪑 [SEATING_MAP] ===== ASIENTO CLICKEADO =====');
      console.log('🪑 [SEATING_MAP] Asiento clickeado:', {
        id: seat._id,
        nombre: seat.nombre,
        numero: seat.numero,
        zona: seat.zona,
        estado: seat.estado,
        posicion: seat.posicion
      });

      // Verificar que el asiento sea válido
      if (!seat || !seat._id) {
        console.warn('❌ [SEATING_MAP] Asiento inválido:', seat);
        return;
      }

      // En modo store, delegar completamente al onSeatToggle
      if (!modoVenta) {
        console.log('🛒 [SEATING_MAP] Modo store - delegando a onSeatToggle');
        if (onSeatToggle) {
          onSeatToggle({ ...seat, funcionId });
        }
        if (onSeatInfo) onSeatInfo(seat);
        return;
      }

      // Verificar si está seleccionado por otro usuario
      const isSelectedByOther = seat.estado === 'seleccionado_por_otro';
      if (isSelectedByOther) {
        console.warn('❌ [SEATING_MAP] Asiento seleccionado por otro usuario, no se puede interactuar');
        // Mostrar mensaje al usuario
        if (onSeatError) {
          onSeatError('Este asiento está siendo seleccionado por otro usuario. Por favor, elige otro asiento.');
        }
        return;
      }

      // Verificar si está bloqueado localmente (desde props)
      const isLocallyBlocked = blockedSeats && blockedSeats.has && blockedSeats.has(seat._id);
      if (isLocallyBlocked) {
        console.warn('❌ [SEATING_MAP] Asiento bloqueado localmente, no se puede seleccionar');
        return;
      }

      // Verificar si está vendido, reservado o bloqueado permanentemente
      if (seat.estado === 'vendido' || seat.estado === 'reservado' || seat.estado === 'locked') {
        console.warn('❌ [SEATING_MAP] Asiento no disponible para selección:', seat.estado);
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
        const paymentCheck = await seatPaymentChecker.isSeatPaidByUser(seat._id, funcionId, currentSessionId);
        
        if (paymentCheck.isPaid) {
          console.log('🚫 [SEATING_MAP] No se puede deseleccionar asiento comprado:', seat._id);
          if (onSeatError) {
            onSeatError('Este asiento ya ha sido comprado y no puede ser deseleccionado');
          }
          return;
        }
        
        console.log('🔄 [SEATING_MAP] Deseleccionando asiento:', seat._id);
        if (onSeatToggle) {
          onSeatToggle({ ...seat, funcionId });
        }
      } else {
        // SELECCIONAR: Solo verificar que no esté comprado o bloqueado por otro
        const currentSessionId = localStorage.getItem('anonSessionId');
        const paymentCheck = await seatPaymentChecker.isSeatPaidByUser(seat._id, funcionId, currentSessionId);
        
        if (paymentCheck.isPaid) {
          console.log('🚫 [SEATING_MAP] Asiento ya pagado:', seat._id);
          if (onSeatError) {
            onSeatError('Este asiento ya ha sido comprado');
          }
          return;
        }
        
        // Verificar si está bloqueado por otro usuario
        if (seat.estado === 'seleccionado_por_otro' || seat.estado === 'vendido' || seat.estado === 'reservado') {
          console.log('🚫 [SEATING_MAP] Asiento no disponible:', seat.estado);
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
        
        console.log('✅ [SEATING_MAP] Seleccionando asiento:', seat._id);
        if (onSeatToggle) {
          onSeatToggle({ ...seat, funcionId });
        }
      }

      // Llamar a la función de información del asiento si existe
      if (onSeatInfo) onSeatInfo(seat);
    },
    [onSeatToggle, onSeatInfo, onSeatError, selectedSeatIds, funcionId, blockedSeats, modoVenta]
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
  
  // Obtener mesas del mapa - CORREGIR ESTA LÓGICA
let mesas = [];
if (Array.isArray(mapa?.contenido)) {
  mesas = mapa.contenido.filter(item => {
    // Un elemento es una mesa si tiene nombre, shape y _id
    return item && item._id && item.nombre && item.shape;
  });
  
  // Log removido para evitar spam en consola
} else {
  // Si es un objeto, buscar la propiedad 'elementos'
  const elementos = Array.isArray(mapa?.contenido) 
    ? mapa.contenido 
    : mapa?.contenido?.elementos || [];
  
  // Filtrar solo las mesas de los elementos
  mesas = elementos.filter(el => el && el.type === 'mesa');
}

  // Validar y normalizar las mesas
  const validatedMesas = mesas
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
    }));

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
     console.error('[SYNC] Error en sincronización:', seatsError);
     return <div className="text-center p-4 text-red-600">Error al cargar asientos</div>;
   }

   // Si no hay asientos sincronizados, mostrar mensaje
   if (validatedSeats.length === 0) {
     return <div className="text-center p-4">No hay asientos disponibles en este mapa</div>;
   }

  // Validar que haya mesas válidas
  if (validatedMesas.length === 0) {
    console.warn('No valid tables found in the map');
  }

  // Create a set of found seat IDs for quick lookup

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SeatStatusLegend />
      {shouldShowSeatLockDebug && <SeatLockDebug funcionId={funcionId} />}
      
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

      <Stage
        width={maxX + 50}
        height={maxY + 50}
        style={{ border: '1px solid #ccc' }}
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
            const lockedByMe = isSeatLockedByMe ? isSeatLockedByMe(seat._id, funcionId) : false;

            // Determinar estado visual - priorizar seatStates del store para sincronización en tiempo real
            let seatEstado = seat.estado;
            
            // Verificar si hay un estado actualizado en el store (tiempo real)
            const storeState = seatStates.get(seat._id);
            if (storeState) {
              console.log('🎨 [SEATING_MAP] Usando estado del store para asiento:', {
                seatId: seat._id,
                storeState,
                originalState: seat.estado
              });
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
            
            const seatColor = getSeatColor(
              seatData,
              seatZona,
              isSelected,
              selectedSeatList,
              allLockedSeats,
              seatStates
            );
            const borderColor = getBorderColor(isSelected, seatZona);
            const seatName = seat.nombre || seat.numero || seat._id || 'Asiento';

            return (
              <React.Fragment key={`seat_${seat._id}`}>
                {/* Asiento */}
                <Circle
                  x={seat.x || seat.posicion?.x || 0}
                  y={seat.y || seat.posicion?.y || 0}
                  radius={seat.width ? seat.width / 2 : 10}
                  fill={seatColor}
                  stroke={isSelected ? '#ffd700' : borderColor}
                  strokeWidth={isSelected ? 4 : 2}
                  shadowColor={isSelected ? 'rgba(255, 215, 0, 0.8)' : 'rgba(0,0,0,0.3)'}
                  shadowBlur={isSelected ? 15 : 5}
                  shadowOffset={{ x: 2, y: 2 }}
                  shadowOpacity={isSelected ? 0.8 : 0.3}
                  onClick={() => handleSeatClick(seatData)}
                  onTap={() => handleSeatClick(seatData)}
                  style={{ cursor: 'pointer' }}
                />

                {/* Nombre del asiento centrado en el círculo */}
                <Text
                  x={(seat.x || seat.posicion?.x || 0) - 10}
                  y={(seat.y || seat.posicion?.y || 0) - 6}
                  text={seatName}
                  fontSize={10}
                  fill="#333"
                  fontFamily="Arial"
                  align="center"
                  width={20}
                  onClick={() => handleSeatClick(seatData)}
                  onTap={() => handleSeatClick(seatData)}
                  style={{ cursor: 'pointer' }}
                />
              </React.Fragment>
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
  );
};

export default memo(SeatingMapUnified);
