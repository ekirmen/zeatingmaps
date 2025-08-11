import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Stage, Layer, Group, Circle, Rect, Text, Line } from 'react-konva';
import { useSeatLockStore } from './seatLockStore';
import { useSeatColors } from '../hooks/useSeatColors';
import { useMapaSeatsSync } from '../hooks/useMapaSeatsSync';
import SeatStatusLegend from './SeatStatusLegend';

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
  const canLockSeats = !!channel;
  const { getSeatColor, getBorderColor } = useSeatColors();
  
  // Usar hook de sincronización para obtener asientos con estado real
  const { seatsData: syncedSeats, loading: seatsLoading, error: seatsError } = useMapaSeatsSync(mapa, funcionId);

  const handleSeatClick = useCallback(
    async (seat) => {
      const seatId = seat._id;
      if (!seatId) return;

      // Para el store front, ignoramos el estado "reservado" y permitimos selección
      // Solo bloqueamos asientos que están realmente pagados
      if (seat.estado === 'pagado') {
        if (onSeatInfo) onSeatInfo(seat);
        return;
      }

      // Llamar directamente a onSeatToggle sin usar el sistema de bloqueo
      if (onSeatToggle) onSeatToggle(seat);
    },
    [onSeatToggle, onSeatInfo]
  );

  const handleTableClick = useCallback(
    async (table) => {
      const tableId = table._id;
      if (!tableId) return;

      // Llamar directamente a onTableToggle sin usar el sistema de bloqueo
      if (onTableToggle) onTableToggle(table);
    },
    [onTableToggle]
  );

     // Usar asientos sincronizados del hook
   const allSeats = syncedSeats;
   
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

     // Debug: mostrar información de sincronización
   console.log('[SYNC] Estado de sincronización:');
   console.log('- Asientos sincronizados:', syncedSeats.length);
   console.log('- Loading:', seatsLoading);
   console.log('- Error:', seatsError);
   console.log('- Zonas creadas:', validatedZonas.length);
   console.log('- Mesas encontradas:', validatedMesas.length);

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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <SeatStatusLegend />
      <Stage
        width={maxX + 50}
        height={maxY + 50}
        style={{ border: '1px solid #ccc' }}
        onWheel={handleWheel}
        draggable
        ref={stageRef}
      >
        <Layer>
          {/* Renderizar mesas primero (para que estén detrás de las sillas) */}
          {validatedMesas.map((mesa) => {
            console.log('[RENDER] Renderizando mesa:', mesa);
            
            if (mesa.shape === 'circle') {
              return (
                <Circle
                  key={`mesa_${mesa._id}`}
                  x={mesa.x || mesa.posicion?.x || 0}
                  y={mesa.y || mesa.posicion?.y || 0}
                  radius={mesa.radius || (mesa.width || 60) / 2}
                  fill="#f0f0f0"
                  stroke="#666"
                  strokeWidth={2}
                  opacity={0.8}
                />
              );
            } else if (mesa.shape === 'rect') {
              return (
                <Rect
                  key={`mesa_${mesa._id}`}
                  x={mesa.x || mesa.posicion?.x || 0}
                  y={mesa.y || mesa.posicion?.y || 0}
                  width={mesa.width || 120}
                  height={mesa.height || 80}
                  fill="#f0f0f0"
                  stroke="#666"
                  strokeWidth={2}
                  opacity={0.8}
                />
              );
            }
            return null;
          })}

          {/* Renderizar asientos */}
          {validatedSeats.map((seat) => {
            const seatColor = getSeatColor(seat);
            const borderColor = getBorderColor(seat);
            
            return (
              <Circle
                key={`seat_${seat._id}`}
                x={seat.x || seat.posicion?.x || 0}
                y={seat.y || seat.posicion?.y || 0}
                radius={seat.width ? seat.width / 2 : 10}
                fill={seatColor}
                stroke={borderColor}
                strokeWidth={2}
                onClick={() => handleSeatClick(seat)}
                onTap={() => handleSeatClick(seat)}
                style={{ cursor: 'pointer' }}
              />
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
