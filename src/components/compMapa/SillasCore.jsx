import React from 'react';
import { Rect, Circle } from 'react-konva';

const Silla = ({
  shape = 'rect',
  posicion,
  width,
  height,
  onSelect,
  selected,
  onDragEnd,
  zonaId,
  zonas = [],
}) => {
  const zona = zonas.find((z) => z.id === zonaId);
  const zonaColor = zona?.color || 'black';
  const strokeColor = selected ? 'blue' : zonaColor;

  const commonProps = {
    x: posicion.x,
    y: posicion.y,
    width,
    height,
    fill: selected ? 'orange' : 'lightgray',
    stroke: strokeColor,
    strokeWidth: 2,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd,
  };

  return shape === 'circle' ? (
    <Circle
      {...commonProps}
      radius={width / 2}
      width={undefined}
      height={undefined}
    />
  ) : (
    <Rect {...commonProps} />
  );
};

export default Silla;
