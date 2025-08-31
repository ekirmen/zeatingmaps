import React, { useRef, useCallback } from 'react';
import { Stage, Layer, Circle, Rect, Text, Line, Image } from 'react-konva';
import { useSeatLockStore } from './seatLockStore';
import { useSeatColors } from '../hooks/useSeatColors';
import { useMapaSeatsSync } from '../hooks/useMapaSeatsSync';
import SeatStatusLegend from './SeatStatusLegend';
import SeatLockDebug from './SeatLockDebug';

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
  selectedSeats = []
}) => {
  const channel = useSeatLockStore(state => state.channel);
  const lockedSeatsState = useSeatLockStore(state => state.lockedSeats);
  const { getSeatColor, getBorderColor } = useSeatColors(funcionId);
  
  // Referencia al stage de Konva
  const stageRef = useRef(null);
  
  // Usar hook de sincronización para obtener asientos con estado real
  const { seatsData: syncedSeats, loading: seatsLoading, error: seatsError } = useMapaSeatsSync(mapa, funcionId);

  const useImageLoader = (url) => {
    const [img, setImg] = React.useState(null);
    React.useEffect(() => {
      if (!url) return;
      const image = new window.Image();
      image.src = url;
      image.onload = () => setImg(image);
    }, [url]);
    return [img];
  };

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

      // Verificar que el asiento esté disponible
      if (seat.estado !== 'disponible') {
        console.warn('❌ [SEATING_MAP] Asiento no disponible:', seat.estado);
        return;
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
    [onSeatToggle, onSeatInfo]
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
  const allSeats = syncedSeats;
  
  console.log('🪑 [SEATING_MAP] Asientos sincronizados recibidos:', {
    total: allSeats.length,
    asientos: allSeats.map(s => ({
      id: s._id,
      nombre: s.nombre,
      numero: s.numero,
      zona: s.zona,
      estado: s.estado,
      posicion: s.posicion
    }))
  });
  
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
    
    console.log('🏷️ [SEATING_MAP] Zonas creadas:', zonas);
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
  
  console.log('Mesas extraídas del contenido:', mesas);
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

  // Background images
  const backgroundElements = Array.isArray(mapa?.contenido)
    ? mapa.contenido.filter(el => el.type === 'background' && el.showInWeb !== false)
    : mapa?.contenido?.elementos?.filter(el => el.type === 'background' && el.showInWeb !== false) || [];

  const BackgroundImage = ({ config }) => {
    const [img] = useImageLoader(config.imageUrl);
    if (!img) return null;
    return (
      <Image
        image={img}
        x={config.position?.x || config.posicion?.x || 0}
        y={config.position?.y || config.posicion?.y || 0}
        scaleX={config.scale || 1}
        scaleY={config.scale || 1}
        opacity={config.opacity ?? 1}
        listening={false}
      />
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SeatStatusLegend />
      <SeatLockDebug funcionId={funcionId} />
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
            <BackgroundImage key={bg._id || bg.id} config={bg} />
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

                         // Determinar estado visual según lock.status
             let seatEstado = seat.estado;
             if (locked) {
               const lock = Array.isArray(lockedSeatsState)
                 ? lockedSeatsState.find(l => l.seat_id === seat._id)
                 : null;
               const lockStatus = lock?.status || 'bloqueado';
               const isSeleccionado = String(lockStatus).toLowerCase() === 'seleccionado';
               if (isSeleccionado) {
                 seatEstado = lockedByMe ? 'seleccionado_por_mi' : 'seleccionado_por_otro';
               } else {
                 seatEstado = lockedByMe ? 'bloqueado_por_mi' : 'bloqueado_por_otro';
               }
             }

             // Debug: mostrar el estado del asiento
             console.log(`🪑 [SEAT_COLOR] Asiento ${seat._id}:`, {
               estadoOriginal: seat.estado,
               seatEstado: seatEstado,
               locked,
               lockedByMe,
               lockStatus: locked ? lockedSeatsState.find(l => l.seat_id === seat._id)?.status : null,
               lockData: locked ? lockedSeatsState.find(l => l.seat_id === seat._id) : null
             });

            const seatData = { ...seat, estado: seatEstado };
            const seatColor = getSeatColor(seatData, null, isSelected, selectedSeats);
            const borderColor = getBorderColor(isSelected, null);
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
