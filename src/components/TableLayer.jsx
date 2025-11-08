import React, { memo, useMemo } from 'react';
import { Layer, Circle, Rect, Text } from 'react-konva';

/**
 * Componente optimizado para renderizar la capa de mesas
 * Memoizado para evitar re-renders innecesarios
 */
const TableLayer = memo(({ mesas }) => {
  const renderedTables = useMemo(() => {
    if (!mesas || !Array.isArray(mesas) || mesas.length === 0) return null;

    return mesas.map((mesa) => {
      if (mesa.shape === 'circle') {
        const centerX = mesa.x || mesa.posicion?.x || 0;
        const centerY = mesa.y || mesa.posicion?.y || 0;
        const radius = mesa.radius || (mesa.width || 60) / 2;
        return (
          <React.Fragment key={`mesa_${mesa._id}`}>
            <Circle
              x={centerX}
              y={centerY}
              radius={radius}
              fill="#f0f0f0"
              stroke="#666"
              strokeWidth={2}
              opacity={0.8}
            />
            <Text
              x={centerX - radius}
              y={centerY - 7}
              width={radius * 2}
              align="center"
              text={mesa.nombre || ''}
              fontSize={14}
              fill="#000"
            />
          </React.Fragment>
        );
      } else if (mesa.shape === 'rect') {
        const x = mesa.x || mesa.posicion?.x || 0;
        const y = mesa.y || mesa.posicion?.y || 0;
        const width = mesa.width || 120;
        const height = mesa.height || 80;
        return (
          <React.Fragment key={`mesa_${mesa._id}`}>
            <Rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="#f0f0f0"
              stroke="#666"
              strokeWidth={2}
              opacity={0.8}
            />
            <Text
              x={x}
              y={y + height / 2 - 7}
              width={width}
              align="center"
              text={mesa.nombre || ''}
              fontSize={14}
              fill="#000"
            />
          </React.Fragment>
        );
      }
      return null;
    });
  }, [mesas]);

  return <Layer>{renderedTables}</Layer>;
});

TableLayer.displayName = 'TableLayer';

export default TableLayer;
