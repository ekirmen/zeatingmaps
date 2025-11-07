import React, { useState } from 'react';
import { Circle, Text, Group } from 'react-konva';
import { SeatPriceTooltip } from './SeatPriceTooltip';

/**
 * Componente de asiento con tooltip de precio integrado
 * Wrapper para Konva Circle que muestra tooltip en HTML sobre el canvas
 */
const SeatCircleWithTooltip = ({
  seat,
  funcionId,
  seatColor,
  highlightStroke,
  strokeWidth,
  shadowColor,
  shadowBlur,
  shadowOffset,
  shadowOpacity,
  seatName,
  isSelectedByMe,
  isSelectedByOther,
  isSelected,
  onSeatClick,
  x,
  y,
  radius = 10
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Calcular posición del tooltip basada en la posición del círculo en la pantalla
  const handleMouseEnter = (e) => {
    const stage = e.target.getStage();
    if (stage) {
      const container = stage.container();
      const rect = container.getBoundingClientRect();
      const stageBox = stage.getPointerPosition();
      
      setTooltipPosition({
        x: rect.left + (stageBox?.x || 0),
        y: rect.top + (stageBox?.y || 0) - 50
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleMouseMove = (e) => {
    if (showTooltip) {
      const stage = e.target.getStage();
      if (stage) {
        const container = stage.container();
        const rect = container.getBoundingClientRect();
        const stageBox = stage.getPointerPosition();
        
        setTooltipPosition({
          x: rect.left + (stageBox?.x || 0),
          y: rect.top + (stageBox?.y || 0) - 50
        });
      }
    }
  };

  return (
    <>
      <Group
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <Circle
          x={x}
          y={y}
          radius={radius}
          fill={seatColor}
          stroke={highlightStroke}
          strokeWidth={strokeWidth}
          shadowColor={shadowColor}
          shadowBlur={shadowBlur}
          shadowOffset={shadowOffset}
          shadowOpacity={shadowOpacity}
          onClick={onSeatClick}
          onTap={onSeatClick}
          style={{ cursor: 'pointer' }}
        />
        <Text
          x={x - 10}
          y={y - 6}
          text={seatName}
          fontSize={10}
          fill="#333"
          fontFamily="Arial"
          align="center"
          width={20}
          onClick={onSeatClick}
          onTap={onSeatClick}
          style={{ cursor: 'pointer' }}
        />
      </Group>
      
      {/* Tooltip HTML overlay */}
      {showTooltip && seat.precio && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 10000,
            pointerEvents: 'none',
            transform: 'translate(-50%, -100%)'
          }}
        >
          <SeatPriceTooltip seat={seat} funcionId={funcionId}>
            <div style={{ display: 'none' }} />
          </SeatPriceTooltip>
        </div>
      )}
    </>
  );
};

export default SeatCircleWithTooltip;

