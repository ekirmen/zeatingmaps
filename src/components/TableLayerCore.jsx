import React from 'react';
import { Layer, Rect, Text } from 'react-konva';

const TableLayerCore = ({ tables }) => {
  return (
    <Layer>
      {tables.map((t, idx) => (
        <React.Fragment key={t._id || idx}>
          <Rect
            x={(t.posicion && t.posicion.x) || 0}
            y={(t.posicion && t.posicion.y) || 0}
            width={(t.dimensiones && t.dimensiones.ancho) || 60}
            height={(t.dimensiones && t.dimensiones.alto) || 40}
            fill={t.color || 'tan'}
            stroke="black"
            strokeWidth={1}
          />
          <Text
            x={(t.posicion && t.posicion.x) || 0}
            y={((t.posicion && t.posicion.y) || 0) + 6}
            text={t.nombre || t._id || `Mesa ${idx + 1}`}
            fontSize={12}
            fill="black"
          />
        </React.Fragment>
      ))}
    </Layer>
  );
};

export default TableLayerCore;