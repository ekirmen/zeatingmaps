import React from 'react';
import { Group, Rect, Circle, Text } from 'react-konva';
import Chair from './Chair';

const Table = ({
  id,
  x,
  y,
  type = 'rect',
  width = 100,
  height = 60,
  radius = 40,
  rotation = 0,
  name = '',
  fill = '#cccccc',
  chairs = [],
  onDragEnd,
  onSelect,
}) => {
  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable
      onDragEnd={(e) => onDragEnd && onDragEnd(id, e)}
      onClick={() => onSelect && onSelect(id)}
      onTap={() => onSelect && onSelect(id)}
    >
      {type === 'circle' ? (
        <Circle radius={radius} fill={fill} />
      ) : (
        <Rect width={width} height={height} fill={fill} cornerRadius={4} />
      )}
      <Text
        text={name}
        width={type === 'circle' ? radius * 2 : width}
        y={type === 'circle' ? -radius - 16 : -20}
        align="center"
      />
      {chairs.map((chair) => (
        <Chair key={chair.id} {...chair} />
      ))}
    </Group>
  );
};

export default Table;
