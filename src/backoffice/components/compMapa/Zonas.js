// Zonas.jsx - Versión simplificada para Konva
import React from 'react';
import { Rect, Text, Group } from 'react-konva';

const Zonas = ({ zones, selectedZone, onZoneSelect }) => {
  if (!zones || zones.length === 0) {
    return null;
  }

  return (
    <Group>
      {zones.map((zone) => {
        // Solo renderizar si la zona tiene coordenadas válidas
        if (!zone.coordenadas || !zone.coordenadas.x || !zone.coordenadas.y) {
          return null;
        }

        const isSelected = selectedZone?._id === zone._id;
        const zoneColor = zone.color || '#4A90E2';
        const borderColor = isSelected ? '#FF6B6B' : zoneColor;
        
        return (
          <Group key={zone._id}>
            {/* Fondo de la zona */}
            <Rect
              x={zone.coordenadas.x}
              y={zone.coordenadas.y}
              width={zone.coordenadas.width || 100}
              height={zone.coordenadas.height || 50}
              fill={`${zoneColor}20`} // Color con transparencia
              stroke={borderColor}
              strokeWidth={isSelected ? 3 : 1}
              dash={isSelected ? [5, 5] : []}
              opacity={0.8}
            />
            
            {/* Nombre de la zona */}
            <Text
              x={zone.coordenadas.x + 5}
              y={zone.coordenadas.y + 5}
              text={zone.nombre || 'Zona'}
              fontSize={12}
              fill={zoneColor}
              fontStyle="bold"
              align="left"
            />
          </Group>
        );
      })}
    </Group>
  );
};

export default Zonas;
