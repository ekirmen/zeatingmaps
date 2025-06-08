import React, { useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Table from './Table';
import Chair from './Chair';

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
  const [seatRows, setSeatRows] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const seatSpacing = 30;

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

  const startSeatRow = () => {
    const zone = prompt('Nombre de la zona', `A${seatRows.length + 1}`);
    if (!zone) return;
    setActiveRow({ id: `row-${Date.now()}`, zone, seats: [] });
    setIsDrawing(false);
  };

  const handleMouseDown = (e) => {
    if (!activeRow) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const seat = { id: `${activeRow.zone}-${activeRow.seats.length + 1}`, x: pos.x, y: pos.y };
    setActiveRow({ ...activeRow, seats: [seat] });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!activeRow || !isDrawing) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const lastSeat = activeRow.seats[activeRow.seats.length - 1];
    const dx = pos.x - lastSeat.x;
    const dy = pos.y - lastSeat.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= seatSpacing) {
      const seat = { id: `${activeRow.zone}-${activeRow.seats.length + 1}`, x: pos.x, y: pos.y };
      setActiveRow({ ...activeRow, seats: [...activeRow.seats, seat] });
    }
  };

  const handleMouseUp = () => {
    if (activeRow && isDrawing) {
      setSeatRows([...seatRows, activeRow]);
      setActiveRow(null);
      setIsDrawing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={() => addTable('rect')} style={{ marginRight: '4px' }}>
          Agregar mesa rectangular
        </button>
        <button onClick={() => addTable('circle')} style={{ marginRight: '4px' }}>
          Agregar mesa circular
        </button>
        <button onClick={startSeatRow}>Crear fila de sillas</button>
      </div>
      <Stage
        width={800}
        height={600}
        style={{ border: '1px solid #ccc' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {tables.map((t) => (
            <Table key={t.id} {...t} onDragEnd={moveTable} />
          ))}
          {seatRows.map((row) =>
            row.seats.map((seat) => <Chair key={seat.id} {...seat} />)
          )}
          {activeRow &&
            activeRow.seats.map((seat) => <Chair key={seat.id} {...seat} />)}
        </Layer>
      </Stage>
    </div>
  );
};

export default SeatingMap;
