// components/SeatingMap.jsx
import React from 'react';
import { Stage, Layer, Rect, Circle, Text, Image } from 'react-konva';

const SeatingMap = ({ mapa, zonas = [], onClickSilla, onElementClick }) => {
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

  // Handle new structure where contenido is an object with elementos property
  const elementos = Array.isArray(mapa.contenido) 
    ? mapa.contenido 
    : mapa.contenido.elementos || [];

  // Filtrar elementos por tipo
  const mesas = elementos.filter(el => el.type === 'mesa');
  const sillas = elementos.filter(el => el.type === 'silla');
  const textos = elementos.filter(el => el.type === 'texto');
  const imagenes = elementos.filter(el => el.type === 'background');

  return (
    <Stage width={800} height={500}>
      <Layer>
        {/* Renderizar imagen de fondo si existe */}
        {imagenes.map(imagen => (
          <Image
            key={imagen._id}
            image={imagen.imageUrl}
            x={imagen.posicion?.x || 0}
            y={imagen.posicion?.y || 0}
            scaleX={imagen.scale || 1}
            scaleY={imagen.scale || 1}
            opacity={imagen.opacity || 1}
            listening={false}
          />
        ))}

        {/* Renderizar mesas */}
        {mesas.map(mesa => (
          <React.Fragment key={mesa._id}>
            {mesa.shape === 'rect' || !mesa.shape ? (
              <Rect
                x={mesa.posicion.x}
                y={mesa.posicion.y}
                width={mesa.width || 120}
                height={mesa.height || 80}
                fill={mesa.fill || mesa.zona?.color || "#4CAF50"}
                stroke={mesa.stroke || "#2E7D32"}
                strokeWidth={mesa.strokeWidth || 2}
                cornerRadius={10}
                onClick={() => onElementClick && onElementClick(mesa)}
              />
            ) : (
              <Circle
                x={mesa.posicion.x + (mesa.width || 60)}
                y={mesa.posicion.y + (mesa.height || 40)}
                radius={(mesa.width || 120) / 2}
                fill={mesa.fill || mesa.zona?.color || "#4CAF50"}
                stroke={mesa.stroke || "#2E7D32"}
                strokeWidth={mesa.strokeWidth || 2}
                onClick={() => onElementClick && onElementClick(mesa)}
              />
            )}
            
            {/* Mostrar nombre de la mesa */}
            <Text
              x={mesa.posicion.x}
              y={mesa.posicion.y + (mesa.height || 0) + 15}
              text={mesa.nombre || ''}
              fontSize={14}
              fill="black"
              align="center"
              width={mesa.width || 120}
            />
          </React.Fragment>
        ))}

        {/* Renderizar sillas */}
        {sillas.map(silla => (
          <React.Fragment key={silla._id}>
            <Circle
              x={silla.posicion.x + (silla.width || 10)}
              y={silla.posicion.y + (silla.height || 10)}
              radius={(silla.width || 20) / 2}
              fill={silla.fill || silla.zona?.color || "#2196F3"}
              stroke={silla.stroke || "#1976D2"}
              strokeWidth={silla.strokeWidth || 1}
              onClick={() => onClickSilla && onClickSilla(silla)}
            />
            
            {/* Mostrar número de la silla */}
            <Text
              x={silla.posicion.x}
              y={silla.posicion.y}
              text={silla.nombre || silla.numero || ''}
              fontSize={10}
              fill="black"
              align="center"
              width={silla.width || 20}
            />
          </React.Fragment>
        ))}

        {/* Renderizar textos */}
        {textos.map(texto => (
          <Text
            key={texto._id}
            x={texto.posicion.x}
            y={texto.posicion.y}
            text={texto.texto || ''}
            fontSize={texto.fontSize || 16}
            fill={texto.fill || "black"}
            align="center"
            onClick={() => onElementClick && onElementClick(texto)}
          />
        ))}

        {/* Mostrar información de zonas si existe */}
        {elementos.some(el => el.zona) && (
          <Text
            x={10}
            y={10}
            text="Zonas activas"
            fontSize={12}
            fill="gray"
          />
        )}
      </Layer>
    </Stage>
  );
};

export default SeatingMap;
