import React, { useState } from 'react';
import { Button, Select, InputNumber } from 'antd';

const ContextToolsPanel = ({
  selectedElements,
  elements,
  seatShape,
  setSeatShape,
  addSeatsToTable
}) => {
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);

  if (selectedElements.length === 0) return null;

  const selectedElement = elements.find(el => el.id === selectedElements[0]);
  if (!selectedElement) return null;

  const renderTableTools = () => {
    if (selectedElement.type !== 'mesa') return null;

    return (
      <div className="context-tools-content">
        <h4>🍽️ Herramientas de Mesa</h4>
        
        <div style={{ marginBottom: '1rem' }}>
          <label>Forma de asientos:</label>
          <Select
            value={seatShape}
            onChange={setSeatShape}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            <Select.Option value="circle">🔵 Círculo</Select.Option>
            <Select.Option value="square">⬜ Cuadrado</Select.Option>
          </Select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Asientos por lado:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div>
              <label>⬆️ Arriba:</label>
              <InputNumber
                min={0}
                max={10}
                value={up}
                onChange={setUp}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>⬇️ Abajo:</label>
              <InputNumber
                min={0}
                max={10}
                value={down}
                onChange={setDown}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>⬅️ Izquierda:</label>
              <InputNumber
                min={0}
                max={10}
                value={left}
                onChange={setLeft}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label>➡️ Derecha:</label>
              <InputNumber
                min={0}
                max={10}
                value={right}
                onChange={setRight}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <Button
          type="primary"
          onClick={() => addSeatsToTable(selectedElement.id, { up, down, left, right })}
          style={{ width: '100%' }}
        >
          ➕ Agregar Asientos
        </Button>
      </div>
    );
  };

  const renderSeatTools = () => {
    if (selectedElement.type !== 'silla') return null;

    return (
      <div className="context-tools-content">
        <h4>🪑 Herramientas de Asiento</h4>
        <p><strong>Número:</strong> {selectedElement.numero || 'Sin numerar'}</p>
        <p><strong>Fila:</strong> {selectedElement.fila || 'Sin fila'}</p>
        <p><strong>Estado:</strong> {selectedElement.estado || 'Disponible'}</p>
      </div>
    );
  };

  const renderZoneTools = () => {
    if (selectedElement.type !== 'zone') return null;

    return (
      <div className="context-tools-content">
        <h4>🏗️ Herramientas de Zona</h4>
        <p><strong>Nombre:</strong> {selectedElement.nombre || 'Sin nombre'}</p>
        <p><strong>Dimensiones:</strong> {selectedElement.width} x {selectedElement.height}</p>
        <p><strong>Posición:</strong> ({selectedElement.x}, {selectedElement.y})</p>
      </div>
    );
  };

  return (
    <div className="context-tools-panel">
      {renderTableTools()}
      {renderSeatTools()}
      {renderZoneTools()}
      
      {!renderTableTools() && !renderSeatTools() && !renderZoneTools() && (
        <div className="context-tools-content">
          <h4>🔧 Herramientas Generales</h4>
          <p><strong>Tipo:</strong> {selectedElement.type}</p>
          <p><strong>ID:</strong> {selectedElement.id}</p>
          <p><strong>Posición:</strong> ({selectedElement.x}, {selectedElement.y})</p>
        </div>
      )}
    </div>
  );
};

export default ContextToolsPanel;
