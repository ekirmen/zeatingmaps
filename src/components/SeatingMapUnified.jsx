import React, { useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { useSeatLockStore } from './seatLockStore';

const SeatingMapUnified = ({
  funcionId,
  mapa,
  lockSeat,
  unlockSeat,
  isSeatLocked,
  isSeatLockedByMe,
  onSeatToggle,
}) => {
  const channel = useSeatLockStore(state => state.channel);
  const canLockSeats = !!channel;

  const handleSeatClick = useCallback(
    async (seat) => {
      if (!canLockSeats) {
        alert('Sincronizando disponibilidad...');
        return;
      }

      const seatId = seat._id;
      if (!seatId) return;

      if (isSeatLocked(seatId) && !isSeatLockedByMe(seatId)) {
        alert('Asiento bloqueado por otro usuario.');
        return;
      }

      const result = isSeatLocked(seatId)
        ? await unlockSeat(seatId)
        : await lockSeat(seatId);

      if (result) onSeatToggle(seat);
    },
    [canLockSeats, lockSeat, unlockSeat, isSeatLocked, isSeatLockedByMe, onSeatToggle]
  );

  const zonas = mapa?.contenido?.zonas || [];
  const allSeats = zonas.flatMap(z => z.asientos || []);

  const maxX = Math.max(...allSeats.map(s => s.x + (s.ancho || 30)), 800);
  const maxY = Math.max(...allSeats.map(s => s.y + (s.alto || 30)), 600);

  if (!mapa || !mapa.zonas) {
    return <div>No map data available</div>;
  }

  return (
    <>
      {!canLockSeats && (
        <div className="text-sm text-gray-600 mb-2">Sincronizando asientos...</div>
      )}
      <Stage width={maxX + 50} height={maxY + 50} style={{ border: '1px solid #ccc' }}>
        <Layer>
          {mapa.zonas.map(zona => (
            <Group key={zona.id}>
              <Text
                text={zona.nombre}
                x={10}
                y={(zona.asientos?.[0]?.y || 0) - 20}
                fontSize={14}
                fill="#2d3748"
              />
              {zona.asientos.map(seat => {
                const locked = isSeatLocked(seat._id);
                const mine = isSeatLockedByMe(seat._id);

                let fill = '#9ae6b4'; // Verde libre
                if (locked && mine) fill = '#f6ad55'; // Naranja
                else if (locked) fill = '#fc8181'; // Rojo

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
