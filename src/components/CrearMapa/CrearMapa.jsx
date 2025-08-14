import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Group, Rect, Circle, Text, Line, Shape } from 'react-konva';
import './CrearMapa.css';

// Componentes importados
import ShapeBuilder from './components/ShapeBuilder';
import SectionEditor from './components/SectionEditor';
import ElementProperties from './components/ElementProperties';
import GridPattern from './components/GridPattern';
import CustomShape from './components/CustomShape';
import { showNotification } from './utils/notifications';

const CrearMapa = () => {
  // Estados principales
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [drawingMode, setDrawingMode] = useState('select');
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [clipboard, setClipboard] = useState([]);
  const [selectedElements, setSelectedElements] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  // Referencias
  const stageRef = useRef();
  const isDraggingRef = useRef(false);

  // Interceptar Ctrl+C/V nativo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelectedElements();
      }
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteElements();
      }
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAllElements();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElements();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements]);

  // Manejadores de eventos del canvas
  const handleCanvasClick = (e) => {
    if (drawingMode === 'shape' && isDrawing) {
      const pos = stageRef.current.getPointerPosition();
      addPoint(pos.x, pos.y);
    }
  };

  const handleCanvasMove = (e) => {
    if (isDraggingRef.current) {
      const pos = stageRef.current.getPointerPosition();
      setStagePosition({
        x: pos.x - stagePosition.x,
        y: pos.y - stagePosition.y
      });
    }
  };

  const handleCanvasRelease = () => {
    isDraggingRef.current = false;
  };

  // Funciones de clipboard
  const copySelectedElements = () => {
    if (selectedElements.length > 0) {
      const selected = shapes.filter(shape => selectedElements.includes(shape.id));
      setClipboard(selected);
      showNotification('✅ Copiado al portapapeles', 'success');
    }
  };

  const pasteElements = () => {
    if (clipboard.length > 0) {
      const pastedElements = clipboard.map(element => ({
        ...element,
        id: Date.now() + Math.random(),
        position: {
          x: element.position.x + 20,
          y: element.position.y + 20
        }
      }));
      
      setShapes([...shapes, ...pastedElements]);
      showNotification(`✅ Pegados ${pastedElements.length} elementos`, 'success');
    }
  };

  const selectAllElements = () => {
    const allIds = shapes.map(shape => shape.id);
    setSelectedElements(allIds);
  };

  const deleteSelectedElements = () => {
    if (selectedElements.length > 0) {
      const filteredShapes = shapes.filter(shape => !selectedElements.includes(shape.id));
      setShapes(filteredShapes);
      setSelectedElements([]);
      showNotification('🗑️ Elementos eliminados', 'success');
    }
  };

  // Funciones de shape
  const addPoint = (x, y) => {
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;
    
    const newPoint = { x: snappedX, y: snappedY, id: Date.now() };
    const newPoints = [...points, newPoint];
    setPoints(newPoints);
    
    if (newPoints.length >= 3) {
      createShape(newPoints);
    }
  };

  const createShape = (pointArray) => {
    if (pointArray.length < 3) return;
    
    const shape = {
      id: Date.now(),
      type: 'custom',
      points: pointArray,
      fill: '#4CAF50',
      stroke: '#2E7D32',
      strokeWidth: 2,
      opacity: 0.8,
      position: { x: 0, y: 0 }
    };
    
    setShapes([...shapes, shape]);
    setPoints([]);
    setIsDrawing(false);
    showNotification('✅ Shape creado exitosamente', 'success');
  };

  const handleShapeComplete = (shape) => {
    setShapes([...shapes, shape]);
  };

  const handleSectionEdit = (sectionData) => {
    // Actualizar la sección seleccionada
    const updatedShapes = shapes.map(shape => 
      shape.id === selectedShape?.id ? { ...shape, ...sectionData } : shape
    );
    setShapes(updatedShapes);
    showNotification('✅ Sección actualizada', 'success');
  };

  const selectElement = (id) => {
    setSelectedElements([id]);
    const shape = shapes.find(s => s.id === id);
    setSelectedShape(shape);
  };

  const editShape = (shape) => {
    setSelectedShape(shape);
    setDrawingMode('edit');
  };

  // Funciones de zoom y navegación
  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  
  const moveView = (direction) => {
    const offset = 100;
    switch (direction) {
      case 'up':
        setStagePosition(prev => ({ ...prev, y: prev.y + offset }));
        break;
      case 'down':
        setStagePosition(prev => ({ ...prev, y: prev.y - offset }));
        break;
      case 'left':
        setStagePosition(prev => ({ ...prev, x: prev.x + offset }));
        break;
      case 'right':
        setStagePosition(prev => ({ ...prev, x: prev.x - offset }));
        break;
    }
  };

  const centerView = () => {
    setStagePosition({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="map-editor">
      {/* Header con información */}
      <div className="editor-header">
        <h1>🎨 EDITOR DE MAPA PROFESIONAL</h1>
        <div className="venue-info">
          <span>🏢 Sala: PPLAZA DE TOROS VALLE L...</span>
          <span>🪑 Asientos: 12</span>
        </div>
      </div>
      
      <div className="editor-container">
        {/* Sidebar Izquierda - Herramientas */}
        <div className="left-sidebar">
          <div className="tool-section">
            <h3>🛠️ HERRAMIENTAS PRINCIPALES</h3>
            
            {/* Modos de dibujo */}
            <div className="drawing-modes">
              <button 
                className={drawingMode === 'select' ? 'active' : ''}
                onClick={() => setDrawingMode('select')}
              >
                👆 Seleccionar
              </button>
              <button 
                className={drawingMode === 'shape' ? 'active' : ''}
                onClick={() => setDrawingMode('shape')}
              >
                ✏️ Crear Shape
              </button>
              <button 
                className={drawingMode === 'edit' ? 'active' : ''}
                onClick={() => setDrawingMode('edit')}
              >
                🔧 Editar
              </button>
            </div>
            
            {/* Builder de shapes */}
            {drawingMode === 'shape' && (
              <ShapeBuilder 
                onShapeComplete={handleShapeComplete}
                gridSize={gridSize}
                points={points}
                setPoints={setPoints}
                isDrawing={isDrawing}
                setIsDrawing={setIsDrawing}
              />
            )}
            
            {/* Editor de sección */}
            {drawingMode === 'edit' && (
              <SectionEditor 
                selectedShape={selectedShape}
                onSave={handleSectionEdit}
              />
            )}
          </div>
          
          {/* Acciones rápidas */}
          <div className="quick-actions">
            <h3>⚡ ACCIONES RÁPIDAS</h3>
            <div className="shortcuts">
              <div>📋 <kbd>Ctrl</kbd> + <kbd>C</kbd> Copiar</div>
              <div>📋 <kbd>Ctrl</kbd> + <kbd>V</kbd> Pegar</div>
              <div>📋 <kbd>Ctrl</kbd> + <kbd>A</kbd> Seleccionar Todo</div>
              <div>🗑️ <kbd>Delete</kbd> Eliminar</div>
            </div>
          </div>
        </div>
        
        {/* Canvas Central */}
        <div className="canvas-container">
          <Stage 
            ref={stageRef}
            width={1200} 
            height={800}
            scaleX={zoom}
            scaleY={zoom}
            x={stagePosition.x}
            y={stagePosition.y}
            onMouseDown={handleCanvasClick}
            onMouseMove={handleCanvasMove}
            onMouseUp={handleCanvasRelease}
            draggable={drawingMode === 'select'}
          >
            <Layer>
              {/* Grid de fondo */}
              <GridPattern size={gridSize} />
              
              {/* Stage */}
              <Rect
                x={400}
                y={50}
                width={400}
                height={100}
                fill="#f0f0f0"
                stroke="#333"
                strokeWidth={2}
              />
              <Text
                x={500}
                y={90}
                text="STAGE"
                fontSize={24}
                fill="#333"
                align="center"
              />
              
              {/* Shapes existentes */}
              {shapes.map(shape => (
                <CustomShape
                  key={shape.id}
                  {...shape}
                  isSelected={selectedElements.includes(shape.id)}
                  onSelect={() => selectElement(shape.id)}
                  onEdit={() => editShape(shape)}
                />
              ))}
              
              {/* Puntos de dibujo */}
              {points.map((point, index) => (
                <Circle
                  key={index}
                  x={point.x}
                  y={point.y}
                  radius={6}
                  fill="#0066ff"
                  stroke="#0033cc"
                  strokeWidth={2}
                />
              ))}
              
              {/* Líneas de conexión */}
              {points.length > 1 && (
                <Line
                  points={points.flatMap(p => [p.x, p.y])}
                  stroke="#0066ff"
                  strokeWidth={3}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </Layer>
          </Stage>
        </div>
        
        {/* Sidebar Derecha - Propiedades y Estado */}
        <div className="right-sidebar">
          <div className="status-panel">
            <h3>📊 ESTADO ACTUAL</h3>
            <div className="status-item error">
              ⚠️ 12 asientos sin zona
            </div>
            <div className="status-item success">
              ✅ {selectedElements.length} objetos seleccionados
            </div>
          </div>
          
          {/* Propiedades del elemento seleccionado */}
          {selectedShape && (
            <ElementProperties 
              element={selectedShape}
              onUpdate={(updates) => {
                const updatedShapes = shapes.map(shape => 
                  shape.id === selectedShape.id ? { ...shape, ...updates } : shape
                );
                setShapes(updatedShapes);
              }}
            />
          )}
          
          {/* Controles de zoom y navegación */}
          <div className="view-controls">
            <h3>🔍 CONTROLES DE VISTA</h3>
            <div className="zoom-controls">
              <button onClick={zoomOut}>🔍-</button>
              <button onClick={zoomIn}>🔍+</button>
            </div>
            <div className="navigation-controls">
              <button onClick={() => moveView('up')}>⬆️</button>
              <button onClick={() => moveView('down')}>⬇️</button>
              <button onClick={() => moveView('left')}>⬅️</button>
              <button onClick={() => moveView('right')}>➡️</button>
              <button onClick={centerView}>🎯</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearMapa;
