import React from 'react';
import { Circle, Label, Tag, Text } from 'react-konva';

export default function SeatWithTooltip({ seat = {}, x = 0, y = 0, onClick, fill: propFill, status, blockMode = false, blockAction = null }) {
  const fill = propFill || seat.color || (seat.estado === 'reservado' ? '#666' : 'lightgreen');
  const label = seat.nombre || seat.numero || '';

  // Determine stroke color and width based on block mode
  let strokeColor = 'black';
  let strokeWidth = 1;

  if (blockMode) {
    if (blockAction === 'block') {
      strokeColor = '#ef4444'; // Red for block mode
      strokeWidth = 3;
    } else if (blockAction === 'unlock') {
      strokeColor = '#22c55e'; // Green for unlock mode
      strokeWidth = 3;
    }
  }

  return (
    <React.Fragment>
      <Circle
        x={x}
        y={y}
        radius={12}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onClick={(e) => {
          e.cancelBubble = true; // Stop propagation
          onClick && onClick(seat);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onClick && onClick(seat);
        }}
        listening={true} // Explicitly enable events
        onMouseEnter={(e) => {
          const container = e.target.getStage().container();
          container.style.cursor = 'pointer';
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage().container();
          container.style.cursor = 'default';
        }}
      />
      {label && (
        <Label x={x + 14} y={y - 10} listening={false}>
          <Tag fill="#222" opacity={0.8} cornerRadius={4} />
          <Text text={label} fontSize={11} padding={6} fill="white" />
        </Label>
      )}
    </React.Fragment>
  );
}
