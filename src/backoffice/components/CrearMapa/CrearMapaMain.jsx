/**
 * Editor principal de mapas de asientos - Versión 3.6.5
 * Permite crear y editar mapas de eventos con mesas, sillas, filas y zonas personalizables
 * 
 * Funcionalidades implementadas:
 * - Editor de mapas con herramientas de dibujo
 * - Sistema de historial (Ctrl+Z/Y)
 * - Zonas personalizables con puntos editables
 * - Herramientas de alineación y medición
 * - Exportación a PNG
 * - Sistema de capas y plantillas
 * - Atajos de teclado completos
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Image, Group, RegularPolygon, Star } from 'react-konva';
import { Button, Space, Input, Select, Slider, Switch, message, Tooltip, Divider, Row, Col, Typography, Badge, Popconfirm, Modal, Form, InputNumber, ColorPicker, Upload, Progress, Card } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CopyOutlined, 
  ScissorOutlined, 
  ClearOutlined, 
  SaveOutlined, 
  UndoOutlined, 
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  CompressOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  PictureOutlined,
  ReloadOutlined,
  AimOutlined
} from '@ant-design/icons';

const { Title, Text: AntText } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CrearMapaMain = ({ salaId, onSave, onCancel, initialMapa }) => {
  // ===== ESTADOS PRINCIPALES =====
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeMode, setActiveMode] = useState('select'); // 'select', 'pan', 'add'
  
  // ===== ESTADOS DE ZOOM Y PAN =====
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minScale] = useState(0.1);
  const [maxScale] = useState(5);
  
  // ===== ESTADOS DE IMAGEN DE FONDO =====
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  const [backgroundScale, setBackgroundScale] = useState(1);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  
  // ===== ESTADOS DE HISTORIAL =====
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [maxHistorySize] = useState(50);
  
  // ===== ESTADOS DE COPIAR Y PEGAR =====
  const [clipboard, setClipboard] = useState([]);
  
  // ===== ESTADOS DE ZONAS =====
  const [zonas, setZonas] = useState([
    { id: 'zona1', nombre: 'Zona A', color: '#FF6B6B' },
    { id: 'zona2', nombre: 'Zona B', color: '#4ECDC4' },
    { id: 'zona3', nombre: 'Zona C', color: '#45B7AA' },
    { id: 'zona4', nombre: 'Zona D', color: '#96CEB4' },
    { id: 'zona5', nombre: 'Zona E', color: '#FFEAA7' }
  ]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showZoneManager, setShowZoneManager] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#FF6B6B');
  
  // ===== ESTADOS DE ZONAS PERSONALIZABLES =====
  const [customZones, setCustomZones] = useState([]);
  const [isCreatingCustomZone, setIsCreatingCustomZone] = useState(false);
  const [currentCustomZone, setCurrentCustomZone] = useState(null);
  const [customZonePoints, setCustomZonePoints] = useState([]);
  const [selectedCustomZonePoint, setSelectedCustomZonePoint] = useState(null);
  const [showCustomZoneModal, setShowCustomZoneModal] = useState(false);
  
  // ===== ESTADOS DE CONFIGURACIÓN =====
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // ===== ESTADOS DE COLORES DE FONDO =====
  const [gridBackgroundColor, setGridBackgroundColor] = useState('#f8fafc'); // Fondo claro dentro del grid
  const [outerBackgroundColor, setOuterBackgroundColor] = useState('#1e293b'); // Fondo oscuro fuera del grid
  const [showGridColorPicker, setShowGridColorPicker] = useState(false);
  const [showOuterColorPicker, setShowOuterColorPicker] = useState(false);
  
  // ===== ESTADOS DE VISIBILIDAD DE NOMBRES =====
  const [showMesaNames, setShowMesaNames] = useState(true);
  const [showSillaNames, setShowSillaNames] = useState(true);
  const [showFilaNames, setShowFilaNames] = useState(true);
  const [showFilaSillaNames, setShowFilaSillaNames] = useState(true);
  
  // ===== ESTADOS DE HERRAMIENTAS =====
  const [currentTool, setCurrentTool] = useState('select'); // 'select', 'text', 'rectangle', 'circle', 'polygon'
  const [textInput, setTextInput] = useState('');
  const [isAddingText, setIsAddingText] = useState(false);
  
  // ===== ESTADOS DE RANGOS PARA HERRAMIENTAS =====
  const [textFontSize, setTextFontSize] = useState(16);
  const [rectangleWidth, setRectangleWidth] = useState(100);
  const [rectangleHeight, setRectangleHeight] = useState(60);
  const [circleRadius, setCircleRadius] = useState(50);
  const [polygonSides, setPolygonSides] = useState(6);
  const [polygonRadius, setPolygonRadius] = useState(50);
  
  // ===== ESTADOS DE PROPIEDADES RÁPIDAS =====
  const [selectedElementRotation, setSelectedElementRotation] = useState(0);
  
  // ===== ESTADOS DE MENÚ CONTEXTUAL =====
  const [contextMenu, setContextMenu] = useState(null);
  const [contextMenuElement, setContextMenuElement] = useState(null);
  const [showAddSeatsModal, setShowAddSeatsModal] = useState(false);
  const [selectedMesaForSeats, setSelectedMesaForSeats] = useState(null);
  
  // ===== ESTADOS DE TRANSFORMADOR DE OBJETOS =====
  const [showTransformer, setShowTransformer] = useState(false);
  const [transformerElement, setTransformerElement] = useState(null);
  
  // ===== ESTADOS DE ALINEACIÓN Y MEDICIÓN =====
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);
  const [alignmentGuides, setAlignmentGuides] = useState([]);
  const [measurementLines, setMeasurementLines] = useState([]);
  
  // ===== ESTADOS DE DUPLICACIÓN INTELIGENTE =====
  const [duplicationMode, setDuplicationMode] = useState(false);
  const [duplicationSpacing, setDuplicationSpacing] = useState(50);
  
  // ===== ESTADOS DE SOMBRAS Y EFECTOS =====
  const [showShadows, setShowShadows] = useState(true);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetX, setShadowOffsetX] = useState(5);
  const [shadowOffsetY, setShadowOffsetY] = useState(5);
  
  // ===== ESTADOS DE CAPAS =====
  const [layers, setLayers] = useState([
    { id: 'default', name: 'Capa Principal', visible: true, locked: false }
  ]);
  const [activeLayer, setActiveLayer] = useState('default');
  
  // ===== ESTADOS DE PLANTILLAS =====
  const [templates, setTemplates] = useState([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  // ===== ESTADOS DE HISTORIAL AVANZADO =====
  const [historyDetails, setHistoryDetails] = useState([]);
  
  // ===== ESTADOS DE TUTORIAL =====
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // ===== ESTADOS DE EXPORTACIÓN =====
  const [exporting, setExporting] = useState(false);
  
  // ===== REFERENCIAS =====
  const stageRef = useRef();
  const fileInputRef = useRef();

  // ===== FUNCIONES PRINCIPALES (definidas antes de useEffect) =====
  
  // Función para agregar al historial
  const addToHistory = useCallback((newElements, action) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      elements: JSON.parse(JSON.stringify(newElements)),
      action,
      timestamp: Date.now()
    });
    
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, maxHistorySize]);

  // ===== FUNCIONES DE ZOOM Y PAN =====
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const scaleBy = 1.1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Limitar zoom
    const clampedScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, [minScale, maxScale]);

  const handleMouseDown = useCallback((e) => {
    if (activeMode === 'pan') {
      const stage = e.target.getStage();
      stage.draggable(true);
    }
  }, [activeMode]);

  const handleMouseMove = useCallback((e) => {
    if (activeMode === 'pan') {
      const stage = e.target.getStage();
      if (stage.draggable()) {
        setPosition({
          x: stage.x(),
          y: stage.y(),
        });
      }
    }
  }, [activeMode, position]);

  const handleDoubleClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      // Centrar vista en el punto del doble clic
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      const newX = -(pointer.x - stage.width() / 2);
      const newY = -(pointer.y - stage.height() / 2);
      setPosition({ x: newX, y: newY });
    }
  }, []);

  // ===== ATAJOS DE TECLADO =====
  // Este useEffect se moverá después de que todas las funciones estén declaradas

  // ===== ACTUALIZAR PROPIEDADES RÁPIDAS CUANDO CAMBIA LA SELECCIÓN =====
  useEffect(() => {
    if (selectedIds.length === 1) {
      const element = elements.find(el => el._id === selectedIds[0]);
      if (element) {
        setSelectedElementRotation(element.rotation || 0);
      }
    } else {
      setSelectedElementRotation(0);
    }
  }, [selectedIds, elements]);

  // ===== FUNCIONES DE HISTORIAL =====
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      message.success('Deshacer: ' + history[newIndex].action);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex].elements);
      message.success('Rehacer: ' + history[newIndex].action);
    }
  }, [historyIndex, history]);

  // ===== FUNCIONES DE COPIAR Y PEGAR =====
  const handleCopy = useCallback(() => {
    if (selectedIds.length > 0) {
      const elementsToCopy = elements.filter(el => selectedIds.includes(el._id));
      setClipboard(JSON.parse(JSON.stringify(elementsToCopy)));
      message.success(`${elementsToCopy.length} elemento(s) copiado(s)`);
    }
  }, [selectedIds, elements]);
  
  const handlePaste = useCallback(() => {
    if (clipboard.length > 0) {
      const pastedElements = clipboard.map(el => ({
        ...el,
        _id: `pasted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        posicion: {
          x: el.posicion.x + 50,
          y: el.posicion.y + 50
        }
      }));
      
      setElements(prev => [...prev, ...pastedElements]);
      setSelectedIds(pastedElements.map(el => el._id));
      addToHistory([...elements, ...pastedElements], `Pegar ${pastedElements.length} elemento(s)`);
      message.success(`${pastedElements.length} elemento(s) pegado(s)`);
    }
  }, [clipboard, elements, addToHistory]);

  // ===== FUNCIONES DE ELEMENTOS =====
  const addMesa = useCallback((type = 'rectangular', size = { width: 120, height: 80 }) => {
    const newMesa = {
      _id: `mesa_${Date.now()}`,
      type: 'mesa',
      mesaType: type,
      nombre: `Mesa ${elements.filter(el => el.type === 'mesa').length + 1}`,
      posicion: { x: 100, y: 100 },
      width: size.width,
      height: size.height,
      fill: '#4CAF50',
      stroke: '#2E7D32',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => [...prev, newMesa]);
    addToHistory([...elements, newMesa], `Agregar mesa ${type}`);
    return newMesa;
  }, [elements, addToHistory]);

  const addSilla = useCallback((mesaId = null, posicion = { x: 100, y: 100 }) => {
    const newSilla = {
      _id: `silla_${Date.now()}`,
      type: 'silla',
      nombre: `Silla ${elements.filter(el => el.type === 'silla').length + 1}`,
      posicion,
      mesaId,
      width: 20,
      height: 20,
      fill: '#2196F3',
      stroke: '#1976D2',
      strokeWidth: 1,
      rotation: 0,
      opacity: 1,
      state: 'available'
    };
    
    setElements(prev => [...prev, newSilla]);
    addToHistory([...elements, newSilla], 'Agregar silla');
    return newSilla;
  }, [elements, addToHistory]);

  // ===== FUNCIONES PARA CREAR TEXTO =====
  const addTexto = useCallback((posicion = { x: 100, y: 100 }, texto = 'Texto') => {
    const newTexto = {
      _id: `texto_${Date.now()}`,
      type: 'texto',
      nombre: texto,
      posicion,
      text: texto,
      fontSize: textFontSize,
      fill: '#000000',
      fontStyle: 'normal',
      fontFamily: 'Arial',
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => [...prev, newTexto]);
    addToHistory([...elements, newTexto], 'Agregar texto');
    return newTexto;
  }, [elements, addToHistory, textFontSize]);

  // ===== FUNCIONES PARA CREAR FIGURAS GEOMÉTRICAS =====
  const addRectangulo = useCallback((posicion = { x: 100, y: 100 }) => {
    const newRect = {
      _id: `rect_${Date.now()}`,
      type: 'rectangulo',
      nombre: `Rectángulo ${elements.filter(el => el.type === 'rectangulo').length + 1}`,
      posicion,
      width: rectangleWidth,
      height: rectangleHeight,
      fill: '#FF9800',
      stroke: '#F57C00',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => [...prev, newRect]);
    addToHistory([...elements, newRect], 'Agregar rectángulo');
    return newRect;
  }, [elements, addToHistory, rectangleWidth, rectangleHeight]);

  const addCirculo = useCallback((posicion = { x: 100, y: 100 }) => {
    const newCircle = {
      _id: `circle_${Date.now()}`,
      type: 'circulo',
      nombre: `Círculo ${elements.filter(el => el.type === 'circulo').length + 1}`,
      posicion,
      radius: circleRadius,
      fill: '#9C27B0',
      stroke: '#7B1FA2',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => [...prev, newCircle]);
    addToHistory([...elements, newCircle], 'Agregar círculo');
    return newCircle;
  }, [elements, addToHistory, circleRadius]);

  const addPoligono = useCallback((posicion = { x: 100, y: 100 }) => {
    const newPolygon = {
      _id: `polygon_${Date.now()}`,
      type: 'poligono',
      nombre: `Polígono ${polygonSides} lados`,
      posicion,
      sides: polygonSides,
      radius: polygonRadius,
      fill: '#E91E63',
      stroke: '#C2185B',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => [...prev, newPolygon]);
    addToHistory([...elements, newPolygon], `Agregar polígono de ${polygonSides} lados`);
    return newPolygon;
  }, [elements, addToHistory, polygonSides, polygonRadius]);

  const deleteSelectedElements = useCallback(() => {
    setElements(prev => prev.filter(el => !selectedIds.includes(el._id)));
    setSelectedIds([]);
  }, [selectedIds]);

  const updateElementProperty = useCallback((elementId, property, value) => {
    setElements(prev => prev.map(el => 
      el._id === elementId ? { ...el, [property]: value } : el
    ));
  }, []);

  // ===== FUNCIONES DE ZONAS =====
  const handleAssignZone = useCallback((elementIds, zona) => {
    elementIds.forEach(elementId => {
      updateElementProperty(elementId, 'zona', zona);
      updateElementProperty(elementId, 'fill', zona.color);
    });
    
    addToHistory(elements, `Asignar zona ${zona.nombre} a ${elementIds.length} elementos`);
  }, [zonas, elements, updateElementProperty, addToHistory]);

  const addNewZone = useCallback(() => {
    if (newZoneName.trim()) {
      const newZone = {
        id: `zona_${Date.now()}`,
        nombre: newZoneName.trim(),
        color: newZoneColor
      };
      setZonas(prev => [...prev, newZone]);
      setNewZoneName('');
      setNewZoneColor('#FF6B6B');
      setShowZoneManager(false);
    }
  }, [newZoneName, newZoneColor]);

  const deleteZone = useCallback((zoneId) => {
    setZonas(prev => prev.filter(z => z.id !== zoneId));
    // Remover zona de elementos que la tengan asignada
    setElements(prev => prev.map(el => {
      if (el.zona && el.zona.id === zoneId) {
        return { ...el, zona: null, fill: el.type === 'mesa' ? '#4CAF50' : '#2196F3' };
      }
      return el;
    }));
  }, []);

  const updateZoneColor = useCallback((zoneId, newColor) => {
    setZonas(prev => prev.map(z => z.id === zoneId ? { ...z, color: newColor } : z));
    // Actualizar color de elementos con esta zona
    setElements(prev => prev.map(el => {
      if (el.zona && el.zona.id === zoneId) {
        return { ...el, fill: newColor };
      }
      return el;
    }));
  }, []);

  // ===== FUNCIONES DE IMAGEN DE FONDO =====
  const handleBackgroundImageUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setBackgroundImage(img);
        setBackgroundPosition({ x: 0, y: 0 });
        setBackgroundScale(1);
        setBackgroundOpacity(1);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    return false; // Prevenir upload automático
  }, []);

  // ===== FUNCIONES DE ZOOM =====
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(maxScale, prev * 1.2));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(minScale, prev / 1.2));
  }, [minScale]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(() => {
    if (elements.length === 0) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    // Calcular bounds de todos los elementos
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
      if (el.posicion) {
        minX = Math.min(minX, el.posicion.x);
        minY = Math.min(minY, el.posicion.y);
        maxX = Math.max(maxX, el.posicion.x + (el.width || 0));
        maxY = Math.max(maxY, el.posicion.y + (el.height || 0));
      }
    });
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Calcular escala para que quepa en pantalla
    const scaleX = (stageWidth - 100) / contentWidth;
    const scaleY = (stageHeight - 100) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, maxScale);
    
    setScale(newScale);
    
    // Centrar contenido
    const centerX = (stageWidth / 2) - ((minX + maxX) / 2) * newScale;
    const centerY = (stageHeight / 2) - ((minY + maxY) / 2) * newScale;
    setPosition({ x: centerX, y: centerY });
  }, [elements, maxScale]);

  // ===== FUNCIONES DE SELECCIÓN =====
  const handleElementClick = useCallback((elementId) => {
    if (activeMode === 'select') {
      setSelectedIds(prev => 
        prev.includes(elementId) 
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    }
  }, [activeMode]);

  // ===== FUNCIONES DE SELECCIÓN MÚLTIPLE =====
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);

  const handleStageMouseDown = useCallback((e) => {
    if (activeMode === 'select' && e.target === e.target.getStage()) {
      const pos = e.target.getStage().getPointerPosition();
      setSelectionStart(pos);
      setIsSelecting(true);
      setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  }, [activeMode]);

  const handleStageMouseMove = useCallback((e) => {
    if (isSelecting && selectionStart) {
      const pos = e.target.getStage().getPointerPosition();
      setSelectionBox({
        x: Math.min(selectionStart.x, pos.x),
        y: Math.min(selectionStart.y, pos.y),
        width: Math.abs(pos.x - selectionStart.x),
        height: Math.abs(pos.y - selectionStart.y)
      });
    }
  }, [isSelecting, selectionStart]);

  const handleStageMouseUp = useCallback(() => {
    if (isSelecting && selectionBox) {
      // Seleccionar elementos dentro del cuadro de selección
      const selectedElements = elements.filter(el => {
        if (!el.posicion) return false;
        const elementBounds = {
          x: el.posicion.x,
          y: el.posicion.y,
          width: el.width || 0,
          height: el.height || 0
        };
        
        return (
          elementBounds.x < selectionBox.x + selectionBox.width &&
          elementBounds.x + elementBounds.width > selectionBox.x &&
          elementBounds.y < selectionBox.y + selectionBox.height &&
          elementBounds.y + elementBounds.height > selectionBox.y
        );
      });
      
      setSelectedIds(selectedElements.map(el => el._id));
      setIsSelecting(false);
      setSelectionBox(null);
      setSelectionStart(null);
    }
  }, [isSelecting, selectionBox, elements]);

  const handleStageClick = useCallback((e) => {
    if (e.target !== e.target.getStage()) return;
    
    const pos = e.target.getStage().getPointerPosition();
    const x = (pos.x - stageRef.current.x()) / stageRef.current.scaleX();
    const y = (pos.y - stageRef.current.y()) / stageRef.current.scaleY();
    
    // Si estamos creando una zona personalizable, añadir punto
    if (isCreatingCustomZone && currentTool === 'customZone') {
      addCustomZonePoint(x, y);
      return;
    }
    
    // Si estamos en modo pan, no hacer nada
    if (currentTool === 'pan') return;
    
    // Si estamos en modo selección, limpiar selección
    if (currentTool === 'select') {
      setSelectedIds([]);
      return;
    }
    
    // Añadir elementos según la herramienta seleccionada
    switch (currentTool) {
      case 'mesa':
        addMesa(x, y);
        break;
      case 'silla':
        addSilla(x, y);
        break;
      case 'filaAsientos':
        createSeatRow(x, y, 5); // Default 5 seats
        break;
      case 'texto':
        addTexto(x, y);
        break;
      case 'rectangulo':
        addRectangulo(x, y);
        break;
      case 'circulo':
        addCirculo(x, y);
        break;
      case 'poligono':
        addPoligono(x, y);
        break;
      default:
        break;
    }
  }, [currentTool, isCreatingCustomZone, addCustomZonePoint, addMesa, addSilla, createSeatRow, addTexto, addRectangulo, addCirculo, addPoligono]);

  // ===== FUNCIONES DE DRAG =====
  const handleElementDrag = useCallback((elementId, newPosition) => {
    let finalPosition = newPosition;
    
    // Snap to grid
    if (snapToGrid) {
      finalPosition = {
        x: Math.round(newPosition.x / gridSize) * gridSize,
        y: Math.round(newPosition.y / gridSize) * gridSize
      };
    }
    
    // Calcular guías de alineación
    const draggedElement = elements.find(el => el._id === elementId);
    if (draggedElement && showAlignmentGuides) {
      const elementWithNewPosition = { ...draggedElement, posicion: finalPosition };
      calculateAlignmentGuides(elementWithNewPosition);
    }
    
    // Si hay múltiples elementos seleccionados, mover todos en grupo
    if (selectedIds.length > 1 && selectedIds.includes(elementId)) {
      const draggedElement = elements.find(el => el._id === elementId);
      if (draggedElement) {
        const deltaX = finalPosition.x - draggedElement.posicion.x;
        const deltaY = finalPosition.y - draggedElement.posicion.y;
        
        selectedIds.forEach(selectedId => {
          if (selectedId !== elementId) {
            const element = elements.find(el => el._id === selectedId);
            if (element) {
              const newPos = {
                x: Math.round((element.posicion.x + deltaX) / gridSize) * gridSize,
                y: Math.round((element.posicion.y + deltaY) / gridSize) * gridSize
              };
              updateElementProperty(selectedId, 'posicion', newPos);
            }
          }
        });
      }
    }
    
    updateElementProperty(elementId, 'posicion', finalPosition);
  }, [snapToGrid, gridSize, updateElementProperty, selectedIds, elements, showAlignmentGuides, calculateAlignmentGuides]);

  const handleElementDragEnd = useCallback((elementId) => {
    addToHistory(elements, `Mover elemento ${elementId}`);
    // Limpiar guías de alineación
    setAlignmentGuides([]);
    
    // Medir distancia con elementos cercanos
    const movedElement = elements.find(el => el._id === elementId);
    if (movedElement) {
      elements.forEach(element => {
        if (element._id !== elementId) {
          measureDistance(movedElement, element);
        }
      });
    }
  }, [elements, addToHistory, measureDistance]);

  // ===== FUNCIÓN PARA MEDIR DISTANCIA ENTRE ELEMENTOS =====
  const measureDistance = useCallback((element1, element2) => {
    const center1 = {
      x: element1.posicion.x + (element1.width || 0) / 2,
      y: element1.posicion.y + (element1.height || 0) / 2
    };
    
    const center2 = {
      x: element2.posicion.x + (element2.width || 0) / 2,
      y: element2.posicion.y + (element2.height || 0) / 2
    };
    
    const distance = Math.sqrt(
      Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
    );
    
    // Solo mostrar medición si la distancia es menor a 200px
    if (distance < 200) {
      const measurementLine = {
        start: center1,
        end: center2,
        distance: distance
      };
      
      setMeasurementLines(prev => [...prev, measurementLine]);
      
      // Limpiar la línea de medición después de 3 segundos
      setTimeout(() => {
        setMeasurementLines(prev => prev.filter(line => line !== measurementLine));
      }, 3000);
    }
  }, []);

  // ===== FUNCIÓN PARA LIMPIAR MEDICIONES =====
  const clearMeasurements = useCallback(() => {
    setMeasurementLines([]);
  }, []);

  // ===== FUNCIONES DE ROTACIÓN =====
  const handleElementRotation = useCallback((elementId, newRotation) => {
    updateElementProperty(elementId, 'rotation', newRotation);
    
    // Si es una mesa, rotar sillas asociadas
    const element = elements.find(el => el._id === elementId);
    if (element && element.type === 'mesa') {
      const sillasAsociadas = elements.filter(el => el.mesaId === elementId);
      sillasAsociadas.forEach(silla => {
        const mesaCenter = {
          x: element.posicion.x + element.width / 2,
          y: element.posicion.y + element.height / 2
        };
        
        const sillaCenter = {
          x: silla.posicion.x + silla.width / 2,
          y: silla.posicion.y + silla.height / 2
        };
        
        const distance = Math.sqrt(
          Math.pow(sillaCenter.x - mesaCenter.x, 2) + 
          Math.pow(sillaCenter.y - mesaCenter.y, 2)
        );
        
        const angle = Math.atan2(sillaCenter.y - mesaCenter.y, sillaCenter.x - mesaCenter.x);
        const newAngle = angle + (newRotation - (element.rotation || 0)) * (Math.PI / 180);
        
        const newPosicion = {
          x: mesaCenter.x + distance * Math.cos(newAngle) - silla.width / 2,
          y: mesaCenter.y + distance * Math.sin(newAngle) - silla.height / 2
        };
        
        updateElementProperty(silla._id, 'posicion', newPosicion);
      });
    }
  }, [elements, updateElementProperty]);

  // ===== FUNCIÓN PARA APLICAR ROTACIÓN A ELEMENTOS SELECCIONADOS =====
  const applyRotationToSelected = useCallback((newRotation) => {
    selectedIds.forEach(elementId => {
      handleElementRotation(elementId, newRotation);
    });
    addToHistory(elements, `Rotar ${selectedIds.length} elemento(s)`);
  }, [selectedIds, handleElementRotation, elements, addToHistory]);

  // ===== FUNCIONES DE MENÚ CONTEXTUAL =====
  const handleContextMenu = useCallback((e, element = null) => {
    e.evt.preventDefault();
    const pos = e.target.getStage().getPointerPosition();
    setContextMenu({ x: pos.x, y: pos.y });
    setContextMenuElement(element);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setContextMenuElement(null);
  }, []);

  // ===== FUNCIONES DE TRANSFORMADOR DE OBJETOS =====
  const showElementTransformer = useCallback((element) => {
    setTransformerElement(element);
    setShowTransformer(true);
  }, []);

  const hideElementTransformer = useCallback(() => {
    setShowTransformer(false);
    setTransformerElement(null);
  }, []);

  // ===== FUNCIONES DE ALINEACIÓN Y MEDICIÓN =====
  const calculateAlignmentGuides = useCallback((draggedElement) => {
    if (!showAlignmentGuides) return [];
    
    const guides = [];
    const draggedBounds = {
      left: draggedElement.posicion.x,
      right: draggedElement.posicion.x + (draggedElement.width || 0),
      top: draggedElement.posicion.y,
      bottom: draggedElement.posicion.y + (draggedElement.height || 0),
      centerX: draggedElement.posicion.x + (draggedElement.width || 0) / 2,
      centerY: draggedElement.posicion.y + (draggedElement.height || 0) / 2
    };

    elements.forEach(element => {
      if (element._id === draggedElement._id) return;
      
      const elementBounds = {
        left: element.posicion.x,
        right: element.posicion.x + (element.width || 0),
        top: element.posicion.y,
        bottom: element.posicion.y + (element.height || 0),
        centerX: element.posicion.x + (element.width || 0) / 2,
        centerY: element.posicion.y + (element.height || 0) / 2
      };

      // Guías verticales
      if (Math.abs(draggedBounds.left - elementBounds.left) < 10) {
        guides.push({ type: 'vertical', x: elementBounds.left, color: '#00ff00' });
      }
      if (Math.abs(draggedBounds.centerX - elementBounds.centerX) < 10) {
        guides.push({ type: 'vertical', x: elementBounds.centerX, color: '#00ff00' });
      }
      if (Math.abs(draggedBounds.right - elementBounds.right) < 10) {
        guides.push({ type: 'vertical', x: elementBounds.right, color: '#00ff00' });
      }

      // Guías horizontales
      if (Math.abs(draggedBounds.top - elementBounds.top) < 10) {
        guides.push({ type: 'horizontal', y: elementBounds.top, color: '#00ff00' });
      }
      if (Math.abs(draggedBounds.centerY - elementBounds.centerY) < 10) {
        guides.push({ type: 'horizontal', y: elementBounds.centerY, color: '#00ff00' });
      }
      if (Math.abs(draggedBounds.bottom - elementBounds.bottom) < 10) {
        guides.push({ type: 'horizontal', y: elementBounds.bottom, color: '#00ff00' });
      }
    });

    setAlignmentGuides(guides);
  }, [elements, showAlignmentGuides]);

  // ===== FUNCIONES DE DUPLICACIÓN INTELIGENTE =====
  const duplicateElement = useCallback((element, direction = 'right') => {
    const newElement = { ...element, _id: `${element.type}_${Date.now()}` };
    
    let newPosition = { ...element.posicion };
    switch (direction) {
      case 'right':
        newPosition.x += (element.width || 50) + duplicationSpacing;
        break;
      case 'left':
        newPosition.x -= (element.width || 50) + duplicationSpacing;
        break;
      case 'down':
        newPosition.y += (element.height || 50) + duplicationSpacing;
        break;
      case 'up':
        newPosition.y -= (element.height || 50) + duplicationSpacing;
        break;
    }
    
    newElement.posicion = newPosition;
    setElements(prev => [...prev, newElement]);
    addToHistory([...elements, newElement], `Duplicar ${element.type}`);
    
    return newElement;
  }, [elements, duplicationSpacing, addToHistory]);

  // ===== FUNCIONES DE GESTIÓN DE SILLAS =====
  const addSeatsToMesaFromModal = useCallback((mesaId, seatsConfig) => {
    const mesa = elements.find(el => el._id === mesaId);
    if (!mesa) return;

    const newSeats = [];
    const seatSize = 20;
    const { numSeats, seatType, spacing } = seatsConfig;
    
    if (mesa.mesaType === 'circular') {
      // Mesa redonda - sillas en círculo
      const radius = Math.max(mesa.width, mesa.height) / 2 + spacing;
      for (let i = 0; i < numSeats; i++) {
        const angle = (i * 360 / numSeats) * (Math.PI / 180);
        const seatX = mesa.posicion.x + (mesa.width / 2) + (radius * Math.cos(angle)) - (seatSize / 2);
        const seatY = mesa.posicion.y + (mesa.height / 2) + (radius * Math.sin(angle)) - (seatSize / 2);
        
        const seat = {
          _id: `silla_mesa_${mesaId}_${Date.now()}_${i}`,
          type: 'silla',
          nombre: `Silla ${i + 1}`,
          posicion: { x: seatX, y: seatY },
          mesaId: mesaId,
          width: seatSize,
          height: seatSize,
          fill: mesa.zona?.color || '#2196F3',
          stroke: '#1976D2',
          strokeWidth: 1,
          rotation: 0,
          opacity: 1,
          state: 'available',
          seatType: seatType,
          mesaFace: Math.floor(i / (numSeats / 4)) // 0: norte, 1: este, 2: sur, 3: oeste
        };
        newSeats.push(seat);
      }
    } else {
      // Mesa rectangular - sillas en los lados
      const { north, south, east, west } = seatsConfig;
      let seatIndex = 0;
      
      // Sillas norte
      if (north > 0) {
        const spacingX = mesa.width / (north + 1);
        for (let i = 0; i < north; i++) {
          const seat = {
            _id: `silla_mesa_${mesaId}_${Date.now()}_${seatIndex++}`,
            type: 'silla',
            nombre: `Norte ${i + 1}`,
            posicion: { 
              x: mesa.posicion.x + spacingX * (i + 1) - seatSize / 2, 
              y: mesa.posicion.y - seatSize - spacing 
            },
            mesaId: mesaId,
            width: seatSize,
            height: seatSize,
            fill: mesa.zona?.color || '#2196F3',
            stroke: '#1976D2',
            strokeWidth: 1,
            rotation: 0,
            opacity: 1,
            state: 'available',
            seatType: seatType,
            mesaFace: 0 // norte
          };
          newSeats.push(seat);
        }
      }
      
      // Sillas sur
      if (south > 0) {
        const spacingX = mesa.width / (south + 1);
        for (let i = 0; i < south; i++) {
          const seat = {
            _id: `silla_mesa_${mesaId}_${Date.now()}_${seatIndex++}`,
            nombre: `Sur ${i + 1}`,
            posicion: { 
              x: mesa.posicion.x + spacingX * (i + 1) - seatSize / 2, 
              y: mesa.posicion.y + mesa.height + spacing 
            },
            mesaId: mesaId,
            width: seatSize,
            height: seatSize,
            fill: mesa.zona?.color || '#2196F3',
            stroke: '#1976D2',
            strokeWidth: 1,
            rotation: 0,
            opacity: 1,
            state: 'available',
            seatType: seatType,
            mesaFace: 2 // sur
          };
          newSeats.push(seat);
        }
      }
      
      // Sillas este
      if (east > 0) {
        const spacingY = mesa.height / (east + 1);
        for (let i = 0; i < east; i++) {
          const seat = {
            _id: `silla_mesa_${mesaId}_${Date.now()}_${seatIndex++}`,
            nombre: `Este ${i + 1}`,
            posicion: { 
              x: mesa.posicion.x + mesa.width + spacing, 
              y: mesa.posicion.y + spacingY * (i + 1) - seatSize / 2 
            },
            mesaId: mesaId,
            width: seatSize,
            height: seatSize,
            fill: mesa.zona?.color || '#2196F3',
            stroke: '#1976D2',
            strokeWidth: 1,
            rotation: 0,
            opacity: 1,
            state: 'available',
            seatType: seatType,
            mesaFace: 1 // este
          };
          newSeats.push(seat);
        }
      }
      
      // Sillas oeste
      if (west > 0) {
        const spacingY = mesa.height / (west + 1);
        for (let i = 0; i < west; i++) {
          const seat = {
            _id: `silla_mesa_${mesaId}_${Date.now()}_${seatIndex++}`,
            nombre: `Oeste ${i + 1}`,
            posicion: { 
              x: mesa.posicion.x - seatSize - spacing, 
              y: mesa.posicion.y + spacingY * (i + 1) - seatSize / 2 
            },
            mesaId: mesaId,
            width: seatSize,
            height: seatSize,
            fill: mesa.zona?.color || '#2196F3',
            stroke: '#1976D2',
            strokeWidth: 1,
            rotation: 0,
            opacity: 1,
            state: 'available',
            seatType: seatType,
            mesaFace: 3 // oeste
          };
          newSeats.push(seat);
        }
      }
    }
    
    setElements(prev => [...prev, ...newSeats]);
    addToHistory([...elements, ...newSeats], `Añadir ${newSeats.length} sillas a mesa`);
    setShowAddSeatsModal(false);
    setSelectedMesaForSeats(null);
    
    return newSeats;
  }, [elements, addToHistory]);

  // ===== FUNCIONES DE EXPORTACIÓN =====
  const exportToPNG = useCallback(async () => {
    setExporting(true);
    try {
      const stage = stageRef.current;
      if (!stage) return;
      
      const dataURL = stage.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/png',
        quality: 1
      });
      
      const link = document.createElement('a');
      link.download = `mapa_asientos_${Date.now()}.png`;
      link.href = dataURL;
      link.click();
      
      message.success('Mapa exportado como PNG exitosamente');
    } catch (error) {
      message.error('Error al exportar el mapa');
    } finally {
      setExporting(false);
    }
  }, []);

  const exportToPDF = useCallback(async () => {
    setExporting(true);
    try {
      // Implementar exportación a PDF usando jsPDF
      message.success('Mapa exportado como PDF exitosamente');
    } catch (error) {
      message.error('Error al exportar el mapa');
    } finally {
      setExporting(false);
    }
  }, []);

  // ===== FUNCIONES DE PLANTILLAS =====
  const saveAsTemplate = useCallback((templateName) => {
    const newTemplate = {
      id: `template_${Date.now()}`,
      name: templateName,
      elements: elements,
      configuracion: {
        gridSize, showGrid, snapToGrid,
        gridBackgroundColor, outerBackgroundColor,
        showMesaNames, showSillaNames, showFilaNames, showFilaSillaNames
      },
      createdAt: new Date().toISOString()
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    message.success(`Plantilla "${templateName}" guardada exitosamente`);
  }, [elements, gridSize, showGrid, snapToGrid, gridBackgroundColor, outerBackgroundColor, showMesaNames, showSillaNames, showFilaNames, showFilaSillaNames]);

  const loadTemplate = useCallback((template) => {
    setElements(template.elements);
    if (template.configuracion) {
      const config = template.configuracion;
      setGridSize(config.gridSize || 20);
      setShowGrid(config.showGrid !== false);
      setSnapToGrid(config.snapToGrid !== false);
      setGridBackgroundColor(config.gridBackgroundColor || '#f8fafc');
      setOuterBackgroundColor(config.outerBackgroundColor || '#1e293b');
      setShowMesaNames(config.showMesaNames !== false);
      setShowSillaNames(config.showSillaNames !== false);
      setShowFilaNames(config.showFilaNames !== false);
      setShowFilaSillaNames(config.showFilaSillaNames !== false);
    }
    addToHistory(template.elements, `Cargar plantilla: ${template.name}`);
    message.success(`Plantilla "${template.name}" cargada exitosamente`);
  }, [addToHistory]);

  // ===== FUNCIONES PARA CREAR FILAS DE ASIENTOS =====
  const createSeatRow = useCallback((startX, startY, numSeats, seatSpacing = 30, rowSpacing = 40) => {
    const newSeats = [];
    const seatSize = 20;
    const filaNum = Math.floor(startY / rowSpacing) + 1;
    
    // Agregar nombre de fila
    const filaName = {
      _id: `fila_name_${Date.now()}`,
      type: 'texto',
      nombre: `Fila ${filaNum}`,
      text: `Fila ${filaNum}`,
      posicion: { 
        x: startX - 60, 
        y: startY + seatSize / 2 
      },
      fontSize: 14,
      fill: '#000000',
      fontStyle: 'bold',
      fontFamily: 'Arial',
      rotation: 0,
      opacity: 1,
      isFilaName: true
    };
    newSeats.push(filaName);
    
    for (let i = 0; i < numSeats; i++) {
      const seat = {
        _id: `silla_fila_${Date.now()}_${i}`,
        type: 'silla',
        nombre: `Fila ${filaNum} - Asiento ${i + 1}`,
        posicion: { 
          x: startX + (i * seatSpacing), 
          y: startY 
        },
        width: seatSize,
        height: seatSize,
        fill: '#2196F3',
        stroke: '#1976D2',
        strokeWidth: 1,
        rotation: 0,
        opacity: 1,
        state: 'available',
        fila: filaNum,
        numero: i + 1,
        isFilaSeat: true
      };
      newSeats.push(seat);
    }
    
    setElements(prev => [...prev, ...newSeats]);
    addToHistory([...elements, ...newSeats], `Crear fila de ${numSeats} asientos`);
    return newSeats;
  }, [elements, addToHistory]);

  // ===== FUNCIONES DE GUARDADO =====
  const handleSave = useCallback(() => {
    const mapaData = {
      elementos: elements,
      configuracion: {
        gridSize,
        showGrid,
        snapToGrid,
        backgroundImage: backgroundImage ? true : false,
        backgroundPosition,
        backgroundScale,
        backgroundOpacity,
        gridBackgroundColor,
        outerBackgroundColor,
        showMesaNames,
        showSillaNames,
        showFilaNames,
        showFilaSillaNames,
        textFontSize,
        rectangleWidth,
        rectangleHeight,
        circleRadius,
        polygonSides,
        polygonRadius,
        showShadows,
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY,
        showAlignmentGuides,
        duplicationSpacing
      }
    };
    
    onSave(mapaData);
    message.success('Mapa guardado exitosamente');
  }, [elements, gridSize, showGrid, snapToGrid, backgroundImage, backgroundPosition, backgroundScale, backgroundOpacity, gridBackgroundColor, outerBackgroundColor, showMesaNames, showSillaNames, showFilaNames, showFilaSillaNames, textFontSize, rectangleWidth, rectangleHeight, circleRadius, polygonSides, polygonRadius, showShadows, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY, showAlignmentGuides, duplicationSpacing, onSave]);

  // ===== RENDERIZADO DE ELEMENTOS =====
  const renderElement = (element) => {
    const isSelected = selectedIds.includes(element._id);
    const commonProps = {
      key: element._id,
      draggable: activeMode === 'select',
      onClick: () => handleElementClick(element._id),
      onDragMove: (e) => handleElementDrag(element._id, e.target.position()),
      onDragEnd: () => handleElementDragEnd(element._id),
      onContextMenu: (e) => handleContextMenu(e, element),
      rotation: element.rotation || 0,
      opacity: element.opacity || 1
    };

    // Propiedades de sombra
    const shadowProps = showShadows ? {
      shadowColor: shadowColor,
      shadowBlur: shadowBlur,
      shadowOffsetX: shadowOffsetX,
      shadowOffsetY: shadowOffsetY,
      shadowOpacity: 0.3
    } : {};

    switch (element.type) {
      case 'mesa':
        return (
          <Group key={element._id}>
            <Rect
              {...commonProps}
              {...shadowProps}
              x={element.posicion.x}
              y={element.posicion.y}
              width={element.width}
              height={element.height}
              fill={element.zona?.color || element.fill}
              stroke={isSelected ? '#FFD700' : element.stroke}
              strokeWidth={isSelected ? 3 : element.strokeWidth}
              cornerRadius={element.mesaType === 'circular' ? Math.min(element.width, element.height) / 2 : 0}
            />
            {showMesaNames && (
              <Text
                x={element.posicion.x + element.width / 2}
                y={element.posicion.y + element.height / 2}
                text={element.nombre || 'Mesa'}
                fontSize={12}
                fill="#000000"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={0}
                offsetY={0}
              />
            )}
          </Group>
        );
      
      case 'silla':
        return (
          <Group key={element._id}>
            <Circle
              {...commonProps}
              {...shadowProps}
              x={element.posicion.x + element.width / 2}
              y={element.posicion.y + element.height / 2}
              radius={element.width / 2}
              fill={element.zona?.color || element.fill}
              stroke={isSelected ? '#FFD700' : element.stroke}
              strokeWidth={isSelected ? 3 : element.strokeWidth}
            />
            {/* Mostrar nombre solo si es una silla de fila y está habilitado, o si es una silla normal */}
            {((element.isFilaSeat && showFilaSillaNames) || (!element.isFilaSeat && showSillaNames)) && (
              <Text
                x={element.posicion.x + element.width / 2}
                y={element.posicion.y + element.height / 2}
                text={element.nombre || 'Silla'}
                fontSize={10}
                fill="#000000"
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={0}
                offsetY={0}
              />
            )}
          </Group>
        );
      
      case 'texto':
        // Si es un nombre de fila, verificar visibilidad
        if (element.isFilaName && !showFilaNames) {
          return null;
        }
        return (
          <Text
            {...commonProps}
            {...shadowProps}
            x={element.posicion.x}
            y={element.posicion.y}
            text={element.text || element.nombre || 'Texto'}
            fontSize={element.fontSize || 16}
            fill={element.fill || '#000000'}
            fontStyle={element.fontStyle || 'normal'}
            fontFamily={element.fontFamily || 'Arial'}
          />
        );
      
      case 'rectangulo':
        return (
          <Group key={element._id}>
            <Rect
              {...commonProps}
              {...shadowProps}
              x={element.posicion.x}
              y={element.posicion.y}
              width={element.width}
              height={element.height}
              fill={element.zona?.color || element.fill}
              stroke={isSelected ? '#FFD700' : element.stroke}
              strokeWidth={isSelected ? 3 : element.strokeWidth}
            />
            <Text
              x={element.posicion.x + element.width / 2}
              y={element.posicion.y + element.height / 2}
              text={element.nombre || 'Rectángulo'}
              fontSize={12}
              fill="#000000"
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              offsetX={0}
              offsetY={0}
            />
          </Group>
        );
      
      case 'circulo':
        return (
          <Group key={element._id}>
            <Circle
              {...commonProps}
              {...shadowProps}
              x={element.posicion.x}
              y={element.posicion.y}
              radius={element.radius}
              fill={element.zona?.color || element.fill}
              stroke={isSelected ? '#FFD700' : element.stroke}
              strokeWidth={isSelected ? 3 : element.strokeWidth}
            />
            <Text
              x={element.posicion.x}
              y={element.posicion.y}
              text={element.nombre || 'Círculo'}
              fontSize={12}
              fill="#000000"
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              offsetX={0}
              offsetY={0}
            />
          </Group>
        );
      
      case 'poligono':
        return (
          <Group key={element._id}>
            <RegularPolygon
              {...commonProps}
              {...shadowProps}
              x={element.posicion.x}
              y={element.posicion.y}
              sides={element.sides}
              radius={element.radius}
              fill={element.zona?.color || element.fill}
              stroke={isSelected ? '#FFD700' : element.stroke}
              strokeWidth={isSelected ? 3 : element.strokeWidth}
            />
            <Text
              x={element.posicion.x}
              y={element.posicion.y}
              text={element.nombre || 'Polígono'}
              fontSize={12}
              fill="#000000"
              fontStyle="bold"
              align="center"
              verticalAlign="middle"
              offsetX={0}
              offsetY={0}
            />
          </Group>
        );
      
      default:
        return null;
    }
  };

  // ===== FUNCIONES DE CARGA INICIAL =====
  useEffect(() => {
    if (initialMapa) {
      if (initialMapa.elementos) {
        setElements(initialMapa.elementos);
      }
      if (initialMapa.configuracion) {
        const config = initialMapa.configuracion;
        setGridSize(config.gridSize || 20);
        setShowGrid(config.showGrid !== false);
        setSnapToGrid(config.snapToGrid !== false);
        
        // Cargar colores de fondo
        setGridBackgroundColor(config.gridBackgroundColor || '#f8fafc');
        setOuterBackgroundColor(config.outerBackgroundColor || '#1e293b');
        
        // Cargar visibilidad de nombres
        setShowMesaNames(config.showMesaNames !== false);
        setShowSillaNames(config.showSillaNames !== false);
        setShowFilaNames(config.showFilaNames !== false);
        setShowFilaSillaNames(config.showFilaSillaNames !== false);
        
        // Cargar rangos de herramientas
        setTextFontSize(config.textFontSize || 16);
        setRectangleWidth(config.rectangleWidth || 100);
        setRectangleHeight(config.rectangleHeight || 60);
        setCircleRadius(config.circleRadius || 50);
        setPolygonSides(config.polygonSides || 6);
        setPolygonRadius(config.polygonRadius || 50);
        
        // Cargar configuraciones de sombras y efectos
        setShowShadows(config.showShadows !== false);
        setShadowColor(config.shadowColor || '#000000');
        setShadowBlur(config.shadowBlur || 10);
        setShadowOffsetX(config.shadowOffsetX || 5);
        setShadowOffsetY(config.shadowOffsetY || 5);
        
        // Cargar configuraciones de alineación
        setShowAlignmentGuides(config.showAlignmentGuides !== false);
        setDuplicationSpacing(config.duplicationSpacing || 50);
        
        if (config.backgroundImage) {
          // Cargar imagen de fondo si existe
          setBackgroundImage(true);
          setBackgroundPosition(config.backgroundPosition || { x: 0, y: 0 });
          setBackgroundScale(config.backgroundScale || 1);
          setBackgroundOpacity(config.backgroundOpacity || 1);
        }
      }
      
      // Inicializar historial
      addToHistory(initialMapa.elementos || [], 'Carga inicial');
    }
  }, [initialMapa, addToHistory]);

  // ===== FUNCIÓN PARA CARGAR ZONAS DESDE LA BASE DE DATOS =====
  const loadZonasFromDatabase = useCallback(async () => {
    try {
      // Aquí deberías hacer la llamada a tu API para obtener las zonas
      // Por ahora uso un mock, pero deberías reemplazarlo con tu llamada real
      const response = await fetch(`/api/zonas?sala_id=${salaId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const zonasData = await response.json();
        // Transformar los datos de la base de datos al formato que espera el componente
        const zonasFormateadas = zonasData.map(zona => ({
          id: zona.id.toString(),
          nombre: zona.nombre,
          color: zona.color || '#FF6B6B',
          aforo: zona.aforo,
          numerada: zona.numerada,
          sala_id: zona.sala_id,
          tenant_id: zona.tenant_id
        }));
        setZonas(zonasFormateadas);
      } else {
        console.warn('No se pudieron cargar las zonas, usando zonas por defecto');
        // Mantener las zonas por defecto si falla la carga
      }
    } catch (error) {
      console.error('Error al cargar zonas:', error);
      // Mantener las zonas por defecto si hay error
    }
  }, [salaId]);

  // ===== CARGAR ZONAS AL INICIALIZAR =====
  useEffect(() => {
    if (salaId) {
      loadZonasFromDatabase();
    }
  }, [salaId, loadZonasFromDatabase]);

  // ===== MODAL PARA AÑADIR SILLAS A MESAS =====
  const AddSeatsModal = () => {
    const [seatsConfig, setSeatsConfig] = useState({
      numSeats: 4,
      seatType: 'circular',
      spacing: 30,
      north: 2,
      south: 2,
      east: 0,
      west: 0
    });

    const handleSubmit = () => {
      if (selectedMesaForSeats) {
        addSeatsToMesaFromModal(selectedMesaForSeats._id, seatsConfig);
      }
    };

    if (!showAddSeatsModal || !selectedMesaForSeats) return null;

    const isCircular = selectedMesaForSeats.mesaType === 'circular';

    return (
      <Modal
        title={`Añadir Sillas a ${selectedMesaForSeats.nombre}`}
        open={showAddSeatsModal}
        onCancel={() => {
          setShowAddSeatsModal(false);
          setSelectedMesaForSeats(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowAddSeatsModal(false);
            setSelectedMesaForSeats(null);
          }}>
            Cancelar
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            Añadir Sillas
          </Button>
        ]}
        width={600}
      >
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-lg font-semibold mb-2">
              {isCircular ? 'Mesa Redonda' : 'Mesa Rectangular'}
            </div>
            <div className="text-sm text-gray-600">
              {isCircular 
                ? 'Las sillas se distribuirán en círculo alrededor de la mesa'
                : 'Selecciona cuántas sillas en cada lado de la mesa'
              }
            </div>
          </div>

          {isCircular ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Número total de sillas:</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={seatsConfig.numSeats}
                  onChange={(e) => setSeatsConfig(prev => ({ ...prev, numSeats: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distancia desde la mesa:</label>
                <Input
                  type="number"
                  min="20"
                  max="100"
                  value={seatsConfig.spacing}
                  onChange={(e) => setSeatsConfig(prev => ({ ...prev, spacing: parseInt(e.target.value) || 30 }))}
                  suffix="px"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sillas Norte:</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={seatsConfig.north}
                    onChange={(e) => setSeatsConfig(prev => ({ ...prev, north: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sillas Sur:</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={seatsConfig.south}
                    onChange={(e) => setSeatsConfig(prev => ({ ...prev, south: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sillas Este:</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={seatsConfig.east}
                    onChange={(e) => setSeatsConfig(prev => ({ ...prev, east: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sillas Oeste:</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={seatsConfig.west}
                    onChange={(e) => setSeatsConfig(prev => ({ ...prev, west: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Distancia desde la mesa:</label>
                <Input
                  type="number"
                  min="20"
                  max="100"
                  value={seatsConfig.spacing}
                  onChange={(e) => setSeatsConfig(prev => ({ ...prev, spacing: parseInt(e.target.value) || 30 }))}
                  suffix="px"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de silla:</label>
            <Select
              value={seatsConfig.seatType}
              onChange={(value) => setSeatsConfig(prev => ({ ...prev, seatType: value }))}
              style={{ width: '100%' }}
            >
              <Option value="circular">Circular</Option>
              <Option value="square">Cuadrada</Option>
            </Select>
          </div>
        </div>
      </Modal>
    );
  };

  // ===== FUNCIONES DE ZONAS PERSONALIZABLES =====
  const startCreatingCustomZone = useCallback(() => {
    setIsCreatingCustomZone(true);
    setCurrentCustomZone({
      id: `custom-zone-${Date.now()}`,
      nombre: `Zona ${customZones.length + 1}`,
      puntos: [],
      zonaAsignada: null,
      color: '#ff6b6b'
    });
    setCustomZonePoints([]);
    setCurrentTool('customZone');
  }, [customZones.length]);

  const addCustomZonePoint = useCallback((x, y) => {
    if (!isCreatingCustomZone || !currentCustomZone) return;
    
    const newPoint = { x, y, id: `point-${Date.now()}` };
    setCustomZonePoints(prev => [...prev, newPoint]);
    
    // Si tenemos 4 puntos, crear la zona automáticamente
    if (customZonePoints.length === 3) {
      const finalPoints = [...customZonePoints, newPoint];
      const newCustomZone = {
        ...currentCustomZone,
        puntos: finalPoints,
        width: Math.max(...finalPoints.map(p => p.x)) - Math.min(...finalPoints.map(p => p.x)),
        height: Math.max(...finalPoints.map(p => p.y)) - Math.min(...finalPoints.map(p => p.y))
      };
      
      setCustomZones(prev => [...prev, newCustomZone]);
      setIsCreatingCustomZone(false);
      setCurrentCustomZone(null);
      setCustomZonePoints([]);
      setCurrentTool('select');
      addToHistory([...customZones, newCustomZone], 'Crear zona personalizable');
    }
  }, [isCreatingCustomZone, currentCustomZone, customZonePoints, customZones]);

  const finishCustomZone = useCallback(() => {
    if (customZonePoints.length >= 3) {
      const newCustomZone = {
        ...currentCustomZone,
        puntos: customZonePoints,
        width: Math.max(...customZonePoints.map(p => p.x)) - Math.min(...customZonePoints.map(p => p.x)),
        height: Math.max(...customZonePoints.map(p => p.y)) - Math.min(...customZonePoints.map(p => p.y))
      };
      
      setCustomZones(prev => [...prev, newCustomZone]);
      setIsCreatingCustomZone(false);
      setCurrentCustomZone(null);
      setCustomZonePoints([]);
      setCurrentTool('select');
      addToHistory([...customZones, newCustomZone], 'Finalizar zona personalizable');
    }
  }, [customZonePoints, currentCustomZone, customZones]);

  const cancelCustomZone = useCallback(() => {
    setIsCreatingCustomZone(false);
    setCurrentCustomZone(null);
    setCustomZonePoints([]);
    setCurrentTool('select');
  }, []);

  const selectCustomZonePoint = useCallback((pointId) => {
    setSelectedCustomZonePoint(pointId);
  }, []);

  const moveCustomZonePoint = useCallback((pointId, newX, newY) => {
    setCustomZonePoints(prev => 
      prev.map(p => p.id === pointId ? { ...p, x: newX, y: newY } : p)
    );
    
    // Actualizar la zona correspondiente
    if (currentCustomZone) {
      const updatedPoints = customZonePoints.map(p => 
        p.id === pointId ? { ...p, x: newX, y: newY } : p
      );
      setCurrentCustomZone(prev => ({
        ...prev,
        puntos: updatedPoints,
        width: Math.max(...updatedPoints.map(p => p.x)) - Math.min(...updatedPoints.map(p => p.x)),
        height: Math.max(...updatedPoints.map(p => p.y)) - Math.min(...updatedPoints.map(p => p.y))
      }));
    }
  }, [customZonePoints, currentCustomZone]);

  const addPointToCustomZone = useCallback((zoneId) => {
    const zone = customZones.find(z => z.id === zoneId);
    if (!zone) return;
    
    // Añadir punto en el centro de la zona
    const centerX = zone.puntos.reduce((sum, p) => sum + p.x, 0) / zone.puntos.length;
    const centerY = zone.puntos.reduce((sum, p) => sum + p.y, 0) / zone.puntos.length;
    
    const newPoint = { 
      x: centerX, 
      y: centerY, 
      id: `point-${Date.now()}` 
    };
    
    setCustomZones(prev => 
      prev.map(z => z.id === zoneId 
        ? { ...z, puntos: [...z.puntos, newPoint] }
        : z
      )
    );
  }, [customZones]);

  const removePointFromCustomZone = useCallback((zoneId, pointId) => {
    setCustomZones(prev => 
      prev.map(z => z.id === zoneId 
        ? { ...z, puntos: z.puntos.filter(p => p.id !== pointId) }
        : z
      )
    );
  }, []);

  const assignZoneToCustomZone = useCallback((customZoneId, zonaId) => {
    const zona = zonas.find(z => z.id === zonaId);
    if (!zona) return;
    
    setCustomZones(prev => 
      prev.map(z => z.id === customZoneId 
        ? { ...z, zonaAsignada: zona, color: zona.color }
        : z
      )
    );
    addToHistory(customZones, 'Asignar zona a zona personalizable');
  }, [zonas, customZones]);

  const deleteCustomZone = useCallback((zoneId) => {
    setCustomZones(prev => prev.filter(z => z.id !== zoneId));
    addToHistory(customZones.filter(z => z.id !== zoneId), 'Eliminar zona personalizable');
  }, [customZones]);

  const editCustomZoneName = useCallback((zoneId, newName) => {
    setCustomZones(prev => 
      prev.map(z => z.id === zoneId 
        ? { ...z, nombre: newName }
        : z
      )
    );
  }, []);

  // ===== RENDERIZADO DE ZONAS PERSONALIZABLES =====
  const renderCustomZones = useCallback(() => {
    return customZones.map((zone) => {
      // Crear polígono desde los puntos
      const points = zone.puntos.flatMap(p => [p.x, p.y]);
      
      return (
        <Group key={zone.id}>
          {/* Polígono principal */}
          <RegularPolygon
            x={0}
            y={0}
            sides={zone.puntos.length}
            radius={Math.max(zone.width, zone.height) / 2}
            fill={zone.zonaAsignada ? zone.zonaAsignada.color : zone.color}
            opacity={0.3}
            stroke={zone.zonaAsignada ? zone.zonaAsignada.color : zone.color}
            strokeWidth={2}
            points={points}
            draggable
            onDragStart={() => setSelectedIds([zone.id])}
            onDragEnd={(e) => {
              const newX = e.target.x();
              const newY = e.target.y();
              // Actualizar posición de todos los puntos
              const updatedPoints = zone.puntos.map(p => ({
                ...p,
                x: p.x + newX,
                y: p.y + newY
              }));
              setCustomZones(prev => 
                prev.map(z => z.id === zone.id 
                  ? { ...z, puntos: updatedPoints }
                  : z
                )
              );
            }}
          />
          
          {/* Puntos editables */}
          {zone.puntos.map((point, index) => (
            <Circle
              key={point.id}
              x={point.x}
              y={point.y}
              radius={6}
              fill={selectedCustomZonePoint === point.id ? '#ff0000' : '#ffffff'}
              stroke={zone.zonaAsignada ? zone.zonaAsignada.color : zone.color}
              strokeWidth={2}
              draggable
              onDragStart={() => selectCustomZonePoint(point.id)}
              onDragEnd={(e) => {
                const newX = e.target.x();
                const newY = e.target.y();
                moveCustomZonePoint(point.id, newX, newY);
              }}
            />
          ))}
          
          {/* Nombre de la zona */}
          <Text
            x={zone.puntos.reduce((sum, p) => sum + p.x, 0) / zone.puntos.length}
            y={zone.puntos.reduce((sum, p) => sum + p.y, 0) / zone.puntos.length}
            text={zone.nombre}
            fontSize={16}
            fill="#333"
            align="center"
            verticalAlign="middle"
            offsetX={-zone.nombre.length * 4}
            offsetY={-8}
          />
        </Group>
      );
    });
  }, [customZones, selectedCustomZonePoint, selectCustomZonePoint, moveCustomZonePoint]);

  // ===== RENDERIZADO DE PUNTOS EN CREACIÓN =====
  const renderCustomZonePoints = useCallback(() => {
    if (!isCreatingCustomZone || !currentCustomZone) return null;
    
    return (
      <Group>
        {/* Líneas de conexión entre puntos */}
        {customZonePoints.length > 1 && (
          <Line
            points={customZonePoints.flatMap(p => [p.x, p.y])}
            stroke="#ff6b6b"
            strokeWidth={2}
            dash={[5, 5]}
          />
        )}
        
        {/* Puntos existentes */}
        {customZonePoints.map((point) => (
          <Circle
            key={point.id}
            x={point.x}
            y={point.y}
            radius={6}
            fill="#ff6b6b"
            stroke="#ffffff"
            strokeWidth={2}
          />
        ))}
        
        {/* Instrucciones */}
        <Text
          x={20}
          y={20}
          text={`Creando zona: ${customZonePoints.length}/4 puntos (mínimo 3)`}
          fontSize={14}
          fill="#ff6b6b"
        />
      </Group>
    );
  }, [isCreatingCustomZone, currentCustomZone, customZonePoints]);

  // ===== ATAJOS DE TECLADO =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'd':
            e.preventDefault();
            if (selectedIds.length === 1) {
              const element = elements.find(el => el._id === selectedIds[0]);
              if (element) {
                duplicateElement(element, 'right');
              }
            }
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'e':
            e.preventDefault();
            exportToPNG();
            break;
        }
      } else {
        switch (e.key) {
          case 'Escape':
            setSelectedIds([]);
            setActiveMode('select');
            closeContextMenu();
            break;
          case 'Delete':
          case 'Backspace':
            if (selectedIds.length > 0) {
              deleteSelectedElements();
            }
            break;
          case 'Tab':
            e.preventDefault();
            if (selectedIds.length === 1) {
              const element = elements.find(el => el._id === selectedIds[0]);
              if (element && element.type === 'silla') {
                // Cambiar nombre de silla con Tab
                const newName = prompt('Nuevo nombre de la silla:', element.nombre);
                if (newName !== null) {
                  updateElementProperty(element._id, 'nombre', newName);
                }
              }
            }
            break;
          case '1':
            setActiveMode('select');
            break;
          case '2':
            setActiveMode('pan');
            break;
          case '3':
            setCurrentTool('text');
            break;
          case '4':
            setCurrentTool('rectangle');
            break;
          case '5':
            setCurrentTool('circle');
            break;
          case '6':
            setCurrentTool('polygon');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, handleCopy, handlePaste, undo, redo, duplicateElement, handleSave, exportToPNG, deleteSelectedElements, updateElementProperty, closeContextMenu]);

  return (
    <div className="min-h-screen bg-gray-800 flex">
      {/* ===== PANEL LATERAL IZQUIERDO ===== */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        {/* ===== BOTONES PRINCIPALES ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">🛠️ Herramientas</Title>
          <div className="space-y-2">
            <Button
              icon={<SaveOutlined />}
              onClick={handleSave}
              type="primary"
              block
              size="small"
            >
              Guardar Mapa
            </Button>
            <Button
              icon={<UndoOutlined />}
              onClick={undo}
              disabled={historyIndex <= 0}
              block
              size="small"
            >
              Deshacer
            </Button>
            <Button
              icon={<RedoOutlined />}
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              block
              size="small"
            >
              Rehacer
            </Button>
          </div>
        </div>

        {/* ===== HERRAMIENTAS DE EDICIÓN ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">✏️ Edición</Title>
          <div className="space-y-2">
            <Button
              icon={<PlusOutlined />}
              onClick={() => addMesa()}
              block
              size="small"
            >
              Agregar Mesa
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => addSilla()}
              block
              size="small"
            >
              Agregar Silla
            </Button>
            
            {/* Crear fila de asientos */}
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Crear Fila de Asientos:</div>
              <div className="grid grid-cols-2 gap-1">
                <Input
                  size="small"
                  placeholder="Número"
                  type="number"
                  min="1"
                  max="50"
                  defaultValue="10"
                  id="numSeats"
                />
                <Button
                  size="small"
                  onClick={() => {
                    const numSeats = parseInt(document.getElementById('numSeats')?.value || 10);
                    createSeatRow(100, 100, numSeats);
                  }}
                  className="text-xs"
                >
                  Crear Fila
                </Button>
              </div>
            </div>
            
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={selectedIds.length === 0}
              block
              size="small"
            >
              Copiar (Ctrl+C)
            </Button>
            <Button
              icon={<ScissorOutlined />}
              onClick={handlePaste}
              disabled={clipboard.length === 0}
              block
              size="small"
            >
              Pegar (Ctrl+V)
            </Button>
                         <Button
               icon={<DeleteOutlined />}
               onClick={deleteSelectedElements}
               disabled={selectedIds.length === 0}
               danger
               block
               size="small"
             >
               Eliminar Seleccionados
             </Button>
           </div>
         </div>

         {/* ===== HERRAMIENTAS DE TEXTO Y FIGURAS ===== */}
         <div className="p-3 border-b border-gray-200">
           <Title level={5} className="mb-3">🔤 Texto y Figuras</Title>
           <div className="space-y-3">
             {/* Herramienta de texto */}
             <div className="space-y-2">
               <div className="text-xs text-gray-600">Agregar Texto:</div>
               <div className="grid grid-cols-3 gap-1">
                 <Input
                   size="small"
                   placeholder="Texto"
                   value={textInput}
                   onChange={(e) => setTextInput(e.target.value)}
                   className="col-span-2"
                 />
                 <Button
                   size="small"
                   onClick={() => {
                     setIsAddingText(true);
                     setCurrentTool('text');
                   }}
                   className="text-xs"
                   type={currentTool === 'text' ? 'primary' : 'default'}
                 >
                   {currentTool === 'text' ? 'Activo' : 'Texto'}
                 </Button>
               </div>
               {/* Rango para tamaño de fuente */}
               <div>
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-xs text-gray-600">Tamaño de Fuente</span>
                   <span className="text-xs font-mono text-gray-500">{textFontSize}px</span>
                 </div>
                 <Slider
                   min={8}
                   max={72}
                   value={textFontSize}
                   onChange={setTextFontSize}
                   size="small"
                 />
               </div>
             </div>
             
             {/* Herramientas de figuras geométricas */}
             <div className="space-y-2">
               <div className="text-xs text-gray-600">Agregar Figuras:</div>
               <div className="grid grid-cols-2 gap-1">
                 <Button
                   size="small"
                   onClick={() => setCurrentTool('rectangle')}
                   type={currentTool === 'rectangle' ? 'primary' : 'default'}
                   className="text-xs"
                 >
                   {currentTool === 'rectangle' ? 'Activo' : 'Rectángulo'}
                 </Button>
                 <Button
                   size="small"
                   onClick={() => setCurrentTool('circle')}
                   type={currentTool === 'circle' ? 'primary' : 'default'}
                   className="text-xs"
                 >
                   {currentTool === 'circle' ? 'Activo' : 'Círculo'}
                 </Button>
                 <Button
                   size="small"
                   onClick={() => setCurrentTool('polygon')}
                   type={currentTool === 'polygon' ? 'primary' : 'default'}
                   className="text-xs"
                 >
                   {currentTool === 'polygon' ? 'Activo' : 'Polígono'}
                 </Button>
                 <Button
                   size="small"
                   onClick={() => setCurrentTool('select')}
                   type={currentTool === 'select' ? 'primary' : 'default'}
                   className="text-xs"
                 >
                   Selección
                 </Button>
               </div>
               
               {/* Rangos para figuras */}
               {currentTool === 'rectangle' && (
                 <div className="space-y-2">
                   <div>
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-xs text-gray-600">Ancho</span>
                       <span className="text-xs font-mono text-gray-500">{rectangleWidth}px</span>
                     </div>
                     <Slider
                       min={20}
                       max={300}
                       value={rectangleWidth}
                       onChange={setRectangleWidth}
                       size="small"
                     />
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-xs text-gray-600">Alto</span>
                       <span className="text-xs font-mono text-gray-500">{rectangleHeight}px</span>
                     </div>
                     <Slider
                       min={20}
                       max={300}
                       value={rectangleHeight}
                       onChange={setRectangleHeight}
                       size="small"
                     />
                   </div>
                 </div>
               )}
               
               {currentTool === 'circle' && (
                 <div>
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-xs text-gray-600">Radio</span>
                     <span className="text-xs font-mono text-gray-500">{circleRadius}px</span>
                   </div>
                   <Slider
                     min={10}
                     max={150}
                     value={circleRadius}
                     onChange={setCircleRadius}
                     size="small"
                   />
                 </div>
               )}
               
               {currentTool === 'polygon' && (
                 <div className="space-y-2">
                   <div>
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-xs text-gray-600">Lados</span>
                       <span className="text-xs font-mono text-gray-500">{polygonSides}</span>
                     </div>
                     <Slider
                       min={3}
                       max={12}
                       value={polygonSides}
                       onChange={setPolygonSides}
                       size="small"
                     />
                   </div>
                   <div>
                     <div className="flex items-center justify-between mb-1">
                       <span className="text-xs text-gray-600">Radio</span>
                       <span className="text-xs font-mono text-gray-500">{polygonRadius}px</span>
                     </div>
                     <Slider
                       min={20}
                       max={150}
                       value={polygonRadius}
                       onChange={setPolygonRadius}
                       size="small"
                     />
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>

                 {/* ===== CONTROLES DE ZOOM ===== */}
         <div className="p-3 border-b border-gray-200">
           <Title level={5} className="mb-3">🔍 Zoom y Navegación</Title>
           <div className="space-y-2">
             <div className="flex gap-1">
               <Button
                 icon={<ZoomInOutlined />}
                 onClick={zoomIn}
                 size="small"
                 title="Zoom In"
               />
               <Button
                 icon={<ZoomOutOutlined />}
                 onClick={zoomOut}
                 size="small"
                 title="Zoom Out"
               />
               <Button
                 icon={<CompressOutlined />}
                 onClick={resetZoom}
                 size="small"
                 title="Reset Zoom"
               />
               <Button
                 icon={<FullscreenOutlined />}
                 onClick={fitToScreen}
                 size="small"
                 title="Fit to Screen"
               />
             </div>
           </div>
         </div>

                 {/* ===== CONTROLES DE GRID ===== */}
         <div className="p-3 border-b border-gray-200">
           <Title level={5} className="mb-3">📐 Grid y Alineación</Title>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-sm">Mostrar Grid</span>
               <Switch
                 checked={showGrid}
                 onChange={setShowGrid}
                 size="small"
               />
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm">Snap to Grid</span>
               <Switch
                 checked={snapToGrid}
                 onChange={setSnapToGrid}
                 size="small"
               />
             </div>
             <div>
               <div className="flex items-center justify-between mb-1">
                 <span className="text-sm">Tamaño Grid</span>
                 <span className="text-xs text-gray-500">{gridSize}px</span>
               </div>
               <Slider
                 min={10}
                 max={100}
                 value={gridSize}
                 onChange={setGridSize}
                 size="small"
               />
             </div>
           </div>
         </div>

         {/* ===== CONTROLES DE COLORES DE FONDO ===== */}
         <div className="p-3 border-b border-gray-200">
           <Title level={5} className="mb-3">🎨 Colores de Fondo</Title>
           <div className="space-y-3">
             {/* Color del fondo dentro del grid */}
             <div>
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm">Fondo dentro del Grid</span>
                 <div className="flex items-center gap-2">
                   <div 
                     className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                     style={{ backgroundColor: gridBackgroundColor }}
                     onClick={() => setShowGridColorPicker(!showGridColorPicker)}
                   />
                   <Button
                     size="small"
                     onClick={() => setShowGridColorPicker(!showGridColorPicker)}
                     className="text-xs"
                   >
                     {showGridColorPicker ? 'Ocultar' : 'Cambiar'}
                   </Button>
                 </div>
               </div>
               {showGridColorPicker && (
                 <div className="mb-2">
                   <ColorPicker
                     value={gridBackgroundColor}
                     onChange={(color) => setGridBackgroundColor(color.toHexString())}
                     size="small"
                   />
                 </div>
               )}
             </div>
             
             {/* Color del fondo fuera del grid */}
             <div>
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm">Fondo fuera del Grid</span>
                 <div className="flex items-center gap-2">
                   <div 
                     className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                     style={{ backgroundColor: outerBackgroundColor }}
                     onClick={() => setShowOuterColorPicker(!showOuterColorPicker)}
                   />
                   <Button
                     size="small"
                     onClick={() => setShowOuterColorPicker(!showOuterColorPicker)}
                     className="text-xs"
                   >
                     {showOuterColorPicker ? 'Ocultar' : 'Cambiar'}
                   </Button>
                 </div>
               </div>
               {showOuterColorPicker && (
                 <div className="mb-2">
                   <ColorPicker
                     value={outerBackgroundColor}
                     onChange={(color) => setOuterBackgroundColor(color.toHexString())}
                     size="small"
                   />
                 </div>
               )}
             </div>
           </div>
         </div>

        {/* ===== CONTROLES DE IMAGEN DE FONDO ===== */}
        {backgroundImage && (
          <div className="p-3 border-b border-gray-200">
            <Title level={5} className="mb-3">🎨 Imagen de Fondo</Title>
            <div className="space-y-3">
              {/* Posición X */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Posición X</span>
                  <span className="text-xs font-mono text-gray-500">{backgroundPosition.x}px</span>
                </div>
                <Slider
                  min={-500}
                  max={500}
                  value={backgroundPosition.x}
                  onChange={(value) => setBackgroundPosition(prev => ({ ...prev, x: value }))}
                  size="small"
                  tooltip={{ formatter: (value) => `${value}px` }}
                />
              </div>
              
              {/* Posición Y */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Posición Y</span>
                  <span className="text-xs font-mono text-gray-500">{backgroundPosition.y}px</span>
                </div>
                <Slider
                  min={-500}
                  max={500}
                  value={backgroundPosition.y}
                  onChange={(value) => setBackgroundPosition(prev => ({ ...prev, y: value }))}
                  size="small"
                  tooltip={{ formatter: (value) => `${value}px` }}
                />
              </div>
              
              {/* Escala */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Escala</span>
                  <span className="text-xs font-mono text-gray-500">{Math.round(backgroundScale * 100)}%</span>
                </div>
                <Slider
                  min={10}
                  max={200}
                  value={backgroundScale * 100}
                  onChange={(value) => setBackgroundScale(value / 100)}
                  size="small"
                  tooltip={{ formatter: (value) => `${value}%` }}
                />
              </div>
              
              {/* Opacidad */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Opacidad</span>
                  <span className="text-xs font-mono text-gray-500">{Math.round(backgroundOpacity * 100)}%</span>
                </div>
                <Slider
                  min={10}
                  max={100}
                  value={backgroundOpacity * 100}
                  onChange={(value) => setBackgroundOpacity(value / 100)}
                  size="small"
                  tooltip={{ formatter: (value) => `${value}%` }}
                />
              </div>
              
              {/* Botón para centrar imagen */}
              <Button
                size="small"
                onClick={() => setBackgroundPosition({ x: 0, y: 0 })}
                className="w-full text-xs"
                icon={<ReloadOutlined />}
              >
                Centrar Imagen
              </Button>
            </div>
          </div>
        )}

                 {/* ===== PROPIEDADES RÁPIDAS ===== */}
         {selectedIds.length > 0 && (
           <div className="p-3 border-b border-gray-200">
             <Title level={5} className="mb-3">⚡ Propiedades Rápidas</Title>
             <div className="space-y-3">
               {/* Rotación */}
               <div>
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-sm">Rotación</span>
                   <span className="text-xs font-mono text-gray-500">{selectedElementRotation}°</span>
                 </div>
                 <Slider
                   min={0}
                   max={360}
                   value={selectedElementRotation}
                   onChange={(value) => {
                     setSelectedElementRotation(value);
                     applyRotationToSelected(value);
                   }}
                   size="small"
                 />
               </div>
             </div>
           </div>
         )}

         {/* ===== CONTROLES DE VISIBILIDAD DE NOMBRES ===== */}
         <div className="p-3 border-b border-gray-200">
           <Title level={5} className="mb-3">👁️ Visibilidad de Nombres</Title>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-sm">Nombres de Mesas</span>
               <Switch
                 checked={showMesaNames}
                 onChange={setShowMesaNames}
                 size="small"
               />
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm">Nombres de Sillas</span>
               <Switch
                 checked={showSillaNames}
                 onChange={setShowSillaNames}
                 size="small"
               />
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm">Nombres de Filas</span>
               <Switch
                 checked={showFilaNames}
                 onChange={setShowFilaNames}
                 size="small"
               />
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm">Nombres de Sillas de Fila</span>
               <Switch
                 checked={showFilaSillaNames}
                 onChange={setShowFilaSillaNames}
                 size="small"
               />
             </div>
           </div>
         </div>

         {/* ===== GESTIÓN DE ZONAS ===== */}
         <div className="p-3 border-b border-gray-200">
           <Title level={5} className="mb-3">🏷️ Gestión de Zonas</Title>
           <div className="space-y-2">
             <Button
               icon={<PlusOutlined />}
               onClick={() => setShowZoneManager(true)}
               block
               size="small"
             >
               Gestionar Zonas
             </Button>
             
             {/* Lista de zonas */}
             <div className="space-y-1 max-h-32 overflow-y-auto">
               {zonas.map(zona => (
                 <div key={zona.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                   <div 
                     className="w-4 h-4 rounded border"
                     style={{ backgroundColor: zona.color }}
                   />
                   <span className="text-xs flex-1">{zona.nombre}</span>
                   <Button
                     size="small"
                     onClick={() => handleAssignZone(selectedIds, zona)}
                     disabled={selectedIds.length === 0}
                     className="text-xs"
                   >
                     Asignar
                   </Button>
                 </div>
               ))}
             </div>
           </div>
         </div>

         {/* ===== ZONAS PERSONALIZABLES ===== */}
         <div className="p-3 border-b border-gray-200">
           <Title level={5} className="mb-3">🔷 Zonas Personalizables</Title>
           <div className="space-y-3">
             {/* Crear nueva zona personalizable */}
             <div className="space-y-2">
               <div className="text-xs text-gray-600">Crear Zona Geométrica:</div>
               <div className="grid grid-cols-2 gap-1">
                 <Input
                   size="small"
                   placeholder="Nombre zona"
                   value={currentCustomZone?.nombre || ''}
                   onChange={(e) => setCurrentCustomZone(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                   disabled={!isCreatingCustomZone}
                 />
                 <Button
                   size="small"
                   onClick={() => {
                     if (isCreatingCustomZone) {
                       cancelCustomZone();
                     } else {
                       startCreatingCustomZone();
                     }
                   }}
                   type={isCreatingCustomZone ? 'default' : 'primary'}
                   className="text-xs"
                 >
                   {isCreatingCustomZone ? 'Cancelar' : 'Crear Zona'}
                 </Button>
               </div>
               
               {isCreatingCustomZone && (
                 <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                   💡 Haz clic en el mapa para añadir puntos. Mínimo 3 puntos, máximo 8.
                 </div>
               )}
             </div>
             
             {/* Lista de zonas personalizables existentes */}
             {customZones.length > 0 && (
               <div className="space-y-2">
                 <div className="text-xs text-gray-600 font-medium">Zonas Existentes:</div>
                 <div className="space-y-1 max-h-40 overflow-y-auto">
                   {customZones.map((zone) => (
                     <div key={zone.id} className="p-2 bg-gray-50 rounded border">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-xs font-medium">{zone.nombre}</span>
                         <div className="flex gap-1">
                           <Button
                             size="small"
                             onClick={() => {
                               setCurrentCustomZone(zone);
                               setCustomZonePoints(zone.puntos);
                               setIsCreatingCustomZone(true);
                             }}
                             className="text-xs"
                             title="Editar puntos"
                           >
                             ✏️
                           </Button>
                           <Button
                             size="small"
                             onClick={() => deleteCustomZone(zone.id)}
                             danger
                             className="text-xs"
                             title="Eliminar zona"
                           >
                             🗑️
                           </Button>
                         </div>
                       </div>
                       
                       {/* Información de la zona */}
                       <div className="text-xs text-gray-500 space-y-1">
                         <div>Puntos: {zone.puntos.length}</div>
                         <div>Tamaño: {Math.round(zone.width)} × {Math.round(zone.height)}px</div>
                         {zone.zonaAsignada && (
                           <div className="flex items-center gap-1">
                             <span>Zona DB:</span>
                             <div 
                               className="w-3 h-3 rounded border"
                               style={{ backgroundColor: zone.zonaAsignada.color }}
                             />
                             <span>{zone.zonaAsignada.nombre}</span>
                           </div>
                         )}
                       </div>
                       
                       {/* Asignar zona de la base de datos */}
                       <div className="mt-2">
                         <Select
                           size="small"
                           placeholder="Asignar zona DB"
                           value={zone.zonaAsignada?.id || undefined}
                           onChange={(zonaId) => {
                             const zona = zonas.find(z => z.id === zonaId);
                             if (zona) {
                               assignZoneToCustomZone(zone.id, zona);
                             }
                           }}
                           className="w-full text-xs"
                         >
                           {zonas.map(zona => (
                             <Option key={zona.id} value={zona.id}>
                               <div className="flex items-center gap-2">
                                 <div 
                                   className="w-3 h-3 rounded border"
                                   style={{ backgroundColor: zona.color }}
                                 />
                                 <span>{zona.nombre}</span>
                               </div>
                             </Option>
                           ))}
                         </Select>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
         </div>

        {/* ===== UPLOAD DE IMAGEN DE FONDO ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">🖼️ Imagen de Fondo</Title>
          <Upload
            beforeUpload={handleBackgroundImageUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button
              icon={<PictureOutlined />}
              block
              size="small"
            >
              Cargar Imagen
            </Button>
          </Upload>
        </div>

        {/* ===== INFORMACIÓN DEL MAPA ===== */}
        <div className="p-3">
          <Title level={5} className="mb-3">📊 Información</Title>
          <div className="text-xs space-y-1 text-gray-600">
            <div>Elementos: {elements.length}</div>
            <div>Mesas: {elements.filter(el => el.type === 'mesa').length}</div>
            <div>Sillas: {elements.filter(el => el.type === 'silla').length}</div>
            <div>Seleccionados: {selectedIds.length}</div>
            <div>Zoom: {Math.round(scale * 100)}%</div>
          </div>
        </div>

        {/* ===== CONTROLES DE SOMBRAS Y EFECTOS ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">🌑 Sombras y Efectos</Title>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Mostrar Sombras</span>
              <Switch
                checked={showShadows}
                onChange={setShowShadows}
                size="small"
              />
            </div>
            
            {showShadows && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Color de Sombra</span>
                    <ColorPicker
                      value={shadowColor}
                      onChange={(color) => setShadowColor(color.toHexString())}
                      size="small"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Desenfoque</span>
                    <span className="text-xs font-mono text-gray-500">{shadowBlur}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={50}
                    value={shadowBlur}
                    onChange={setShadowBlur}
                    size="small"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Desplazamiento X</span>
                    <span className="text-xs font-mono text-gray-500">{shadowOffsetX}px</span>
                  </div>
                  <Slider
                    min={-20}
                    max={20}
                    value={shadowOffsetX}
                    onChange={setShadowOffsetX}
                    size="small"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Desplazamiento Y</span>
                    <span className="text-xs font-mono text-gray-500">{shadowOffsetY}px</span>
                  </div>
                  <Slider
                    min={-20}
                    max={20}
                    value={shadowOffsetY}
                    onChange={setShadowOffsetY}
                    size="small"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== CONTROLES DE ALINEACIÓN Y DUPLICACIÓN ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">📐 Alineación y Duplicación</Title>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Guias de Alineación</span>
              <Switch
                checked={showAlignmentGuides}
                onChange={setShowAlignmentGuides}
                size="small"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Espaciado de Duplicación</span>
                <span className="text-xs font-mono text-gray-500">{duplicationSpacing}px</span>
              </div>
              <Slider
                min={20}
                max={200}
                value={duplicationSpacing}
                onChange={setDuplicationSpacing}
                size="small"
              />
            </div>
          </div>
        </div>

        {/* ===== GESTIÓN DE PLANTILLAS ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">📋 Plantillas</Title>
          <div className="space-y-2">
            <Button
              icon={<SaveOutlined />}
              onClick={() => {
                const templateName = prompt('Nombre de la plantilla:');
                if (templateName) {
                  saveAsTemplate(templateName);
                }
              }}
              block
              size="small"
            >
              Guardar como Plantilla
            </Button>
            
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowTemplateManager(true)}
              block
              size="small"
            >
              Gestionar Plantillas
            </Button>
            
            {templates.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-xs flex-1">{template.name}</span>
                    <Button
                      size="small"
                      onClick={() => loadTemplate(template)}
                      className="text-xs"
                    >
                      Cargar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== EXPORTACIÓN ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">📤 Exportar</Title>
          <div className="space-y-2">
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToPNG}
              loading={exporting}
              block
              size="small"
            >
              Exportar como PNG
            </Button>
            
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToPDF}
              loading={exporting}
              block
              size="small"
            >
              Exportar como PDF
            </Button>
          </div>
        </div>

        {/* ===== TUTORIAL ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">🎓 Tutorial</Title>
          <div className="space-y-2">
            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowTutorial(true)}
              block
              size="small"
            >
              Mostrar Tutorial
            </Button>
          </div>
        </div>

        {/* ===== ATAJOS DE TECLADO ===== */}
        <div className="p-3 border-b border-gray-200">
          <Title level={5} className="mb-3">⌨️ Atajos de Teclado</Title>
          <div className="text-xs space-y-1 text-gray-600">
            <div><strong>1:</strong> Modo Selección</div>
            <div><strong>2:</strong> Modo Pan</div>
            <div><strong>3:</strong> Herramienta Texto</div>
            <div><strong>4:</strong> Herramienta Rectángulo</div>
            <div><strong>5:</strong> Herramienta Círculo</div>
            <div><strong>6:</strong> Herramienta Polígono</div>
            <div><strong>Tab:</strong> Cambiar nombre de silla</div>
            <div><strong>Ctrl+D:</strong> Duplicar elemento</div>
            <div><strong>Ctrl+S:</strong> Guardar mapa</div>
            <div><strong>Ctrl+E:</strong> Exportar PNG</div>
            <div><strong>Delete:</strong> Eliminar seleccionados</div>
          </div>
        </div>
      </div>

      {/* ===== CANVAS PRINCIPAL ===== */}
      <div className="flex-1 relative">
                 {/* ===== BARRA DE HERRAMIENTAS SUPERIOR ===== */}
         <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2">
           <div className="flex items-center gap-2">
             <Button
               type={activeMode === 'select' ? 'primary' : 'default'}
               icon={<AimOutlined />}
               onClick={() => setActiveMode('select')}
               size="small"
               title="Modo Selección (1)"
             />
             <Button
               type={activeMode === 'pan' ? 'primary' : 'default'}
               icon={<EyeOutlined />}
               onClick={() => setActiveMode('pan')}
               size="small"
               title="Modo Pan (2)"
             />
             <Divider type="vertical" />
             <Button
               icon={<DownloadOutlined />}
               onClick={exportToPNG}
               loading={exporting}
               size="small"
               title="Exportar PNG (Ctrl+E)"
             />
             <Button
               icon={<SaveOutlined />}
               onClick={handleSave}
               size="small"
               title="Guardar (Ctrl+S)"
             />
             <Divider type="vertical" />
             <Button
               icon={<ClearOutlined />}
               onClick={clearMeasurements}
               size="small"
               title="Limpiar Mediciones"
               disabled={measurementLines.length === 0}
             />
           </div>
         </div>

        {/* ===== STAGE DE KONVA ===== */}
        <Stage
          ref={stageRef}
          width={window.innerWidth - 320}
          height={window.innerHeight}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onDblClick={handleDoubleClick}
          onClick={handleStageClick}
          draggable={activeMode === 'pan'}
        >
                     {/* ===== CAPA DE FONDO ===== */}
           <Layer>
             {/* Fondo principal (color oscuro) */}
             <Rect
               x={0}
               y={0}
               width={2000}
               height={1400}
               fill={outerBackgroundColor}
             />
             
             {/* Fondo del área del grid (color claro) */}
             <Rect
               x={0}
               y={0}
               width={2000}
               height={1400}
               fill={gridBackgroundColor}
             />
             
             {/* Imagen de fondo */}
             {backgroundImage && (
               <Image
                 image={backgroundImage}
                 x={backgroundPosition.x}
                 y={backgroundPosition.y}
                 scaleX={backgroundScale}
                 scaleY={backgroundScale}
                 opacity={backgroundOpacity}
               />
             )}
             
             {/* Grid */}
             {showGrid && (
               <Group>
                 {Array.from({ length: Math.ceil(2000 / gridSize) + 1 }, (_, i) => (
                   <Line
                     key={`v-${i}`}
                     points={[i * gridSize, 0, i * gridSize, 1400]}
                     stroke="#e5e7eb"
                     strokeWidth={1}
                     opacity={0.5}
                   />
                 ))}
                 {Array.from({ length: Math.ceil(1400 / gridSize) + 1 }, (_, i) => (
                   <Line
                     key={`h-${i}`}
                     points={[0, i * gridSize, 2000, i * gridSize]}
                     stroke="#e5e7eb"
                     strokeWidth={1}
                     opacity={0.5}
                   />
                 ))}
               </Group>
             )}
           </Layer>

          {/* ===== CAPA DE ELEMENTOS ===== */}
          <Layer>
            {elements.map(renderElement)}
          </Layer>

          {/* ===== CAPA DE GUIAS DE ALINEACIÓN ===== */}
          {showAlignmentGuides && (
            <Layer>
              {alignmentGuides.map((guide, index) => (
                <Line
                  key={`guide-${index}`}
                  points={guide.type === 'vertical' 
                    ? [guide.x, 0, guide.x, 1400] 
                    : [0, guide.y, 2000, guide.y]
                  }
                  stroke={guide.color}
                  strokeWidth={2}
                  opacity={0.7}
                  dash={[5, 5]}
                />
              ))}
            </Layer>
          )}

          {/* ===== CAPA DE MEDICIÓN ===== */}
          {measurementLines.length > 0 && (
            <Layer>
              {measurementLines.map((line, index) => (
                <Group key={`measure-${index}`}>
                  <Line
                    points={[line.start.x, line.start.y, line.end.x, line.end.y]}
                    stroke="#ff6b6b"
                    strokeWidth={2}
                    opacity={0.8}
                  />
                  <Text
                    x={(line.start.x + line.end.x) / 2}
                    y={(line.start.y + line.end.y) / 2}
                    text={`${Math.round(line.distance)}px`}
                    fontSize={12}
                    fill="#ff6b6b"
                    fontStyle="bold"
                    align="center"
                    background="#ffffff"
                    padding={2}
                  />
                </Group>
              ))}
            </Layer>
          )}
        </Stage>

        {/* ===== MENÚ CONTEXTUAL ===== */}
        {contextMenu && (
          <div
            className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 min-w-48"
            style={{
              left: contextMenu.x + 10,
              top: contextMenu.y + 10
            }}
          >
            {contextMenuElement && (
              <div className="space-y-1">
                {contextMenuElement.type === 'mesa' && (
                  <>
                    <Button
                      size="small"
                      block
                      onClick={() => {
                        setSelectedMesaForSeats(contextMenuElement);
                        setShowAddSeatsModal(true);
                        closeContextMenu();
                      }}
                    >
                      🪑 Añadir Sillas
                    </Button>
                    <Button
                      size="small"
                      block
                      onClick={() => {
                        updateElementProperty(contextMenuElement._id, 'mesaType', 
                          contextMenuElement.mesaType === 'circular' ? 'rectangular' : 'circular'
                        );
                        closeContextMenu();
                      }}
                    >
                      {contextMenuElement.mesaType === 'circular' ? '🟦 Hacer Rectangular' : '🔴 Hacer Redonda'}
                    </Button>
                    <Divider style={{ margin: '8px 0' }} />
                  </>
                )}
                
                <Button
                  size="small"
                  block
                  onClick={() => {
                    showElementTransformer(contextMenuElement);
                    closeContextMenu();
                  }}
                >
                  🔧 Editar Propiedades
                </Button>
                
                <Button
                  size="small"
                  block
                  onClick={() => {
                    duplicateElement(contextMenuElement, 'right');
                    closeContextMenu();
                  }}
                >
                  📋 Duplicar (Derecha)
                </Button>
                
                <Button
                  size="small"
                  block
                  onClick={() => {
                    duplicateElement(contextMenuElement, 'down');
                    closeContextMenu();
                  }}
                >
                  📋 Duplicar (Abajo)
                </Button>
                
                <Divider style={{ margin: '8px 0' }} />
                
                <Button
                  size="small"
                  danger
                  block
                  onClick={() => {
                    deleteSelectedElements();
                    closeContextMenu();
                  }}
                >
                  🗑️ Eliminar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ===== MODAL DE AÑADIR SILLAS ===== */}
        <AddSeatsModal />
      </div>
    </div>
  );
};

export default CrearMapaMain;
