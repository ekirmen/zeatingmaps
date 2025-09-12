import React, { useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Circle, Rect, Text, Line, Image } from 'react-konva';
import { useSeatLockStore } from './seatLockStore';
import { useSeatColors } from '../hooks/useSeatColors';
import { useMapaSeatsSync } from '../hooks/useMapaSeatsSync';
import SeatStatusLegend from './SeatStatusLegend';
import SeatLockDebug from './SeatLockDebug';
import VisualNotifications from '../utils/VisualNotifications';
import resolveImageUrl from '../utils/resolveImageUrl';

const SeatingMapUnified = ({
  funcionId,
  mapa,
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
  foundSeats = [],
  selectedSeats = [],
  lockedSeats = []
}) => {
  const channel = useSeatLockStore(state => state.channel);
  const lockedSeatsState = useSeatLockStore(state => state.lockedSeats);
  const { getSeatColor, getBorderColor } = useSeatColors(funcionId);

  // Combinar locks temporales del store con locks permanentes de la BD
  const allLockedSeats = useMemo(() => {
    const tempLocks = lockedSeatsState || [];
    const permanentLocks = lockedSeats || [];
    
    console.log('🎫 [SEATING_MAP] Temp locks:', tempLocks.length);
    console.log('🎫 [SEATING_MAP] Permanent locks:', permanentLocks.length);
    console.log('🎫 [SEATING_MAP] Permanent locks data:', permanentLocks);
    
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
    console.log('🎫 [SEATING_MAP] Combined locks:', result.length);
    return result;
  }, [lockedSeatsState, lockedSeats]);

  // Controlar visibilidad del panel de depuración de locks (oculto por defecto)
  const shouldShowSeatLockDebug =
    typeof window !== 'undefined' && window.__SHOW_SEAT_LOCK_DEBUG === true;
  
  // Referencia al stage de Konva
  const stageRef = useRef(null);
  
  // Usar hook de sincronización para obtener asientos con estado real
  const { seatsData: syncedSeats, loading: seatsLoading, error: seatsError } = useMapaSeatsSync(mapa, funcionId);
  
  // Memoizar los asientos sincronizados para evitar re-renders innecesarios
  const memoizedSeats = useMemo(() => syncedSeats, [syncedSeats]);

  // Background images - memoized to prevent unnecessary re-renders (moved before any returns)
  const backgroundElements = useMemo(() => {
    if (!mapa) return [];
    return Array.isArray(mapa?.contenido)
      ? mapa.contenido.filter(el => el.type === 'background' && el.showInWeb !== false)
      : mapa?.contenido?.elementos?.filter(el => el.type === 'background' && el.showInWeb !== false) || [];
  }, [mapa?.contenido]);

  const [mapImage, setMapImage] = React.useState(null);
  
  React.useEffect(() => {
    if (!mapa?.imagen_fondo) {
      setMapImage(null);
      return;
    }
    
    const url = resolveImageUrl(mapa.imagen_fondo);
    
    // Verificar si la imagen ya está en cache
    const cachedImage = new window.Image();
    cachedImage.src = url;
    
    if (cachedImage.complete) {
      setMapImage(cachedImage);
      return;
    }
    
    const image = new window.Image();
    // Habilitar cache de CDN y uso de canvas seguro
    image.crossOrigin = 'anonymous';
    image.loading = 'lazy'; // Lazy loading para mejor rendimiento
    
    const handleLoad = () => {
      setMapImage(image);
    };
    
    const handleError = () => {
      console.warn('Error loading background image:', url);
      setMapImage(null);
    };
    
    image.addEventListener('load', handleLoad);
    image.addEventListener('error', handleError);
    
    image.src = url;
    
    return () => {
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', handleError);
    };
  }, [mapa?.imagen_fondo]);

  const handleSeatClick = useCallback(
    (seat) => {
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

      // Verificar si está seleccionado por otro usuario
      const isSelectedByOther = seat.estado === 'seleccionado_por_otro';
      if (isSelectedByOther) {
        console.warn('❌ [SEATING_MAP] Asiento seleccionado por otro usuario, no se puede interactuar');
        // Aquí podrías mostrar un mensaje al usuario
        return;
      }

      // Verificar si está vendido o reservado
      if (seat.estado === 'vendido' || seat.estado === 'reservado') {
        console.warn('❌ [SEATING_MAP] Asiento vendido o reservado:', seat.estado);
        return;
      }

      // Verificar si está seleccionado por el usuario actual
      const isSelectedByMe = selectedSeats.includes(seat._id);
      
      // Permitir deseleccionar si está seleccionado por mí
      if (isSelectedByMe) {
        console.log('🔄 [SEATING_MAP] Deseleccionando asiento:', seat._id);
      } else {
        // Solo permitir seleccionar si está disponible
        if (seat.estado !== 'disponible') {
          console.warn('❌ [SEATING_MAP] Asiento no disponible para selección:', seat.estado);
          return;
        }
        console.log('✅ [SEATING_MAP] Seleccionando asiento:', seat._id);
      }

      // Llamar a la función de toggle del asiento
      if (onSeatToggle) {
        console.log('✅ [SEATING_MAP] Llamando a onSeatToggle con asiento:', seat);
        onSeatToggle({ ...seat, funcionId });
      } else {
        console.warn('⚠️ [SEATING_MAP] onSeatToggle no está definido');
      }

      // Llamar a la función de información del asiento si existe
      if (onSeatInfo) onSeatInfo(seat);
    },
    [onSeatToggle, onSeatInfo, selectedSeats, funcionId]
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
  
  // Debug: mostrar información de los asientos
  console.log('🔍 [SEATING_MAP] Asientos del hook:', allSeats.length);
  console.log('🔍 [SEATING_MAP] Primeros 3 asientos:', allSeats.slice(0, 3));
  console.log('🔍 [SEATING_MAP] Mapa contenido:', mapa?.contenido?.length);
  console.log('🔍 [SEATING_MAP] Primeros 3 elementos del mapa:', mapa?.contenido?.slice(0, 3));
  
  // Crear zonas basadas en los asientos sincronizados
  const zonas = [];
  if (allSeats.length > 0) {
    // Agrupar asientos por zona
    const zonasMap = new Map();
    
    allSeats.forEach(seat => {
      const zonaId = seat.zonaId || 'zona_principal';
      if (!zonasMap.has(zonaId)) {
        zonasMap.set(zonaId, {
          id: zonaId,
          nombre: `Zona ${zonaId}`,
          color: '#4CAF50',
          asientos: []
        });
      }
      zonasMap.get(zonaId).asientos.push(seat);
    });
    
    zonas.push(...zonasMap.values());
    
    // Log removido para evitar spam en consola
  }

           // Usar zonas creadas directamente
    const validatedZonas = zonas;
  
  // Obtener mesas del mapa - CORREGIR ESTA LÓGICA
let mesas = [];
if (Array.isArray(mapa?.contenido)) {
  mesas = mapa.contenido.filter(item => {
    // Un elemento es una mesa si tiene nombre, shape y _id
    return item && item._id && item.nombre && item.shape;
  });
  
  // Log removido para evitar spam en consola
} else {
  mesas = mapa?.contenido?.mesas || mapa?.contenido?.tables || [];
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
  const foundSeatIds = new Set(foundSeats.map(seat => seat._id));

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

    const [bgImg, setBgImg] = React.useState(null);

    React.useEffect(() => {
      if (!rawUrl) {
        setBgImg(null);
        return;
      }
      const image = new window.Image();
      image.crossOrigin = 'anonymous';
      image.loading = 'lazy';
      const onLoad = () => setBgImg(image);
      const onError = () => setBgImg(null);
      image.addEventListener('load', onLoad);
      image.addEventListener('error', onError);
      image.src = rawUrl;
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SeatStatusLegend />
      {shouldShowSeatLockDebug && <SeatLockDebug funcionId={funcionId} />}
      <Stage
        width={maxX + 50}
        height={maxY + 50}
        style={{ border: '1px solid #ccc' }}
        onWheel={handleWheel}
        draggable
        ref={stageRef}
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
            const isSelected = selectedSeats.includes(seat._id);
            const locked = isSeatLocked ? isSeatLocked(seat._id) : false;
            const lockedByMe = isSeatLockedByMe ? isSeatLockedByMe(seat._id) : false;

                         // Determinar estado visual según lock.status (consistente con boleteria)
             let seatEstado = seat.estado;
             if (locked) {
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

             // Debug: mostrar el estado del asiento (actualizado con nuevos estados)
             const lockData = locked ? allLockedSeats.find(l => l.seat_id === seat._id) : null;
             console.log(`🪑 [SEAT_COLOR] Asiento ${seat._id}:`, {
               estadoOriginal: seat.estado,
               seatEstado: seatEstado,
               locked,
               lockedByMe,
               lockStatus: lockData?.status || null,
               lockType: lockData?.lock_type || null,
               locator: lockData?.locator || null,
               expiresAt: lockData?.expires_at || null,
               isPermanent: lockData?.status === 'locked' || lockData?.status === 'vendido' || lockData?.status === 'reservado' || lockData?.status === 'anulado',
               isTemporary: lockData?.status === 'seleccionado',
               lockData: lockData
             });

            const seatData = { ...seat, estado: seatEstado };
            
            // Buscar la zona del asiento
            const seatZona = zonas.find(z => z.asientos.some(a => a._id === seat._id)) || zonas[0];
            
            const seatColor = getSeatColor(seatData, seatZona, isSelected, selectedSeats, allLockedSeats);
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
                  stroke={borderColor}
                  strokeWidth={2}
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
          {mapa?.contenido?.map((elemento, index) => {
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

export default SeatingMapUnified;
