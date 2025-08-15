import React from 'react';
import { Button, Switch, Input, Select, Slider, InputNumber, ColorPicker } from 'antd';
import { message } from 'antd';

const EditorSidebar = ({
  salaId,
  elements,
  expandedMenus,
  toggleMenu,
  numerationMode,
  activateNumerationMode,
  activeTool,
  setActiveTool,
  seatShape,
  setSeatShape,
  seatSize,
  setSeatSize,
  seatSpacing,
  setSeatSpacing,
  rowSpacing,
  setRowSpacing,
  tableShape,
  setTableShape,
  tableSize,
  setTableSize,
  showGrid,
  setShowGrid,
  gridSize,
  setGridSize,
  snapToGrid,
  setSnapToGrid,
  currentColor,
  setCurrentColor,
  textContent,
  setTextContent,
  fontSize,
  setFontSize,
  createSeatRow,
  selectByType,
  moveSelected,
  duplicateSelected,
  deleteSelected,
  saveMapa,
  clearSelection,
  setShowTypeSelector
}) => {
  return (
    <aside className="editor-sidebar">
      <h3 className="editor-title">🛠 Editor de Mapa</h3>
      
      <div className="sala-info">
        <div className="info-row">
          <span>Sala:</span>
          <span className="info-value">{salaId}</span>
        </div>
        <div className="info-row">
          <span>Elementos:</span>
          <span className="info-value">{elements.length}</span>
        </div>
      </div>

      {/* Herramientas Básicas */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('basicTools')}
        >
          <span>🛠️ Herramientas Básicas</span>
          <span className="expand-icon">
            {expandedMenus.basicTools ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.basicTools && (
          <div className="section-content">
            <Button 
              type="primary" 
              onClick={() => setShowTypeSelector(true)}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              🎯 Cambiar Tipo de Plano
            </Button>
            
            <Button 
              onClick={saveMapa}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              💾 Guardar Mapa
            </Button>
            
            <Button 
              onClick={clearSelection}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              🧹 Limpiar Selección
            </Button>
          </div>
        )}
      </div>

      {/* Herramientas de Asientos */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('seatingTools')}
        >
          <span>🪑 Herramientas de Asientos</span>
          <span className="expand-icon">
            {expandedMenus.seatingTools ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.seatingTools && (
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <label>Forma:</label>
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
              <label>Tamaño:</label>
              <Slider
                min={10}
                max={50}
                value={seatSize}
                onChange={setSeatSize}
                style={{ marginTop: '0.5rem' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Espaciado:</label>
              <Slider
                min={15}
                max={50}
                value={seatSpacing}
                onChange={setSeatSpacing}
                style={{ marginTop: '0.5rem' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Espaciado entre filas:</label>
              <Slider
                min={20}
                max={60}
                value={rowSpacing}
                onChange={setRowSpacing}
                style={{ marginTop: '0.5rem' }}
              />
            </div>

            <Button 
              onClick={() => {
                const count = parseInt(prompt('Cantidad de asientos:', '10')) || 10;
                createSeatRow(100, 100, count, 'horizontal');
              }}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              ➡️ Fila Horizontal
            </Button>

            <Button 
              onClick={() => {
                const count = parseInt(prompt('Cantidad de asientos:', '10')) || 10;
                createSeatRow(100, 100, count, 'vertical');
              }}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              ⬇️ Fila Vertical
            </Button>
          </div>
        )}
      </div>

      {/* Herramientas de Mesas */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('tableTools')}
        >
          <span>🍽️ Herramientas de Mesas</span>
          <span className="expand-icon">
            {expandedMenus.tableTools ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.tableTools && (
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <label>Forma:</label>
              <Select
                value={tableShape}
                onChange={setTableShape}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <Select.Option value="square">⬜ Cuadrada</Select.Option>
                <Select.Option value="circle">🔵 Redonda</Select.Option>
              </Select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Tamaño:</label>
              <Slider
                min={40}
                max={200}
                value={tableSize}
                onChange={setTableSize}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Herramientas de Zonas */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('zoneTools')}
        >
          <span>🏗️ Herramientas de Zonas</span>
          <span className="expand-icon">
            {expandedMenus.zoneTools ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.zoneTools && (
          <div className="section-content">
            <Button 
              onClick={() => selectByType('zone')}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              🎯 Seleccionar Todas las Zonas
            </Button>
          </div>
        )}
      </div>

      {/* Herramientas de Formas */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('shapeTools')}
        >
          <span>🔷 Herramientas de Formas</span>
          <span className="expand-icon">
            {expandedMenus.shapeTools ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.shapeTools && (
          <div className="section-content">
            <Button 
              onClick={() => setActiveTool('shapes')}
              type={activeTool === 'shapes' ? 'primary' : 'default'}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              🔷 Crear Formas
            </Button>
          </div>
        )}
      </div>

      {/* Herramientas de Texto */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('textTools')}
        >
          <span>📝 Herramientas de Texto</span>
          <span className="expand-icon">
            {expandedMenus.textTools ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.textTools && (
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <label>Texto:</label>
              <Input
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Escribe el texto..."
                style={{ marginTop: '0.5rem' }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Tamaño de fuente:</label>
              <Slider
                min={8}
                max={48}
                value={fontSize}
                onChange={setFontSize}
                style={{ marginTop: '0.5rem' }}
              />
            </div>

            <Button 
              onClick={() => setActiveTool('text')}
              type={activeTool === 'text' ? 'primary' : 'default'}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              📝 Agregar Texto
            </Button>
          </div>
        )}
      </div>

      {/* Sección de Numeración */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('numeration')}
        >
          <span>🔢 Numeración</span>
          <span className="expand-icon">
            {expandedMenus.numeration ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.numeration && (
          <div className="section-content">
            <button 
              className={`section-button ${numerationMode === 'seats' ? 'active' : ''}`}
              onClick={() => activateNumerationMode('seats')}
            >
              🪑 Numeración de Asientos
            </button>
            <button 
              className={`section-button ${numerationMode === 'tables' ? 'active' : ''}`}
              onClick={() => activateNumerationMode('tables')}
            >
              🍽️ Numeración de Mesas
            </button>
            <button 
              className={`section-button ${numerationMode === 'rows' ? 'active' : ''}`}
              onClick={() => activateNumerationMode('rows')}
            >
              📏 Numeración de Filas
            </button>
            
            {numerationMode && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                  <strong>Modo activo:</strong> {numerationMode === 'seats' ? 'Asientos' : numerationMode === 'tables' ? 'Mesas' : 'Filas'}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  💡 Haz clic en los elementos para editarlos
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Herramientas de Selección */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('selectionTools')}
        >
          <span>👆 Herramientas de Selección</span>
          <span className="expand-icon">
            {expandedMenus.selectionTools ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.selectionTools && (
          <div className="section-content">
            <Button 
              onClick={() => setActiveTool('select')}
              type={activeTool === 'select' ? 'primary' : 'default'}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              👆 Seleccionar
            </Button>

            <Button 
              onClick={() => setActiveTool('seats')}
              type={activeTool === 'seats' ? 'primary' : 'default'}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              🪑 Crear Asientos
            </Button>

            <Button 
              onClick={() => setActiveTool('tables')}
              type={activeTool === 'tables' ? 'primary' : 'default'}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              🍽️ Crear Mesas
            </Button>

            <Button 
              onClick={() => selectByType('silla')}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              🎯 Seleccionar Todos los Asientos
            </Button>

            <Button 
              onClick={() => selectByType('mesa')}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              🎯 Seleccionar Todas las Mesas
            </Button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Button size="small" onClick={() => moveSelected(-10, 0)}>⬅️</Button>
              <Button size="small" onClick={() => moveSelected(10, 0)}>➡️</Button>
              <Button size="small" onClick={() => moveSelected(0, -10)}>⬆️</Button>
              <Button size="small" onClick={() => moveSelected(0, 10)}>⬇️</Button>
            </div>

            <Button 
              onClick={duplicateSelected}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            >
              📋 Duplicar Seleccionados
            </Button>

            <Button 
              danger
              onClick={deleteSelected}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              🗑️ Eliminar Seleccionados
            </Button>
          </div>
        )}
      </div>

      {/* Configuración de Grid */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('gridConfig')}
        >
          <span>📐 Configuración de Grid</span>
          <span className="expand-icon">
            {expandedMenus.gridConfig ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.gridConfig && (
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <Switch
                checked={showGrid}
                onChange={setShowGrid}
              />
              <span>Mostrar Grid</span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Tamaño de Grid:</label>
              <Slider
                min={10}
                max={100}
                value={gridSize}
                onChange={setGridSize}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <Switch
                checked={snapToGrid}
                onChange={setSnapToGrid}
              />
              <span>Snap to Grid</span>
            </div>
          </div>
        )}
      </div>

      {/* Configuración de Color */}
      <div className="menu-section">
        <button 
          className="section-header"
          onClick={() => toggleMenu('colorConfig')}
        >
          <span>🎨 Configuración de Color</span>
          <span className="expand-icon">
            {expandedMenus.colorConfig ? '▼' : '▶'}
          </span>
        </button>
        {expandedMenus.colorConfig && (
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <label>Color Principal:</label>
              <ColorPicker
                value={currentColor}
                onChange={setCurrentColor}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default EditorSidebar;
