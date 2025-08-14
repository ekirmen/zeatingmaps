import React from 'react';

const GridPattern = ({ size = 20 }) => {
  const gridLines = [];
  const stageWidth = 1200;
  const stageHeight = 800;

  // Líneas verticales
  for (let i = 0; i <= stageWidth; i += size) {
    gridLines.push(
      <line
        key={`v${i}`}
        x1={i}
        y1={0}
        x2={i}
        y2={stageHeight}
        stroke="#e0e0e0"
        strokeWidth={0.5}
        opacity={0.3}
      />
    );
  }

  // Líneas horizontales
  for (let i = 0; i <= stageHeight; i += size) {
    gridLines.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={i}
        x2={stageWidth}
        y2={i}
        stroke="#e0e0e0"
        strokeWidth={0.5}
        opacity={0.3}
      />
    );
  }

  return <g>{gridLines}</g>;
};

export default GridPattern;
