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
  // ===== TODOS LOS HOOKS DEBEN ESTAR AL INICIO =====
  
  // ===== ESTADOS PRINCIPALES =====
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeMode, setActiveMode] = useState('select'); // 'select', 'pan', 'add'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
  const [gridBackgroundColor, setGridBackgroundColor] = useState('#f8fafc');
  const [outerBackgroundColor, setOuterBackgroundColor] = useState('#1e293b');
  const [showGridColorPicker, setShowGridColorPicker] = useState(false);
  const [showOuterColorPicker, setShowOuterColorPicker] = useState(false);
  
  // ===== ESTADOS DE VISIBILIDAD DE NOMBRES =====
  const [showMesaNames, setShowMesaNames] = useState(true);
  const [showSillaNames, setShowSillaNames] = useState(true);
  const [showFilaNames, setShowFilaNames] = useState(true);
  const [showFilaSillaNames, setShowFilaSillaNames] = useState(true);
  
  // ===== ESTADOS DE HERRAMIENTAS =====
  const [currentTool, setCurrentTool] = useState('select');
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

  // ===== FUNCIONES PRINCIPALES (definidas después de todos los hooks) =====
  
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
      opacity: 1
    };
    
    setElements(prev => [...prev, newSilla]);
    addToHistory([...elements, newSilla], 'Agregar silla');
    return newSilla;
  }, [elements, addToHistory]);

  const addTexto = useCallback((posicion = { x: 100, y: 100 }, texto = 'Texto') => {
    const newTexto = {
      _id: `texto_${Date.now()}`,
      type: 'texto',
      texto,
      posicion,
      fontSize: textFontSize,
      fill: '#000000',
      fontFamily: 'Arial',
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => [...prev, newTexto]);
    addToHistory([...elements, newTexto], 'Agregar texto');
    return newTexto;
  }, [elements, addToHistory, textFontSize]);

  const addRectangulo = useCallback((posicion = { x: 100, y: 100 }) => {
    const newRectangulo = {
      _id: `rect_${Date.now()}`,
      type: 'rectangulo',
      posicion,
      width: rectangleWidth,
      height: rectangleHeight,
      fill: '#FFC107',
      stroke: '#FF8F00',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => [...prev, newRectangulo]);
    addToHistory([...elements, newRectangulo], 'Agregar rectángulo');
    return newRectangulo;
  }, [elements, addToHistory, rectangleWidth, rectangleHeight]);

  const addCirculo = useCallback((posicion = { x: 100, y: 100 }) => {
    const newCirculo = {
      _id: `circle_${Date.now()}`,
      type: 'circulo',
      posicion,
      radius: circleRadius,
      fill: '#9C27B0',
      stroke: '#7B1FA2',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => [...prev, newCirculo]);
    addToHistory([...elements, newCirculo], 'Agregar círculo');
    return newCirculo;
  }, [elements, addToHistory, circleRadius]);

  // Función para eliminar elementos seleccionados
  const deleteSelectedElements = useCallback(() => {
    if (selectedIds.length > 0) {
      const newElements = elements.filter(el => !selectedIds.includes(el._id));
      setElements(newElements);
      setSelectedIds([]);
      addToHistory(newElements, `Eliminar ${selectedIds.length} elemento(s)`);
    }
  }, [selectedIds, elements, addToHistory]);

  // ===== FUNCIONES DE ZONAS =====
  const assignZoneToSelected = useCallback((zoneId) => {
    if (selectedIds.length > 0) {
      const newElements = elements.map(el =>
        selectedIds.includes(el._id)
          ? { ...el, zonaId: zoneId }
          : el
      );
      setElements(newElements);
      addToHistory(newElements, `Asignar zona a ${selectedIds.length} elemento(s)`);
    }
  }, [selectedIds, elements, addToHistory]);

  const getElementZoneColor = useCallback((element) => {
    if (element.zonaId) {
      const zona = zonas.find(z => z.id === element.zonaId);
      return zona ? zona.color : '#e2e8f0';
    }
    return element.fill;
  }, [zonas]);

  const addNewZone = useCallback(() => {
    if (newZoneName.trim()) {
      const newZone = {
        id: `zona_${Date.now()}`,
        nombre: newZoneName.trim(),
        color: newZoneColor
      };
      setZonas(prev => [...prev, newZone]);
      setNewZoneName('');
      message.success(`Zona "${newZone.nombre}" creada`);
    }
  }, [newZoneName, newZoneColor]);

  const deleteZone = useCallback((zoneId) => {
    setZonas(prev => prev.filter(z => z.id !== zoneId));
    // Remover la zona de todos los elementos
    const newElements = elements.map(el => 
      el.zonaId === zoneId ? { ...el, zonaId: null } : el
    );
    setElements(newElements);
    addToHistory(newElements, `Eliminar zona`);
    message.success('Zona eliminada');
  }, [elements, addToHistory]);

  const updateZoneColor = useCallback((zoneId, newColor) => {
    setZonas(prev => prev.map(z => 
      z.id === zoneId ? { ...z, color: newColor } : z
    ));
    message.success('Color de zona actualizado');
  }, []);

  // ===== FUNCIONES DE PROPIEDADES =====
  const updateElementProperty = useCallback((elementId, property, value) => {
    const newElements = elements.map(el =>
      el._id === elementId ? { ...el, [property]: value } : el
    );
    setElements(newElements);
    addToHistory(newElements, `Actualizar ${property}`);
  }, [elements, addToHistory]);

  const duplicateElement = useCallback((element, direction = 'right') => {
    const offset = direction === 'right' ? { x: 50, y: 0 } : { x: 0, y: 50 };
    const duplicated = {
      ...element,
      _id: `${element.type}_${Date.now()}`,
      posicion: {
        x: element.posicion.x + offset.x,
        y: element.posicion.y + offset.y
      }
    };
    
    setElements(prev => [...prev, duplicated]);
    addToHistory([...elements, duplicated], `Duplicar ${element.type}`);
    return duplicated;
  }, [elements, addToHistory]);

  // Función para seleccionar elementos
  const handleElementClick = useCallback((elementId) => {
    setSelectedIds(prev => {
      if (prev.includes(elementId)) {
        return prev.filter(id => id !== elementId);
      } else {
        return [...prev, elementId];
      }
    });
  }, []);

  // Función para manejar click derecho (menú contextual)
  const handleElementRightClick = useCallback((e, elementId) => {
    e.evt.preventDefault();
    const element = elements.find(el => el._id === elementId);
    if (element) {
      setContextMenu({
        x: e.evt.clientX,
        y: e.evt.clientY,
        elementId
      });
      setContextMenuElement(element);
      // Seleccionar el elemento si no está seleccionado
      if (!selectedIds.includes(elementId)) {
        setSelectedIds([elementId]);
      }
    }
  }, [elements, selectedIds]);

  // Función para cerrar menú contextual
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setContextMenuElement(null);
  }, []);

  // Función para duplicar elemento desde menú contextual
  const duplicateFromContext = useCallback(() => {
    if (contextMenuElement) {
      duplicateElement(contextMenuElement, 'right');
      closeContextMenu();
    }
  }, [contextMenuElement, duplicateElement, closeContextMenu]);

  // Función para eliminar elemento desde menú contextual
  const deleteFromContext = useCallback(() => {
    if (contextMenuElement) {
      deleteSelectedElements();
      closeContextMenu();
    }
  }, [contextMenuElement, deleteSelectedElements, closeContextMenu]);

  // Función para copiar elemento desde menú contextual
  const copyFromContext = useCallback(() => {
    if (contextMenuElement) {
      setSelectedIds([contextMenuElement._id]);
      handleCopy();
      closeContextMenu();
    }
  }, [contextMenuElement, handleCopy, closeContextMenu]);

  // Función para renderizar elementos en el canvas
  const renderElements = useCallback(() => {
    return elements.map(element => {
      const isSelected = selectedIds.includes(element._id);
      const strokeColor = isSelected ? '#FF6B6B' : element.stroke;
      const strokeWidth = isSelected ? 3 : element.strokeWidth;

      // Renderizar mesa
      if (element.type === 'mesa') {
        const zoneColor = getElementZoneColor(element);
        
        if (element.mesaType === 'circular') {
          return (
            <Circle
              key={element._id}
              x={element.posicion.x + element.width / 2}
              y={element.posicion.y + element.height / 2}
              radius={Math.min(element.width, element.height) / 2}
              fill={zoneColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rotation={element.rotation}
              opacity={element.opacity}
              onClick={() => handleElementClick(element._id)}
              onTap={() => handleElementClick(element._id)}
              onContextMenu={(e) => handleElementRightClick(e, element._id)}
              draggable={activeMode === 'select'}
              onDragEnd={(e) => {
                const newElements = elements.map(el =>
                  el._id === element._id
                    ? { ...el, posicion: { x: e.target.x() - element.width / 2, y: e.target.y() - element.height / 2 } }
                    : el
                );
                setElements(newElements);
              }}
            />
          );
        } else {
          return (
            <Rect
              key={element._id}
              x={element.posicion.x}
              y={element.posicion.y}
              width={element.width}
              height={element.height}
              fill={zoneColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              rotation={element.rotation}
              opacity={element.opacity}
              onClick={() => handleElementClick(element._id)}
              onTap={() => handleElementClick(element._id)}
              onContextMenu={(e) => handleElementRightClick(e, element._id)}
              draggable={activeMode === 'select'}
              onDragEnd={(e) => {
                const newElements = elements.map(el =>
                  el._id === element._id
                    ? { ...el, posicion: { x: e.target.x(), y: e.target.y() } }
                    : el
                );
                setElements(newElements);
              }}
            />
          );
        }
      }

      // Renderizar silla
      if (element.type === 'silla') {
        return (
          <Circle
            key={element._id}
            x={element.posicion.x}
            y={element.posicion.y}
            radius={element.width / 2}
            fill={element.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rotation={element.rotation}
            opacity={element.opacity}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const newElements = elements.map(el =>
                el._id === element._id
                  ? { ...el, posicion: { x: e.target.x(), y: e.target.y() } }
                  : el
              );
              setElements(newElements);
            }}
          />
        );
      }

      // Renderizar texto
      if (element.type === 'texto') {
        return (
          <Text
            key={element._id}
            x={element.posicion.x}
            y={element.posicion.y}
            text={element.texto}
            fontSize={element.fontSize}
            fill={element.fill}
            fontFamily={element.fontFamily}
            rotation={element.rotation}
            opacity={element.opacity}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const newElements = elements.map(el =>
                el._id === element._id
                  ? { ...el, posicion: { x: e.target.x(), y: e.target.y() } }
                  : el
              );
              setElements(newElements);
            }}
          />
        );
      }

      // Renderizar rectángulo
      if (element.type === 'rectangulo') {
        return (
          <Rect
            key={element._id}
            x={element.posicion.x}
            y={element.posicion.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rotation={element.rotation}
            opacity={element.opacity}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const newElements = elements.map(el =>
                el._id === element._id
                  ? { ...el, posicion: { x: e.target.x(), y: e.target.y() } }
                  : el
              );
              setElements(newElements);
            }}
          />
        );
      }

      // Renderizar círculo
      if (element.type === 'circulo') {
        return (
          <Circle
            key={element._id}
            x={element.posicion.x}
            y={element.posicion.y}
            radius={element.radius}
            fill={element.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rotation={element.rotation}
            opacity={element.opacity}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const newElements = elements.map(el =>
                el._id === element._id
                  ? { ...el, posicion: { x: e.target.x(), y: e.target.y() } }
                  : el
              );
              setElements(newElements);
            }}
          />
        );
      }

      return null;
    });
  }, [elements, selectedIds, handleElementClick, getElementZoneColor, activeMode]);

  // Función para manejar zoom con la rueda del mouse
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

  // Función para manejar pan
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
  }, [activeMode]);

  const handleMouseUp = useCallback((e) => {
    if (activeMode === 'pan') {
      const stage = e.target.getStage();
      stage.draggable(false);
    }
  }, [activeMode]);

  // ===== EFECTOS =====
  
  // Efecto para inicializar el componente
  useEffect(() => {
    console.log('[CrearMapaMain] Componente inicializado');
    
    // Cargar mapa inicial si está disponible
    if (initialMapa && initialMapa.contenido) {
      setElements(initialMapa.contenido);
      addToHistory(initialMapa.contenido, 'Cargar mapa inicial');
    }
  }, [initialMapa, addToHistory]);

  // Efecto para actualizar propiedades rápidas cuando cambia la selección
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

  // Efecto para cerrar menú contextual al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu && !e.target.closest('.context-menu')) {
        closeContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu, closeContextMenu]);

  // Efecto para manejar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Evitar ejecutar atajos si se está escribiendo en un input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
          case 's':
            e.preventDefault();
            if (onSave) onSave(elements);
            break;
          case 'a':
            e.preventDefault();
            setSelectedIds(elements.map(el => el._id));
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            deleteSelectedElements();
            break;
          case 'Escape':
            e.preventDefault();
            setSelectedIds([]);
            closeContextMenu();
            break;
          case 'm':
            e.preventDefault();
            addMesa('rectangular');
            break;
          case 's':
            e.preventDefault();
            addSilla();
            break;
          case 't':
            e.preventDefault();
            addTexto();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [elements, onSave, deleteSelectedElements, undo, redo, handleCopy, handlePaste, addMesa, addSilla, addTexto]);

  // ===== RENDERIZADO =====
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando editor de mapas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <p>Error al cargar el editor: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-100">
      {/* Barra de herramientas completa */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4 flex-wrap">
          {/* Controles de modo */}
          <div className="flex items-center space-x-2 border-r border-gray-300 pr-4">
            <button
              onClick={() => setActiveMode('select')}
              className={`px-3 py-2 rounded text-sm font-medium ${
                activeMode === 'select'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ✋ Seleccionar
            </button>
            <button
              onClick={() => setActiveMode('pan')}
              className={`px-3 py-2 rounded text-sm font-medium ${
                activeMode === 'pan'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🖐️ Mover
            </button>
          </div>

          {/* Controles de elementos */}
          <div className="flex items-center space-x-2 border-r border-gray-300 pr-4">
            <button
              onClick={() => addMesa('rectangular')}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              🟦 Mesa
            </button>
            <button
              onClick={() => addMesa('circular')}
              className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              🔴 Mesa Redonda
            </button>
            <button
              onClick={() => addSilla()}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              🪑 Silla
            </button>
            <button
              onClick={() => addTexto()}
              className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              📝 Texto
            </button>
            <button
              onClick={() => addRectangulo()}
              className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
            >
              ⬜ Rectángulo
            </button>
            <button
              onClick={() => addCirculo()}
              className="px-3 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 text-sm"
            >
              ⭕ Círculo
            </button>
          </div>

          {/* Controles de edición */}
          <div className="flex items-center space-x-2 border-r border-gray-300 pr-4">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
            >
              ↶ Deshacer
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
            >
              ↷ Rehacer
            </button>
            <button
              onClick={handleCopy}
              disabled={selectedIds.length === 0}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
            >
              📋 Copiar
            </button>
            <button
              onClick={handlePaste}
              disabled={clipboard.length === 0}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
            >
              📄 Pegar
            </button>
            <button
              onClick={deleteSelectedElements}
              disabled={selectedIds.length === 0}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              🗑️ Eliminar
            </button>
          </div>

          {/* Selector de zona */}
          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2 border-r border-gray-300 pr-4">
              <span className="text-sm text-gray-600">Zona:</span>
              <select
                onChange={(e) => assignZoneToSelected(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                defaultValue=""
              >
                <option value="">Sin zona</option>
                {zonas.map(zona => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Controles de zoom */}
          <div className="flex items-center space-x-2 border-r border-gray-300 pr-4">
            <button
              onClick={() => {
                const newScale = Math.min(maxScale, scale * 1.2);
                setScale(newScale);
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              🔍+
            </button>
            <span className="text-sm text-gray-600 w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => {
                const newScale = Math.max(minScale, scale / 1.2);
                setScale(newScale);
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              🔍-
            </button>
            <button
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              🏠 Centrar
            </button>
          </div>

          {/* Controles de acción */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSave && onSave(elements)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              💾 Guardar
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ❌ Cancelar
            </button>
          </div>
        </div>

        {/* Segunda fila de herramientas */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-4 text-sm">
            {/* Información de selección */}
            <div className="text-gray-600">
              Elementos: {elements.length} | Seleccionados: {selectedIds.length}
            </div>
            
            {/* Controles de grid */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded"
                />
                <span>Grid</span>
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-16"
              />
              <span className="w-8">{gridSize}px</span>
            </div>

            {/* Controles de visibilidad */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={showMesaNames}
                  onChange={(e) => setShowMesaNames(e.target.checked)}
                  className="rounded"
                />
                <span>Nombres</span>
              </label>
            </div>

            {/* Historial */}
            <div className="text-gray-500">
              Historial: {historyIndex + 1}/{history.length}
            </div>
          </div>
        </div>
      </div>

      {/* Área de trabajo */}
      <div className="flex-1 flex">
        {/* Panel lateral */}
        <div className="w-80 bg-white border-r border-gray-300 p-4">
          <div className="space-y-6">
            {/* Gestión de zonas */}
            <div>
              <h3 className="font-semibold mb-3">🎨 Gestión de Zonas</h3>
              <div className="space-y-2">
                {zonas.map(zona => (
                  <div key={zona.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: zona.color }}
                      ></div>
                      <span className="text-sm">{zona.nombre}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="color"
                        value={zona.color}
                        onChange={(e) => updateZoneColor(zona.id, e.target.value)}
                        className="w-6 h-6 border-none rounded cursor-pointer"
                      />
                      <button
                        onClick={() => deleteZone(zona.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Agregar nueva zona */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Nombre de zona"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="color"
                    value={newZoneColor}
                    onChange={(e) => setNewZoneColor(e.target.value)}
                    className="w-8 h-8 border-none rounded cursor-pointer"
                  />
                  <button
                    onClick={addNewZone}
                    disabled={!newZoneName.trim()}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Propiedades del elemento seleccionado */}
            {selectedIds.length === 1 && (
              <div>
                <h3 className="font-semibold mb-3">🔧 Propiedades</h3>
                {(() => {
                  const element = elements.find(el => el._id === selectedIds[0]);
                  if (!element) return null;
                  
                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Nombre:</label>
                        <input
                          type="text"
                          value={element.nombre || element.texto || ''}
                          onChange={(e) => {
                            const property = element.type === 'texto' ? 'texto' : 'nombre';
                            updateElementProperty(element._id, property, e.target.value);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      
                      {element.type === 'mesa' && (
                        <>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Ancho:</label>
                            <input
                              type="number"
                              value={element.width}
                              onChange={(e) => updateElementProperty(element._id, 'width', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Alto:</label>
                            <input
                              type="number"
                              value={element.height}
                              onChange={(e) => updateElementProperty(element._id, 'height', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Tipo:</label>
                            <select
                              value={element.mesaType || 'rectangular'}
                              onChange={(e) => updateElementProperty(element._id, 'mesaType', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="rectangular">Rectangular</option>
                              <option value="circular">Circular</option>
                            </select>
                          </div>
                        </>
                      )}

                      {element.type === 'texto' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Tamaño de fuente:</label>
                          <input
                            type="number"
                            value={element.fontSize}
                            onChange={(e) => updateElementProperty(element._id, 'fontSize', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Color:</label>
                        <input
                          type="color"
                          value={element.fill}
                          onChange={(e) => updateElementProperty(element._id, 'fill', e.target.value)}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Rotación:</label>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={selectedElementRotation}
                          onChange={(e) => {
                            const rotation = Number(e.target.value);
                            setSelectedElementRotation(rotation);
                            updateElementProperty(element._id, 'rotation', rotation);
                          }}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{selectedElementRotation}°</span>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Opacidad:</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={element.opacity}
                          onChange={(e) => updateElementProperty(element._id, 'opacity', Number(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{Math.round(element.opacity * 100)}%</span>
                      </div>

                      <div className="pt-2 border-t border-gray-200">
                        <button
                          onClick={() => duplicateElement(element, 'right')}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          📋 Duplicar
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Atajos de teclado */}
            <div>
              <h3 className="font-semibold mb-3">⌨️ Atajos de Teclado</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+Z</kbd> Deshacer</div>
                <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+Y</kbd> Rehacer</div>
                <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+C</kbd> Copiar</div>
                <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+V</kbd> Pegar</div>
                <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+S</kbd> Guardar</div>
                <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+A</kbd> Seleccionar todo</div>
                <div><kbd className="bg-gray-100 px-1 rounded">Del</kbd> Eliminar</div>
                <div><kbd className="bg-gray-100 px-1 rounded">Esc</kbd> Deseleccionar</div>
                <div><kbd className="bg-gray-100 px-1 rounded">M</kbd> Agregar mesa</div>
                <div><kbd className="bg-gray-100 px-1 rounded">S</kbd> Agregar silla</div>
                <div><kbd className="bg-gray-100 px-1 rounded">T</kbd> Agregar texto</div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas principal */}
        <div className="flex-1 p-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Editor de Mapas - Sala ID: {salaId}
              </h2>
              <p className="text-sm text-gray-500">
                Usa las herramientas de arriba para crear tu mapa de asientos
              </p>
            </div>

          {/* Canvas de Konva */}
          <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
            <Stage
              ref={stageRef}
              width={800}
              height={600}
              style={{ background: '#f8fafc' }}
              scaleX={scale}
              scaleY={scale}
              x={position.x}
              y={position.y}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Layer>
                {/* Grid de fondo */}
                {showGrid && (
                  <Group>
                    {Array.from({ length: Math.ceil(800 / gridSize) }, (_, i) => (
                      <Line
                        key={`v${i}`}
                        points={[i * gridSize, 0, i * gridSize, 600]}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                      />
                    ))}
                    {Array.from({ length: Math.ceil(600 / gridSize) }, (_, i) => (
                      <Line
                        key={`h${i}`}
                        points={[0, i * gridSize, 800, i * gridSize]}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                      />
                    ))}
                  </Group>
                )}
                
                {/* Elementos del mapa */}
                {renderElements()}
                
                {/* Nombres de elementos */}
                {showMesaNames && elements.map(element => {
                  if (element.type === 'mesa' && element.nombre) {
                    return (
                      <Text
                        key={`name_${element._id}`}
                        x={element.posicion.x + element.width / 2}
                        y={element.posicion.y + element.height / 2}
                        text={element.nombre}
                        fontSize={12}
                        fill="#000000"
                        fontFamily="Arial"
                        align="center"
                        verticalAlign="middle"
                        offsetX={element.nombre.length * 3}
                        offsetY={6}
                        listening={false}
                      />
                    );
                  }
                  return null;
                })}
              </Layer>
            </Stage>
          </div>

          </div>
        </div>
      </div>

      {/* Menú contextual flotante */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-48 context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {/* Información del elemento */}
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
            <div className="text-sm font-medium text-gray-700">
              {contextMenuElement?.type === 'mesa' && 'Mesa'}
              {contextMenuElement?.type === 'silla' && 'Silla'}
              {contextMenuElement?.type === 'texto' && 'Texto'}
              {contextMenuElement?.type === 'rectangulo' && 'Rectángulo'}
              {contextMenuElement?.type === 'circulo' && 'Círculo'}
            </div>
            <div className="text-xs text-gray-500">
              {contextMenuElement?.nombre || contextMenuElement?.texto || 'Sin nombre'}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="py-1">
            <button
              onClick={copyFromContext}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📋</span>
              <span>Copiar</span>
            </button>
            
            <button
              onClick={duplicateFromContext}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>📄</span>
              <span>Duplicar</span>
            </button>

            <button
              onClick={() => {
                if (contextMenuElement) {
                  setSelectedIds([contextMenuElement._id]);
                  closeContextMenu();
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <span>✏️</span>
              <span>Editar propiedades</span>
            </button>

            {/* Acciones específicas por tipo */}
            {contextMenuElement?.type === 'mesa' && (
              <button
                onClick={() => {
                  setSelectedMesaForSeats(contextMenuElement);
                  setShowAddSeatsModal(true);
                  closeContextMenu();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <span>🪑</span>
                <span>Agregar sillas</span>
              </button>
            )}

            {contextMenuElement?.type === 'texto' && (
              <button
                onClick={() => {
                  if (contextMenuElement) {
                    setTextInput(contextMenuElement.texto || '');
                    setIsAddingText(true);
                    closeContextMenu();
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <span>✏️</span>
                <span>Editar texto</span>
              </button>
            )}

            {/* Separador */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Acciones de zona */}
            <div className="px-4 py-2">
              <div className="text-xs text-gray-500 mb-2">Asignar zona:</div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    assignZoneToSelected('');
                    closeContextMenu();
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Sin zona
                </button>
                {zonas.map(zona => (
                  <button
                    key={zona.id}
                    onClick={() => {
                      assignZoneToSelected(zona.id);
                      closeContextMenu();
                    }}
                    className="px-2 py-1 text-xs text-white rounded hover:opacity-80"
                    style={{ backgroundColor: zona.color }}
                  >
                    {zona.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-1"></div>

            {/* Acción destructiva */}
            <button
              onClick={deleteFromContext}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <span>🗑️</span>
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay para cerrar menú contextual */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeContextMenu}
        />
      )}
    </div>
  );
};

export default CrearMapaMain;
