import React, { useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Table from './Table';

const generateChairs = (table) => {
  const chairs = [];
  const count = table.capacity || 4;
  const radius = table.type === 'circle' ? table.radius + 30 : Math.max(table.width, table.height) / 2 + 30;
  for (let i = 0; i < count; i++) {
    const angle = (i * 360) / count;
    const rad = (angle * Math.PI) / 180;
    const x = table.x + Math.cos(rad) * radius;
    const y = table.y + Math.sin(rad) * radius;
    chairs.push({ id: `${table.id}-c${i}`, x, y });
  }
  return chairs;
};

const SeatingMap = () => {
  const [tables, setTables] = useState([]);

  const addTable = (type = 'rect') => {
    const id = `t-${Date.now()}`;
    const table = {
      id,
      type,
      x: 150,
      y: 150,
      width: 80,
      height: 60,
      radius: 40,
      name: `Mesa ${tables.length + 1}`,
      capacity: 4,
    };
    table.chairs = generateChairs(table);
    setTables([...tables, table]);
  };

  const moveTable = (id, e) => {
    const { x, y } = e.target.position();
    setTables((t) =>
      t.map((tb) =>
        tb.id === id
          ? { ...tb, x, y, chairs: generateChairs({ ...tb, x, y }) }
          : tb
      )
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={() => addTable('rect')} style={{ marginRight: '4px' }}>
          Agregar mesa rectangular
        </button>
        <button onClick={() => addTable('circle')}>Agregar mesa circular</button>
      </div>
      <Stage width={800} height={600} style={{ border: '1px solid #ccc' }}>
        <Layer>
          {tables.map((t) => (
            <Table key={t.id} {...t} onDragEnd={moveTable} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default SeatingMap;
