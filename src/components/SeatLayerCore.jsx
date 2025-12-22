import React from 'react';
import { Layer } from 'react-konva';
import SeatWithTooltip from './SeatWithTooltipCore.jsx';

export default function SeatLayer({
  seats = [],
  onSeatClick,
  seatStates,
  getSeatColor
}) {
  return (
    <Layer>
      {seats.map((s, idx) => {
        const id = s.sillaId || s.id || s._id;
        const idString = String(id);

        // Intentar obtener estado con y sin prefijo
        let state = null;
        if (seatStates) {
          state = seatStates.get(idString) || seatStates.get(`silla_${idString}`);
        }

        // Determinar color
        let color = s.color; // color por defecto del mapa
        if (getSeatColor && state) {
          // Crear un objeto seat temporal con el estado actualizado para obtener el color
          color = getSeatColor({ ...s, estado: state });
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
          />
        );
      })}
    </Layer>
  );
}
