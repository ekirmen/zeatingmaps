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
  const zonas = mapa?.zonas || mapa?.contenido?.zonas || [];
  const allSeats = zonas?.flatMap((z) => z.asientos || []) || [];
  
  // Obtener mesas del mapa - manejar diferentes estructuras de datos
  const mesas = Array.isArray(mapa?.contenido) 
    ? mapa.contenido.filter(item => item.type === 'mesa') 
    : mapa?.contenido?.mesas || mapa?.contenido?.tables || [];

  // Debug: mostrar información del mapa
  console.log('Mapa recibido:', mapa);
  console.log('Zonas encontradas:', zonas);
  console.log('Asientos totales:', allSeats.length);
  console.log('Mesas encontradas:', mesas);

  const maxX = Math.max(...allSeats.map((s) => s.x + (s.ancho || 30)), 800);
  const maxY = Math.max(...allSeats.map((s) => s.y + (s.alto || 30)), 600);

  if (!mapa || !zonas || zonas.length === 0) {
    return <div>No map data available</div>;
  }

  // Create a set of found seat IDs for quick lookup
  const foundSeatIds = new Set(foundSeats.map(seat => seat._id));

  return (
    <>
      {!canLockSeats && (
        <div className="text-sm text-gray-600 mb-2">Sincronizando asientos...</div>
      )}
      <Stage width={maxX + 50} height={maxY + 50} style={{ border: '1px solid #ccc' }}>
        <Layer>
          {/* Renderizar mesas primero (para que estén detrás de las sillas) */}
          {mesas.map((mesa) => {
            // Color simple para las mesas
            let fill = '#f7fafc'; // Gris claro por defecto

            return (
              <Group key={mesa._id} x={mesa.posicion?.x || 0} y={mesa.posicion?.y || 0}>
                {mesa.shape === 'circle' ? (
                  <Circle
                    radius={mesa.radius || 50}
                    fill={fill}
                    stroke="#2d3748"
                    strokeWidth={2}
                    onClick={() => handleTableClick(mesa)}
                  />
                ) : (
                  <Rect
                    width={mesa.width || 100}
                    height={mesa.height || 80}
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
                  width={mesa.width || 100}
                  height={mesa.height || 80}
                />
              </Group>
            );
          })}

          {/* Renderizar zonas y asientos */}
          {zonas.map((zona) => (
            <Group key={zona.id}>
              <Text
                text={zona.nombre}
                x={10}
                y={(zona.asientos?.[0]?.y || 0) - 20}
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

                return (
                  <Group key={seat._id} x={seat.x} y={seat.y} onClick={() => handleSeatClick(seat)}>
                    <Rect
                      width={seat.ancho || 30}
                      height={seat.alto || 30}
                      fill={fill}
                      stroke="#2d3748"
                      strokeWidth={1}
                      cornerRadius={4}
                    />
                    <Text
                      text={seat.nombre || seat._id}
                      fontSize={10}
                      fill="#1a202c"
                      width={seat.ancho || 30}
                      height={seat.alto || 30}
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
