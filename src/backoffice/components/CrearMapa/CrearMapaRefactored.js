import React, { useState, useEffect, useMemo, useRef } from 'react';
import { message } from 'antd';
import { Group, Rect, Text } from 'react-konva';
import SeatmapTypeSelector from '../SeatmapTypeSelector';
import EditorSidebar from './components/EditorSidebar';
import MapArea from './components/MapArea';
import TopControls from './components/TopControls';
import ZoomControls from './components/ZoomControls';
import InfoPanel from './components/InfoPanel';
import ContextMenu from './components/ContextMenu';
import ContextToolsPanel from './components/ContextToolsPanel';
import StatusIndicators from './components/StatusIndicators';
import './CrearMapa.css';

const CrearMapaRefactored = ({ salaId }) => {
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
    basicTools: false,
    seatingTools: false,
    zoneTools: false,
    tableTools: false,
    shapeTools: false,
    textTools: false,
    selectionTools: false,
    gridConfig: false,
    numeration: false
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

  // Estados para modo numeración
  const [numerationMode, setNumerationMode] = useState(null);
  const [editingElement, setEditingElement] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Estados para selección por arrastre
  const [selectionRect, setSelectionRect] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);

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

  // Funciones de utilidad
  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Funciones de zoom y paneo
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const resetZoom = () => {
    setZoom(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const handlePanStart = (e) => {
    if (e.evt.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
    }
  };

  const handlePanMove = (e) => {
    if (!isPanning || !panStart) return;
    
    const newX = stagePosition.x + (e.evt.clientX - panStart.x);
    const newY = stagePosition.y + (e.evt.clientY - panStart.y);
    setStagePosition({ x: newX, y: newY });
    setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
    setPanStart(null);
  };

  // Selección por arrastre
  const handleMouseDown = (e) => {
    if (e.evt.button === 0) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      setSelectionStart(pointer);
      setIsSelecting(true);
      setSelectionRect({
        x: pointer.x,
        y: pointer.y,
        width: 0,
        height: 0
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isSelecting || !selectionStart) return;
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    setSelectionRect({
      x: Math.min(selectionStart.x, pointer.x),
      y: Math.min(selectionStart.y, pointer.y),
      width: Math.abs(pointer.x - selectionStart.x),
      height: Math.abs(pointer.y - selectionStart.y)
    });
  };

  const handleMouseUp = (e) => {
    if (!isSelecting || !selectionRect) return;
    
    const elementsInSelection = elements.filter(element => {
      return element.x >= selectionRect.x && 
             element.x <= selectionRect.x + selectionRect.width &&
             element.y >= selectionRect.y && 
             element.y <= selectionRect.y + selectionRect.height;
    });
    
    if (elementsInSelection.length > 0) {
      setSelectedElements(elementsInSelection.map(el => el.id));
    }
    
    setIsSelecting(false);
    setSelectionRect(null);
    setSelectionStart(null);
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
      zonaId: selectedZone,
      estado: 'available',
      shape: seatShape,
      tenant_id: salaId,
      color: currentColor
    };
    setElements(prev => [...prev, newSeat]);
  };

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
        zonaId: selectedZone,
        estado: 'available',
        shape: seatShape,
        tenant_id: salaId,
        color: currentColor
      });
    }
    
    setElements(prev => [...prev, ...newSeats]);
    message.success(`Fila de ${count} asientos creada`);
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
      zonaId: selectedZone,
      tenant_id: salaId,
      color: currentColor,
      shape: tableShape
    };
    
    setElements(prev => [...prev, newTable]);
    message.success('Mesa creada');
  };

  const createZone = (x, y, width, height) => {
    const newZone = {
      id: `zone-${Date.now()}`,
      type: 'zone',
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      width: width || 200,
      height: height || 150,
      nombre: `Zona ${elements.filter(e => e.type === 'zone').length + 1}`,
      tenant_id: salaId,
      color: currentColor
    };
    
    setElements(prev => [...prev, newZone]);
    message.success('Zona creada');
  };

  const createShape = (x, y, type = 'rect') => {
    const newShape = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      width: 50,
      height: 50,
      shapeType: type,
      tenant_id: salaId,
      color: currentColor
    };
    
    setElements(prev => [...prev, newShape]);
    message.success('Forma creada');
  };

  const addText = (x, y) => {
    if (!textContent.trim()) {
      message.warning('Escribe algo de texto primero');
      return;
    }
    
    const newText = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      text: textContent,
      fontSize: fontSize,
      tenant_id: salaId,
      color: currentColor
    };
    
    setElements(prev => [...prev, newText]);
    setTextContent('');
    message.success('Texto agregado');
  };

  // Funciones de selección y manipulación
  const clearSelection = () => {
    setSelectedElements([]);
    message.info('Selección limpiada');
  };

  const selectByType = (type) => {
    const elementsOfType = elements.filter(el => el.type === type);
    if (elementsOfType.length > 0) {
      setSelectedElements(elementsOfType.map(el => el.id));
      message.success(`${elementsOfType.length} elementos de tipo ${type} seleccionados`);
    } else {
      message.info(`No hay elementos de tipo ${type}`);
    }
  };

  const moveSelected = (deltaX = 0, deltaY = 0) => {
    if (selectedElements.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }

    const newElements = elements.map(el => {
      if (selectedElements.includes(el.id)) {
        return {
          ...el,
          x: el.x + deltaX,
          y: el.y + deltaY
        };
      }
      return el;
    });

    setElements(newElements);
    message.success('Elementos movidos');
  };

  const duplicateSelected = () => {
    if (selectedElements.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }

    const newElements = [];
    selectedElements.forEach(selectedId => {
      const original = elements.find(el => el.id === selectedId);
      if (original) {
        const duplicate = {
          ...original,
          id: `${original.type}-${Date.now()}-${Math.random()}`,
          x: original.x + 20,
          y: original.y + 20
        };
        newElements.push(duplicate);
      }
    });

    setElements([...elements, ...newElements]);
    message.success(`${newElements.length} elementos duplicados`);
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

  // Funciones de numeración
  const activateNumerationMode = (mode) => {
    if (numerationMode === mode) {
      setNumerationMode(null);
      setEditingElement(null);
      setEditingValue('');
    } else {
      setNumerationMode(mode);
      setEditingElement(null);
      setEditingValue('');
    }
  };

  const startEditing = (element) => {
    setEditingElement(element);
    if (numerationMode === 'seats') {
      setEditingValue(element.numero || '');
    } else if (numerationMode === 'tables') {
      setEditingValue(element.nombre || '');
    } else if (numerationMode === 'rows') {
      setEditingValue(element.fila || '');
    }
  };

  const saveEditing = () => {
    if (!editingElement || !editingValue.trim()) return;

    const newElements = elements.map(el => {
      if (el.id === editingElement.id) {
        if (numerationMode === 'seats') {
          return { ...el, numero: editingValue.trim() };
        } else if (numerationMode === 'tables') {
          return { ...el, nombre: editingValue.trim() };
        } else if (numerationMode === 'rows') {
          return { ...el, fila: editingValue.trim() };
        }
      }
      return el;
    });

    setElements(newElements);
    setEditingElement(null);
    setEditingValue('');
    message.success('Cambio guardado');
  };

  const cancelEditing = () => {
    setEditingElement(null);
    setEditingValue('');
  };

  const getSeatsByRow = () => {
    const seatsByRow = {};
    elements.filter(el => el.type === 'silla').forEach(seat => {
      if (!seatsByRow[seat.fila]) {
        seatsByRow[seat.fila] = [];
      }
      seatsByRow[seat.fila].push(seat);
    });
    return seatsByRow;
  };

  const editRowName = (oldFilaName, newFilaName) => {
    if (!newFilaName.trim()) return;

    const newElements = elements.map(el => {
      if (el.type === 'silla' && el.fila === oldFilaName) {
        return { ...el, fila: newFilaName.trim() };
      }
      return el;
    });

    setElements(newElements);
    message.success(`Fila ${oldFilaName} renombrada a ${newFilaName.trim()}`);
  };

  // Funciones de zona
  const enterZoneMode = (zoneId) => {
    setSelectedZone(zoneId);
    setIsInZoneMode(true);
    setActiveTool('select');
    message.info(`Modo zona activado: ${zoneId}`);
  };

  const exitZoneMode = () => {
    setSelectedZone(null);
    setIsInZoneMode(false);
    setActiveTool('select');
    message.info('Modo zona desactivado');
  };

  // Función para guardar el mapa
  const saveMapa = async () => {
    try {
      if (!salaId) {
        message.error('No hay sala seleccionada');
        return;
      }

      if (elements.length === 0) {
        message.warning('No hay elementos para guardar');
        return;
      }

      const mapData = {
        salaId: salaId,
        elements: elements,
        lastModified: new Date().toISOString(),
        tenant_id: salaId
      };

      console.log('Guardando mapa:', mapData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSavedAt(new Date());
      message.success('Mapa guardado correctamente');
    } catch (error) {
      console.error('Error guardando mapa:', error);
      message.error('Error al guardar el mapa');
    }
  };

  // Funciones de eventos del stage
  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      
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

  const handleStageContextMenu = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    setContextMenuPosition({ x: pointer.x, y: pointer.y });
    setContextMenuTarget(e.target);
    setShowContextMenu(true);
  };

  const handleElementClick = (elementId) => {
    if (selectedElements.includes(elementId)) {
      setSelectedElements(selectedElements.filter(id => id !== elementId));
    } else {
      setSelectedElements([...selectedElements, elementId]);
    }
  };

  const handleElementDragEnd = (elementId, e) => {
    const newElements = elements.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          x: e.target.x(),
          y: e.target.y()
        };
      }
      return el;
    });
    setElements(newElements);
  };

  // Renderizar indicadores de filas
  const renderRowIndicators = useMemo(() => {
    if (numerationMode !== 'rows') return null;
    
    const seatsByRow = getSeatsByRow();
    const rowIndicators = [];
    
    Object.entries(seatsByRow).forEach(([filaName, seats]) => {
      if (seats.length === 0) return;
      
      const avgX = seats.reduce((sum, seat) => sum + seat.x, 0) / seats.length;
      const avgY = seats.reduce((sum, seat) => sum + seat.y, 0) / seats.length;
      
      rowIndicators.push(
        <Group key={`row-${filaName}`}>
          <Rect
            x={avgX - 30}
            y={avgY - 35}
            width={60}
            height={25}
            fill="rgba(255, 255, 255, 0.95)"
            stroke="#667eea"
            strokeWidth={1}
            cornerRadius={6}
          />
          {editingElement?.type === 'row' && editingElement?.fila === filaName ? (
            <Text
              x={avgX - 28}
              y={avgY - 33}
              text={editingValue}
              fontSize={14}
              fill="#667eea"
              fontStyle="bold"
              align="center"
              width={56}
            />
          ) : (
            <Text
              x={avgX - 25}
              y={avgY - 30}
              text={filaName}
              fontSize={14}
              fill="#667eea"
              fontStyle="bold"
              align="center"
              width={50}
              onClick={() => setEditingElement({ type: 'row', fila: filaName })}
              cursor="pointer"
            />
          )}
        </Group>
      );
    });
    
    return rowIndicators;
  }, [numerationMode, elements, editingElement, editingValue]);

  // Renderizar zonas del dashboard
  const renderDashboardZones = useMemo(() => {
    if (isInZoneMode) return null;
    
    return zonesFromDashboard.map(zone => (
      <Rect
        key={zone.id}
        x={zone.x}
        y={zone.y}
        width={zone.width}
        height={zone.height}
        fill={zone.color + '10'}
        stroke={zone.color}
        strokeWidth={1}
        dash={[5, 5]}
        onClick={() => enterZoneMode(zone.id)}
        cursor="pointer"
      />
    ));
  }, [zonesFromDashboard, isInZoneMode]);

  // Funciones de utilidad para colores
  const getSeatColor = (seat) => seat.color || '#48BB78';
  const getZonaColor = (element) => element.color || '#87CEEB';
  const getBorderColor = (element) => '#000000';

  // Agregar asientos a una mesa
  const addSeatsToTable = (tableId, seatCounts) => {
    const table = elements.find(el => el.id === tableId);
    if (!table) return;

    const newSeats = [];
    let seatNumber = 1;

    // Asientos arriba
    for (let i = 0; i < seatCounts.up; i++) {
      newSeats.push({
        id: `seat-${Date.now()}-${seatNumber++}`,
        type: 'silla',
        x: table.x + (table.width / 2) - (seatCounts.up * seatSpacing / 2) + (i * seatSpacing),
        y: table.y - seatSize - 10,
        width: seatSize,
        height: seatSize,
        numero: seatNumber - 1,
        fila: 'A',
        zonaId: table.zonaId,
        estado: 'available',
        shape: seatShape,
        tenant_id: salaId,
        color: currentColor
      });
    }

    // Asientos abajo
    for (let i = 0; i < seatCounts.down; i++) {
      newSeats.push({
        id: `seat-${Date.now()}-${seatNumber++}`,
        type: 'silla',
        x: table.x + (table.width / 2) - (seatCounts.down * seatSpacing / 2) + (i * seatSpacing),
        y: table.y + table.height + 10,
        width: seatSize,
        height: seatSize,
        numero: seatNumber - 1,
        fila: 'B',
        zonaId: table.zonaId,
        estado: 'available',
        shape: seatShape,
        tenant_id: salaId,
        color: currentColor
      });
    }

    // Asientos izquierda
    for (let i = 0; i < seatCounts.left; i++) {
      newSeats.push({
        id: `seat-${Date.now()}-${seatNumber++}`,
        type: 'silla',
        x: table.x - seatSize - 10,
        y: table.y + (table.height / 2) - (seatCounts.left * seatSpacing / 2) + (i * seatSpacing),
        width: seatSize,
        height: seatSize,
        numero: seatNumber - 1,
        fila: 'C',
        zonaId: table.zonaId,
        estado: 'available',
        shape: seatShape,
        tenant_id: salaId,
        color: currentColor
      });
    }

    // Asientos derecha
    for (let i = 0; i < seatCounts.right; i++) {
      newSeats.push({
        id: `seat-${Date.now()}-${seatNumber++}`,
        type: 'silla',
        x: table.x + table.width + 10,
        y: table.y + (table.height / 2) - (seatCounts.right * seatSpacing / 2) + (i * seatSpacing),
        width: seatSize,
        height: seatSize,
        numero: seatNumber - 1,
        fila: 'D',
        zonaId: table.zonaId,
        estado: 'available',
        shape: seatShape,
        tenant_id: salaId,
        color: currentColor
      });
    }

    setElements(prev => [...prev, ...newSeats]);
    message.success(`${newSeats.length} asientos agregados a la mesa`);
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
      <h1>Editor de Mapa - Versión Simplificada</h1>
      <p>Sala ID: {salaId}</p>
      <p>Elementos: {elements.length}</p>
      <p>Estado: {showTypeSelector ? 'Mostrando selector' : 'Editor activo'}</p>
      
      {/* Selector de tipo de mapa */}
      {showTypeSelector && (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
          <h3>Selector de Tipo de Mapa</h3>
          <p>Selecciona el tipo de mapa que quieres crear:</p>
          <button onClick={() => {
            setActiveTool('seats');
            setShowTypeSelector(false);
            setHasMapData(true);
          }}>Filas con secciones</button>
          <button onClick={() => {
            setActiveTool('tables');
            setShowTypeSelector(false);
            setHasMapData(true);
          }}>Mesas</button>
        </div>
      )}

      {/* Panel izquierdo - Herramientas */}
      <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
        <h3>Panel de Herramientas</h3>
        <p>Herramienta activa: {activeTool}</p>
        <button onClick={() => setActiveTool('seats')}>Crear Asientos</button>
        <button onClick={() => setActiveTool('tables')}>Crear Mesas</button>
        <button onClick={() => setActiveTool('select')}>Seleccionar</button>
      </div>

      {/* Área principal del mapa */}
      <div className="map-area" style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
        <h3>Área del Mapa</h3>
        <p>Zoom: {zoom}</p>
        <p>Posición: X={stagePosition.x}, Y={stagePosition.y}</p>
        <p>Grid: {showGrid ? 'Visible' : 'Oculto'} (Tamaño: {gridSize})</p>
        
        {/* Controles básicos */}
        <div style={{ margin: '10px 0' }}>
          <button onClick={handleZoomIn}>🔍+</button>
          <button onClick={handleZoomOut}>🔍-</button>
          <button onClick={resetZoom}>🎯</button>
          <button onClick={saveMapa}>💾 Guardar</button>
        </div>

        {/* Área de canvas simplificada */}
        <div style={{ 
          width: '600px', 
          height: '400px', 
          border: '2px solid #333', 
          backgroundColor: '#f0f0f0',
          position: 'relative',
          margin: '20px auto'
        }}>
          <p style={{ textAlign: 'center', marginTop: '180px' }}>
            Área del Canvas (Konva.js)
          </p>
          {elements.length > 0 && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '5px' }}>
              <strong>Elementos creados:</strong>
              <ul>
                {elements.map(el => (
                  <li key={el.id}>{el.type} - {el.numero || el.nombre || 'Sin nombre'}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Información del estado */}
        <div style={{ margin: '20px 0', padding: '10px', background: '#f9f9f9' }}>
          <h4>Estado del Editor:</h4>
          <p>Elementos seleccionados: {selectedElements.length}</p>
          <p>Zona seleccionada: {selectedZone || 'Ninguna'}</p>
          <p>Modo zona: {isInZoneMode ? 'Activo' : 'Inactivo'}</p>
          <p>Último guardado: {lastSavedAt ? lastSavedAt.toLocaleString() : 'Nunca'}</p>
        </div>
      </div>
    </div>
  );
};

export default CrearMapaRefactored;
