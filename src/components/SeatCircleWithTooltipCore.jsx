import React from 'react';
import { Circle, Label, Tag, Text } from 'react-konva';

export default function SeatCircleWithTooltip({ x = 0, y = 0, radius = 10, fill = 'lightblue', tooltip }) {
  return (
    <React.Fragment>
      <Circle x={x} y={y} radius={radius} fill={fill} stroke="black" strokeWidth={1} />
      {tooltip && (
        <Label x={x + radius + 6} y={y - 12}>
          <Tag fill="black" opacity={0.7} cornerRadius={4} />
          <Text text={tooltip} fontSize={12} padding={6} fill="white" />
        </Label>
      )}
    </React.Fragment>
  );
}
