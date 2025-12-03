import React from 'react';
import { Stage, Layer, Circle, Rect, Text, Group } from 'react-konva';

// Canvas-only component. This file is imported lazily so `react-konva` lands
// in a separate chunk from the main app bundle.
export default function SelectSeatsCanvas(props) {
  const {
    mapElements = [],
    stageSize = { width: 0, height: 0 },
    funcionId,
    lockedSeats = [],
    getSeatState,
    currentSessionId,
    toggleSeatSelection,
    mapa = {}
  } = props;

  return (
    <Stage width={stageSize.width} height={stageSize.height}>
      <Layer>
        {mapElements.map((elemento, idx) => {
          if (elemento.type === 'zona' || elemento.type === 'grada' || elemento.type === 'fila') {
            const { posicion = {}, dimensiones = {}, nombre, estado, color } = elemento;
            const overlayColor =
              estado === 'reservado'
                ? '#666'
                : estado === 'pagado'
                ? '#999'
                : estado === 'bloqueado'
                ? 'orange'
                : color || 'rgba(0, 128, 0, 0.35)';

            return (
              <Group key={elemento._id || idx}>
                <Rect
                  x={posicion.x || 0}
                  y={posicion.y || 0}
                  width={dimensiones.ancho || dimensiones.width || 60}
                  height={dimensiones.alto || dimensiones.height || 40}
                  fill={overlayColor}
                  stroke="black"
                  strokeWidth={1}
                  cornerRadius={4}
                />
                {nombre && (
                  <Text
                    x={(posicion.x || 0) + 6}
                    y={(posicion.y || 0) + 6}
                    text={nombre}
                    fontSize={12}
                    fill="black"
                  />
                )}
              </Group>
            );
          }

          if (elemento.type === 'mesa') {
            const mesa = elemento;
            return (
              <React.Fragment key={mesa._id || idx}>
                <Circle
                  x={mesa.posicion?.x || 0}
                  y={mesa.posicion?.y || 0}
                  radius={30}
                  fill={mesa.color || 'green'}
                  stroke="black"
                  strokeWidth={2}
                />
                <Text
                  x={(mesa.posicion?.x || 0) - 30}
                  y={(mesa.posicion?.y || 0) - 10}
                  text={mesa.nombre || `Mesa ${idx + 1}`}
                  fontSize={14}
                  fill="black"
                  align="center"
                />

                {mesa.sillas &&
                  mesa.sillas.map((silla, sillaIndex) => {
                    const computed = silla._computed || {};
                    const x = computed.x ?? (mesa.posicion?.x || 0) + Math.cos((sillaIndex * Math.PI * 2) / mesa.sillas.length) * 50;
                    const y = computed.y ?? (mesa.posicion?.y || 0) + Math.sin((sillaIndex * Math.PI * 2) / mesa.sillas.length) * 50;

                    const isLockedByMe = lockedSeats.some(
                      (lock) =>
                        lock.seat_id === silla._id && lock.funcion_id === funcionId && lock.session_id === currentSessionId
                    );
                    const isLocked = lockedSeats.some((lock) => lock.seat_id === silla._id);
                    const seatEstado = silla.estado || (getSeatState ? getSeatState(silla._id) : undefined);

                    const fillColor = isLockedByMe
                      ? 'blue'
                      : isLocked
                      ? 'orange'
                      : seatEstado === 'reservado'
                      ? '#555'
                      : seatEstado === 'pagado'
                      ? 'gray'
                      : silla.color || 'lightblue';

                    return (
                      <React.Fragment key={silla._id || sillaIndex}>
                        <Circle
                          x={x}
                          y={y}
                          radius={10}
                          fill={fillColor}
                          stroke="black"
                          strokeWidth={1}
                          onClick={() => toggleSeatSelection(silla)}
                        />
                        <Text x={x - 10} y={y - 6} text={`${sillaIndex + 1}`} fontSize={12} fill="black" align="center" width={20} />
                      </React.Fragment>
                    );
                  })}
              </React.Fragment>
            );
          }

          return null;
        })}
      </Layer>
    </Stage>
  );
}
