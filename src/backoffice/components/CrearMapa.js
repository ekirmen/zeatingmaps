import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Image } from 'react-konva';
import { message, Button, Switch, Input, Select, Slider, ColorPicker } from 'antd';
import { Mesa, Silla } from './compMapa/MesaSilla';
import { useCrearMapa } from '../hooks/useCrearMapa';
import './CrearMapa.css';

const { Option } = Select;

const CrearMapa = ({ salaId }) => {
  const {
    elements,
    setElements,
    selectedElements,
    setSelectedElements,
    zoom,
    setZoom,
    stagePosition,
    setStagePosition,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    activeMode,
    setActiveMode,
    isCreatingSection,
    setIsCreatingSection,
    sectionPoints,
    setSectionPoints,
    lastSavedAt,
    savingProgress,
    loadedZonas,
    salaInfo,
    showNumeracion,
    setShowNumeracion,
    clearSelection,
    handleElementClick,
    handleElementDoubleClick,
    handleElementDragEnd,
    handleZoom,
    resetZoom,
    getSeatColor,
    getZonaColor,
    getBorderColor,
    showZones,
    selectedZone,
    showConnections,
    connectionStyle,
    fetchZonasPorSala,
    fetchSalaById,
    syncSeatsForSala,
    saveMapa
  } = useCrearMapa(salaId);

  const [toolMode, setToolMode] = useState('select'); // select, draw, text, shape
  const [drawingMode, setDrawingMode] = useState('seats'); // seats, sections, shapes
  const [seatShape, setSeatShape] = useState('circle'); // circle, square, rectangle
  const [seatSize, setSeatSize] = useState(20);
  const [seatSpacing, setSeatSpacing] = useState(25);
  const [rowSpacing, setRowSpacing] = useState(30);
  const [currentColor, setCurrentColor] = useState('#48BB78');
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [selectedTool, setSelectedTool] = useState('select');

  const stageRef = useRef();
  const isDrawingRef = useRef(false);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Z para deshacer
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // Implementar deshacer
        message.info('Función de deshacer próximamente');
      }
      
      // Ctrl/Cmd + Y para rehacer
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        // Implementar rehacer
        message.info('Función de rehacer próximamente');
      }
      
      // Delete para eliminar elementos seleccionados
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      }
      
      // Ctrl/Cmd + D para duplicar
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      }
      
      // Ctrl/Cmd + S para guardar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleGuardarMapa();
      }
      
      // Escape para limpiar selección
      if (e.key === 'Escape') {
        clearSelection();
      }
      
      // Teclas numéricas para cambiar herramientas
      switch (e.key) {
        case '1':
          handleToolSelect('select');
          break;
        case '2':
          handleToolSelect('seats');
          break;
        case '3':
          handleToolSelect('sections');
          break;
        case '4':
          handleToolSelect('shapes');
          break;
        case '5':
          handleToolSelect('text');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, elements, clearSelection, handleDeleteSelected, handleDuplicateSelected, handleGuardarMapa, handleToolSelect]);

  // Cargar datos iniciales
  useEffect(() => {
    if (salaId) {
      fetchSalaById(salaId);
      fetchZonasPorSala(salaId);
    }
  }, [salaId, fetchSalaById, fetchZonasPorSala]);

  // Agregar elementos de prueba si no hay ninguno
  useEffect(() => {
    if (elements.length === 0 && salaId) {
      createStadiumTemplate();
    }
  }, [elements.length, salaId]);

  // Función para crear un template de stadium
  const createStadiumTemplate = () => {
    const centerX = 400;
    const centerY = 300;
    const templateElements = [];

    // Crear secciones del stadium
    const sections = [
      { name: 'VIP', color: '#FFD700', radius: 80, seats: 8 },
      { name: 'Premium', color: '#FF6B6B', radius: 120, seats: 12 },
      { name: 'General', color: '#4ECDC4', radius: 160, seats: 16 },
      { name: 'Economy', color: '#45B7D1', radius: 200, seats: 20 }
    ];

    sections.forEach((section, sectionIndex) => {
      const sectionId = `section-${sectionIndex + 1}`;
      
      // Crear asientos en círculo para cada sección
      for (let i = 0; i < section.seats; i++) {
        const angle = (i * 2 * Math.PI) / section.seats;
        const x = centerX + Math.cos(angle) * section.radius;
        const y = centerY + Math.sin(angle) * section.radius;
        
        templateElements.push({
          id: `seat-${sectionIndex}-${i}`,
          type: 'silla',
          x: x,
          y: y,
          width: seatSize,
          height: seatSize,
          numero: i + 1,
          fila: String.fromCharCode(65 + sectionIndex),
          zonaId: sectionId,
          estado: 'available',
          shape: seatShape,
          tenant_id: salaId,
          color: section.color,
          section: section.name
        });
      }

      // Agregar etiqueta de sección
      templateElements.push({
        id: `label-${sectionId}`,
        type: 'text',
        x: centerX + Math.cos(0) * section.radius,
        y: centerY + Math.sin(0) * section.radius - 30,
        text: section.name,
        fontSize: 18,
        fill: section.color,
        fontStyle: 'bold',
        tenant_id: salaId
      });
    });

    // Agregar escenario central
    templateElements.push({
      id: 'stage',
      type: 'shape',
      x: centerX - 40,
      y: centerY - 20,
      width: 80,
      height: 40,
      fill: '#2C3E50',
      stroke: '#34495E',
      strokeWidth: 2,
      tenant_id: salaId,
      name: 'Escenario'
    });

    setElements(templateElements);
    message.success('Template de stadium creado');
  };

  // Funciones de herramientas
  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
    setActiveMode(tool);
    
    switch (tool) {
      case 'select':
        setToolMode('select');
        break;
      case 'seats':
        setToolMode('draw');
        setDrawingMode('seats');
        break;
      case 'sections':
        setToolMode('draw');
        setDrawingMode('sections');
        break;
      case 'shapes':
        setToolMode('draw');
        setDrawingMode('shapes');
        break;
      case 'text':
        setToolMode('text');
        break;
      default:
        setToolMode('select');
    }
  };

  // Función para crear fila de asientos
  const createSeatRow = (startX, startY, count, direction = 'horizontal') => {
    const newSeats = [];
    const currentRow = String.fromCharCode(65 + elements.filter(e => e.type === 'silla').length % 26);
    
    for (let i = 0; i < count; i++) {
      const x = direction === 'horizontal' ? startX + (i * seatSpacing) : startX;
      const y = direction === 'horizontal' ? startY : startY + (i * seatSpacing);
      
      newSeats.push({
        id: `seat-${Date.now()}-${i}`,
        type: 'silla',
        x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        width: seatSize,
        height: seatSize,
        numero: i + 1,
        fila: currentRow,
        zonaId: null,
        estado: 'available',
        shape: seatShape,
        tenant_id: salaId,
        color: currentColor
      });
    }
    
    setElements([...elements, ...newSeats]);
    message.success(`Fila de ${count} asientos creada`);
  };

  // Función para crear sección rectangular
  const createSection = (startX, startY, endX, endY) => {
    const sectionId = `section-${Date.now()}`;
    const section = {
      id: sectionId,
      type: 'section',
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
      fill: currentColor,
      stroke: '#000',
      strokeWidth: 2,
      tenant_id: salaId,
      name: `Sección ${elements.filter(e => e.type === 'section').length + 1}`
    };
    
    setElements([...elements, section]);
    message.success('Sección creada');
  };

  // Función para crear forma personalizada
  const createShape = (x, y, shapeType) => {
    const shape = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      width: seatSize * 2,
      height: seatSize * 2,
      fill: currentColor,
      stroke: '#000',
      strokeWidth: 2,
      tenant_id: salaId,
      shapeType: shapeType,
      name: `${shapeType} ${elements.filter(e => e.type === 'shape').length + 1}`
    };
    
    setElements([...elements, shape]);
    message.success(`${shapeType} creado`);
  };

  // Función para agregar texto
  const addText = (x, y) => {
    if (!textContent.trim()) {
      message.warning('Ingresa texto antes de agregar');
      return;
    }
    
    const textElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      text: textContent,
      fontSize: fontSize,
      fill: currentColor,
      tenant_id: salaId
    };
    
    setElements([...elements, textElement]);
    setTextContent('');
    message.success('Texto agregado');
  };

  // Manejadores de eventos del stage
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      
      switch (toolMode) {
        case 'draw':
          if (drawingMode === 'seats') {
            const newSeat = {
              id: `seat-${Date.now()}`,
              type: 'silla',
              x: snapToGrid ? Math.round(pointer.x / gridSize) * gridSize : pointer.x,
              y: snapToGrid ? Math.round(pointer.y / gridSize) * gridSize : pointer.y,
              width: seatSize,
              height: seatSize,
              numero: elements.filter(e => e.type === 'silla').length + 1,
              fila: 'A',
              zonaId: null,
              estado: 'available',
              shape: seatShape,
              tenant_id: salaId,
              color: currentColor
            };
            setElements([...elements, newSeat]);
            message.success('Asiento creado');
          } else if (drawingMode === 'shapes') {
            createShape(pointer.x, pointer.y, 'rectangle');
          }
          break;
        case 'text':
          addText(pointer.x, pointer.y);
          break;
        default:
          clearSelection();
      }
    }
  };

  // Función para manejar el zoom con rueda del mouse
  const handleStageWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setZoom(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Función para eliminar elementos seleccionados
  const handleDeleteSelected = () => {
    if (selectedElements.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }
    
    const newElements = elements.filter(element => !selectedElements.includes(element.id));
    setElements(newElements);
    setSelectedElements([]);
    message.success(`${selectedElements.length} elementos eliminados`);
  };

  // Función para duplicar elementos seleccionados
  const handleDuplicateSelected = () => {
    if (selectedElements.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }
    
    const duplicatedElements = [];
    selectedElements.forEach(elementId => {
      const element = elements.find(e => e.id === elementId);
      if (element) {
        const duplicated = {
          ...element,
          id: `${element.id}-copy-${Date.now()}`,
          x: element.x + 50,
          y: element.y + 50
        };
        duplicatedElements.push(duplicated);
      }
    });
    
    setElements([...elements, ...duplicatedElements]);
    message.success(`${duplicatedElements.length} elementos duplicados`);
  };

  // Función para alinear elementos
  const handleAlignElements = (alignment) => {
    if (selectedElements.length < 2) {
      message.warning('Selecciona al menos 2 elementos para alinear');
      return;
    }
    
    const selectedElementObjects = elements.filter(e => selectedElements.includes(e.id));
    const newElements = [...elements];
    
    switch (alignment) {
      case 'left':
        const leftmostX = Math.min(...selectedElementObjects.map(e => e.x));
        selectedElementObjects.forEach(element => {
          const index = newElements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            newElements[index].x = leftmostX;
          }
        });
        break;
      case 'center':
        const centerX = selectedElementObjects.reduce((sum, e) => sum + e.x, 0) / selectedElementObjects.length;
        selectedElementObjects.forEach(element => {
          const index = newElements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            newElements[index].x = centerX;
          }
        });
        break;
      case 'right':
        const rightmostX = Math.max(...selectedElementObjects.map(e => e.x));
        selectedElementObjects.forEach(element => {
          const index = newElements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            newElements[index].x = rightmostX;
          }
        });
        break;
      case 'top':
        const topmostY = Math.min(...selectedElementObjects.map(e => e.y));
        selectedElementObjects.forEach(element => {
          const index = newElements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            newElements[index].y = topmostY;
          }
        });
        break;
      case 'middle':
        const middleY = selectedElementObjects.reduce((sum, e) => sum + e.y, 0) / selectedElementObjects.length;
        selectedElementObjects.forEach(element => {
          const index = newElements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            newElements[index].y = middleY;
          }
        });
        break;
      case 'bottom':
        const bottommostY = Math.max(...selectedElementObjects.map(e => e.y));
        selectedElementObjects.forEach(element => {
          const index = newElements.findIndex(e => e.id === element.id);
          if (index !== -1) {
            newElements[index].y = bottommostY;
          }
        });
        break;
    }
    
    setElements(newElements);
    message.success(`Elementos alineados: ${alignment}`);
  };

  const handleStageMouseDown = (e) => {
    if (e.target === e.target.getStage() && drawingMode === 'sections') {
      setIsDrawing(true);
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      setDrawingPoints([pointer]);
    }
  };

  const handleStageMouseMove = (e) => {
    if (isDrawing && drawingMode === 'sections') {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      setDrawingPoints([drawingPoints[0], pointer]);
    }
  };

  const handleStageMouseUp = (e) => {
    if (isDrawing && drawingMode === 'sections' && drawingPoints.length === 2) {
      createSection(drawingPoints[0].x, drawingPoints[0].y, drawingPoints[1].x, drawingPoints[1].y);
      setIsDrawing(false);
      setDrawingPoints([]);
    }
  };

  // Funciones de zoom mejoradas
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setStagePosition({ x: 0, y: 0 });
  };

  // Funciones de guardado y carga
  const handleGuardarMapa = async () => {
    try {
      await saveMapa();
      message.success('Mapa guardado correctamente');
    } catch (error) {
      message.error('Error al guardar el mapa');
    }
  };

  const handleLimpiarTodo = () => {
    setElements([]);
    message.success('Mapa limpiado');
  };

  // Función para renderizar elementos
  const renderElements = useMemo(() => {
    return elements.map((element) => {
      switch (element.type) {
        case 'silla':
          return (
            <Silla
              key={element.id}
              silla={element}
              isSelected={selectedElements.includes(element.id)}
              onClick={() => handleElementClick(element.id)}
              onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              getSeatColor={getSeatColor}
              getZonaColor={getZonaColor}
              getBorderColor={getBorderColor}
              showZones={showZones}
              selectedZone={selectedZone}
              showConnections={showConnections}
              connectionStyle={connectionStyle}
            />
          );
        case 'mesa':
          return (
            <Mesa
              key={element.id}
              mesa={element}
              isSelected={selectedElements.includes(element.id)}
              onClick={() => handleElementClick(element.id)}
              onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              getSeatColor={getSeatColor}
              getZonaColor={getZonaColor}
              getBorderColor={getBorderColor}
              showZones={showZones}
              selectedZone={selectedZone}
              showConnections={showConnections}
              connectionStyle={connectionStyle}
            />
          );
        case 'text':
          return (
            <Text
              key={element.id}
              x={element.x}
              y={element.y}
              text={element.text}
              fontSize={element.fontSize || 16}
              fill={element.fill || '#000'}
              fontStyle={element.fontStyle}
              draggable={true}
              onClick={() => handleElementClick(element.id)}
              onDragEnd={(e) => handleElementDragEnd(element.id, e)}
            />
          );
        case 'shape':
          return (
            <Rect
              key={element.id}
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              fill={element.fill}
              stroke={element.stroke}
              strokeWidth={element.strokeWidth}
              draggable={true}
              onClick={() => handleElementClick(element.id)}
              onDragEnd={(e) => handleElementDragEnd(element.id, e)}
            />
          );
        case 'section':
          return (
            <Rect
              key={element.id}
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              fill={element.fill}
              stroke={element.stroke}
              strokeWidth={element.strokeWidth}
              opacity={0.3}
              draggable={true}
              onClick={() => handleElementClick(element.id)}
              onDragEnd={(e) => handleElementDragEnd(element.id, e)}
            />
          );
        default:
          return null;
      }
    });
  }, [elements, selectedElements, handleElementClick, handleElementDragEnd, getSeatColor, getZonaColor, getBorderColor, showZones, selectedZone, showConnections, connectionStyle]);

  // Renderizar grid
  const renderGrid = useMemo(() => {
    if (!showGrid) return null;
    
    const gridLines = [];
    const stageWidth = 2000;
    const stageHeight = 2000;
    
    // Líneas verticales
    for (let i = 0; i <= stageWidth; i += gridSize) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, stageHeight]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }
    
    // Líneas horizontales
    for (let i = 0; i <= stageHeight; i += gridSize) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, stageWidth, i]}
          stroke="#e0e0e0"
          strokeWidth={0.5}
        />
      );
    }
    
    return gridLines;
  }, [showGrid, gridSize]);

  // Renderizar línea de dibujo
  const renderDrawingLine = useMemo(() => {
    if (drawingPoints.length !== 2) return null;
    
    return (
      <Line
        points={[drawingPoints[0].x, drawingPoints[0].y, drawingPoints[1].x, drawingPoints[1].y]}
        stroke="#ff0000"
        strokeWidth={2}
        dash={[5, 5]}
      />
    );
  }, [drawingPoints]);

  return (
    <div className="crear-mapa-container">
      {/* Panel izquierdo - Herramientas */}
      <aside className="editor-sidebar">
        <h3 className="editor-title">🏟️ Editor de Stadium</h3>
        
        {/* Información de la sala */}
        <div className="sala-info">
          <div className="sala-info-row">
            <span className="sala-info-label">Sala</span>
            <span className="sala-info-value">{salaInfo?.nombre || 'sala 1'}</span>
          </div>
          <div className="sala-info-row">
            <span className="sala-info-label">Asientos</span>
            <span className="sala-info-value">{elements.filter(e => e.type === 'silla').length}</span>
          </div>
          <div className="sala-info-row">
            <span className="sala-info-label">Secciones</span>
            <span className="sala-info-value">{elements.filter(e => e.type === 'section').length}</span>
          </div>
        </div>

        {/* Herramientas principales */}
        <div className="edit-modes">
          <h4>Herramientas</h4>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${selectedTool === 'select' ? 'active' : ''}`}
              onClick={() => handleToolSelect('select')}
            >
              👆 Seleccionar
            </button>
            <button 
              className={`mode-button ${selectedTool === 'seats' ? 'active' : ''}`}
              onClick={() => handleToolSelect('seats')}
            >
              🪑 Asientos
            </button>
            <button 
              className={`mode-button ${selectedTool === 'sections' ? 'active' : ''}`}
              onClick={() => handleToolSelect('sections')}
            >
              📐 Secciones
            </button>
            <button 
              className={`mode-button ${selectedTool === 'shapes' ? 'active' : ''}`}
              onClick={() => handleToolSelect('shapes')}
            >
              ⬜ Formas
            </button>
            <button 
              className={`mode-button ${selectedTool === 'text' ? 'active' : ''}`}
              onClick={() => handleToolSelect('text')}
            >
              📝 Texto
            </button>
          </div>
        </div>

        {/* Configuración de asientos */}
        <div className="menu-section">
          <button className="section-header">
            <span>Configuración de Asientos</span>
          </button>
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <label>Forma:</label>
              <Select 
                value={seatShape} 
                onChange={setSeatShape}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <Option value="circle">🔵 Redondo</Option>
                <Option value="square">⬜ Cuadrado</Option>
                <Option value="rectangle">⬜ Rectángulo</Option>
              </Select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Tamaño: {seatSize}px</label>
              <Slider 
                min={10} 
                max={50} 
                value={seatSize} 
                onChange={setSeatSize}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Espaciado: {seatSpacing}px</label>
              <Slider 
                min={15} 
                max={50} 
                value={seatSpacing} 
                onChange={setSeatSpacing}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Color:</label>
              <div style={{ marginTop: '0.5rem' }}>
                <input 
                  type="color" 
                  value={currentColor} 
                  onChange={(e) => setCurrentColor(e.target.value)}
                  style={{ width: '100%', height: '40px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Crear filas de asientos */}
        <div className="menu-section">
          <button className="section-header">
            <span>Crear Filas</span>
          </button>
          <div className="section-content">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Input 
                placeholder="Cantidad" 
                type="number" 
                min="1" 
                max="50"
                defaultValue="10"
                id="seatCount"
              />
              <Button 
                type="primary" 
                onClick={() => {
                  const count = parseInt(document.getElementById('seatCount').value) || 10;
                  createSeatRow(100, 100, count, 'horizontal');
                }}
              >
                ➡️ Horizontal
              </Button>
            </div>
            <Button 
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={() => {
                const count = parseInt(document.getElementById('seatCount').value) || 10;
                createSeatRow(100, 100, count, 'vertical');
              }}
            >
              ⬇️ Vertical
            </Button>
          </div>
        </div>

        {/* Configuración de grid */}
        <div className="menu-section">
          <button className="section-header">
            <span>Configuración de Grid</span>
          </button>
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <Switch 
                checked={showGrid} 
                onChange={setShowGrid}
                style={{ marginRight: '0.5rem' }}
              />
              <span>Mostrar Grid</span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <Switch 
                checked={snapToGrid} 
                onChange={setSnapToGrid}
                style={{ marginRight: '0.5rem' }}
              />
              <span>Snap to Grid</span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Tamaño de Grid: {gridSize}px</label>
              <Slider 
                min={10} 
                max={50} 
                value={gridSize} 
                onChange={setGridSize}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
          </div>
        </div>

        {/* Configuración de texto */}
        {toolMode === 'text' && (
          <div className="menu-section">
            <button className="section-header">
              <span>Configuración de Texto</span>
            </button>
            <div className="section-content">
              <Input 
                placeholder="Ingresa texto..." 
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              />
              <div style={{ marginBottom: '1rem' }}>
                <label>Tamaño: {fontSize}px</label>
                <Slider 
                  min={8} 
                  max={48} 
                  value={fontSize} 
                  onChange={setFontSize}
                  style={{ marginTop: '0.5rem' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Herramientas de edición */}
        <div className="menu-section">
          <button className="section-header">
            <span>Herramientas de Edición</span>
          </button>
          <div className="section-content">
            <Button 
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={handleDeleteSelected}
              disabled={selectedElements.length === 0}
            >
              🗑️ Eliminar Seleccionados
            </Button>
            <Button 
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={handleDuplicateSelected}
              disabled={selectedElements.length === 0}
            >
              📋 Duplicar Seleccionados
            </Button>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Alinear Elementos:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <Button 
                  size="small"
                  onClick={() => handleAlignElements('left')}
                  disabled={selectedElements.length < 2}
                >
                  ⬅️ Izquierda
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleAlignElements('center')}
                  disabled={selectedElements.length < 2}
                >
                  ↔️ Centro
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleAlignElements('right')}
                  disabled={selectedElements.length < 2}
                >
                  ➡️ Derecha
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleAlignElements('top')}
                  disabled={selectedElements.length < 2}
                >
                  ⬆️ Arriba
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleAlignElements('middle')}
                  disabled={selectedElements.length < 2}
                >
                  ↕️ Medio
                </Button>
                <Button 
                  size="small"
                  onClick={() => handleAlignElements('bottom')}
                  disabled={selectedElements.length < 2}
                >
                  ⬇️ Abajo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="menu-section">
          <button className="section-header">
            <span>Acciones</span>
          </button>
          <div className="section-content">
            <Button 
              type="primary" 
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={handleGuardarMapa}
            >
              💾 Guardar Mapa
            </Button>
            <Button 
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={createStadiumTemplate}
            >
              🏟️ Template Stadium
            </Button>
            <Button 
              danger
              style={{ width: '100%' }}
              onClick={handleLimpiarTodo}
            >
              🗑️ Limpiar Todo
            </Button>
          </div>
        </div>
      </aside>

      {/* Área principal del mapa */}
      <div className="map-area">
        {/* Controles superiores */}
        <div className="top-controls">
          <span className="control-label">Herramienta: {selectedTool}</span>
          <span className="control-label">Zoom: {Math.round(zoom * 100)}%</span>
          <span className="control-label">Elementos: {elements.length}</span>
          <span className="control-label">Seleccionados: {selectedElements.length}</span>
        </div>

        {/* Estado de guardado */}
        <div className="saving-status">
          <span>✅ Mapa guardado: {lastSavedAt || 'Nunca'}</span>
        </div>

        {/* Indicador de paneo */}
        {isPanning && (
          <div className="panning-indicator">
            🖱️ Paneando mapa... Haz clic para soltar
          </div>
        )}

        {/* Stage de Konva */}
        <Stage
          ref={stageRef}
          width={window.innerWidth - 320}
          height={window.innerHeight}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleStageWheel}
          onClick={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          draggable={toolMode === 'select'}
        >
          <Layer>
            {/* Grid */}
            {renderGrid}
            
            {/* Línea de dibujo */}
            {renderDrawingLine}
            
            {/* Elementos del mapa */}
            {renderElements}
          </Layer>
        </Stage>

        {/* Controles de zoom */}
        <div className="zoom-controls">
          <button 
            className="zoom-button primary" 
            title="Zoom In"
            onClick={handleZoomIn}
          >
            🔍+
          </button>
          <button 
            className="zoom-button primary" 
            title="Zoom Out"
            onClick={handleZoomOut}
          >
            🔍-
          </button>
          <button 
            className="zoom-button secondary" 
            title="Reset Zoom"
            onClick={handleResetZoom}
          >
            🎯
          </button>
        </div>

        {/* Panel de información */}
        <div className="info-panel">
          <h4 className="error-title">📊 Estadísticas del Mapa</h4>
          <div className="info-item">
            <span>🎫 Asientos:</span>
            <span className="info-count">{elements.filter(e => e.type === 'silla').length}</span>
          </div>
          <div className="info-item">
            <span>📐 Secciones:</span>
            <span className="info-count">{elements.filter(e => e.type === 'section').length}</span>
          </div>
          <div className="info-item">
            <span>⬜ Formas:</span>
            <span className="info-count">{elements.filter(e => e.type === 'shape').length}</span>
          </div>
          <div className="info-item">
            <span>📝 Textos:</span>
            <span className="info-count">{elements.filter(e => e.type === 'text').length}</span>
          </div>
          <div className="info-item">
            <span>👆 Seleccionados:</span>
            <span className="info-count">{selectedElements.length}</span>
          </div>
          <div className="info-item">
            <span>🔍 Zoom:</span>
            <span className="info-count">{Math.round(zoom * 100)}%</span>
          </div>
          {selectedElements.length > 0 && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e', fontSize: '0.875rem' }}>📋 Elementos Seleccionados</h5>
              {selectedElements.slice(0, 3).map(id => {
                const element = elements.find(e => e.id === id);
                return (
                  <div key={id} style={{ fontSize: '0.75rem', color: '#0369a1', marginBottom: '0.25rem' }}>
                    • {element?.type || 'Desconocido'} - {element?.name || element?.id}
                  </div>
                );
              })}
              {selectedElements.length > 3 && (
                <div style={{ fontSize: '0.75rem', color: '#0369a1', fontStyle: 'italic' }}>
                  ... y {selectedElements.length - 3} más
                </div>
              )}
            </div>
          )}

          {/* Atajos de teclado */}
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#92400e', fontSize: '0.875rem' }}>⌨️ Atajos de Teclado</h5>
            <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
              <div style={{ marginBottom: '0.25rem' }}>• <strong>1-5:</strong> Cambiar herramientas</div>
              <div style={{ marginBottom: '0.25rem' }}>• <strong>Delete:</strong> Eliminar seleccionados</div>
              <div style={{ marginBottom: '0.25rem' }}>• <strong>Ctrl+D:</strong> Duplicar</div>
              <div style={{ marginBottom: '0.25rem' }}>• <strong>Ctrl+S:</strong> Guardar</div>
              <div style={{ marginBottom: '0.25rem' }}>• <strong>Escape:</strong> Limpiar selección</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearMapa;
