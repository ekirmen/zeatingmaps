import React, { useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle } from 'react-konva';
import { useSeatLockStore } from './seatLockStore';

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

  // Fetch zones from "mapa". Some backends store the zones inside
  // "mapa.contenido" while others may return them at the root level.
  let zonas = mapa?.zonas || mapa?.contenido?.zonas || [];
  let allSeats = zonas?.flatMap((z) => z.asientos || []) || [];
  
  // Si no hay zonas en la estructura esperada, intentar extraer del contenido
  if (zonas.length === 0 && Array.isArray(mapa?.contenido)) {
    console.log('Buscando zonas en contenido del mapa...');
    
    // Buscar elementos que puedan ser zonas o contener asientos
    const elementos = mapa.contenido;
    zonas = elementos.filter(item => 
      item && (item.type === 'zona' || item.asientos || item.sillas)
    );
    
    // Extraer asientos de diferentes estructuras posibles
    allSeats = elementos.flatMap(item => {
      if (item.asientos && Array.isArray(item.asientos)) {
        return item.asientos;
      }
      if (item.sillas && Array.isArray(item.sillas)) {
        return item.sillas;
      }
      if (item.type === 'silla') {
        return [item];
      }
      return [];
    });
    
    console.log('Zonas extraídas del contenido:', zonas);
    console.log('Asientos extraídos del contenido:', allSeats);
  }

  // Validar que las zonas tengan asientos válidos
  const validatedZonas = zonas
    .filter(zona => zona && zona.id && zona.asientos && Array.isArray(zona.asientos))
    .map(zona => ({
      ...zona,
      asientos: zona.asientos.filter(seat => seat && seat._id)
    }));
  
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

  // Asegurar que todos los asientos tengan las propiedades x e y
  const validatedSeats = allSeats
    .filter(seat => seat && seat._id) // Filtrar asientos válidos
    .map(seat => ({
      ...seat,
      x: seat.x ?? seat.posicion?.x ?? 0,
      y: seat.y ?? seat.posicion?.y ?? 0,
      ancho: seat.ancho ?? seat.width ?? 30,
      alto: seat.alto ?? seat.height ?? 30
    }));

  // Debug: mostrar información del mapa
  console.log('Mapa recibido:', mapa);
  console.log('Contenido del mapa:', mapa?.contenido);
  console.log('Tipo de contenido:', typeof mapa?.contenido);
  console.log('Es array:', Array.isArray(mapa?.contenido));
  console.log('Longitud del contenido:', mapa?.contenido?.length);
  console.log('Primer elemento:', mapa?.contenido?.[0]);
  console.log('Segundo elemento:', mapa?.contenido?.[1]);
  console.log('Zonas encontradas:', zonas);
  console.log('Zonas validadas:', validatedZonas);
  console.log('Asientos totales:', allSeats.length);
  console.log('Mesas encontradas:', mesas);
  console.log('Mesas validadas:', validatedMesas);
  console.log('Asientos originales:', allSeats);
  console.log('Asientos validados:', validatedSeats);

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
  
  // Si no hay zonas tradicionales pero hay asientos, continuar
  if (validatedZonas.length === 0 && allSeats.length === 0) {
    console.warn('No zones or seats found in map');
    return <div>No zones or seats found in map</div>;
  }

  // Validar que haya asientos válidos antes de continuar
  if (validatedSeats.length === 0) {
    console.warn('No valid seats found in the map');
    // No retornar error, solo mostrar mensaje
    console.log('Continuando sin asientos válidos...');
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
              <Text
                text={zona.nombre}
                x={10}
                y={(zona.asientos?.[0]?.y || zona.asientos?.[0]?.posicion?.y || 0) - 20}
                fontSize={14}
                fill="#2d3748"
              />
              {zona.asientos.map(seat => {
                // Verificar si el asiento está seleccionado usando selectedSeats
                const isSelected = selectedSeats && selectedSeats.includes(seat._id);

                // Default fill colors
                let fill = '#9ae6b4'; // Verde libre
                if (isSelected) fill = '#3182ce'; // Azul - seleccionado

                // Override fill if seat is found by locator search
                if (foundSeatIds.has(seat._id)) {
                  fill = '#38a169'; // Verde oscuro (darker green)
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
                      stroke="#2d3748"
                      strokeWidth={1}
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
        </Layer>
      </Stage>
    </>
  );
};

export default SeatingMapUnified;
