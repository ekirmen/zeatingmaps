import React from 'react';
import { Rect } from 'react-konva';

export default function Chair({ x = 0, y = 0, width = 12, height = 12, fill = 'sienna' }) {
  return <Rect x={x} y={y} width={width} height={height} fill={fill} stroke="black" strokeWidth={1} />;
}
