import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva';
import { message, Button, Switch, Input, Select, Slider, InputNumber, ColorPicker } from 'antd';
import { Mesa, Silla } from './compMapa/MesaSilla';
import SeatmapTypeSelector from './SeatmapTypeSelector';
import './CrearMapa.css';

const CrearMapa = ({ salaId }) => {
  // Estado local básico
  const [elements, setElements] = useState([]);
  const [selectedElements, setSelectedElements] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [seatSize, setSeatSize] = useState(20);
  const [seatShape, setSeatShape] = useState('circle');
  const [currentColor, setCurrentColor] = useState('#48BB78');
  
  // Estado para el selector de tipos
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [hasMapData, setHasMapData] = useState(false);

  // Estado para menús expandibles
  const [expandedMenus, setExpandedMenus] = useState({
    basicTools: true,
    seatingTools: true,
    zoneTools: true,
    tableTools: true,
    shapeTools: true,
    textTools: true,
    selectionTools: true,
    gridConfig: true
  });

  // Estado para herramientas de creación
  const [activeTool, setActiveTool] = useState('select');
  const [drawingMode, setDrawingMode] = useState('seats');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [seatSpacing, setSeatSpacing] = useState(25);
  const [rowSpacing, setRowSpacing] = useState(30);
  const [tableShape, setTableShape] = useState('square');
  const [tableSize, setTableSize] = useState(80);
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Estado para zonas y selección
  const [selectedZone, setSelectedZone] = useState(null);
  const [isInZoneMode, setIsInZoneMode] = useState(false);
  const [zonesFromDashboard, setZonesFromDashboard] = useState([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState(null);

  const stageRef = useRef();

  // Verificar si hay datos del mapa y mostrar selector de tipos si es necesario
  useEffect(() => {
    try {
      if (salaId && elements.length === 0) {
        setShowTypeSelector(true);
        setHasMapData(false);
      } else if (elements.length > 0) {
        setHasMapData(true);
        setShowTypeSelector(false);
      }
    } catch (error) {
      console.error('Error en useEffect:', error);
      setShowTypeSelector(true);
    }
  }, [elements.length, salaId]);

  // Cargar zonas del dashboard
  useEffect(() => {
    const loadZonesFromDashboard = async () => {
      try {
        // Simular carga de zonas del dashboard
        const mockZones = [
          { id: 'dashboard-zone-1', name: 'Zona VIP', color: '#FFD700', x: 100, y: 100, width: 200, height: 150 },
          { id: 'dashboard-zone-2', name: 'Zona General', color: '#87CEEB', x: 400, y: 100, width: 300, height: 200 },
          { id: 'dashboard-zone-3', name: 'Zona Premium', color: '#98FB98', x: 100, y: 300, width: 250, height: 120 }
        ];
        setZonesFromDashboard(mockZones);
      } catch (error) {
        console.error('Error cargando zonas del dashboard:', error);
      }
    };

    if (salaId) {
      loadZonesFromDashboard();
    }
  }, [salaId]);

  // Funciones básicas
  const clearSelection = () => setSelectedElements([]);
  
  const handleElementClick = (id) => {
    if (selectedElements.includes(id)) {
      setSelectedElements(selectedElements.filter(e => e !== id));
    } else {
      setSelectedElements([...selectedElements, id]);
    }
  };
  
  const handleElementDragEnd = (id, e) => {
    const newElements = [...elements];
    const elementIndex = newElements.findIndex(el => el.id === id);
    if (elementIndex !== -1) {
      newElements[elementIndex].x = e.target.x();
      newElements[elementIndex].y = e.target.y();
      setElements(newElements);
    }
  };
  
  const getSeatColor = () => '#48BB78';
  const getZonaColor = () => '#667eea';
  const getBorderColor = () => '#000';
  
  const saveMapa = async () => {
    setLastSavedAt(new Date().toLocaleTimeString());
    message.success('Mapa guardado correctamente');
  };

  // Función para crear templates según el tipo seleccionado
  const createTemplateByType = (type) => {
    try {
      let templateElements = [];
      
      // Template básico para todos los tipos
      templateElements = [
        {
          id: 'stage-1',
          type: 'shape',
          x: 400,
          y: 300,
          width: 100,
          height: 50,
          fill: '#2C3E50',
          stroke: '#34495E',
          strokeWidth: 2,
          tenant_id: salaId,
          name: 'Escenario'
        },
        {
          id: 'seat-1',
          type: 'silla',
          x: 300,
          y: 200,
          width: 20,
          height: 20,
          numero: 1,
          fila: 'A',
          zonaId: 'zona-1',
          estado: 'available',
          shape: 'circle',
          tenant_id: salaId
        },
        {
          id: 'seat-2',
          type: 'silla',
          x: 330,
          y: 200,
          width: 20,
          height: 20,
          numero: 2,
          fila: 'A',
          zonaId: 'zona-1',
          estado: 'available',
          shape: 'circle',
          tenant_id: salaId
        }
      ];
      
      setElements(templateElements);
      setHasMapData(true);
      setShowTypeSelector(false);
      message.success(`Template básico creado para ${type}`);
    } catch (error) {
      console.error('Error creando template:', error);
      message.error('Error al crear el template');
    }
  };

  const handleTypeSelect = (type) => {
    createTemplateByType(type);
  };

  const handleTypeSelectorCancel = () => {
    // No permitir cerrar sin seleccionar
    message.warning('Debes seleccionar un tipo de plano para continuar');
  };

  // Funciones de zoom y paneo
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const resetZoom = () => {
    setZoom(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const handlePanStart = (e) => {
    if (activeTool === 'select') {
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
    }
  };

  const handlePanMove = (e) => {
    if (!isPanning || !panStart || activeTool !== 'select') return;
    
    const newX = stagePosition.x + (e.evt.clientX - panStart.x);
    const newY = stagePosition.y + (e.evt.clientY - panStart.y);
    setStagePosition({ x: newX, y: newY });
    setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  // Funciones de creación de elementos
  const createSeat = (x, y) => {
    const newSeat = {
      id: `seat-${Date.now()}`,
      type: 'silla',
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      width: seatSize,
      height: seatSize,
      numero: elements.filter(e => e.type === 'silla').length + 1,
      fila: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      zonaId: null,
      estado: 'available',
      shape: seatShape,
      tenant_id: salaId,
      color: currentColor
    };
    setElements([...elements, newSeat]);
  };

  const createTable = (x, y) => {
    const newTable = {
      id: `table-${Date.now()}`,
      type: 'mesa',
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      width: tableSize,
      height: tableSize,
      nombre: `Mesa ${elements.filter(e => e.type === 'mesa').length + 1}`,
      zonaId: null,
      tenant_id: salaId,
      shape: tableShape,
      sillas: []
    };
    setElements([...elements, newTable]);
  };

  const createZone = (startX, startY, endX, endY) => {
    const zone = {
      id: `zone-${Date.now()}`,
      type: 'zone',
      x: Math.min(startX, endX),
      y: Math.min(startY, endY),
      width: Math.abs(endX - startX),
      height: Math.abs(endY - startY),
      fill: currentColor + '20',
      stroke: currentColor,
      strokeWidth: 2,
      tenant_id: salaId,
      name: `Zona ${elements.filter(e => e.type === 'zone').length + 1}`
    };
    setElements([...elements, zone]);
  };

  const createShape = (x, y) => {
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
      name: `Forma ${elements.filter(e => e.type === 'shape').length + 1}`
    };
    setElements([...elements, shape]);
  };

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
  };

  // Funciones de selección y manipulación
  const selectByZone = (zoneId) => {
    const zoneElements = elements.filter(el => el.zonaId === zoneId);
    setSelectedElements(zoneElements.map(el => el.id));
  };

  const selectByType = (type) => {
    const typeElements = elements.filter(el => el.type === type);
    setSelectedElements(typeElements.map(el => el.id));
  };

  const moveSelected = (dx, dy) => {
    const newElements = elements.map(el => {
      if (selectedElements.includes(el.id)) {
        return { ...el, x: el.x + dx, y: el.y + dy };
      }
      return el;
    });
    setElements(newElements);
  };

  const deleteSelected = () => {
    if (selectedElements.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }
    const newElements = elements.filter(el => !selectedElements.includes(el.id));
    setElements(newElements);
    setSelectedElements([]);
    message.success(`${selectedElements.length} elementos eliminados`);
  };

  const duplicateSelected = () => {
    if (selectedElements.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }
    const duplicatedElements = selectedElements.map(elementId => {
      const element = elements.find(e => e.id === elementId);
      return {
        ...element,
        id: `${element.id}-copy-${Date.now()}`,
        x: element.x + 50,
        y: element.y + 50
      };
    });
    setElements([...elements, ...duplicatedElements]);
    message.success(`${duplicatedElements.length} elementos duplicados`);
  };

  // Funciones de creación de filas
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

  // Manejadores de eventos del stage
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      
      // Cerrar menú contextual si está abierto
      setShowContextMenu(false);
      
      switch (activeTool) {
        case 'seats':
          createSeat(pointer.x, pointer.y);
          break;
        case 'tables':
          createTable(pointer.x, pointer.y);
          break;
        case 'shapes':
          createShape(pointer.x, pointer.y);
          break;
        case 'text':
          addText(pointer.x, pointer.y);
          break;
        case 'zones':
          if (drawingPoints.length === 0) {
            setDrawingPoints([pointer]);
          } else {
            createZone(drawingPoints[0].x, drawingPoints[0].y, pointer.x, pointer.y);
            setDrawingPoints([]);
            setIsDrawing(false);
          }
          break;
        default:
          clearSelection();
      }
    }
  };

  // Manejar clic derecho para menú contextual
  const handleStageContextMenu = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    setContextMenuPosition({ x: pointer.x, y: pointer.y });
    setContextMenuTarget(e.target);
    setShowContextMenu(true);
  };

  // Entrar en modo zona
  const enterZoneMode = (zoneId) => {
    setSelectedZone(zoneId);
    setIsInZoneMode(true);
    setActiveTool('select');
    message.info(`Modo zona activado: ${zoneId}`);
  };

  // Salir del modo zona
  const exitZoneMode = () => {
    setSelectedZone(null);
    setIsInZoneMode(false);
    setActiveTool('select');
    message.info('Modo zona desactivado');
  };

  // Agregar asientos a una mesa
  const addSeatsToTable = (tableId, count) => {
    const table = elements.find(el => el.id === tableId);
    if (!table) return;

    const newSeats = [];
    const radius = tableSize / 2 + 10;
    
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const x = table.x + tableSize / 2 + Math.cos(angle) * radius;
      const y = table.y + tableSize / 2 + Math.sin(angle) * radius;
      
      newSeats.push({
        id: `seat-${Date.now()}-${i}`,
        type: 'silla',
        x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        width: seatSize,
        height: seatSize,
        numero: i + 1,
        fila: 'M',
        zonaId: table.zonaId,
        estado: 'available',
        shape: seatShape,
        tenant_id: salaId,
        color: currentColor,
        tableId: tableId
      });
    }
    
    setElements([...elements, ...newSeats]);
    message.success(`${count} asientos agregados a la mesa`);
  };

  // Función para renderizar elementos
  const renderElements = useMemo(() => {
    try {
      return elements.map((element) => {
        if (!element || !element.type) return null;
        
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
                showZones={true}
                selectedZone={selectedZone}
                showConnections={true}
                connectionStyle="dashed"
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
                showZones={true}
                selectedZone={selectedZone}
                showConnections={true}
                connectionStyle="dashed"
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
          case 'zone':
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
    } catch (error) {
      console.error('Error renderizando elementos:', error);
      return null;
    }
  }, [elements, selectedElements, selectedZone, handleElementClick, handleElementDragEnd]);

  // Renderizar zonas del dashboard
  const renderDashboardZones = useMemo(() => {
    return zonesFromDashboard.map((zone) => (
      <Group key={zone.id}>
        <Rect
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          fill={zone.color + '20'}
          stroke={zone.color}
          strokeWidth={2}
          opacity={0.6}
          dash={[5, 5]}
        />
        <Text
          x={zone.x + 10}
          y={zone.y + 10}
          text={zone.name}
          fontSize={14}
          fill={zone.color}
          fontStyle="bold"
        />
      </Group>
    ));
  }, [zonesFromDashboard]);

  // Renderizar grid
  const renderGrid = useMemo(() => {
    try {
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
    } catch (error) {
      console.error('Error renderizando grid:', error);
      return null;
    }
  }, [showGrid, gridSize]);

  // Función para alternar menús
  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Manejo de errores
  if (!salaId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Error: No se proporcionó ID de sala</h2>
        <p>Por favor, asegúrate de que se pase el parámetro salaId al componente.</p>
      </div>
    );
  }

  return (
    <div className="crear-mapa-container">
      {/* Panel izquierdo - Herramientas */}
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
                <label>Forma de mesa:</label>
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
                <label>Tamaño de mesa:</label>
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
            <span>🗺️ Herramientas de Zonas</span>
            <span className="expand-icon">
              {expandedMenus.zoneTools ? '▼' : '▶'}
            </span>
          </button>
          {expandedMenus.zoneTools && (
            <div className="section-content">
              <Button 
                onClick={() => {
                  setActiveTool('zones');
                  setDrawingMode('zones');
                  setIsDrawing(true);
                  message.info('Haz clic en dos puntos para crear una zona');
                }}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                📐 Crear Zona
              </Button>

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
            <span>⬜ Herramientas de Formas</span>
            <span className="expand-icon">
              {expandedMenus.shapeTools ? '▼' : '▶'}
            </span>
          </button>
          {expandedMenus.shapeTools && (
            <div className="section-content">
              <Button 
                onClick={() => {
                  setActiveTool('shapes');
                  message.info('Haz clic en el mapa para crear formas');
                }}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                ⬜ Crear Forma
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
              <Input
                placeholder="Ingresa texto..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                style={{ marginBottom: '1rem' }}
              />
              
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
                onClick={() => {
                  setActiveTool('text');
                  message.info('Haz clic en el mapa para agregar texto');
                }}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                📝 Agregar Texto
              </Button>
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
                <Switch
                  checked={snapToGrid}
                  onChange={setSnapToGrid}
                />
                <span>Snap to Grid</span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label>Tamaño del Grid:</label>
                <Slider
                  min={10}
                  max={100}
                  value={gridSize}
                  onChange={setGridSize}
                  style={{ marginTop: '0.5rem' }}
                />
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
                <label>Color actual:</label>
                <ColorPicker
                  value={currentColor}
                  onChange={(color) => setCurrentColor(color.toHexString())}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Área principal del mapa */}
      <main className="map-area">
        {/* Controles superiores */}
        <div className="top-controls">
          <div className="control-group">
            <Button onClick={handleZoomIn}>🔍+</Button>
            <Button onClick={handleZoomOut}>🔍-</Button>
            <Button onClick={resetZoom}>🎯</Button>
          </div>
        </div>

        {/* Estado de guardado - separado y abajo a la izquierda */}
        <div className="saving-status-left">
          <span>✅ Mapa guardado: {lastSavedAt || 'Nunca'}</span>
        </div>

        {/* Indicador de paneo */}
        {isPanning && (
          <div className="panning-indicator">
            <span>🖱️ Paneando - Haz clic para soltar</span>
          </div>
        )}

        {/* Panel de herramientas contextuales */}
        {selectedElements.length > 0 && (
          <div className="context-tools-panel">
            <h4>🛠️ Herramientas para Elemento Seleccionado</h4>
            <div className="context-tools-content">
              {(() => {
                const selectedElement = elements.find(el => el.id === selectedElements[0]);
                if (!selectedElement) return null;
                
                switch (selectedElement.type) {
                  case 'silla':
                    return (
                      <div>
                        <p><strong>Tipo:</strong> Asiento</p>
                        <p><strong>Número:</strong> {selectedElement.numero}</p>
                        <p><strong>Fila:</strong> {selectedElement.fila}</p>
                        <Button 
                          onClick={() => {
                            const newElements = elements.map(el => 
                              el.id === selectedElement.id 
                                ? { ...el, color: currentColor }
                                : el
                            );
                            setElements(newElements);
                            message.success('Color actualizado');
                          }}
                          style={{ marginRight: '0.5rem' }}
                        >
                          🎨 Cambiar Color
                        </Button>
                        <Button 
                          danger
                          onClick={() => deleteSelected()}
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    );
                  case 'mesa':
                    return (
                      <div>
                        <p><strong>Tipo:</strong> Mesa</p>
                        <p><strong>Nombre:</strong> {selectedElement.nombre}</p>
                        <Button 
                          onClick={() => {
                            const count = parseInt(prompt('Cantidad de asientos:', '4')) || 4;
                            addSeatsToTable(selectedElement.id, count);
                          }}
                          style={{ marginRight: '0.5rem' }}
                        >
                          🪑 Agregar Asientos
                        </Button>
                        <Button 
                          onClick={() => {
                            const newElements = elements.map(el => 
                              el.id === selectedElement.id 
                                ? { ...el, color: currentColor }
                                : el
                            );
                            setElements(newElements);
                            message.success('Color actualizado');
                          }}
                          style={{ marginRight: '0.5rem' }}
                        >
                          🎨 Cambiar Color
                        </Button>
                        <Button 
                          danger
                          onClick={() => deleteSelected()}
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    );
                  case 'zone':
                    return (
                      <div>
                        <p><strong>Tipo:</strong> Zona</p>
                        <p><strong>Nombre:</strong> {selectedElement.name}</p>
                        <Button 
                          onClick={() => enterZoneMode(selectedElement.id)}
                          style={{ marginRight: '0.5rem' }}
                        >
                          🚪 Entrar a Zona
                        </Button>
                        <Button 
                          danger
                          onClick={() => deleteSelected()}
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    );
                  default:
                    return (
                      <div>
                        <p><strong>Tipo:</strong> {selectedElement.type}</p>
                        <Button 
                          danger
                          onClick={() => deleteSelected()}
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    );
                }
              })()}
            </div>
          </div>
        )}

        {/* Indicador de modo zona */}
        {isInZoneMode && (
          <div className="zone-mode-indicator">
            <span>🏠 Modo Zona: {selectedZone}</span>
            <Button 
              size="small"
              onClick={exitZoneMode}
              style={{ marginLeft: '1rem' }}
            >
              🚪 Salir de Zona
            </Button>
          </div>
        )}

        {/* Stage de Konva */}
        <Stage
          ref={stageRef}
          width={window.innerWidth - 380}
          height={window.innerHeight - 100}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePosition.x}
          y={stagePosition.y}
          onMouseDown={handlePanStart}
          onMousemove={handlePanMove}
          onMouseup={handlePanEnd}
          onTouchstart={handlePanStart}
          onTouchmove={handlePanMove}
          onTouchend={handlePanEnd}
          onClick={handleStageClick}
          onContextMenu={handleStageContextMenu}
        >
          <Layer>
            {/* Grid de fondo */}
            {renderGrid}
            
            {/* Zonas del dashboard */}
            {renderDashboardZones}
            
            {/* Elementos del mapa */}
            {renderElements}

            {/* Línea de dibujo para zonas */}
            {drawingPoints.length === 2 && (
              <Line
                points={[drawingPoints[0].x, drawingPoints[0].y, drawingPoints[1].x, drawingPoints[1].y]}
                stroke="#ff0000"
                strokeWidth={2}
                dash={[5, 5]}
              />
            )}
          </Layer>
        </Stage>

        {/* Menú contextual */}
        {showContextMenu && (
          <div
            style={{
              position: 'absolute',
              left: contextMenuPosition.x + stagePosition.x,
              top: contextMenuPosition.y + stagePosition.y,
              zIndex: 1000,
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '0.5rem 0',
              minWidth: '150px'
            }}
          >
            <div
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#374151',
                borderBottom: '1px solid #f3f4f6'
              }}
              onClick={() => {
                if (contextMenuTarget && contextMenuTarget.attrs && contextMenuTarget.attrs.id) {
                  const elementId = contextMenuTarget.attrs.id;
                  const element = elements.find(el => el.id === elementId);
                  if (element && element.type === 'mesa') {
                    const count = parseInt(prompt('Cantidad de asientos:', '4')) || 4;
                    addSeatsToTable(elementId, count);
                  }
                }
                setShowContextMenu(false);
              }}
            >
              🪑 Agregar Asientos
            </div>
            <div
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#374151',
                borderBottom: '1px solid #f3f4f6'
              }}
              onClick={() => {
                if (contextMenuTarget && contextMenuTarget.attrs && contextMenuTarget.attrs.id) {
                  const elementId = contextMenuTarget.attrs.id;
                  handleElementClick(elementId);
                }
                setShowContextMenu(false);
              }}
            >
              👆 Seleccionar
            </div>
            <div
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#dc2626'
              }}
              onClick={() => {
                if (contextMenuTarget && contextMenuTarget.attrs && contextMenuTarget.attrs.id) {
                  const elementId = contextMenuTarget.attrs.id;
                  const newElements = elements.filter(el => el.id !== elementId);
                  setElements(newElements);
                  message.success('Elemento eliminado');
                }
                setShowContextMenu(false);
              }}
            >
              🗑️ Eliminar
            </div>
          </div>
        )}
      </main>

      {/* Selector de tipos de plano */}
      {showTypeSelector && (
        <SeatmapTypeSelector
          visible={showTypeSelector}
          onSelect={handleTypeSelect}
          onCancel={handleTypeSelectorCancel}
        />
      )}
    </div>
  );
};

export default CrearMapa;
