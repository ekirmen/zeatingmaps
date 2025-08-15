// compMapa/MesaSilla.js
import React from 'react';
import { Circle, Rect, Text, Group } from 'react-konva';

export const Mesa = ({
  mesa,
  isSelected,
  onClick,
  onDragEnd,
  getSeatColor,
  getZonaColor,
  getBorderColor,
  showZones,
  selectedZone,
  showConnections,
  connectionStyle,
}) => {
  const { id, x, y, width, height, nombre, zonaId, sillas = [] } = mesa;

  const strokeColor = isSelected ? '#0066FF' : getBorderColor(zonaId);
  const fillColor = getZonaColor(zonaId);

  return (
    <Group
      x={x}
      y={y}
      draggable={true}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={5}
      />
      
      <Text
        x={0}
        y={-25}
        width={width}
        text={nombre || 'Mesa'}
        fontSize={12}
        fill="#333"
        align="center"
        fontStyle="bold"
      />

      {/* Renderizar sillas de la mesa */}
      {sillas.map((silla) => (
        <Silla
          key={silla.id}
          silla={silla}
          isSelected={isSelected}
          onClick={onClick}
          onDragEnd={onDragEnd}
          getSeatColor={getSeatColor}
          getZonaColor={getZonaColor}
          getBorderColor={getBorderColor}
          showZones={showZones}
          selectedZone={selectedZone}
          showConnections={showConnections}
          connectionStyle={connectionStyle}
        />
      ))}
    </Group>
  );
};

export const Silla = ({
  silla,
  isSelected,
  onClick,
  onDragEnd,
  getSeatColor,
  getZonaColor,
  getBorderColor,
  showZones,
  selectedZone,
  showConnections,
  connectionStyle,
}) => {
  const { id, x, y, width = 20, height = 20, numero, fila, zonaId, estado = 'available' } = silla;

  // Colores basados en el estado del asiento
  const seatColors = {
    available: { fill: '#48BB78', stroke: '#38A169' },
    occupied: { fill: '#F56565', stroke: '#E53E3E' },
    reserved: { fill: '#ED8936', stroke: '#DD6B20' },
    disabled: { fill: '#A0AEC0', stroke: '#718096' },
    selected: { fill: '#0066FF', stroke: '#0052CC' }
  };

  const colors = seatColors[estado] || seatColors.available;
  const strokeColor = isSelected ? '#0066FF' : getBorderColor(zonaId);
  const fillColor = isSelected ? '#0066FF' : colors.fill;

  return (
    <Group
      x={x}
      y={y}
      draggable={true}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      {/* Asiento principal */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 3 : 2}
        cornerRadius={3}
        shadowColor="black"
        shadowBlur={isSelected ? 10 : 5}
        shadowOpacity={0.3}
        shadowOffset={{ x: 2, y: 2 }}
      />

      {/* Respaldo del asiento */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height * 0.3}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
        cornerRadius={{ topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 }}
      />

      {/* Número del asiento */}
      <Text
        x={0}
        y={height + 2}
        width={width}
        text={fila ? `${fila}${numero}` : numero?.toString() || ''}
        fontSize={10}
        fill="#333"
        align="center"
        fontStyle="bold"
      />

      {/* Indicador de estado */}
      {estado !== 'available' && (
        <Circle
          x={width - 5}
          y={5}
          radius={3}
          fill={colors.stroke}
          stroke="white"
          strokeWidth={1}
        />
      )}
    </Group>
  );
};
