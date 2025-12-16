import React, { memo, useMemo } from 'react';
import { Layer, Text, Line, Circle, Rect } from 'react-konva';

/**
 * Componente optimizado para renderizar elementos adicionales del mapa (textos, líneas, formas)
 * Memoizado para evitar re-renders innecesarios
 */
const MapElementsLayer = memo(({ mapa }) => {
  const renderedElements = useMemo(() => {
    if (!mapa?.contenido) return null;

    const elementos = Array.isArray(mapa.contenido)
      ? mapa.contenido
      : mapa.contenido.elementos || [];

    return elementos
      .filter((elemento, index) => {
        // Filtrar elementos que ya se renderizaron como mesas o asientos
        if (elemento.type === 'mesa' || elemento.shape === 'circle' || elemento.shape === 'rect') {
          return false;
        }

        // Filtrar elementos de fondo que no deberían ser clickeables
        if (elemento._id && (
          elemento._id.startsWith('bg_') ||
          elemento._id.startsWith('txt_') ||
          elemento.type === 'background' ||
          elemento.type === 'text'
        )) {
          return false;
        }

        return true;
      })
      .map((elemento, index) => {
        // Renderizar elementos de texto
        if (elemento.type === 'Text' || elemento.text) {
          return (
            <Text
              key={`text_${index}`}
              x={elemento.x || elemento.posicion?.x || 0}
              y={elemento.y || elemento.posicion?.y || 0}
              text={elemento.text || elemento.nombre || ''}
              fontSize={elemento.fontSize || 14}
              fill={elemento.fill || '#000'}
              fontFamily={elemento.fontFamily || 'Arial'}
            />
          );
        }

        // Renderizar líneas
        if (elemento.type === 'Line' || elemento.points) {
          return (
            <Line
              key={`line_${index}`}
              points={elemento.points || [0, 0, 100, 100]}
              stroke={elemento.stroke || '#000'}
              strokeWidth={elemento.strokeWidth || 1}
            />
          );
        }

        // Renderizar formas geométricas
        if (elemento._id && elemento._id.startsWith('shape_')) {
          // Círculo
          if (elemento.type === 'Circle' || elemento.shape === 'circle') {
            return (
              <Circle
                key={`shape_circle_${index}`}
                x={elemento.x || elemento.posicion?.x || 0}
                y={elemento.y || elemento.posicion?.y || 0}
                radius={elemento.radius || (elemento.width ? elemento.width / 2 : 20)}
                fill={elemento.fill || '#e0e0e0'}
                stroke={elemento.stroke || '#999'}
                strokeWidth={elemento.strokeWidth || 2}
                opacity={elemento.opacity || 0.8}
                listening={false}
              />
            );
          }

          // Rectángulo
          if (elemento.type === 'Rect' || elemento.shape === 'rect' || elemento.shape === 'square') {
            return (
              <Rect
                key={`shape_rect_${index}`}
                x={elemento.x || elemento.posicion?.x || 0}
                y={elemento.y || elemento.posicion?.y || 0}
                width={elemento.width || 40}
                height={elemento.height || 40}
                fill={elemento.fill || '#e0e0e0'}
                stroke={elemento.stroke || '#999'}
                strokeWidth={elemento.strokeWidth || 2}
                opacity={elemento.opacity || 0.8}
                listening={false}
              />
            );
          }

          // Triángulo
          if (elemento.shape === 'triangle') {
            const x = elemento.x || elemento.posicion?.x || 0;
            const y = elemento.y || elemento.posicion?.y || 0;
            const size = elemento.width || 40;
            const points = [
              x, y - size / 2,
              x - size / 2, y + size / 2,
              x + size / 2, y + size / 2,
              x, y - size / 2
            ];
            return (
              <Line
                key={`shape_triangle_${index}`}
                points={points}
                fill={elemento.fill || '#e0e0e0'}
                stroke={elemento.stroke || '#999'}
                strokeWidth={elemento.strokeWidth || 2}
                closed={true}
                opacity={elemento.opacity || 0.8}
                listening={false}
              />
            );
          }
        }

        // Renderizar círculos genéricos
        if (elemento.type === 'Circle' && !elemento.shape) {
          return (
            <Circle
              key={`circle_${index}`}
              x={elemento.x || elemento.posicion?.x || 0}
              y={elemento.y || elemento.posicion?.y || 0}
              radius={elemento.radius || (elemento.width ? elemento.width / 2 : 20)}
              fill={elemento.fill || '#ccc'}
              stroke={elemento.stroke || '#666'}
              strokeWidth={elemento.strokeWidth || 1}
            />
          );
        }

        // Renderizar rectángulos genéricos
        if (elemento.type === 'Rect' && !elemento.shape) {
          return (
            <Rect
              key={`rect_${index}`}
              x={elemento.x || elemento.posicion?.x || 0}
              y={elemento.y || elemento.posicion?.y || 0}
              width={elemento.width || 100}
              height={elemento.height || 100}
              fill={elemento.fill || '#ccc'}
              stroke={elemento.stroke || '#666'}
              strokeWidth={elemento.strokeWidth || 1}
            />
          );
        }

        return null;
      });
  }, [mapa]);

  if (!renderedElements || renderedElements.length === 0) {
    return null;
  }

  return <Layer>{renderedElements}</Layer>;
});

MapElementsLayer.displayName = 'MapElementsLayer';

export default MapElementsLayer;
