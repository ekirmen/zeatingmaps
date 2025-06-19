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
  const [showRowModal, setShowRowModal] = useState(false);
  const [rowNameInput, setRowNameInput] = useState('');
  const [selectedSeatRow, setSelectedSeatRow] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [editName, setEditName] = useState('');
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
    // Preserve previously typed row names when reopening the modal. Only
    // initialize the input if it is empty to avoid losing the user's value.
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
