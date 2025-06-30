// components/SeatingMap.jsx
import React from 'react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';

const SeatingMap = ({ mapa, zonas = [], onClickSilla }) => {
  if (!mapa) return null;

  const getZonaNombre = (idOrObj) => {
    if (!idOrObj) return '';
    if (typeof idOrObj === 'object') return idOrObj.nombre || '';
    const zona = zonas.find(z => (z.id || z._id) === idOrObj);
    return zona ? zona.nombre : '';
  };

  return (
    <Stage width={800} height={500}>
      <Layer>
        {mapa.contenido.map(elemento => (
          <React.Fragment key={elemento._id}>
            {elemento.type === 'rect' && (
              <Rect
                x={elemento.posicion.x}
                y={elemento.posicion.y}
                width={elemento.width}
                height={elemento.height}
                fill="lightblue"
                cornerRadius={10}
              />
            )}
            {elemento.type === 'circle' && (
              <Circle
                x={elemento.posicion.x}
                y={elemento.posicion.y}
                radius={elemento.width / 2}
                fill="lightblue"
              />
            )}
            {getZonaNombre(elemento.zona || elemento.zonaId) && (
              <Text
                x={elemento.posicion.x}
                y={elemento.posicion.y - 20}
                text={getZonaNombre(elemento.zona || elemento.zonaId)}
                fontSize={14}
                fill="black"
              />
            )}
            {elemento.sillas.map(silla => (
              <Circle
                key={silla._id}
                x={silla.posicion.x}
                y={silla.posicion.y}
                radius={10}
                fill={silla.color || 'gray'}
                onClick={() => onClickSilla(silla, elemento)}
              />
            ))}
          </React.Fragment>
        ))}
      </Layer>
    </Stage>
  );
};

export default SeatingMap;
