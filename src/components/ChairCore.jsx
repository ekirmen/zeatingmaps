import React from 'react';
import { Rect } from 'react-konva';

const ChairCore = ({ x = 0, y = 0, width = 10, height = 10, fill = '#fff' }) => {
  return <Rect x={x} y={y} width={width} height={height} fill={fill} stroke="black" strokeWidth={1} />;
};

export default ChairCore;
