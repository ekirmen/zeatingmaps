import React from 'react';
import { Circle, Label, Tag, Text } from 'react-konva';

export default function SeatWithTooltip({ seat = {}, x = 0, y = 0, onClick, fill: propFill, status }) {
  const fill = propFill || seat.color || (seat.estado === 'reservado' ? '#666' : 'lightgreen');
  const label = seat.nombre || seat.numero || '';

  return (
    <React.Fragment>
      <Circle
        x={x}
        y={y}
        radius={12}
        fill={fill}
        stroke="black"
        strokeWidth={1}
        onClick={() => onClick && onClick(seat)}
        onTap={() => onClick && onClick(seat)}
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
        <Label x={x + 14} y={y - 10}>
          <Tag fill="#222" opacity={0.8} cornerRadius={4} />
          <Text text={label} fontSize={11} padding={6} fill="white" />
        </Label>
      )}
    </React.Fragment>
  );
}
