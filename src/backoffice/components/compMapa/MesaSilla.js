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
  console.log('[Mesa] Componente renderizándose con props:', {
    _id,
    shape,
    posicion,
    radius,
    width,
    height,
    nombre,
    selected,
    zonaId
  });

  // Add validation check
  if (!posicion || typeof posicion.x !== 'number' || typeof posicion.y !== 'number') {
    console.warn('Invalid position provided to Mesa component:', posicion);
    posicion = { x: 0, y: 0 };
  }

  const zona = zonas.find((z) => z.id === zonaId);
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
    const chairUpdates = childChairs.map(chair => {
      // Parse chair position safely - it's stored as text in the database
      let chairPos = { x: 0, y: 0 };
      try {
        if (chair.posicion && typeof chair.posicion === 'string') {
          chairPos = JSON.parse(chair.posicion);
        } else if (chair.posicion && typeof chair.posicion === 'object') {
          chairPos = chair.posicion;
        }
      } catch (error) {
        console.warn('Failed to parse chair position:', chair.posicion, error);
        chairPos = { x: 0, y: 0 };
      }

      return {
        _id: chair._id,
        posicion: {
          x: (chairPos.x || 0) + deltaX,
          y: (chairPos.y || 0) + deltaY
        }
      };
    });

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
      {/* Renderizar sillas como elementos independientes */}
      {childChairs.map((silla) => {
        // Parse chair position safely - it's stored as text in the database
        let sillaPos = { x: 0, y: 0 };
        try {
          if (silla.posicion && typeof silla.posicion === 'string') {
            sillaPos = JSON.parse(silla.posicion);
          } else if (silla.posicion && typeof silla.posicion === 'object') {
            sillaPos = silla.posicion;
          }
        } catch (error) {
          console.warn('Failed to parse chair position:', silla.posicion, error);
          sillaPos = { x: 0, y: 0 };
        }

        return (
          <Silla
            key={silla._id}
            _id={silla._id}
            shape={silla.shape || 'rect'}
            x={sillaPos.x}
            y={sillaPos.y}
            width={silla.width || 20}
            height={silla.height || 20}
            numero={silla.numero}
            nombre={silla.nombre}
            fila={silla.fila}
            selected={selectedIds.includes(silla._id)}
            onSelect={() => onSelect(silla)}
            onDragEnd={onChairDragEnd}
            zonaId={silla.zonaId}
            zonas={zonas}
            parentPosition={posicion}
          />
        );
      })}
    </Group>
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
  const zona = zonas.find((z) => z.id === zonaId);
  const strokeColor = selected ? 'blue' : zona?.color || 'black';
  const fillColor = zona?.color || '#48bb78';

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
