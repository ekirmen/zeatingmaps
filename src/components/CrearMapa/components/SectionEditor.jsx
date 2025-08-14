import React, { useState } from 'react';
import './SectionEditor.css';

const SectionEditor = ({ selectedShape, onSave }) => {
  const [seats, setSeats] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [seatType, setSeatType] = useState('with-seat');
  const [tableType, setTableType] = useState('rectangular');
  const [sectionName, setSectionName] = useState(selectedShape?.name || '');
  const [labelSize, setLabelSize] = useState(16);
  const [labelRotation, setLabelRotation] = useState(0);

  const seatTypes = {
    'with-seat': { 
      icon: '🪑', 
      label: 'Con Asiento',
      description: 'Asiento visible con respaldo'
    },
    'empty-space': { 
      icon: '⬜', 
      label: 'Sin Asiento (Espacio)',
      description: 'Solo espacio reservado'
    },
    'wheelchair': { 
      icon: '♿', 
      label: 'Silla de Ruedas',
      description: 'Accesibilidad especial'
    },
    'reserved': { 
      icon: '🔒', 
      label: 'Reservado',
      description: 'Asiento reservado'
    }
  };

  const tableTypes = {
    rectangular: {
      icon: '🟦',
      label: 'Rectangular',
      configurable: ['width', 'height'],
      seatPositions: ['top', 'bottom', 'left', 'right']
    },
    circular: {
      icon: '🟡',
      label: 'Circular',
      configurable: ['radius'],
      seatPositions: ['around']
    },
    oval: {
      icon: '🟨',
      label: 'Oval',
      configurable: ['width', 'height'],
      seatPositions: ['around']
    }
  };

  const [tableConfig, setTableConfig] = useState({
    width: 120,
    height: 80,
    radius: 60,
    seatCount: 4
  });

  // Funciones de asientos
  const addSeat = (position, type = seatType) => {
    const newSeat = {
      id: Date.now() + Math.random(),
      type,
      position,
      rotation: 0,
      size: 'medium',
      sectionId: selectedShape?.id
    };
    setSeats([...seats, newSeat]);
  };

  const updateSeat = (seatId, updates) => {
    setSeats(seats.map(seat => 
      seat.id === seatId ? { ...seat, ...updates } : seat
    ));
  };

  const deleteSeat = (seatId) => {
    setSeats(seats.filter(seat => seat.id !== seatId));
  };

  // Funciones de mesas
  const addTable = (position, type = tableType) => {
    const newTable = {
      id: Date.now() + Math.random(),
      type,
      position,
      config: { ...tableConfig },
      sectionId: selectedShape?.id
    };
    setTables([...tables, newTable]);
  };

  const updateTable = (tableId, updates) => {
    setTables(tables.map(table => 
      table.id === tableId ? { ...table, ...updates } : table
    ));
  };

  const deleteTable = (tableId) => {
    setTables(tables.filter(table => table.id !== tableId));
  };

  // Funciones de edición de sección
  const updateSectionConfig = (key, value) => {
    setSectionName(prev => ({ ...prev, [key]: value }));
  };

  const saveSection = () => {
    const sectionData = {
      name: sectionName,
      labelSize,
      labelRotation,
      seats,
      tables
    };
    onSave(sectionData);
  };

  const duplicateElement = () => {
    if (selectedElement) {
      const duplicated = {
        ...selectedElement,
        id: Date.now() + Math.random(),
        position: {
          x: selectedElement.position.x + 20,
          y: selectedElement.position.y + 20
        }
      };
      
      if (selectedElement.type === 'seat') {
        setSeats([...seats, duplicated]);
      } else if (selectedElement.type === 'table') {
        setTables([...tables, duplicated]);
      }
    }
  };

  const deleteElement = () => {
    if (selectedElement) {
      if (selectedElement.type === 'seat') {
        deleteSeat(selectedElement.id);
      } else if (selectedElement.type === 'table') {
        deleteTable(selectedElement.id);
      }
      setSelectedElement(null);
    }
  };

  const bringToFront = () => {
    // Implementar lógica de z-index
  };

  const sendToBack = () => {
    // Implementar lógica de z-index
  };

  return (
    <div className="section-editor">
      <h4>🔧 EDITOR DE SECCIÓN</h4>
      
      {/* Información de la sección */}
      <div className="section-info">
        <h5>📋 Información de la Sección</h5>
        <div className="info-row">
          <label>Nombre del sector:</label>
          <input 
            type="text"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="Nombre de la sección"
          />
        </div>
        <div className="info-row">
          <label>Tamaño de etiqueta:</label>
          <input 
            type="range"
            min="8"
            max="32"
            value={labelSize}
            onChange={(e) => setLabelSize(parseInt(e.target.value))}
          />
          <span>{labelSize}px</span>
        </div>
        <div className="info-row">
          <label>Rotar etiqueta:</label>
          <select 
            value={labelRotation}
            onChange={(e) => setLabelRotation(parseInt(e.target.value))}
          >
            <option value={0}>0°</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </div>
      </div>
      
      {/* Herramientas de asientos */}
      <div className="seat-tools">
        <h5>🪑 HERRAMIENTAS DE ASIENTOS</h5>
        
        <div className="seat-type-selector">
          {Object.entries(seatTypes).map(([type, config]) => (
            <button 
              key={type}
              className={`seat-type-btn ${seatType === type ? 'active' : ''}`}
              onClick={() => setSeatType(type)}
              title={config.description}
            >
              <span className="seat-icon">{config.icon}</span>
              <div className="seat-info">
                <div className="seat-label">{config.label}</div>
                <div className="seat-description">{config.description}</div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="seat-config">
          <div className="config-row">
            <label>Rotación:</label>
            <select>
              <option value={0}>0°</option>
              <option value={90}>90°</option>
              <option value={180}>180°</option>
              <option value={270}>270°</option>
            </select>
          </div>
          
          <div className="config-row">
            <label>Tamaño:</label>
            <select>
              <option value="small">Pequeño</option>
              <option value="medium">Mediano</option>
              <option value="large">Grande</option>
            </select>
          </div>
        </div>
        
        <div className="seat-actions">
          <button className="add-seat-btn" onClick={() => addSeat({ x: 100, y: 100 })}>
            ➕ Añadir Asiento
          </button>
          <button className="add-space-btn" onClick={() => addSeat({ x: 100, y: 100 }, 'empty-space')}>
            ⬜ Añadir Espacio
          </button>
        </div>
      </div>
      
      {/* Herramientas de mesas */}
      <div className="table-tools">
        <h5>🟦 HERRAMIENTAS DE MESAS</h5>
        
        <div className="table-type-selector">
          {Object.entries(tableTypes).map(([type, config]) => (
            <button 
              key={type}
              className={`table-type-btn ${tableType === type ? 'active' : ''}`}
              onClick={() => setTableType(type)}
            >
              <span className="table-icon">{config.icon}</span>
              <div className="table-info">
                <div className="table-label">{config.label}</div>
                <div className="table-description">
                  {config.configurable.includes('width') && `Ancho: ${tableConfig.width}cm`}
                  {config.configurable.includes('radius') && `Radio: ${tableConfig.radius}cm`}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Configuración de mesa */}
        <div className="table-config">
          {tableType === 'rectangular' && (
            <>
              <div className="config-row">
                <label>Ancho (cm):</label>
                <input 
                  type="number"
                  value={tableConfig.width}
                  onChange={(e) => setTableConfig({...tableConfig, width: parseInt(e.target.value)})}
                  min="40"
                  max="300"
                />
              </div>
              <div className="config-row">
                <label>Largo (cm):</label>
                <input 
                  type="number"
                  value={tableConfig.height}
                  onChange={(e) => setTableConfig({...tableConfig, height: parseInt(e.target.value)})}
                  min="40"
                  max="300"
                />
              </div>
            </>
          )}
          
          {tableType === 'circular' && (
            <div className="config-row">
              <label>Radio (cm):</label>
              <input 
                type="number"
                value={tableConfig.radius}
                onChange={(e) => setTableConfig({...tableConfig, radius: parseInt(e.target.value)})}
                min="20"
                max="150"
              />
            </div>
          )}
          
          {tableType === 'oval' && (
            <>
              <div className="config-row">
                <label>Ancho (cm):</label>
                <input 
                  type="number"
                  value={tableConfig.width}
                  onChange={(e) => setTableConfig({...tableConfig, width: parseInt(e.target.value)})}
                  min="40"
                  max="300"
                />
              </div>
              <div className="config-row">
                <label>Largo (cm):</label>
                <input 
                  type="number"
                  value={tableConfig.height}
                  onChange={(e) => setTableConfig({...tableConfig, height: parseInt(e.target.value)})}
                  min="40"
                  max="300"
                />
              </div>
            </>
          )}
          
          <div className="config-row">
            <label>Número de asientos:</label>
            <input 
              type="number"
              value={tableConfig.seatCount}
              onChange={(e) => setTableConfig({...tableConfig, seatCount: parseInt(e.target.value)})}
              min="2"
              max="12"
            />
          </div>
        </div>
        
        <div className="table-actions">
          <button className="add-table-btn" onClick={() => addTable({ x: 200, y: 200 })}>
            ➕ Añadir Mesa
          </button>
        </div>
      </div>
      
      {/* Acciones de edición */}
      <div className="edit-actions">
        <h5>⚡ ACCIONES DE EDICIÓN</h5>
        
        <div className="action-buttons">
          <button 
            className="duplicate-btn"
            onClick={duplicateElement}
            disabled={!selectedElement}
          >
            📋 Duplicar
          </button>
          <button 
            className="delete-btn"
            onClick={deleteElement}
            disabled={!selectedElement}
          >
            🗑️ Eliminar
          </button>
          <button 
            className="front-btn"
            onClick={bringToFront}
            disabled={!selectedElement}
          >
            ⬆️ Traer al Frente
          </button>
          <button 
            className="back-btn"
            onClick={sendToBack}
            disabled={!selectedElement}
          >
            ⬇️ Enviar al Fondo
          </button>
        </div>
      </div>
      
      {/* Lista de elementos */}
      <div className="elements-list">
        <h5>📋 ELEMENTOS EN LA SECCIÓN</h5>
        
        <div className="seats-list">
          <h6>🪑 Asientos ({seats.length})</h6>
          {seats.map(seat => (
            <div 
              key={seat.id}
              className={`element-item ${selectedElement?.id === seat.id ? 'selected' : ''}`}
              onClick={() => setSelectedElement({ ...seat, type: 'seat' })}
            >
              <span className="element-icon">{seatTypes[seat.type].icon}</span>
              <span className="element-info">
                {seatTypes[seat.type].label} - {seat.rotation}° - {seat.size}
              </span>
              <button 
                className="delete-element-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSeat(seat.id);
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
        
        <div className="tables-list">
          <h6>🟦 Mesas ({tables.length})</h6>
          {tables.map(table => (
            <div 
              key={table.id}
              className={`element-item ${selectedElement?.id === table.id ? 'selected' : ''}`}
              onClick={() => setSelectedElement({ ...table, type: 'table' })}
            >
              <span className="element-icon">{tableTypes[table.type].icon}</span>
              <span className="element-info">
                {tableTypes[table.type].label} - {table.config.seatCount} asientos
              </span>
              <button 
                className="delete-element-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTable(table.id);
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Botón de guardar */}
      <div className="save-section">
        <button className="save-btn" onClick={saveSection}>
          💾 Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default SectionEditor;
