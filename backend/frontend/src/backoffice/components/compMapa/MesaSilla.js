// compMapa/MesaSilla.js
import React from 'react';
import { Circle, Rect, Text, Group } from 'react-konva';

export const Mesa = ({
  _id,
  shape,
  posicion = { x: 0, y: 0 }, // This will be the grid position
  radius,
  width,
  height,
  nombre,
  selected,
  onSelect,
  onDragEnd,
  onChairDragEnd,
  zonaId,
  zonas = [],
  selectedIds = [],
  elements = [],
}) => {
  // Add validation check
  if (!posicion || typeof posicion.x !== 'number' || typeof posicion.y !== 'number') {
    console.warn('Invalid position provided to Mesa component:', posicion);
    posicion = { x: 0, y: 0 };
  }

  // Fixed position for chair layout (140,140)
  const chairLayoutPosition = { x: 140, y: 140 };

  const zona = zonas.find((z) => z._id === zonaId);
  const strokeColor = selected ? 'blue' : zona?.color || 'black';
  const fillColor = zona?.color || '#ccc';

  // Find chairs belonging to this mesa
  const childChairs = elements.filter(el => el.type === 'silla' && el.parentId === _id);

  const handleGroupDragEnd = (e) => {
    const newGridPos = {
      x: e.target.x(),
      y: e.target.y()
    };
    
    // Calculate movement delta
    const deltaX = newGridPos.x - posicion.x;
    const deltaY = newGridPos.y - posicion.y;
    
    // Update chair positions (relative to grid movement)
    const chairUpdates = childChairs.map(chair => ({
      _id: chair._id,
      posicion: {
        x: chair.posicion.x + deltaX,
        y: chair.posicion.y + deltaY
      }
    }));

    onDragEnd(e, _id, newGridPos, chairUpdates);
  };

  return (
    <Group
      x={posicion.x}
      y={posicion.y}
      draggable={true}
      onDragEnd={handleGroupDragEnd}
      onClick={() => onSelect({ _id })}
      onTap={() => onSelect({ _id })}
    >
      {shape === 'circle' ? (
        <Circle
          // Position relative to the Group's origin (0,0)
          x={0}
          y={0}
          radius={radius}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          // Remove draggable from the shape inside the group
        />
      ) : (
        <Rect
          // Position relative to the Group's origin (0,0)
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          // Remove draggable from the shape inside the group
        />
      )}
      {/* Position text relative to the Group's origin (0,0) */}
      <Text
        x={-(radius || width / 2)} // Adjust text position relative to group
        y={-30} // Adjust text position relative to group
        text={nombre}
        fontSize={14}
        fill="black"
      />
      {/* Map over childChairs and render Silla components */}
      {childChairs.map((silla) => {
        // Calculate chair position relative to the table's grid position
        const relativeX = silla.posicion.x - posicion.x;
        const relativeY = silla.posicion.y - posicion.y;

        return (
          <Silla
            key={silla._id}
            {...silla}
            x={relativeX}
            y={relativeY}
            width={silla.width || 20}
            height={silla.height || 20}
            selected={selectedIds.includes(silla._id)}
            zonas={zonas}
            onSelect={onSelect}
            onDragEnd={onChairDragEnd}
            parentPosition={posicion}
          />
        );
      })}
    </Group> // Close the Group
  );
};

export const Silla = ({
  _id,
  shape = 'rect',
  // Accept x and y props which are the positions relative to the parent Group
  x,
  y,
  width,
  height,
  numero,
  nombre,
  fila,
  selected,
  onSelect,
  onDragEnd, // This prop now receives onDragEndSilla from Mesa
  zonaId,
  zonas = [],
  parentPosition,
}) => {
  const zona = zonas.find((z) => z._id === zonaId);
  const strokeColor = selected ? 'blue' : zona?.color || 'black';
  const fillColor = zona?.color || '#48bb78';

  const textColor = '#fff';
  const textSize = 12;

  return (
    <>
      {shape === 'circle' ? (
        <Circle
          x={x + width / 2} // Use the relative x, y and adjust for center if needed
          y={y + height / 2} // Use the relative x, y and adjust for center if needed
          radius={width / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          draggable={false}
          onClick={() => onSelect({ _id })} // Keep onClick to allow selection
          onTap={() => onSelect({ _id })} // Keep onTap to allow selection
          onDragEnd={(e) => onDragEnd(e, _id)}
        />
      ) : (
        <Rect
          x={x} // Use the relative x
          y={y} // Use the relative y
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          draggable={false}
          onClick={() => onSelect({ _id })} // Keep onClick to allow selection
          onTap={() => onSelect({ _id })} // Keep onTap to allow selection
          onDragEnd={(e) => onDragEnd(e, _id)}
        />
      )}
      <Text
        x={x}
        y={y - 20}  // Position text above chair
        width={width}
        text={fila ? `${fila}${numero}` : nombre || numero?.toString() || ''}
        fontSize={12}
        fill="black"
        align="center"
      />
    </>
  );
};
