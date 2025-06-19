import React from 'react';
import { Rect, Circle } from 'react-konva';

const Chair = ({
  id,
  x,
  y,
  type = 'rect',
  size = 20,
  rotation = 0,
  fill = '#999999',
  draggable = true,
  onDragEnd,
  onSelect,
}) => {
  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(id, e);
    }
  };
  return type === 'circle' ? (
    <Circle
      x={x}
      y={y}
      radius={size / 2}
      fill={fill}
      rotation={rotation}
      draggable={draggable}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect && onSelect(id)}
      onTap={() => onSelect && onSelect(id)}
    />
  ) : (
    <Rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      fill={fill}
      rotation={rotation}
      draggable={draggable}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect && onSelect(id)}
      onTap={() => onSelect && onSelect(id)}
    />
  );
};

export default Chair;
