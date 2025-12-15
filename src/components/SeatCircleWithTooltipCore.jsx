import React from 'react';
import { Circle, Label, Tag, Text } from 'react-konva';

const SeatCircleWithTooltipCore = ({ x = 0, y = 0, radius = 8, fill = '#fff', tooltip = '' }) => {
  return (
    <>
      <Circle x={x} y={y} radius={radius} fill={fill} stroke="black" strokeWidth={1} />
      {tooltip && (
        <Label x={x + radius + 6} y={y - 12}>
          <Tag fill="black" opacity={0.7} cornerRadius={4} />
          <Text text={tooltip} fontSize={12} padding={6} fill="white" />
        </Label>
      )}
    </>
  );
};

export default SeatCircleWithTooltipCore;
