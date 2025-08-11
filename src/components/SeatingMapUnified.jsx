import React, { useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import { useSeatLockStore } from './seatLockStore';
import { useSeatColors } from '../hooks/useSeatColors';
import { useMapaSeatsSync } from '../hooks/useMapaSeatsSync';

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
    <>
      {!canLockSeats && (
        <div className="text-sm text-gray-600 mb-2">Sincronizando asientos...</div>
      )}
      
      {/* Mostrar información de debug */}
      <div className="text-xs text-gray-500 mb-2">
        Elementos encontrados: {mapa?.contenido?.length || 0} | 
        Zonas: {validatedZonas.length} | 
        Mesas: {validatedMesas.length} | 
        Asientos: {validatedSeats.length}
      </div>
      
      <Stage width={maxX + 50} height={maxY + 50} style={{ border: '1px solid #ccc' }}>
        <Layer>
          {/* Renderizar mesas primero (para que estén detrás de las sillas) */}
          {validatedMesas.map((mesa) => {
            // Color simple para las mesas
            let fill = '#f7fafc'; // Gris claro por defecto

            return (
              <Group key={mesa._id} x={mesa.posicion.x} y={mesa.posicion.y}>
                {mesa.shape === 'circle' ? (
                  <Circle
                    radius={mesa.radius}
                    fill={fill}
                    stroke="#2d3748"
                    strokeWidth={2}
                    onClick={() => handleTableClick(mesa)}
                  />
                ) : (
                  <Rect
                    width={mesa.width}
                    height={mesa.height}
                    fill={fill}
                    stroke="#2d3748"
                    strokeWidth={2}
                    cornerRadius={4}
                    onClick={() => handleTableClick(mesa)}
                  />
                )}
                <Text
                  text={mesa.nombre || `Mesa ${mesa._id}`}
                  fontSize={12}
                  fill="#1a202c"
                  align="center"
                  verticalAlign="middle"
                  width={mesa.width}
                  height={mesa.height}
                />
              </Group>
            );
          })}

                                         {/* Renderizar zonas y asientos */}
           {validatedZonas.map((zona) => (
             <Group key={zona.id}>
               {/* Nombre de la zona */}
               <Text
                 text={zona.nombre}
                 x={10}
                 y={(zona.asientos?.[0]?.y || zona.asientos?.[0]?.posicion?.y || 0) - 20}
                 fontSize={14}
                 fill="#2d3748"
                 fontStyle="bold"
               />
               
               {/* Renderizar asientos de la zona */}
               {zona.asientos.map(seat => {
                 // Verificar si el asiento está seleccionado usando selectedSeats
                 const isSelected = selectedSeats && selectedSeats.includes(seat._id);

                 // Usar sistema de colores automático unificado
                 let fill = getSeatColor(seat, zona, isSelected, selectedSeats);
                 
                 // Override fill if seat is found by locator search
                 if (foundSeatIds.has(seat._id)) {
                   fill = '#8b5cf6'; // 🟣 Púrpura = Encontrado por búsqueda
                 }

                 // Asegurar que el asiento tenga las propiedades x e y
                 const seatX = seat.x ?? seat.posicion?.x ?? 0;
                 const seatY = seat.y ?? seat.posicion?.y ?? 0;

                 return (
                   <Group key={seat._id} x={seatX} y={seatY} onClick={() => handleSeatClick(seat)}>
                     <Rect
                       width={seat.ancho ?? seat.width ?? 30}
                       height={seat.alto ?? seat.height ?? 30}
                       fill={fill}
                       stroke={getBorderColor(isSelected, zona)}
                       strokeWidth={isSelected ? 2 : 1}
                       cornerRadius={4}
                     />
                     <Text
                       text={seat.nombre || seat._id}
                       fontSize={10}
                       fill="#1a202c"
                       width={seat.ancho ?? seat.width ?? 30}
                       height={seat.alto ?? seat.height ?? 30}
                       align="center"
                       verticalAlign="middle"
                     />
                   </Group>
                 );
               })}
             </Group>
           ))}

          {/* Renderizar OTROS ELEMENTOS del mapa (textos, formas, líneas, etc.) */}
          {Array.isArray(mapa?.contenido) && mapa.contenido.map((elemento, index) => {
            // Solo procesar elementos que NO sean mesas o zonas (ya procesados arriba)
            if (elemento.type === 'mesa' || elemento.type === 'zona') {
              return null;
            }

            // Procesar TEXTOS
            if (elemento.type === 'texto' || elemento.text || elemento.nombre) {
              return (
                <Text
                  key={`texto_${index}`}
                  text={elemento.text || elemento.nombre || 'Texto'}
                  x={elemento.x || elemento.posicion?.x || 0}
                  y={elemento.y || elemento.posicion?.y || 0}
                  fontSize={elemento.fontSize || 12}
                  fill={elemento.color || '#2d3748'}
                  fontStyle={elemento.bold ? 'bold' : 'normal'}
                  align={elemento.align || 'left'}
                />
              );
            }

            // Procesar LÍNEAS
            if (elemento.type === 'linea' || elemento.points) {
              return (
                <Line
                  key={`linea_${index}`}
                  points={elemento.points || [0, 0, 100, 100]}
                  stroke={elemento.color || '#2d3748'}
                  strokeWidth={elemento.strokeWidth || 2}
                />
              );
            }

            // Procesar CÍRCULOS
            if (elemento.type === 'circulo' || elemento.shape === 'circle') {
              return (
                <Circle
                  key={`circulo_${index}`}
                  x={elemento.x || elemento.posicion?.x || 0}
                  y={elemento.y || elemento.posicion?.y || 0}
                  radius={elemento.radius || 20}
                  fill={elemento.fill || 'transparent'}
                  stroke={elemento.color || '#2d3748'}
                  strokeWidth={elemento.strokeWidth || 2}
                />
              );
            }

            // Procesar RECTÁNGULOS
            if (elemento.type === 'rectangulo' || elemento.shape === 'rect') {
              return (
                <Rect
                  key={`rectangulo_${index}`}
                  x={elemento.x || elemento.posicion?.x || 0}
                  y={elemento.y || elemento.posicion?.y || 0}
                  width={elemento.width || 100}
                  height={elemento.height || 50}
                  fill={elemento.fill || 'transparent'}
                  stroke={elemento.color || '#2d3748'}
                  strokeWidth={elemento.strokeWidth || 2}
                  cornerRadius={elemento.cornerRadius || 0}
                />
              );
            }

            // Procesar otros elementos genéricos
            return null;
          })}
        </Layer>
      </Stage>
    </>
  );
};

export default SeatingMapUnified;
