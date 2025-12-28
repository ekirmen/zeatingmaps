import React from 'react';
import { Layer } from 'react-konva';
import SeatWithTooltip from './SeatWithTooltipCore.jsx';

export default function SeatLayer({
  seats = [],
  onSeatClick,
  seatStates,
  getSeatColor,
  blockMode = false,
  blockAction = null
}) {
  return (
    <Layer>
      {seats.map((s, idx) => {
        const id = s.sillaId || s.id || s._id;
        const idString = String(id);

        // Intentar obtener estado con y sin prefijo de forma defensiva
        let state = null;
        try {
          if (seatStates && typeof seatStates.get === 'function') {
            state = seatStates.get(idString) || seatStates.get(`silla_${idString}`);
          } else if (seatStates && typeof seatStates === 'object') {
            state = seatStates[idString] || seatStates[`silla_${idString}`];
          }
        } catch (e) {
          // Ignorar errores de acceso
        }

        // Determinar color
        let color = s.color; // color por defecto del mapa
        if (typeof getSeatColor === 'function' && state) {
          // Crear un objeto seat temporal con el estado actualizado para obtener el color
          try {
            color = getSeatColor({ ...s, estado: state });
          } catch (e) {
            console.warn('Error calculating seat color', e);
          }
        } else if (state === 'ocupado' || state === 'vendido') {
          color = '#ff4d4f'; // Rojo fallback
        } else if (state === 'seleccionado') {
          color = '#fadb14'; // Amarillo fallback
        } else if (state === 'seleccionado_por_otro') {
          color = '#fa8c16'; // Naranja fallback
        }

        return (
          <SeatWithTooltip
            key={s._id || idx}
            seat={s}
            x={(s._computed && s._computed.x) || s.x || 0}
            y={(s._computed && s._computed.y) || s.y || 0}
            onClick={onSeatClick}
            fill={color}
            status={state}
            blockMode={blockMode}
            blockAction={blockAction}
          />
        );
      })}
    </Layer>
  );
}
