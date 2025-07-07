import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Circle, Rect, Text, Label, Tag } from 'react-konva';
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
    chairs.push({ id: `${table.id}-c${i}`, x, y, status: 'available' });
  }
  return chairs;
};

const SeatingMap = () => {
  const stageRef = useRef(null);
  const [tables, setTables] = useState([]);
  const [seatRows, setSeatRows] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showRowModal, setShowRowModal] = useState(false);
  const [rowNameInput, setRowNameInput] = useState('');
  const [selectedSeatRow, setSelectedSeatRow] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editName, setEditName] = useState('');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const seatSpacing = 30;

  useEffect(() => {
    const stage = stageRef.current;
    const container = stage?.container();

    const handleWheel = (e) => {
      e.preventDefault();
      const scaleBy = 1.1;
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      const newScale = Math.min(Math.max(e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy, 0.5), 5);

      setScale(newScale);
      setPosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    };

    container?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container?.removeEventListener('wheel', handleWheel);
    };
  }, [scale, position]);

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
    if (!rowNameInput) {
      setRowNameInput(`A${seatRows.length + 1}`);
    }
    setShowRowModal(true);
  };

  const confirmAddRow = () => {
    if (!rowNameInput.trim()) return;
    setActiveRow({ id: `row-${Date.now()}`, zone: rowNameInput.trim(), seats: [] });
    setIsDrawing(false);
    setShowRowModal(false);
  };

  const handleMouseDown = (e) => {
    if (!activeRow) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const seat = { id: `${activeRow.zone}-${activeRow.seats.length + 1}`, x: pos.x, y: pos.y, status: 'available' };
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
      const seat = { id: `${activeRow.zone}-${activeRow.seats.length + 1}`, x: pos.x, y: pos.y, status: 'available' };
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

  const handleSeatSelect = (seatId) => {
    const row = seatRows.find((r) => r.seats.some((s) => s.id === seatId));
    if (row) {
      setSelectedSeatRow(row);
      setEditName(row.zone);
    }
  };

  const handleTableSelect = (tableId) => {
    const table = tables.find((t) => t.id === tableId);
    if (table) {
      setSelectedTable(table);
      setEditName(table.name);
    }
  };

  const saveEdit = () => {
    if (selectedSeatRow) {
      setSeatRows(
        seatRows.map((r) =>
          r.id === selectedSeatRow.id ? { ...r, zone: editName } : r
        )
      );
      setSelectedSeatRow(null);
    } else if (selectedTable) {
      setTables(
        tables.map((t) => (t.id === selectedTable.id ? { ...t, name: editName } : t))
      );
      setSelectedTable(null);
    }
  };

  const cancelEdit = () => {
    setSelectedSeatRow(null);
    setSelectedTable(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={() => setTables([...tables, {
          id: `t-${Date.now()}`,
          type: 'rect',
          x: 150,
          y: 150,
          width: 80,
          height: 60,
          radius: 40,
          name: `Mesa ${tables.length + 1}`,
          capacity: 4,
          chairs: generateChairs({
            id: `t-${Date.now()}`,
            type: 'rect',
            x: 150,
            y: 150,
            width: 80,
            height: 60,
            radius: 40,
          }),
        }])} style={{ marginRight: '4px' }}>
          Agregar mesa rectangular
        </button>
        <button onClick={() => setTables([...tables, {
          id: `t-${Date.now()}`,
          type: 'circle',
          x: 150,
          y: 150,
          width: 80,
          height: 60,
          radius: 40,
          name: `Mesa ${tables.length + 1}`,
          capacity: 4,
          chairs: generateChairs({
            id: `t-${Date.now()}`,
            type: 'circle',
            x: 150,
            y: 150,
            width: 80,
            height: 60,
            radius: 40,
          }),
        }])} style={{ marginRight: '4px' }}>
          Agregar mesa circular
        </button>
        <button onClick={startSeatRow}>Crear fila de sillas</button>
      </div>
      <Stage
        ref={stageRef}
        width={800}
        height={600}
        style={{ border: '1px solid #ccc' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        draggable
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
      >
        <Layer>
          {tables.map((t) => (
            <Table
              key={t.id}
              {...t}
              onDragEnd={moveTable}
              onSelect={handleTableSelect}
            />
          ))}
          {seatRows.map((row) =>
            row.seats.map((seat) => (
              <Chair key={seat.id} {...seat} onSelect={handleSeatSelect} />
            ))
          )}
          {activeRow &&
            activeRow.seats.map((seat) => (
              <Chair key={seat.id} {...seat} onSelect={handleSeatSelect} />
            ))}
          {tooltip.visible && (
            <Label x={tooltip.x} y={tooltip.y}>
              <Tag fill="black" opacity={0.75} cornerRadius={4} />
              <Text text={tooltip.text} fontSize={12} fill="white" padding={4} />
            </Label>
          )}
        </Layer>
      </Stage>

      {showRowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Nombre de fila</h2>
            <input
              className="border p-2"
              value={rowNameInput}
              onChange={(e) => setRowNameInput(e.target.value)}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={confirmAddRow}>
                Aceptar
              </button>
              <button className="bg-gray-300 px-3 py-1 rounded" onClick={() => setShowRowModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {(selectedSeatRow || selectedTable) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">
              Editar nombre {selectedSeatRow ? 'de fila' : 'de mesa'}
            </h2>
            <input
              className="border p-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={saveEdit}>
                Guardar
              </button>
              <button className="bg-gray-300 px-3 py-1 rounded" onClick={cancelEdit}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatingMap;
