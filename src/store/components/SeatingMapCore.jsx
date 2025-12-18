import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

const BackgroundImage = ({ src, width, height }) => {
  const [image] = useImage(src);
  return <KonvaImage image={image} width={width} height={height} />;
};

const SeatingMapCore = ({ mapa, zonas = [], onClickSilla }) => {
  if (!mapa) return null;

  const getZonaNombre = (idOrObj) => {
    if (!idOrObj) return '';
    if (typeof idOrObj === 'object') return idOrObj.nombre || '';
    const zona = zonas.find(z => (z.id || z._id) === idOrObj);
    return zona ? zona.nombre : '';
  };

  const getZonaColor = (idOrObj) => {
    if (!idOrObj) return undefined;
    if (typeof idOrObj === 'object') return idOrObj.color;
    const zona = zonas.find(z => (z.id || z._id) === idOrObj);
    return zona ? zona.color : undefined;
  };

  const elementos = Array.isArray(mapa.contenido) ? mapa.contenido : mapa.contenido.zonas || [];

  // Detect background
  let backgroundSrc = mapa.imagen_fondo;
  // If not in root, check elements
  if (!backgroundSrc) {
    const bgElement = elementos.find(el => el.type === 'background');
    if (bgElement && (bgElement.imageData || bgElement.imageUrl)) {
      backgroundSrc = bgElement.imageData || bgElement.imageUrl;
    }
  }

  return (
    <Stage width={800} height={500}>
      <Layer>
        {backgroundSrc && (
          <BackgroundImage src={backgroundSrc} width={800} height={500} />
        )}
        {elementos.map(elemento => (
          <React.Fragment key={elemento._id}>
            {elemento.type === 'mesa' && (
              elemento.shape === 'rect' ? (
                <Rect
                  x={elemento.posicion.x}
                  y={elemento.posicion.y}
                  width={elemento.width}
                  height={elemento.height}
                  fill="lightblue"
                  cornerRadius={10}
                />
              ) : (
                <Circle
                  x={elemento.posicion.x}
                  y={elemento.posicion.y}
                  radius={elemento.width / 2}
                  fill="lightblue"
                />
              )
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
            {elemento.sillas.map(silla => {
              let fillColor = silla.color || getZonaColor(silla.zona || elemento.zonaId) || 'gray';
              if (silla.blocked) {
                fillColor = '#A9A9A9';
              }
              if (silla.selected) {
                fillColor = '#4CAF50';
              }
              return (
                <React.Fragment key={silla._id || silla.id || Math.random()}>
                  <Circle
                    x={silla.posicion.x}
                    y={silla.posicion.y}
                    radius={10}
                    fill={fillColor}
                    stroke={silla.selected ? '#000' : undefined}
                    strokeWidth={silla.selected ? 2 : 0}
                    onClick={() => onClickSilla(silla, elemento)}
                  />
                  <Text
                    x={silla.posicion.x - 10}
                    y={silla.posicion.y - 6}
                    text={silla.nombre || silla.numero || ''}
                    fontSize={12}
                    fill="black"
                    width={20}
                    align="center"
                    onClick={() => onClickSilla(silla, elemento)}
                    onTap={() => onClickSilla(silla, elemento)}
                    style={{ cursor: 'pointer' }}
                  />
                </React.Fragment>
              );
            })}
            {elemento.sillas.length > 0 && (
              <Text
                x={elemento.posicion.x}
                y={elemento.posicion.y + (elemento.height || 0) + 15}
                text={elemento.nombre || elemento.id || ''}
                fontSize={14}
                fill="black"
              />
            )}
          </React.Fragment>
        ))}
      </Layer>
    </Stage>
  );
};

export default SeatingMapCore;
