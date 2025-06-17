import React from 'react';
import { Line } from 'react-konva';

const Grid = ({ width, height }) => {
  const gridSize = 20;
  const lines = [];

  const verticalCount = Math.ceil(width / gridSize);
  const horizontalCount = Math.ceil(height / gridSize);

  for (let i = 0; i < verticalCount; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i * gridSize, 0, i * gridSize, height]}
        stroke="#ccc"
        strokeWidth={0.5}
      />
    );
  }

  for (let i = 0; i < horizontalCount; i++) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * gridSize, width, i * gridSize]}
        stroke="#ccc"
        strokeWidth={0.5}
      />
    );
  }

  return <>{lines}</>;
};

export default Grid;
