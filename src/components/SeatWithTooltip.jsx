import React, { useState, useRef, useEffect } from 'react';
import { Circle, Text, Group } from 'react-konva';

/**
 * Componente de asiento con tooltip de precio
 * Maneja el estado del tooltip internamente
 */
const SeatWithTooltip = ({
  seat,
  seatColor,
  highlightStroke,
  strokeWidth,
  shadowColor,
  shadowBlur,
  shadowOffset,
  shadowOpacity,
  seatName,
  onSeatClick,
  x,
  y,
  radius = 10
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);

  const handleMouseEnter = (e) => {
    const stage = e.target.getStage();
    if (stage && seat.precio) {
      const container = stage.container();
      const rect = container.getBoundingClientRect();
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        setTooltipPos({
          x: rect.left + pointerPos.x,
          y: rect.top + pointerPos.y - 60
        });
        setTooltipVisible(true);
      }
    }
  };

  const handleMouseLeave = () => {
    setTooltipVisible(false);
  };

  const handleMouseMove = (e) => {
    if (tooltipVisible) {
      const stage = e.target.getStage();
      if (stage) {
        const container = stage.container();
        const rect = container.getBoundingClientRect();
        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          setTooltipPos({
            x: rect.left + pointerPos.x,
            y: rect.top + pointerPos.y - 60
          });
        }
      }
    }
  };

  // Actualizar posición del tooltip cuando cambia
  useEffect(() => {
    if (tooltipVisible && tooltipRef.current) {
      tooltipRef.current.style.left = `${tooltipPos.x}px`;
      tooltipRef.current.style.top = `${tooltipPos.y}px`;
    }
  }, [tooltipPos, tooltipVisible]);

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
      {tooltipVisible && seat.precio && (
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            zIndex: 10000,
            pointerEvents: 'none',
            transform: 'translate(-50%, 0)',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'opacity 0.2s'
          }}
        >
          <div style={{ fontWeight: 600 }}>{seatName}</div>
          <div style={{ color: '#d1d5db', fontSize: '11px' }}>
            {seat.nombreZona || seat.zona?.nombre || 'General'}
          </div>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
            ${(seat.precio || 0).toFixed(2)}
          </div>
        </div>
      )}
    </>
  );
};

export default SeatWithTooltip;

