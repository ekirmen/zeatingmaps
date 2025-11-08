import React, { memo, useMemo } from 'react';
import { Layer } from 'react-konva';
import SeatWithTooltip from './SeatWithTooltip';

/**
 * Componente optimizado para renderizar la capa de asientos
 * Memoizado para evitar re-renders innecesarios
 */
const SeatLayer = memo(({
  seats,
  selectedSeatIds,
  seatStates,
  seatStatesMapForColor,
  validatedZonas,
  selectedSeatList,
  onSeatClick,
  getSeatColor,
  getBorderColor,
  allLockedSeats,
  blockedSeats
}) => {
  // Memoizar los asientos renderizados
  const renderedSeats = useMemo(() => {
    if (!seats || !Array.isArray(seats)) return null;

    return seats.map((seat) => {
      const seatId = (seat._id || '').toString();
      const isSelected = selectedSeatIds.has(seatId);

      // Obtener estado desde seatStates (más actualizado)
      const storeState = seatStates?.[seat._id] || 
        (seatStatesMapForColor instanceof Map ? seatStatesMapForColor.get(seat._id) : null);
      
      let seatEstado = seat.estado;
      if (storeState) {
        seatEstado = storeState;
      } else {
        // Fallback a la lógica original si no hay estado en el store
        const isLocallyBlocked = blockedSeats && blockedSeats.has && blockedSeats.has(seat._id);
        if (isLocallyBlocked) {
          seatEstado = 'locked';
        }
      }

      const seatData = { ...seat, estado: seatEstado };

      // Buscar la zona del asiento
      const seatZona = (
        Array.isArray(validatedZonas)
          ? validatedZonas.find(z => Array.isArray(z?.asientos) && z.asientos.some(a => a._id === seat._id))
          : null
      ) || (Array.isArray(validatedZonas) ? validatedZonas[0] : null);

      // Obtener colores usando la firma correcta de getSeatColor
      const seatColor = getSeatColor(
        seatData,
        seatZona,
        isSelected,
        selectedSeatList,
        allLockedSeats,
        seatStatesMapForColor
      );

      // Determinar si está seleccionado por mí basado en seatStates
      const isSelectedByMe = storeState === 'seleccionado';
      const isSelectedByOther = storeState === 'seleccionado_por_otro';

      // Obtener borderColor
      const borderColor = getBorderColor({
        isSelected: isSelectedByMe || isSelected,
        zona: seatZona,
        seatColor
      });

      const highlightStroke = (isSelectedByMe || isSelectedByOther || isSelected)
        ? seatColor
        : borderColor;
      const highlightShadowColor = (isSelectedByMe || isSelectedByOther || isSelected)
        ? seatColor
        : 'rgba(0, 0, 0, 0.3)';
      const seatName = seat.nombre || seat.numero || seat._id || 'Asiento';

      return (
        <SeatWithTooltip
          key={`seat_${seat._id}`}
          seat={seatData}
          seatColor={seatColor}
          highlightStroke={highlightStroke}
          strokeWidth={(isSelectedByMe || isSelectedByOther || isSelected) ? 3 : 2}
          shadowColor={highlightShadowColor}
          shadowBlur={(isSelectedByMe || isSelectedByOther || isSelected) ? 12 : 5}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={(isSelectedByMe || isSelectedByOther || isSelected) ? 0.45 : 0.3}
          seatName={seatName}
          onSeatClick={() => onSeatClick(seatData)}
          x={seat.x || seat.posicion?.x || 0}
          y={seat.y || seat.posicion?.y || 0}
          radius={seat.width ? seat.width / 2 : 10}
        />
      );
    });
  }, [
    seats,
    selectedSeatIds,
    seatStates,
    seatStatesMapForColor,
    validatedZonas,
    selectedSeatList,
    onSeatClick,
    getSeatColor,
    getBorderColor,
    allLockedSeats,
    blockedSeats
  ]);

  return <Layer>{renderedSeats}</Layer>;
});

SeatLayer.displayName = 'SeatLayer';

export default SeatLayer;
