import React, { useState, useEffect, useMemo, useRef } from 'react';
import { message } from 'antd';
import { Group, Rect, Text, Line, Circle } from 'react-konva';
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
import { Stage, Layer } from 'react-konva';

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

  // Estado para el estado de los asientos
  const [seatLocks, setSeatLocks] = useState([]);
  const [seatReservations, setSeatReservations] = useState([]);
  const [soldTickets, setSoldTickets] = useState([]);
  const [currentFuncionId, setCurrentFuncionId] = useState(null);

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
        // Aquí cargarías las zonas reales de la base de datos
        // const response = await fetch(`/api/zonas?sala_id=${salaId}&tenant_id=${tenantId}`);
        // const realZones = await response.json();
        
        // Por ahora uso datos mock pero con la estructura real
        const mockZones = [
          { 
            id: 1, 
            nombre: 'Zona VIP', 
            aforo: 50, 
            color: '#FFD700', 
            numerada: true, 
            sala_id: salaId, 
            tenant_id: salaId 
          },
          { 
            id: 2, 
            nombre: 'Zona General', 
            aforo: 200, 
            color: '#87CEEB', 
            numerada: true, 
            sala_id: salaId, 
            tenant_id: salaId 
          },
          { 
            id: 3, 
            nombre: 'Zona Premium', 
            aforo: 100, 
            color: '#98FB98', 
            numerada: true, 
            sala_id: salaId, 
            tenant_id: salaId 
          }
        ];
        setZonesFromDashboard(mockZones);
      } catch (error) {
        console.error('Error cargando zonas del dashboard:', error);
      }
    };

    // Cargar estado de los asientos
    const loadSeatStatus = async () => {
      try {
        // Simular datos de la base de datos
        // En producción, aquí harías las llamadas reales:
        // const locksResponse = await fetch(`/api/seat-locks?sala_id=${salaId}&funcion_id=${currentFuncionId}`);
        // const reservationsResponse = await fetch(`/api/reservas?sala_id=${salaId}&funcion_id=${currentFuncionId}`);
        // const ticketsResponse = await fetch(`/api/tickets?sala_id=${salaId}&funcion_id=${currentFuncionId}`);
        
        // Datos mock para demostración
        const mockLocks = [
          { seat_id: 'seat-1', table_id: null, funcion_id: 1, status: 'locked', lock_type: 'seat' },
          { seat_id: 'seat-5', table_id: null, funcion_id: 1, status: 'locked', lock_type: 'seat' }
        ];
        
        const mockReservations = [
          { silla_id: 'seat-3', funcion_id: 1, estado: 'reservado' },
          { silla_id: 'seat-7', funcion_id: 1, estado: 'pendiente' }
        ];
        
        const mockSoldTickets = [
          { silla_id: 'seat-2', funcion_id: 1, estado: 'vendido' },
          { silla_id: 'seat-4', funcion_id: 1, estado: 'vendido' }
        ];
        
        setSeatLocks(mockLocks);
        setSeatReservations(mockReservations);
        setSoldTickets(mockSoldTickets);
        setCurrentFuncionId(1); // ID de función por defecto
        
      } catch (error) {
        console.error('Error cargando estado de asientos:', error);
      }
    };

    if (salaId) {
      loadZonesFromDashboard();
      loadSeatStatus();
      
      // Intentar cargar mapa guardado
      const savedMap = localStorage.getItem(`mapa-sala-${salaId}`);
      if (savedMap) {
        try {
          const mapData = JSON.parse(savedMap);
          if (mapData.elements && mapData.elements.length > 0) {
            setElements(mapData.elements);
            setHasMapData(true);
            setShowTypeSelector(false);
            if (mapData.lastSavedAt) {
              setLastSavedAt(new Date(mapData.lastSavedAt));
            }
            message.info(`Mapa cargado con ${mapData.elements.length} elementos`);
          }
        } catch (error) {
          console.error('Error cargando mapa guardado:', error);
        }
      }
    }
  }, [salaId]);

  // Cargar estado de los asientos para una función específica
  const loadSeatStatusForFuncion = async (funcionId) => {
    try {
      // En producción, aquí harías las llamadas reales a la API:
      // const locksResponse = await fetch(`/api/seat-locks?sala_id=${salaId}&funcion_id=${funcionId}`);
      // const reservationsResponse = await fetch(`/api/reservas?sala_id=${salaId}&funcion_id=${funcionId}`);
      // const ticketsResponse = await fetch(`/api/tickets?sala_id=${salaId}&funcion_id=${funcionId}`);
      
      // Datos mock para demostración - cambiar según la función
      let mockLocks, mockReservations, mockSoldTickets;
      
      switch (funcionId) {
        case 1:
          mockLocks = [
            { seat_id: 'seat-1', table_id: null, funcion_id: 1, status: 'locked', lock_type: 'seat' },
            { seat_id: 'seat-5', table_id: null, funcion_id: 1, status: 'locked', lock_type: 'seat' }
          ];
          mockReservations = [
            { silla_id: 'seat-3', funcion_id: 1, estado: 'reservado' },
            { silla_id: 'seat-7', funcion_id: 1, estado: 'pendiente' }
          ];
          mockSoldTickets = [
            { silla_id: 'seat-2', funcion_id: 1, estado: 'vendido' },
            { silla_id: 'seat-4', funcion_id: 1, estado: 'vendido' }
          ];
          break;
        case 2:
          mockLocks = [
            { seat_id: 'seat-2', table_id: null, funcion_id: 2, status: 'locked', lock_type: 'seat' }
          ];
          mockReservations = [
            { silla_id: 'seat-1', funcion_id: 2, estado: 'reservado' },
            { silla_id: 'seat-6', funcion_id: 2, estado: 'pendiente' }
          ];
          mockSoldTickets = [
            { silla_id: 'seat-3', funcion_id: 2, estado: 'vendido' }
          ];
          break;
        case 3:
          mockLocks = [];
          mockReservations = [
            { silla_id: 'seat-1', funcion_id: 3, estado: 'reservado' }
          ];
          mockSoldTickets = [];
          break;
        default:
          mockLocks = [];
          mockReservations = [];
          mockSoldTickets = [];
      }
      
      setSeatLocks(mockLocks);
      setSeatReservations(mockReservations);
      setSoldTickets(mockSoldTickets);
      
      message.success(`Estado de asientos cargado para Función ${funcionId}`);
      
    } catch (error) {
      console.error('Error cargando estado de asientos para función:', error);
      message.error('Error al cargar el estado de los asientos');
    }
  };

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
      x: x - seatSize / 2,
      y: y - seatSize / 2,
      width: seatSize,
      height: seatSize,
      color: seatShape === 'circle' ? '#48BB78' : '#48BB78',
      shape: seatShape,
      numero: elements.filter(el => el.type === 'silla').length + 1
    };

    // Si estamos en modo zona, asignar automáticamente el color de la zona
    if (isInZoneMode && selectedZone) {
      const zone = zonesFromDashboard.find(z => z.id === selectedZone);
      if (zone) {
        newSeat.color = zone.color;
        newSeat.zonaId = zone.id;
        newSeat.zonaNombre = zone.nombre;
        newSeat.zonaColor = zone.color;
      }
    }

    setElements(prev => [...prev, newSeat]);
  };

  // Crear fila de asientos
  const createSeatRow = (startX, startY, endX, endY) => {
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const seatCount = Math.floor(distance / seatSpacing);
    
    if (seatCount < 1) return;
    
    const newSeats = [];
    const zone = isInZoneMode && selectedZone ? zonesFromDashboard.find(z => z.id === selectedZone) : null;
    
    for (let i = 0; i < seatCount; i++) {
      const progress = i / (seatCount - 1);
      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;
      
      const newSeat = {
        id: `seat-${Date.now()}-${i}`,
        type: 'silla',
        x: x - seatSize / 2,
        y: y - seatSize / 2,
        width: seatSize,
        height: seatSize,
        color: zone ? zone.color : '#48BB78', // Usar color de zona si está disponible
        shape: seatShape,
        numero: elements.filter(el => el.type === 'silla').length + i + 1,
        zonaId: zone ? zone.id : null,
        zonaNombre: zone ? zone.nombre : null,
        zonaColor: zone ? zone.color : null
      };
      
      newSeats.push(newSeat);
    }
    
    setElements(prev => [...prev, ...newSeats]);
    message.success(`Fila de ${seatCount} asientos creada`);
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

  // Asignar zona a elementos seleccionados
  const assignZoneToSelected = (zoneId) => {
    if (selectedElements.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }

    const zone = zonesFromDashboard.find(z => z.id === zoneId);
    if (!zone) {
      message.error('Zona no encontrada');
      return;
    }

    const newElements = elements.map(el => {
      if (selectedElements.includes(el.id)) {
        // Para asientos, cambiar el color al color de la zona
        if (el.type === 'silla') {
          return {
            ...el,
            zonaId: zoneId,
            zonaNombre: zone.nombre,
            zonaColor: zone.color,
            color: zone.color // Cambiar el color del asiento al color de la zona
          };
        }
        // Para otros elementos, solo asignar la zona
        return {
          ...el,
          zonaId: zoneId,
          zonaNombre: zone.nombre,
          zonaColor: zone.color
        };
      }
      return el;
    });

    setElements(newElements);
    message.success(`${selectedElements.length} elementos asignados a la zona "${zone.nombre}"`);
    
    // Limpiar selección después de asignar
    setSelectedElements([]);
  };

  // Seleccionar elementos por zona
  const selectByZone = (zoneId) => {
    const elementsInZone = elements.filter(el => el.zonaId === zoneId);
    if (elementsInZone.length > 0) {
      setSelectedElements(elementsInZone.map(el => el.id));
      message.success(`${elementsInZone.length} elementos de la zona seleccionados`);
    } else {
      message.info('No hay elementos en esta zona');
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

    // Verificar si hay asientos protegidos
    const protectedSeats = selectedElements.filter(elementId => {
      const element = elements.find(el => el.id === elementId);
      return element && element.type === 'silla' && !canDeleteSeat(elementId);
    });

    if (protectedSeats.length > 0) {
      const protectedSeatsInfo = protectedSeats.map(elementId => {
        const element = elements.find(el => el.id === elementId);
        const status = getSeatStatus(elementId);
        const statusMessage = getSeatStatusMessage(elementId);
        return `${element.numero || elementId} (${statusMessage})`;
      });

      const warningMessage = `No se pueden eliminar los siguientes asientos:\n${protectedSeatsInfo.join('\n')}`;
      
      message.error(warningMessage, 5);
      return;
    }

    // Filtrar elementos que se pueden eliminar
    const deletableElements = selectedElements.filter(elementId => {
      const element = elements.find(el => el.id === elementId);
      if (element && element.type === 'silla') {
        return canDeleteSeat(elementId);
      }
      return true; // Otros tipos de elementos se pueden eliminar
    });

    if (deletableElements.length === 0) {
      message.warning('No hay elementos que se puedan eliminar');
      return;
    }

    const newElements = elements.filter(el => !deletableElements.includes(el.id));
    setElements(newElements);
    setSelectedElements([]);
    message.success(`${deletableElements.length} elementos eliminados`);
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
    
    // Ocultar elementos que no están en esta zona
    const zone = zonesFromDashboard.find(z => z.id === zoneId);
    if (zone) {
      // Filtrar elementos para mostrar solo los que están en esta zona
      const elementsInZone = elements.filter(element => {
        if (element.type === 'zone') return true; // Siempre mostrar zonas
        if (element.zonaId === zoneId) return true; // Mostrar elementos de esta zona
        return false; // Ocultar elementos de otras zonas
      });
      
      message.info(`Modo zona activado: ${zone.name || zoneId}`);
    }
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
        tenant_id: salaId,
        metadata: {
          totalElements: elements.length,
          seats: elements.filter(e => e.type === 'silla').length,
          tables: elements.filter(e => e.type === 'mesa').length,
          zones: elements.filter(e => e.type === 'zone').length,
          createdBy: 'editor',
          version: '1.0'
        }
      };

      console.log('Guardando mapa:', mapData);
      
      // Simular guardado en base de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aquí iría la llamada real a la API
      // const response = await fetch('/api/mapas', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(mapData)
      // });
      
      setLastSavedAt(new Date());
      message.success(`Mapa guardado correctamente con ${elements.length} elementos`);
      
      // Guardar en localStorage como respaldo
      localStorage.setItem(`mapa-sala-${salaId}`, JSON.stringify(mapData));
      
    } catch (error) {
      console.error('Error guardando mapa:', error);
      message.error('Error al guardar el mapa: ' + error.message);
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

  const handleStageMouseMove = (e) => {
    if (activeTool === 'seats' && isDrawing) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      
      // Crear asientos mientras se mueve el mouse
      if (drawingPoints.length > 0) {
        const lastPoint = drawingPoints[drawingPoints.length - 1];
        const distance = Math.sqrt(
          Math.pow(pointer.x - lastPoint.x, 2) + 
          Math.pow(pointer.y - lastPoint.y, 2)
        );
        
        if (distance >= seatSpacing) {
          // Calcular dirección
          const dx = pointer.x - lastPoint.x;
          const dy = pointer.y - lastPoint.y;
          const angle = Math.atan2(dy, dx);
          
          // Crear asiento en la nueva posición
          const newSeat = {
            id: `seat-${Date.now()}-${Math.random()}`,
            type: 'silla',
            x: snapToGrid ? Math.round(pointer.x / gridSize) * gridSize : pointer.x,
            y: snapToGrid ? Math.round(pointer.y / gridSize) * gridSize : pointer.y,
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
          setDrawingPoints(prev => [...prev, pointer]);
        }
      }
    }
  };

  const handleStageMouseDown = (e) => {
    if (e.evt.button === 0 && activeTool === 'seats') { // Left click + seats tool
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      
      setIsDrawing(true);
      setDrawingPoints([pointer]);
      
      // Crear primer asiento
      createSeat(pointer.x, pointer.y);
    } else if (e.evt.button === 1) { // Middle mouse button
      handlePanStart(e);
    } else if (e.evt.button === 0) { // Left mouse button
      handleMouseDown(e);
    }
  };

  const handleStageMouseUp = (e) => {
    if (e.evt.button === 0 && activeTool === 'seats') {
      setIsDrawing(false);
      setDrawingPoints([]);
    } else if (e.evt.button === 1) {
      handlePanEnd();
    } else if (e.evt.button === 0) {
      handleMouseUp(e);
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
    
    return zonesFromDashboard.map(zone => {
      const elementsInZone = elements.filter(el => el.zonaId === zone.id);
      const zoneOpacity = elementsInZone.length > 0 ? '30' : '10';
      
      return (
        <Group key={zone.id}>
          <Rect
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            fill={zone.color + zoneOpacity}
            stroke={zone.color}
            strokeWidth={2}
            dash={[5, 5]}
            onClick={() => enterZoneMode(zone.id)}
            cursor="pointer"
          />
          <Text
            x={zone.x + 10}
            y={zone.y + 20}
            text={zone.nombre}
            fontSize={14}
            fill={zone.color}
            fontStyle="bold"
            align="left"
          />
          <Text
            x={zone.x + 10}
            y={zone.y + 40}
            text={`${elementsInZone.length} elementos`}
            fontSize={12}
            fill={zone.color}
            align="left"
          />
          <Text
            x={zone.x + 10}
            y={zone.y + 55}
            text={`Aforo: ${zone.aforo}`}
            fontSize={10}
            fill={zone.color}
            align="left"
          />
        </Group>
      );
    });
  }, [zonesFromDashboard, isInZoneMode, elements]);

  // Renderizar elementos del mapa (con filtrado de zona)
  const renderMapElements = useMemo(() => {
    let elementsToRender = elements;
    
    // Si estamos en modo zona, filtrar elementos
    if (isInZoneMode && selectedZone) {
      elementsToRender = elements.filter(element => {
        if (element.type === 'zone') return true; // Siempre mostrar zonas
        if (element.zonaId === selectedZone) return true; // Mostrar elementos de esta zona
        return false; // Ocultar elementos de otras zonas
      });
    }
    
    return elementsToRender.map((element) => {
      const isSelected = selectedElements.includes(element.id);
      const zone = zonesFromDashboard.find(z => z.id === element.zonaId);
      const zoneColor = zone ? zone.color : '#e2e8f0';
      const selectionColor = isSelected ? '#3b82f6' : 'transparent';
      
      if (element.type === 'silla') {
        const seatStatus = getSeatStatus(element.id);
        const statusColor = getSeatStatusColor(element.id);
        const finalColor = statusColor || element.color;
        
        return (
          <Group key={element.id} draggable>
            {/* Borde de selección */}
            {isSelected && (
              <Rect
                x={element.x - 3}
                y={element.y - 3}
                width={element.width + 6}
                height={element.height + 6}
                fill="transparent"
                stroke={selectionColor}
                strokeWidth={3}
                dash={[5, 5]}
              />
            )}
            {element.shape === 'circle' ? (
              <Circle
                x={element.x}
                y={element.y}
                radius={element.width / 2}
                fill={finalColor}
                stroke={zoneColor}
                strokeWidth={element.zonaId ? 3 : 1}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              />
            ) : (
              <Rect
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                fill={finalColor}
                stroke={zoneColor}
                strokeWidth={element.zonaId ? 3 : 1}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              />
            )}
            <Text
              x={element.x - 2}
              y={element.y - 23}
              text={element.numero || ''}
              fontSize={12}
              fill={statusColor ? 'white' : '#000'}
              align="center"
              width={element.width + 4}
            />
            {/* Indicador de zona */}
            {element.zonaId && zone && (
              <Text
                x={element.x - 2}
                y={element.y + element.height + 5}
                text={zone.nombre}
                fontSize={10}
                fill={zoneColor}
                align="center"
                width={element.width + 4}
                fontStyle="bold"
              />
            )}
            {/* Indicador de estado */}
            {seatStatus !== 'available' && (
              <Text
                x={element.x - 2}
                y={element.y + element.height + 20}
                text={seatStatus === 'locked' ? '🔒' : seatStatus === 'sold' ? '💰' : '📋'}
                fontSize={12}
                align="center"
                width={element.width + 4}
              />
            )}
          </Group>
        );
      } else if (element.type === 'mesa') {
        return (
          <Group key={element.id} draggable>
            {/* Borde de selección */}
            {isSelected && (
              <Rect
                x={element.x - 3}
                y={element.y - 3}
                width={element.width + 6}
                height={element.height + 6}
                fill="transparent"
                stroke={selectionColor}
                strokeWidth={3}
                dash={[5, 5]}
              />
            )}
            {element.shape === 'circle' ? (
              <Circle
                x={element.x + element.width / 2}
                y={element.y + element.height / 2}
                radius={element.width / 2}
                fill={element.color}
                stroke={zoneColor}
                strokeWidth={element.zonaId ? 3 : 2}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              />
            ) : (
              <Rect
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                fill={element.color}
                stroke={zoneColor}
                strokeWidth={element.zonaId ? 3 : 2}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              />
            )}
            <Text
              x={element.x - 8}
              y={element.y - 28}
              text={element.nombre || ''}
              fontSize={14}
              fill="#000"
              fontStyle="bold"
              align="center"
              width={element.width + 16}
            />
            {/* Indicador de zona */}
            {element.zonaId && zone && (
              <Text
                x={element.x - 8}
                y={element.y + element.height + 5}
                text={zone.nombre}
                fontSize={10}
                fill={zoneColor}
                align="center"
                width={element.width + 16}
                fontStyle="bold"
              />
            )}
          </Group>
        );
      }
      return null;
    });
  }, [elements, isInZoneMode, selectedZone, zonesFromDashboard, selectedElements, handleElementClick, handleElementDragEnd, seatLocks, seatReservations, soldTickets, currentFuncionId]);

  // Funciones de utilidad para colores
  const getSeatColor = (seat) => seat.color || '#48BB78';
  const getZonaColor = (element) => element.color || '#87CEEB';
  const getBorderColor = (element) => '#000000';

  // Determinar el estado de un asiento
  const getSeatStatus = (seatId) => {
    // Verificar si está bloqueado
    const isLocked = seatLocks.some(lock => 
      lock.seat_id === seatId && 
      lock.funcion_id === currentFuncionId && 
      lock.status === 'locked'
    );
    
    if (isLocked) return 'locked';
    
    // Verificar si está vendido
    const isSold = soldTickets.some(ticket => 
      ticket.silla_id === seatId && 
      ticket.funcion_id === currentFuncionId && 
      ticket.estado === 'vendido'
    );
    
    if (isSold) return 'sold';
    
    // Verificar si está reservado
    const isReserved = seatReservations.some(reservation => 
      reservation.silla_id === seatId && 
      reservation.funcion_id === currentFuncionId && 
      (reservation.estado === 'reservado' || reservation.estado === 'pendiente')
    );
    
    if (isReserved) return 'reserved';
    
    return 'available';
  };

  // Obtener color según el estado del asiento
  const getSeatStatusColor = (seatId) => {
    const status = getSeatStatus(seatId);
    
    switch (status) {
      case 'locked':
        return '#DC2626'; // Rojo para bloqueado
      case 'sold':
        return '#000000'; // Negro para vendido
      case 'reserved':
        return '#4B5563'; // Gris oscuro para reservado
      default:
        return null; // Color original del asiento
    }
  };

  // Verificar si un asiento se puede eliminar
  const canDeleteSeat = (seatId) => {
    const status = getSeatStatus(seatId);
    return status === 'available';
  };

  // Obtener mensaje de estado del asiento
  const getSeatStatusMessage = (seatId) => {
    const status = getSeatStatus(seatId);
    
    switch (status) {
      case 'locked':
        return 'Asiento bloqueado - No se puede eliminar';
      case 'sold':
        return 'Asiento vendido - No se puede eliminar';
      case 'reserved':
        return 'Asiento reservado - No se puede eliminar';
      default:
        return 'Asiento disponible';
    }
  };

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
        color: table.zonaColor || '#48BB78', // Usar el color de la zona de la mesa
        shape: seatShape,
        zonaId: table.zonaId, // Heredar la zona de la mesa
        zonaNombre: table.zonaNombre,
        zonaColor: table.zonaColor
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
        color: table.zonaColor || '#48BB78', // Usar el color de la zona de la mesa
        shape: seatShape,
        zonaId: table.zonaId, // Heredar la zona de la mesa
        zonaNombre: table.zonaNombre,
        zonaColor: table.zonaColor
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
        color: table.zonaColor || '#48BB78', // Usar el color de la zona de la mesa
        shape: seatShape,
        zonaId: table.zonaId, // Heredar la zona de la mesa
        zonaNombre: table.zonaNombre,
        zonaColor: table.zonaColor
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
        color: table.zonaColor || '#48BB78', // Usar el color de la zona de la mesa
        shape: seatShape,
        zonaId: table.zonaId, // Heredar la zona de la mesa
        zonaNombre: table.zonaNombre,
        zonaColor: table.zonaColor
      });
    }

    setElements(prev => [...prev, ...newSeats]);
    message.success(`${newSeats.length} asientos agregados a la mesa`);
  };

  // Cambiar zona de un elemento existente
  const changeElementZone = (elementId, newZoneId) => {
    const zone = zonesFromDashboard.find(z => z.id === newZoneId);
    if (!zone) return;

    const newElements = elements.map(el => {
      if (el.id === elementId) {
        if (el.type === 'silla') {
          // Para asientos, cambiar el color al color de la nueva zona
          return {
            ...el,
            zonaId: newZoneId,
            zonaNombre: zone.nombre,
            zonaColor: zone.color,
            color: zone.color // Cambiar el color del asiento
          };
        } else {
          // Para otros elementos, solo cambiar la zona
          return {
            ...el,
            zonaId: newZoneId,
            zonaNombre: zone.nombre,
            zonaColor: zone.color
          };
        }
      }
      return el;
    });

    setElements(newElements);
    message.success(`Elemento asignado a la zona "${zone.nombre}"`);
  };

  // Remover zona de un elemento
  const removeElementZone = (elementId) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const newElements = elements.map(el => {
      if (el.id === elementId) {
        if (el.type === 'silla') {
          // Para asientos, restaurar color por defecto
          return {
            ...el,
            zonaId: null,
            zonaNombre: null,
            zonaColor: null,
            color: '#48BB78' // Color por defecto para asientos
          };
        } else {
          // Para otros elementos, solo remover zona
          return {
            ...el,
            zonaId: null,
            zonaNombre: null,
            zonaColor: null
          };
        }
      }
      return el;
    });

    setElements(newElements);
    message.success('Zona removida del elemento');
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
    <div className="crear-mapa-container" style={{ 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '24px 32px', 
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <h1 style={{ 
            margin: '0', 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#1e293b'
          }}>
            Editor de Mapa - Sala {salaId}
          </h1>
          <p style={{ 
            margin: '8px 0 0 0', 
            color: '#64748b',
            fontSize: '14px'
          }}>
            {elements.length} elementos • {showTypeSelector ? 'Selecciona tipo de mapa' : 'Editor activo'}
          </p>
        </div>
        
        {/* Selector de tipo de mapa */}
        {showTypeSelector && (
          <div style={{ 
            padding: '32px', 
            textAlign: 'center',
            backgroundColor: '#f8fafc'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Selecciona el tipo de mapa</h3>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  setActiveTool('seats');
                  setShowTypeSelector(false);
                  setHasMapData(true);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🪑 Filas con secciones
              </button>
              <button 
                onClick={() => {
                  setActiveTool('tables');
                  setShowTypeSelector(false);
                  setHasMapData(true);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🪑 Mesas
              </button>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        <div style={{ display: 'flex', minHeight: '600px' }}>
          {/* Panel izquierdo - Herramientas */}
          <div style={{ 
            width: '320px', 
            padding: '24px',
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px' }}>Herramientas</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Herramienta Activa</h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '2px solid #3b82f6',
                color: '#3b82f6',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                {activeTool === 'seats' ? '🪑 Crear Asientos' : 
                 activeTool === 'tables' ? '🪑 Crear Mesas' : 
                 activeTool === 'zones' ? '🏗️ Crear Zonas' : '🖱️ Seleccionar'}
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Crear Elementos</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={() => setActiveTool('select')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: activeTool === 'select' ? '#3b82f6' : '#e2e8f0',
                    color: activeTool === 'select' ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  🖱️ Seleccionar
                </button>
                <button 
                  onClick={() => setActiveTool('seats')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: activeTool === 'seats' ? '#3b82f6' : '#e2e8f0',
                    color: activeTool === 'seats' ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  🪑 Crear Asientos
                </button>
                <button 
                  onClick={() => setActiveTool('tables')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: activeTool === 'tables' ? '#3b82f6' : '#e2e8f0',
                    color: activeTool === 'tables' ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  🪑 Crear Mesas
                </button>
                <button 
                  onClick={() => setActiveTool('zones')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: activeTool === 'zones' ? '#3b82f6' : '#e2e8f0',
                    color: activeTool === 'zones' ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  🏗️ Crear Zonas
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Crear Fila de Sillas</h4>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#64748b' }}>
                  Espaciado entre asientos:
                </label>
                <input 
                  type="number" 
                  value={seatSpacing} 
                  onChange={(e) => setSeatSpacing(parseInt(e.target.value) || 25)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#64748b' }}>
                  Forma de asiento:
                </label>
                <select 
                  value={seatShape} 
                  onChange={(e) => setSeatShape(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="circle">🔴 Redondo</option>
                  <option value="square">⬜ Cuadrado</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#64748b' }}>
                  Tamaño de asiento:
                </label>
                <input 
                  type="number" 
                  value={seatSize} 
                  onChange={(e) => setSeatSize(parseInt(e.target.value) || 20)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0' }}>
                💡 Haz clic en el canvas y mueve el mouse para crear la fila
              </p>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Configuración de Mesa</h4>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#64748b' }}>
                  Forma de mesa:
                </label>
                <select 
                  value={tableShape} 
                  onChange={(e) => setTableShape(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="square">⬜ Cuadrada</option>
                  <option value="circle">🔴 Redonda</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#64748b' }}>
                  Tamaño de mesa:
                </label>
                <input 
                  type="number" 
                  value={tableSize} 
                  onChange={(e) => setTableSize(parseInt(e.target.value) || 80)}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Configuración</h4>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input 
                    type="checkbox" 
                    checked={snapToGrid} 
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Snap to Grid
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input 
                    type="checkbox" 
                    checked={showGrid} 
                    onChange={(e) => setShowGrid(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Mostrar Grid
                </label>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', color: '#64748b' }}>Tamaño Grid:</label>
                <input 
                  type="number" 
                  value={gridSize} 
                  onChange={(e) => setGridSize(parseInt(e.target.value) || 20)}
                  style={{ 
                    width: '60px', 
                    padding: '4px 8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '4px',
                    fontSize: '14px',
                    marginLeft: '8px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Acciones</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={saveMapa}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  💾 Guardar Mapa
                </button>
                <button 
                  onClick={() => {
                    if (elements.length > 0) {
                      if (window.confirm(`¿Estás seguro de que quieres limpiar el mapa? Se perderán ${elements.length} elementos.`)) {
                        setElements([]);
                        setSelectedElements([]);
                        setHasMapData(false);
                        setLastSavedAt(null);
                        message.info('Mapa limpiado');
                      }
                    } else {
                      message.info('El mapa ya está vacío');
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  🗑️ Limpiar Mapa
                </button>
                <button 
                  onClick={() => setShowTypeSelector(true)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  🔄 Cambiar Tipo
                </button>
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Modo Zona</h4>
              {isInZoneMode ? (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '6px',
                  border: '1px solid #f59e0b'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#92400e' }}>
                    <strong>Zona activa:</strong> {selectedZone}
                  </p>
                  <button 
                    onClick={exitZoneMode}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🚪 Salir de Zona
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0' }}>
                  💡 Haz clic en una zona del mapa para entrar en modo zona
                </p>
              )}
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Asignar Zonas</h4>
              {selectedElements.length > 0 ? (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '6px',
                  border: '1px solid #3b82f6'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#1e40af' }}>
                    <strong>{selectedElements.length} elementos seleccionados</strong>
                  </p>
                  <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#1e40af' }}>
                    Selecciona una zona para asignar:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {zonesFromDashboard.map(zone => (
                      <button
                        key={zone.id}
                        onClick={() => assignZoneToSelected(zone.id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: zone.color + '20',
                          color: zone.color,
                          border: `2px solid ${zone.color}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          textAlign: 'left'
                        }}
                      >
                        🏷️ {zone.nombre} ({zone.aforo} asientos)
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b' }}>
                    <strong>No hay elementos seleccionados</strong>
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748b' }}>
                    Selecciona mesas o asientos para asignarles una zona
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                      onClick={() => selectByType('mesa')}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#e2e8f0',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      🪑 Seleccionar todas las mesas
                    </button>
                    <button
                      onClick={() => selectByType('silla')}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#e2e8f0',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      🪑 Seleccionar todos los asientos
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Gestionar Zonas</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {zonesFromDashboard.map(zone => (
                  <div key={zone.id} style={{ 
                    padding: '8px', 
                    backgroundColor: zone.color + '10', 
                    borderRadius: '6px',
                    border: `1px solid ${zone.color}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '500', color: zone.color }}>
                        {zone.nombre}
                      </span>
                      <span style={{ fontSize: '10px', color: zone.color }}>
                        {elements.filter(el => el.zonaId === zone.id).length} elementos
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => selectByZone(zone.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: zone.color,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        👁️ Ver
                      </button>
                      <button
                        onClick={() => enterZoneMode(zone.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: zone.color + '80',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        🚪 Entrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Modo Numeración</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={() => activateNumerationMode('seats')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: numerationMode === 'seats' ? '#8b5cf6' : '#e2e8f0',
                    color: numerationMode === 'seats' ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  🔢 Numeración de Asientos
                </button>
                <button 
                  onClick={() => activateNumerationMode('tables')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: numerationMode === 'tables' ? '#8b5cf6' : '#e2e8f0',
                    color: numerationMode === 'tables' ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  🏷️ Numeración de Mesas
                </button>
                <button 
                  onClick={() => activateNumerationMode('rows')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: numerationMode === 'rows' ? '#8b5cf6' : '#e2e8f0',
                    color: numerationMode === 'rows' ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  📏 Numeración de Filas
                </button>
              </div>
              {numerationMode && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#475569'
                }}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Modo activo:</strong> {numerationMode === 'seats' ? 'Asientos' : numerationMode === 'tables' ? 'Mesas' : 'Filas'}</p>
                  <p style={{ margin: '0 0 8px 0' }}>Haz clic en un elemento para editarlo</p>
                  <button 
                    onClick={() => activateNumerationMode(null)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ❌ Desactivar
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Leyenda de Estados</h4>
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: '#48BB78',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#475569' }}>Disponible</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: '#4B5563',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#475569' }}>Reservado 📋</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: '#000000',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#475569' }}>Vendido 💰</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: '#DC2626',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#475569' }}>Bloqueado 🔒</span>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '4px',
                  border: '1px solid #f59e0b'
                }}>
                  <p style={{ margin: '0', fontSize: '11px', color: '#92400e' }}>
                    <strong>⚠️ Protegidos:</strong> Los asientos reservados, vendidos y bloqueados no se pueden eliminar
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '14px', fontWeight: '500' }}>Configuración de Evento</h4>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#64748b' }}>
                  Función/Evento:
                </label>
                <select 
                  value={currentFuncionId || ''} 
                  onChange={(e) => {
                    const newFuncionId = parseInt(e.target.value);
                    setCurrentFuncionId(newFuncionId);
                    // Recargar estado de asientos para la nueva función
                    loadSeatStatusForFuncion(newFuncionId);
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Seleccionar función</option>
                  <option value={1}>Función 1 - Evento Principal</option>
                  <option value={2}>Función 2 - Evento Secundario</option>
                  <option value={3}>Función 3 - Evento Especial</option>
                </select>
              </div>
              {currentFuncionId && (
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '4px',
                  border: '1px solid #3b82f6'
                }}>
                  <p style={{ margin: '0', fontSize: '11px', color: '#1e40af' }}>
                    <strong>Evento activo:</strong> Función {currentFuncionId}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#1e40af' }}>
                    Los colores de los asientos reflejan su estado actual
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Área principal del mapa */}
          <div className="map-area" style={{ 
            flex: 1, 
            padding: '24px', 
            position: 'relative',
            backgroundColor: '#f0f0f0'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '18px' }}>Área del Mapa</h3>
            <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px' }}>Zoom: {zoom}</p>
            <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px' }}>Posición: X={stagePosition.x}, Y={stagePosition.y}</p>
            <p style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '14px' }}>Grid: {showGrid ? 'Visible' : 'Oculto'} (Tamaño: {gridSize})</p>
            
            {/* Controles básicos */}
            <div style={{ margin: '10px 0' }}>
              <button onClick={handleZoomIn} style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', marginRight: '8px' }}>🔍+</button>
              <button onClick={handleZoomOut} style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', marginRight: '8px' }}>🔍-</button>
              <button onClick={resetZoom} style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', marginLeft: '8px' }}>🎯</button>
              <button onClick={saveMapa} style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', marginLeft: '8px' }}>💾 Guardar</button>
            </div>
            
            {/* Controles de zoom avanzados */}
            <div style={{ 
              position: 'absolute', 
              bottom: '20px', 
              right: '20px', 
              background: 'white', 
              padding: '10px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 1000
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Zoom: {Math.round(zoom * 100)}%</strong>
              </div>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <button onClick={handleZoomIn} style={{ padding: '5px 10px' }}>🔍+</button>
                <button onClick={handleZoomOut} style={{ padding: '5px 10px' }}>🔍-</button>
                <button onClick={resetZoom} style={{ padding: '5px 10px' }}>🎯</button>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <div>🖱️ Clic: Crear elemento</div>
                <div>🖱️ Arrastrar: Mover elemento</div>
                <div>🖱️ Rueda: Zoom</div>
                <div>🖱️ Medio: Pan</div>
              </div>
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
              <Stage
                width={600}
                height={400}
                ref={stageRef}
                onClick={handleStageClick}
                onContextMenu={handleStageContextMenu}
                onWheel={(e) => {
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
                  
                  const newPos = {
                    x: pointer.x - mousePointTo.x * newScale,
                    y: pointer.y - mousePointTo.y * newScale,
                  };
                  setStagePosition(newPos);
                }}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                scaleX={zoom}
                scaleY={zoom}
                x={stagePosition.x}
                y={stagePosition.y}
              >
                <Layer>
                  {/* Grid */}
                  {showGrid && (
                    <>
                      {Array.from({ length: Math.ceil(600 / gridSize) }, (_, i) => (
                        <Line
                          key={`v-${i}`}
                          points={[i * gridSize, 0, i * gridSize, 400]}
                          stroke="#ddd"
                          strokeWidth={1}
                        />
                      ))}
                      {Array.from({ length: Math.ceil(400 / gridSize) }, (_, i) => (
                        <Line
                          key={`h-${i}`}
                          points={[0, i * gridSize, 600, i * gridSize]}
                          stroke="#ddd"
                          strokeWidth={1}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Elementos del mapa */}
                  {renderMapElements}
                  
                  {/* Zonas del dashboard */}
                  {renderDashboardZones}
                </Layer>
              </Stage>
              
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
              <h4 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '16px' }}>Estado del Editor:</h4>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>Elementos seleccionados: {selectedElements.length}</p>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>Zona seleccionada: {selectedZone || 'Ninguna'}</p>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>Modo zona: {isInZoneMode ? 'Activo' : 'Inactivo'}</p>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>Último guardado: {lastSavedAt ? lastSavedAt.toLocaleString() : 'Nunca'}</p>
              
              {/* Resumen de estado de asientos */}
              {currentFuncionId && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '6px',
                  border: '1px solid #0ea5e9'
                }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#0c4a6e', fontSize: '14px' }}>Estado de Asientos - Función {currentFuncionId}</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#48BB78', borderRadius: '2px' }}></div>
                      <span style={{ color: '#0c4a6e' }}>Disponibles: {elements.filter(el => el.type === 'silla' && getSeatStatus(el.id) === 'available').length}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#4B5563', borderRadius: '2px' }}></div>
                      <span style={{ color: '#0c4a6e' }}>Reservados: {elements.filter(el => el.type === 'silla' && getSeatStatus(el.id) === 'reserved').length}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#000000', borderRadius: '2px' }}></div>
                      <span style={{ color: '#0c4a6e' }}>Vendidos: {elements.filter(el => el.type === 'silla' && getSeatStatus(el.id) === 'sold').length}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#DC2626', borderRadius: '2px' }}></div>
                      <span style={{ color: '#0c4a6e' }}>Bloqueados: {elements.filter(el => el.type === 'silla' && getSeatStatus(el.id) === 'locked').length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Indicador de estado en la parte inferior */}
            <div style={{ 
              position: 'fixed', 
              bottom: '0', 
              left: '0', 
              right: '0', 
              background: '#667eea', 
              color: 'white', 
              padding: '10px', 
              textAlign: 'center',
              zIndex: 1001
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
                <div>
                  <strong>Editor de Mapa Activo</strong> | 
                  Elementos: {elements.length} | 
                  Seleccionados: {selectedElements.length} | 
                  Zoom: {Math.round(zoom * 100)}%
                </div>
                <div>
                  {lastSavedAt && (
                    <span style={{ marginRight: '20px' }}>
                      ✅ Último guardado: {lastSavedAt.toLocaleTimeString()}
                    </span>
                  )}
                  {numerationMode && (
                    <span style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      padding: '5px 10px', 
                      borderRadius: '15px',
                      marginRight: '20px'
                    }}>
                      🔢 Modo: {numerationMode === 'seats' ? 'Asientos' : numerationMode === 'tables' ? 'Mesas' : 'Filas'}
                    </span>
                  )}
                  {isInZoneMode && (
                    <span style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      padding: '5px 10px', 
                      borderRadius: '15px'
                    }}>
                      🏗️ Zona: {selectedZone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearMapaRefactored;
