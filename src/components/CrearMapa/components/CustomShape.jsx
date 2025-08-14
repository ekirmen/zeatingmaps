import React from 'react';
import { Group, Rect, Circle, Text, Shape } from 'react-konva';

const CustomShape = ({ 
  id, 
  type, 
  points, 
  width, 
  height, 
  radius, 
  fill, 
  stroke, 
  strokeWidth, 
  opacity, 
  position, 
  isSelected, 
  onSelect, 
  onEdit 
}) => {
  const handleClick = () => {
    onSelect();
  };

  const handleDoubleClick = () => {
    onEdit();
  };

  const renderShape = () => {
    switch (type) {
      case 'rectangular':
        return (
          <Rect
            x={position?.x || 0}
            y={position?.y || 0}
            width={width || 100}
            height={height || 100}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            draggable
            onDragEnd={(e) => {
              // Actualizar posición después del drag
            }}
          />
        );
        
      case 'circular':
        return (
          <Circle
            x={(position?.x || 0) + (radius || 50)}
            y={(position?.y || 0) + (radius || 50)}
            radius={radius || 50}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            draggable
            onDragEnd={(e) => {
              // Actualizar posición después del drag
            }}
          />
        );
        
      case 'oval':
        return (
          <Rect
            x={position?.x || 0}
            y={position?.y || 0}
            width={width || 100}
            height={height || 100}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            cornerRadius={Math.min(width || 100, height || 100) / 2}
            draggable
            onDragEnd={(e) => {
              // Actualizar posición después del drag
            }}
          />
        );
        
      case 'custom':
        if (points && points.length >= 3) {
          return (
            <Shape
              x={position?.x || 0}
              y={position?.y || 0}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              opacity={opacity}
              draggable
              onDragEnd={(e) => {
                // Actualizar posición después del drag
              }}
              sceneFunc={(context, shape) => {
                context.beginPath();
                context.moveTo(points[0].x, points[0].y);
                
                for (let i = 1; i < points.length; i++) {
                  context.lineTo(points[i].x, points[i].y);
                }
                
                // Cerrar el shape conectando el último punto con el primero
                context.closePath();
                context.fillStrokeShape(shape);
              }}
            />
          );
        }
        return null;
        
      default:
        return null;
    }
  };

  return (
    <Group
      onClick={handleClick}
      onDblClick={handleDoubleClick}
    >
      {/* Shape principal */}
      {renderShape()}
      
      {/* Indicador de selección */}
      {isSelected && (
        <Rect
          x={(position?.x || 0) - 5}
          y={(position?.y || 0) - 5}
          width={(width || 100) + 10}
          height={(height || 100) + 10}
          fill="transparent"
          stroke="#0066ff"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}
      
      {/* Puntos de control si está seleccionado */}
      {isSelected && type === 'custom' && points && (
        points.map((point, index) => (
          <Circle
            key={index}
            x={(position?.x || 0) + point.x}
            y={(position?.y || 0) + point.y}
            radius={4}
            fill="#0066ff"
            stroke="#0033cc"
            strokeWidth={1}
          />
        ))
      )}
      
      {/* Etiqueta del shape */}
      {type === 'custom' && (
        <Text
          x={(position?.x || 0) + 10}
          y={(position?.y || 0) + 10}
          text={`Shape ${id}`}
          fontSize={12}
          fill="#333"
          opacity={0.8}
        />
      )}
    </Group>
  );
};

export default CustomShape;
