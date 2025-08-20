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
import { Stage, Layer, Rect, Circle, Text, Line, Image, Group, RegularPolygon, Star, Transformer } from 'react-konva';
import { Select, message } from 'antd';




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
  const [zonas, setZonas] = useState([]);

  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#FF6B6B');
  const [newZoneAforo, setNewZoneAforo] = useState(0);
  const [newZoneNumerada, setNewZoneNumerada] = useState(false);
  
    // ===== ESTADOS DE ZONAS PERSONALIZABLES =====
  const [customZones, setCustomZones] = useState([]);
  const [isCreatingCustomZone, setIsCreatingCustomZone] = useState(false);
  const [currentCustomZone, setCurrentCustomZone] = useState(null);
  const [customZonePoints, setCustomZonePoints] = useState([]);
  const [selectedCustomZonePoint, setSelectedCustomZonePoint] = useState(null);
  const [showCustomZoneModal, setShowCustomZoneModal] = useState(false);
  const [customZoneMode, setCustomZoneMode] = useState('create'); // 'create', 'edit', 'select'
  
  // ===== ESTADOS DE CONFIGURACIÓN =====
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // ===== ESTADOS DE COLORES DE FONDO =====

  
  // ===== ESTADOS DE VISIBILIDAD DE NOMBRES =====
  const [showMesaNames, setShowMesaNames] = useState(true);
  
    // ===== ESTADOS DE HERRAMIENTAS =====
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

  // ===== ESTADOS DE PANELES DESPLEGABLES =====
  const [showCreateElements, setShowCreateElements] = useState(false);
  const [showEditTools, setShowEditTools] = useState(false);
  const [showZoomTools, setShowZoomTools] = useState(false);
  const [showConfigTools, setShowConfigTools] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showBackgroundTools, setShowBackgroundTools] = useState(false);
  const [showAlignmentTools, setShowAlignmentTools] = useState(false);
  const [showEffectsTools, setShowEffectsTools] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showCustomZonePanel, setShowCustomZonePanel] = useState(false);
  const [showTransformerPanel, setShowTransformerPanel] = useState(false);
  
    // ===== ESTADOS DE TRANSFORMADOR DE OBJETOS =====
  const [showTransformer, setShowTransformer] = useState(false);
  const [transformerElement, setTransformerElement] = useState(null);
  
  // ===== ESTADOS DE ALINEACIÓN Y MEDICIÓN =====

  
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

  
  // ===== ESTADOS DE PLANTILLAS =====
  const [templates, setTemplates] = useState([]);

  
  // ===== ESTADOS DE HISTORIAL AVANZADO =====

  
  // ===== ESTADOS DE TUTORIAL =====

  
  // ===== ESTADOS DE EXPORTACIÓN =====
  const [exporting, setExporting] = useState(false);
  
  // ===== ESTADOS DE PLANTILLAS =====
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // ===== REFERENCIAS =====
  const stageRef = useRef();
  const transformerRef = useRef();
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
      
      setElements(prev => {
        const newElements = [...prev, ...pastedElements];
        addToHistory(newElements, `Pegar ${pastedElements.length} elemento(s)`);
        return newElements;
      });
      setSelectedIds(pastedElements.map(el => el._id));
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
    
    setElements(prev => {
      const newElements = [...prev, newMesa];
      addToHistory(newElements, `Agregar mesa ${type}`);
      return newElements;
    });
    return newMesa;
  }, [addToHistory]);

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
    
    setElements(prev => {
      const newElements = [...prev, newSilla];
      addToHistory(newElements, 'Agregar silla');
      return newElements;
    });
    return newSilla;
  }, [addToHistory]);

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
    
    setElements(prev => {
      const newElements = [...prev, newTexto];
      addToHistory(newElements, 'Agregar texto');
      return newElements;
    });
    return newTexto;
  }, [addToHistory, textFontSize]);

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
    
    setElements(prev => {
      const newElements = [...prev, newRectangulo];
      addToHistory(newElements, 'Agregar rectángulo');
      return newElements;
    });
    return newRectangulo;
  }, [addToHistory, rectangleWidth, rectangleHeight]);

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
    
    setElements(prev => {
      const newElements = [...prev, newCirculo];
      addToHistory(newElements, 'Agregar círculo');
      return newElements;
    });
    return newCirculo;
  }, [addToHistory, circleRadius]);

  const addPoligono = useCallback((posicion = { x: 100, y: 100 }) => {
    const newPoligono = {
      _id: `polygon_${Date.now()}`,
      type: 'poligono',
      posicion,
      radius: polygonRadius,
      sides: polygonSides,
      fill: '#FF5722',
      stroke: '#D84315',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => {
      const newElements = [...prev, newPoligono];
      addToHistory(newElements, 'Agregar polígono');
      return newElements;
    });
    return newPoligono;
  }, [addToHistory, polygonRadius, polygonSides]);

  const addEstrella = useCallback((posicion = { x: 100, y: 100 }) => {
    const newEstrella = {
      _id: `star_${Date.now()}`,
      type: 'estrella',
      posicion,
      innerRadius: polygonRadius * 0.5,
      outerRadius: polygonRadius,
      numPoints: 5,
      fill: '#FFD700',
      stroke: '#FFA000',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1
    };
    
    setElements(prev => {
      const newElements = [...prev, newEstrella];
      addToHistory(newElements, 'Agregar estrella');
      return newElements;
    });
    return newEstrella;
  }, [addToHistory, polygonRadius]);

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
        id: Date.now(), // Usar timestamp como ID temporal
        nombre: newZoneName.trim(),
        aforo: newZoneAforo,
        color: newZoneColor,
        numerada: newZoneNumerada,
        sala_id: salaId,
        tenant_id: null // Se asignará desde el contexto
      };
      setZonas(prev => [...prev, newZone]);
      setNewZoneName('');
      setNewZoneAforo(0);
      setNewZoneColor('#FF6B6B');
      setNewZoneNumerada(false);
      message.success(`Zona "${newZone.nombre}" creada`);
    }
  }, [newZoneName, newZoneColor, newZoneAforo, newZoneNumerada, salaId]);

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
    
    setElements(prev => {
      const newElements = [...prev, duplicated];
      addToHistory(newElements, `Duplicar ${element.type}`);
      return newElements;
    });
    return duplicated;
  }, [addToHistory]);

  // Función para seleccionar elementos
  const handleElementClick = useCallback((elementId) => {
    setSelectedIds(prev => {
      if (prev.includes(elementId)) {
        return prev.filter(id => id !== elementId);
      } else {
        return [...prev, elementId];
      }
    });
    
    // Mostrar transformador para el elemento seleccionado
    setShowTransformer(true);
    setTransformerElement(elementId);
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

  // ===== FUNCIONES DE IMAGEN DE FONDO =====
  const handleBackgroundUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setBackgroundImage({
          src: e.target.result,
          width: img.width,
          height: img.height
        });
        message.success('Imagen de fondo cargada');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    return false; // Prevent upload
  }, []);

  const removeBackgroundImage = useCallback(() => {
    setBackgroundImage(null);
    setBackgroundPosition({ x: 0, y: 0 });
    setBackgroundScale(1);
    setBackgroundOpacity(1);
    message.success('Imagen de fondo eliminada');
  }, []);

  // ===== FUNCIONES DE SOMBRAS Y EFECTOS =====

  const applyShadowToSelected = useCallback((shadowProps) => {
    if (selectedIds.length === 0) {
      message.warning('Selecciona al menos un elemento para aplicar sombra');
      return;
    }
    
    setElements(prev => prev.map(el => 
      selectedIds.includes(el._id)
        ? { ...el, shadow: shadowProps }
        : el
    ));
    
    addToHistory(elements, `Aplicar sombra a ${selectedIds.length} elemento(s)`);
  }, [selectedIds, elements, addToHistory]);

  const removeShadowFromSelected = useCallback(() => {
    if (selectedIds.length === 0) {
      message.warning('Selecciona al menos un elemento para remover sombra');
      return;
    }
    
    setElements(prev => prev.map(el => 
      selectedIds.includes(el._id)
        ? { ...el, shadow: null }
        : el
    ));
    
    addToHistory(elements, `Remover sombra de ${selectedIds.length} elemento(s)`);
  }, [selectedIds, elements, addToHistory]);

  // ===== FUNCIONES DE ZONAS PERSONALIZABLES =====
  const startCustomZoneCreation = useCallback(() => {
    setIsCreatingCustomZone(true);
    setCustomZoneMode('create');
    setCustomZonePoints([]);
    setCurrentCustomZone({
      id: Date.now(),
      name: `Zona Personalizada ${customZones.length + 1}`,
      color: '#FF6B6B',
      points: [],
      aforo: 0,
      numerada: false
    });
    message.info('Haz clic en el canvas para crear puntos de la zona. Doble clic para finalizar.');
  }, [customZones.length]);

  const addCustomZonePoint = useCallback((x, y) => {
    if (!isCreatingCustomZone) return;
    
    const newPoint = { x, y, id: Date.now() };
    setCustomZonePoints(prev => [...prev, newPoint]);
    
    if (customZonePoints.length >= 2) {
      // Crear la zona cuando hay al menos 3 puntos
      const zone = {
        ...currentCustomZone,
        points: [...customZonePoints, newPoint]
      };
      setCustomZones(prev => [...prev, zone]);
      setIsCreatingCustomZone(false);
      setCustomZonePoints([]);
      setCurrentCustomZone(null);
      message.success('Zona personalizada creada exitosamente');
    }
  }, [isCreatingCustomZone, customZonePoints, currentCustomZone]);

  const editCustomZone = useCallback((zoneId) => {
    const zone = customZones.find(z => z.id === zoneId);
    if (zone) {
      setCurrentCustomZone(zone);
      setCustomZonePoints(zone.points);
      setCustomZoneMode('edit');
      setShowCustomZoneModal(true);
    }
  }, [customZones]);

  const updateCustomZonePoint = useCallback((pointId, newPosition) => {
    if (customZoneMode === 'edit' && currentCustomZone) {
      setCustomZonePoints(prev => prev.map(p => 
        p.id === pointId ? { ...p, ...newPosition } : p
      ));
    }
  }, [customZoneMode, currentCustomZone]);



  const deleteCustomZone = useCallback((zoneId) => {
    setCustomZones(prev => prev.filter(z => z.id !== zoneId));
    message.success('Zona personalizada eliminada');
  }, []);

  // ===== FUNCIONES DE ALINEACIÓN =====
  const alignElements = useCallback((alignment) => {
    if (selectedIds.length < 2) {
      message.warning('Selecciona al menos 2 elementos para alinear');
      return;
    }

    const selectedElements = elements.filter(el => selectedIds.includes(el._id));
    let newElements = [...elements];

    switch (alignment) {
      case 'left':
        const minX = Math.min(...selectedElements.map(el => el.posicion.x));
        selectedElements.forEach(el => {
          const index = newElements.findIndex(nel => nel._id === el._id);
          newElements[index] = { ...el, posicion: { ...el.posicion, x: minX } };
        });
        break;
      case 'center':
        const avgX = selectedElements.reduce((sum, el) => sum + el.posicion.x + el.width / 2, 0) / selectedElements.length;
        selectedElements.forEach(el => {
          const index = newElements.findIndex(nel => nel._id === el._id);
          newElements[index] = { ...el, posicion: { ...el.posicion, x: avgX - el.width / 2 } };
        });
        break;
      case 'right':
        const maxX = Math.max(...selectedElements.map(el => el.posicion.x + el.width));
        selectedElements.forEach(el => {
          const index = newElements.findIndex(nel => nel._id === el._id);
          newElements[index] = { ...el, posicion: { ...el.posicion, x: maxX - el.width } };
        });
        break;
      case 'top':
        const minY = Math.min(...selectedElements.map(el => el.posicion.y));
        selectedElements.forEach(el => {
          const index = newElements.findIndex(nel => nel._id === el._id);
          newElements[index] = { ...el, posicion: { ...el.posicion, y: minY } };
        });
        break;
      case 'middle':
        const avgY = selectedElements.reduce((sum, el) => sum + el.posicion.y + el.height / 2, 0) / selectedElements.length;
        selectedElements.forEach(el => {
          const index = newElements.findIndex(nel => nel._id === el._id);
          newElements[index] = { ...el, posicion: { ...el.posicion, y: avgY - el.height / 2 } };
        });
        break;
      case 'bottom':
        const maxY = Math.max(...selectedElements.map(el => el.posicion.y + el.height));
        selectedElements.forEach(el => {
          const index = newElements.findIndex(nel => nel._id === el._id);
          newElements[index] = { ...el, posicion: { ...el.posicion, y: maxY - el.height } };
        });
        break;
      default:
        return;
    }

    setElements(newElements);
    addToHistory(newElements, `Alinear ${selectedIds.length} elementos`);
    message.success(`Elementos alineados: ${alignment}`);
  }, [selectedIds, elements, addToHistory]);

  // ===== FUNCIONES DE DUPLICACIÓN INTELIGENTE =====
  const duplicateInPattern = useCallback((pattern, count, spacing) => {
    if (selectedIds.length === 0) {
      message.warning('Selecciona elementos para duplicar');
      return;
    }

    const selectedElements = elements.filter(el => selectedIds.includes(el._id));
    let newElements = [...elements];

    for (let i = 1; i <= count; i++) {
      selectedElements.forEach(element => {
        let offset = { x: 0, y: 0 };
        
        switch (pattern) {
          case 'horizontal':
            offset = { x: spacing * i, y: 0 };
            break;
          case 'vertical':
            offset = { x: 0, y: spacing * i };
            break;
          case 'diagonal':
            offset = { x: spacing * i, y: spacing * i };
            break;
          case 'grid':
            const cols = Math.ceil(Math.sqrt(count));
            const row = Math.floor((i - 1) / cols);
            const col = (i - 1) % cols;
            offset = { x: spacing * col, y: spacing * row };
            break;
          default:
            offset = { x: spacing * i, y: 0 };
        }

        const duplicated = {
          ...element,
          _id: `${element.type}_${Date.now()}_${i}`,
          posicion: {
            x: element.posicion.x + offset.x,
            y: element.posicion.y + offset.y
          }
        };
        newElements.push(duplicated);
      });
    }

    setElements(newElements);
    addToHistory(newElements, `Duplicar ${selectedElements.length} elementos en patrón ${pattern}`);
    message.success(`${selectedElements.length * count} elementos duplicados`);
  }, [selectedIds, elements, addToHistory]);

  // ===== FUNCIONES DE CAPAS =====

  const toggleLayerVisibility = useCallback((layerName) => {
    setLayers(prev => prev.map(layer =>
      layer.name === layerName ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  // ===== FUNCIONES DE PLANTILLAS =====
  const saveAsTemplate = useCallback((templateName) => {
    if (!templateName.trim()) {
      message.error('Ingresa un nombre para la plantilla');
      return;
    }

    const template = {
      id: `template_${Date.now()}`,
      name: templateName.trim(),
      elements: JSON.parse(JSON.stringify(elements)),
      zonas: JSON.parse(JSON.stringify(zonas)),
      createdAt: new Date().toISOString()
    };

    setTemplates(prev => [...prev, template]);
    message.success(`Plantilla "${templateName}" guardada`);
  }, [elements, zonas]);

  const loadTemplate = useCallback((template) => {
    setElements(template.elements);
    setZonas(template.zonas);
    addToHistory(template.elements, `Cargar plantilla ${template.name}`);
    message.success(`Plantilla "${template.name}" cargada`);
  }, [addToHistory]);

  // ===== FUNCIONES DE EXPORTACIÓN =====
  const exportToPNG = useCallback(async () => {
    if (!stageRef.current) return;

    setExporting(true);
    try {
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2,
        quality: 1
      });
      
      const link = document.createElement('a');
      link.download = `mapa_sala_${salaId}_${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Mapa exportado como PNG');
    } catch (error) {
      message.error('Error al exportar: ' + error.message);
    } finally {
      setExporting(false);
    }
  }, [salaId]);

  const exportToPDF = useCallback(async () => {
    if (!stageRef.current) return;

    setExporting(true);
    try {
      // Crear PDF usando jsPDF (requiere instalación)
      const dataURL = stageRef.current.toDataURL({
        pixelRatio: 2,
        quality: 1
      });
      
      // Por ahora, exportar como imagen hasta instalar jsPDF
      const link = document.createElement('a');
      link.download = `mapa_sala_${salaId}_${Date.now()}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Mapa exportado (PNG - PDF pendiente de configurar)');
    } catch (error) {
      message.error('Error al exportar: ' + error.message);
    } finally {
      setExporting(false);
    }
  }, [salaId]);

  // ===== FUNCIONES DE SNAP TO GRID =====
  const snapToGridPosition = useCallback((position) => {
    if (!snapToGrid) return position;
    
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }, [snapToGrid, gridSize]);

  // ===== FUNCIONES DE SILLAS AUTOMÁTICAS =====
  const addSeatsAroundTable = useCallback((mesa, seatsCount, spacing = 40) => {
    if (!mesa || mesa.type !== 'mesa') return;

    const newSeats = [];
    const centerX = mesa.posicion.x + mesa.width / 2;
    const centerY = mesa.posicion.y + mesa.height / 2;
    const radius = Math.max(mesa.width, mesa.height) / 2 + spacing;

    for (let i = 0; i < seatsCount; i++) {
      const angle = (i / seatsCount) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const seat = {
        _id: `silla_${Date.now()}_${i}`,
        type: 'silla',
        posicion: { x: x - 10, y: y - 10 },
        width: 20,
        height: 20,
        fill: '#4ECDC4',
        stroke: '#000000',
        strokeWidth: 1,
        rotation: 0,
        opacity: 1,
        zonaId: mesa.zonaId
      };
      newSeats.push(seat);
    }

    setElements(prev => {
      const newElements = [...prev, ...newSeats];
      addToHistory(newElements, `Agregar ${seatsCount} sillas alrededor de mesa`);
      return newElements;
    });
    message.success(`${seatsCount} sillas agregadas`);
  }, [addToHistory]);

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
                const rawPosition = { x: e.target.x() - element.width / 2, y: e.target.y() - element.height / 2 };
                const snappedPosition = snapToGridPosition(rawPosition);
                setElements(prev => {
                  const newElements = prev.map(el =>
                    el._id === element._id
                      ? { ...el, posicion: snappedPosition }
                      : el
                  );
                  addToHistory(newElements, `Mover ${element.type}`);
                  return newElements;
                });
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
                const rawPosition = { x: e.target.x(), y: e.target.y() };
                const snappedPosition = snapToGridPosition(rawPosition);
                setElements(prev => {
                  const newElements = prev.map(el =>
                    el._id === element._id
                      ? { ...el, posicion: snappedPosition }
                      : el
                  );
                  addToHistory(newElements, `Mover ${element.type}`);
                  return newElements;
                });
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
            shadowColor={element.shadow?.color || shadowColor}
            shadowBlur={element.shadow?.blur || shadowBlur}
            shadowOffsetX={element.shadow?.offsetX || shadowOffsetX}
            shadowOffsetY={element.shadow?.offsetY || shadowOffsetY}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const rawPosition = { x: e.target.x(), y: e.target.y() };
              const snappedPosition = snapToGridPosition(rawPosition);
              setElements(prev => {
                const newElements = prev.map(el =>
                  el._id === element._id
                    ? { ...el, posicion: snappedPosition }
                    : el
                );
                addToHistory(newElements, `Mover ${element.type}`);
                return newElements;
              });
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
            shadowColor={element.shadow?.color || shadowColor}
            shadowBlur={element.shadow?.blur || shadowBlur}
            shadowOffsetX={element.shadow?.offsetX || shadowOffsetX}
            shadowOffsetY={element.shadow?.offsetY || shadowOffsetY}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const rawPosition = { x: e.target.x(), y: e.target.y() };
              const snappedPosition = snapToGridPosition(rawPosition);
              setElements(prev => {
                const newElements = prev.map(el =>
                  el._id === element._id
                    ? { ...el, posicion: snappedPosition }
                    : el
                );
                addToHistory(newElements, `Mover ${element.type}`);
                return newElements;
              });
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
            shadowColor={element.shadow?.color || shadowColor}
            shadowBlur={element.shadow?.blur || shadowBlur}
            shadowOffsetX={element.shadow?.offsetX || shadowOffsetX}
            shadowOffsetY={element.shadow?.offsetY || shadowOffsetY}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const rawPosition = { x: e.target.x(), y: e.target.y() };
              const snappedPosition = snapToGridPosition(rawPosition);
              setElements(prev => {
                const newElements = prev.map(el =>
                  el._id === element._id
                    ? { ...el, posicion: snappedPosition }
                    : el
                );
                addToHistory(newElements, `Mover ${element.type}`);
                return newElements;
              });
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
            shadowColor={element.shadow?.color || shadowColor}
            shadowBlur={element.shadow?.blur || shadowBlur}
            shadowOffsetX={element.shadow?.offsetX || shadowOffsetX}
            shadowOffsetY={element.shadow?.offsetY || shadowOffsetY}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const rawPosition = { x: e.target.x(), y: e.target.y() };
              const snappedPosition = snapToGridPosition(rawPosition);
              setElements(prev => {
                const newElements = prev.map(el =>
                  el._id === element._id
                    ? { ...el, posicion: snappedPosition }
                    : el
                );
                addToHistory(newElements, `Mover ${element.type}`);
                return newElements;
              });
            }}
          />
        );
      }

      // Renderizar polígono
      if (element.type === 'poligono') {
        return (
          <RegularPolygon
            key={element._id}
            x={element.posicion.x}
            y={element.posicion.y}
            sides={element.sides}
            radius={element.radius}
            fill={element.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rotation={element.rotation}
            opacity={element.opacity}
            shadowColor={element.shadow?.color || shadowColor}
            shadowBlur={element.shadow?.blur || shadowBlur}
            shadowOffsetX={element.shadow?.offsetX || shadowOffsetX}
            shadowOffsetY={element.shadow?.offsetY || shadowOffsetY}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const rawPosition = { x: e.target.x(), y: e.target.y() };
              const snappedPosition = snapToGridPosition(rawPosition);
              setElements(prev => {
                const newElements = prev.map(el =>
                  el._id === element._id
                    ? { ...el, posicion: snappedPosition }
                    : el
                );
                addToHistory(newElements, `Mover ${element.type}`);
                return newElements;
              });
            }}
          />
        );
      }

      // Renderizar estrella
      if (element.type === 'estrella') {
        return (
          <Star
            key={element._id}
            x={element.posicion.x}
            y={element.posicion.y}
            numPoints={element.numPoints}
            innerRadius={element.innerRadius}
            outerRadius={element.outerRadius}
            fill={element.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rotation={element.rotation}
            opacity={element.opacity}
            shadowColor={element.shadow?.color || shadowColor}
            shadowBlur={element.shadow?.blur || shadowBlur}
            shadowOffsetX={element.shadow?.offsetX || shadowOffsetX}
            shadowOffsetY={element.shadow?.offsetY || shadowOffsetY}
            onClick={() => handleElementClick(element._id)}
            onTap={() => handleElementClick(element._id)}
            onContextMenu={(e) => handleElementRightClick(e, element._id)}
            draggable={activeMode === 'select'}
            onDragEnd={(e) => {
              const rawPosition = { x: e.target.x(), y: e.target.y() };
              const snappedPosition = snapToGridPosition(rawPosition);
              setElements(prev => {
                const newElements = prev.map(el =>
                  el._id === element._id
                    ? { ...el, posicion: snappedPosition }
                    : el
                );
                addToHistory(newElements, `Mover ${element.type}`);
                return newElements;
              });
            }}
          />
        );
      }

      return null;
    });
  }, [elements, selectedIds, handleElementClick, getElementZoneColor, activeMode, snapToGridPosition, addToHistory]);

  // Función para renderizar zonas personalizables
  const renderCustomZones = useCallback(() => {
    return (
      <>
        {/* Zonas personalizadas existentes */}
        {customZones.map(zone => (
          <Group key={zone.id}>
            {/* Polígono de la zona */}
            <RegularPolygon
              x={0}
              y={0}
              sides={zone.points.length}
              radius={20}
              fill={zone.color}
              opacity={0.3}
              stroke={zone.color}
              strokeWidth={2}
              listening={false}
            />
            
            {/* Puntos de la zona */}
            {zone.points.map((point, index) => (
              <Circle
                key={point.id}
                x={point.x}
                y={point.y}
                radius={4}
                fill={zone.color}
                stroke="#000"
                strokeWidth={1}
                draggable={customZoneMode === 'edit'}
                onDragEnd={(e) => {
                  if (customZoneMode === 'edit') {
                    updateCustomZonePoint(point.id, { x: e.target.x(), y: e.target.y() });
                  }
                }}
              />
            ))}
            
            {/* Líneas conectando los puntos */}
            {zone.points.length > 1 && (
              <Line
                points={zone.points.flatMap(point => [point.x, point.y])}
                stroke={zone.color}
                strokeWidth={2}
                closed={true}
                listening={false}
              />
            )}
          </Group>
        ))}
        
        {/* Puntos temporales durante la creación */}
        {isCreatingCustomZone && customZonePoints.map((point, index) => (
          <Circle
            key={point.id}
            x={point.x}
            y={point.y}
            radius={4}
            fill="#FF6B6B"
            stroke="#000"
            strokeWidth={1}
          />
        ))}
      </>
    );
  }, [customZones, customZoneMode, isCreatingCustomZone, customZonePoints, updateCustomZonePoint]);

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
    
    // Manejar creación de zonas personalizables
    if (isCreatingCustomZone) {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const adjustedPoint = {
        x: (point.x - position.x) / scale,
        y: (point.y - position.y) / scale
      };
      addCustomZonePoint(adjustedPoint.x, adjustedPoint.y);
    }
  }, [activeMode, isCreatingCustomZone, position, scale, addCustomZonePoint]);

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

  // Efecto para cargar zonas desde la base de datos
  useEffect(() => {
    const loadZonas = async () => {
      try {
        console.log('[CrearMapaMain] Cargando zonas para sala:', salaId);
        
                         // Importar dinámicamente para evitar problemas de circular dependency
                 const { supabase } = await import('../../../config/supabase.js');
        
        const { data: zonasData, error } = await supabase
          .from('zonas')
          .select('*')
          .eq('sala_id', salaId);
        
        if (error) {
          console.error('[CrearMapaMain] Error cargando zonas:', error);
          message.error('Error cargando zonas: ' + error.message);
          return;
        }
        
        if (zonasData && zonasData.length > 0) {
          console.log('[CrearMapaMain] Zonas cargadas:', zonasData);
          setZonas(zonasData);
          message.success(`${zonasData.length} zona(s) cargada(s) desde la base de datos`);
        } else {
          console.log('[CrearMapaMain] No se encontraron zonas para esta sala');
          // Crear zona por defecto si no hay ninguna
          const defaultZone = {
            id: 1,
            nombre: 'Zona Principal',
            aforo: 100,
            color: '#FF6B6B',
            numerada: false,
            sala_id: salaId,
            tenant_id: null
          };
          setZonas([defaultZone]);
        }
      } catch (error) {
        console.error('[CrearMapaMain] Error en loadZonas:', error);
        message.error('Error cargando zonas: ' + error.message);
      }
    };

    if (salaId) {
      loadZonas();
    }
  }, [salaId]);

  // Efecto para debuggear el estado de elementos
  useEffect(() => {
    console.log('[CrearMapaMain] Estado actual de elementos:', elements);
    console.log('[CrearMapaMain] Estado actual de zonas:', zonas);
  }, [elements, zonas]);

  // Efecto para manejar el transformador
  useEffect(() => {
    if (transformerRef.current && selectedIds.length > 0) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedIds[0]}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedIds]);

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
          case 'r':
            e.preventDefault();
            addRectangulo();
            break;
          case 'c':
            e.preventDefault();
            addCirculo();
            break;
          case 'p':
            e.preventDefault();
            addPoligono();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [elements, onSave, deleteSelectedElements, undo, redo, handleCopy, handlePaste, addMesa, addSilla, addTexto, addRectangulo, addCirculo, addPoligono, closeContextMenu]);

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
    <div className="w-full h-full bg-gray-100 flex">
      {/* Panel lateral izquierdo con herramientas */}
      <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
        {/* Header del panel */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Editor de Mapas
          </h2>
          <p className="text-sm text-gray-500">
            Sala ID: {salaId}
          </p>
        </div>

        {/* Contenido del panel con scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Panel: Herramientas de Selección */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setActiveMode('select')}
              className={`w-full p-3 text-left font-medium rounded-t-lg ${
                activeMode === 'select'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✋ Herramientas de Selección
            </button>
            <div className={`p-3 border-t border-gray-200 ${activeMode === 'select' ? 'block' : 'hidden'}`}>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveMode('select')}
                  className={`w-full px-3 py-2 rounded text-sm ${
                    activeMode === 'select'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ✋ Seleccionar
                </button>
                <button
                  onClick={() => setActiveMode('pan')}
                  className={`w-full px-3 py-2 rounded text-sm ${
                    activeMode === 'pan'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🖐️ Mover
                </button>
              </div>
            </div>
          </div>

          {/* Panel: Crear Elementos */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowCreateElements(!showCreateElements)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-green-100 text-green-700 hover:bg-green-200"
            >
              🎨 Crear Elementos
            </button>
            <div className={`p-3 border-t border-gray-200 ${showCreateElements ? 'block' : 'hidden'}`}>
              <div className="grid grid-cols-2 gap-2">
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
                <button
                  onClick={() => addPoligono()}
                  className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                >
                  🔶 Polígono
                </button>
                <button
                  onClick={() => addEstrella()}
                  className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                >
                  ⭐ Estrella
                </button>
                <button
                  onClick={startCustomZoneCreation}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  🎯 Zona Personalizada
                </button>
              </div>
              
              {/* Configuración de formas */}
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                <div className="text-xs text-gray-600 font-medium">Configuración:</div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-600">Tamaño texto:</label>
                  <input
                    type="range"
                    min="8"
                    max="48"
                    value={textFontSize}
                    onChange={(e) => setTextFontSize(Number(e.target.value))}
                    className="w-16"
                  />
                  <span className="text-xs text-gray-500 w-8">{textFontSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-600">Radio círculo:</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={circleRadius}
                    onChange={(e) => setCircleRadius(Number(e.target.value))}
                    className="w-16"
                  />
                  <span className="text-xs text-gray-500 w-8">{circleRadius}</span>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-600">Lados polígono:</label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    value={polygonSides}
                    onChange={(e) => setPolygonSides(Number(e.target.value))}
                    className="w-16"
                  />
                  <span className="text-xs text-gray-500 w-8">{polygonSides}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel: Edición */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowEditTools(!showEditTools)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              🔧 Herramientas de Edición
            </button>
            <div className={`p-3 border-t border-gray-200 ${showEditTools ? 'block' : 'hidden'}`}>
              <div className="space-y-2">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  ↶ Deshacer
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  ↷ Rehacer
                </button>
                <button
                  onClick={handleCopy}
                  disabled={selectedIds.length === 0}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  📋 Copiar
                </button>
                <button
                  onClick={handlePaste}
                  disabled={clipboard.length === 0}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
                >
                  📄 Pegar
                </button>
                <button
                  onClick={deleteSelectedElements}
                  disabled={selectedIds.length === 0}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>

          {/* Panel: Zoom y Navegación */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowZoomTools(!showZoomTools)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
            >
              🔍 Zoom y Navegación
            </button>
            <div className={`p-3 border-t border-gray-200 ${showZoomTools ? 'block' : 'hidden'}`}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const newScale = Math.min(maxScale, scale * 1.2);
                      setScale(newScale);
                    }}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    🔍+
                  </button>
                  <span className="text-sm text-gray-600 flex-1 text-center">
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
                </div>
                <button
                  onClick={() => {
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  🏠 Centrar Vista
                </button>
              </div>
            </div>
          </div>

          {/* Panel: Zonas Personalizables */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowCustomZonePanel(!showCustomZonePanel)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-red-100 text-red-700 hover:bg-red-200"
            >
              🎯 Zonas Personalizables
            </button>
            <div className={`p-3 border-t border-gray-200 ${showCustomZonePanel ? 'block' : 'hidden'}`}>
              <div className="space-y-3">
                <button
                  onClick={startCustomZoneCreation}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  ➕ Crear Nueva Zona
                </button>
                
                {customZones.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Zonas Existentes:</div>
                    {customZones.map(zone => (
                      <div key={zone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{zone.name}</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => editCustomZone(zone.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteCustomZone(zone.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel: Configuración */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowConfigTools(!showConfigTools)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-orange-100 text-orange-700 hover:bg-orange-200"
            >
              ⚙️ Configuración
            </button>
            <div className={`p-3 border-t border-gray-200 ${showConfigTools ? 'block' : 'hidden'}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Grid:</label>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Tamaño Grid:</label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Snap to Grid:</label>
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Nombres:</label>
                  <input
                    type="checkbox"
                    checked={showMesaNames}
                    onChange={(e) => setShowMesaNames(e.target.checked)}
                    className="rounded"
                  />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Historial: {historyIndex + 1}/{history.length}
                </div>
              </div>
            </div>
                    </div>

          {/* Panel: Efectos y Sombras */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowEffectsTools(!showEffectsTools)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
            >
              ✨ Efectos y Sombras
            </button>
            <div className={`p-3 border-t border-gray-200 ${showEffectsTools ? 'block' : 'hidden'}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Mostrar Sombras:</label>
                  <input
                    type="checkbox"
                    checked={showShadows}
                    onChange={(e) => setShowShadows(e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                {showShadows && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">Color Sombra:</label>
                      <input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-8 h-6 rounded border"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">Desenfoque:</label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={shadowBlur}
                        onChange={(e) => setShadowBlur(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">Offset X:</label>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={shadowOffsetX}
                        onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">Offset Y:</label>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={shadowOffsetY}
                        onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={() => applyShadowToSelected({
                          color: shadowColor,
                          blur: shadowBlur,
                          offsetX: shadowOffsetX,
                          offsetY: shadowOffsetY
                        })}
                        disabled={selectedIds.length === 0}
                        className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
                      >
                        🎨 Aplicar a Seleccionados
                      </button>
                      <button
                        onClick={removeShadowFromSelected}
                        disabled={selectedIds.length === 0}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
                      >
                        🚫 Remover Sombras
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Panel: Transformador Visual */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => setShowTransformerPanel(!showTransformerPanel)}
              className="w-full p-3 text-left font-medium rounded-t-lg bg-green-100 text-green-700 hover:bg-green-200"
            >
              🔧 Transformador Visual
            </button>
            <div className={`p-3 border-t border-gray-200 ${showTransformerPanel ? 'block' : 'hidden'}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Mostrar Transformador:</label>
                  <input
                    type="checkbox"
                    checked={showTransformer}
                    onChange={(e) => setShowTransformer(e.target.checked)}
                    className="rounded"
                  />
                </div>
                
                {showTransformer && selectedIds.length > 0 && (
                  <>
                    <div className="text-sm text-gray-600">
                      Elemento seleccionado: {selectedIds.length}
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">
                        Usa los handles del transformador para:
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>• 🔴 Esquinas: Redimensionar</div>
                        <div>• 🔵 Lados: Redimensionar proporcional</div>
                        <div>• 🟡 Centro: Rotar</div>
                        <div>• 🟢 Esquinas internas: Redimensionar desde centro</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Panel: Imagen de Fondo */}
           <div className="bg-white border border-gray-200 rounded-lg">
             <button
               onClick={() => setShowBackgroundTools(!showBackgroundTools)}
               className="w-full p-3 text-left font-medium rounded-t-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
             >
               🖼️ Imagen de Fondo
             </button>
             <div className={`p-3 border-t border-gray-200 ${showBackgroundTools ? 'block' : 'hidden'}`}>
               <div className="space-y-3">
                 {!backgroundImage ? (
                   <div>
                     <input
                       ref={fileInputRef}
                       type="file"
                       accept="image/*"
                       onChange={(e) => {
                         if (e.target.files[0]) {
                           handleBackgroundUpload(e.target.files[0]);
                         }
                       }}
                       className="hidden"
                     />
                     <button
                       onClick={() => fileInputRef.current?.click()}
                       className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                     >
                       📁 Subir Imagen
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     <div className="text-xs text-gray-600">Imagen cargada</div>
                     <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-600">Opacidad:</label>
                       <input
                         type="range"
                         min="0"
                         max="1"
                         step="0.1"
                         value={backgroundOpacity}
                         onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                         className="w-20"
                       />
                     </div>
                     <div className="flex items-center justify-between">
                       <label className="text-sm text-gray-600">Escala:</label>
                       <input
                         type="range"
                         min="0.1"
                         max="3"
                         step="0.1"
                         value={backgroundScale}
                         onChange={(e) => setBackgroundScale(Number(e.target.value))}
                         className="w-20"
                       />
                     </div>
                     <button
                       onClick={removeBackgroundImage}
                       className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                     >
                       🗑️ Quitar Imagen
                     </button>
                   </div>
                 )}
               </div>
             </div>
           </div>

           {/* Panel: Herramientas de Alineación */}
           <div className="bg-white border border-gray-200 rounded-lg">
             <button
               onClick={() => setShowAlignmentTools(!showAlignmentTools)}
               className="w-full p-3 text-left font-medium rounded-t-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
             >
               📐 Alineación
             </button>
             <div className={`p-3 border-t border-gray-200 ${showAlignmentTools ? 'block' : 'hidden'}`}>
               <div className="space-y-3">
                 <div>
                   <div className="text-xs text-gray-600 mb-2">Alineación Horizontal:</div>
                   <div className="grid grid-cols-3 gap-1">
                     <button
                       onClick={() => alignElements('left')}
                       disabled={selectedIds.length < 2}
                       className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-xs"
                     >
                       ⬅️ Izq
                     </button>
                     <button
                       onClick={() => alignElements('center')}
                       disabled={selectedIds.length < 2}
                       className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-xs"
                     >
                       ↔️ Centro
                     </button>
                     <button
                       onClick={() => alignElements('right')}
                       disabled={selectedIds.length < 2}
                       className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-xs"
                     >
                       ➡️ Der
                     </button>
                   </div>
                 </div>
                 <div>
                   <div className="text-xs text-gray-600 mb-2">Alineación Vertical:</div>
                   <div className="grid grid-cols-3 gap-1">
                     <button
                       onClick={() => alignElements('top')}
                       disabled={selectedIds.length < 2}
                       className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-xs"
                     >
                       ⬆️ Arr
                     </button>
                     <button
                       onClick={() => alignElements('middle')}
                       disabled={selectedIds.length < 2}
                       className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-xs"
                     >
                       ↕️ Medio
                     </button>
                     <button
                       onClick={() => alignElements('bottom')}
                       disabled={selectedIds.length < 2}
                       className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-xs"
                     >
                       ⬇️ Abj
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Panel: Duplicación Inteligente */}
           <div className="bg-white border border-gray-200 rounded-lg">
             <button
               onClick={() => setShowEffectsTools(!showEffectsTools)}
               className="w-full p-3 text-left font-medium rounded-t-lg bg-pink-100 text-pink-700 hover:bg-pink-200"
             >
               📋 Duplicación Inteligente
             </button>
             <div className={`p-3 border-t border-gray-200 ${showEffectsTools ? 'block' : 'hidden'}`}>
               <div className="space-y-3">
                 <div>
                   <label className="block text-sm text-gray-600 mb-1">Cantidad:</label>
                   <input
                     type="number"
                     min="1"
                     max="20"
                     value={duplicationSpacing / 10}
                     onChange={(e) => setDuplicationSpacing(Number(e.target.value) * 10)}
                     className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                   />
                 </div>
                 <div>
                   <label className="block text-sm text-gray-600 mb-1">Espaciado:</label>
                   <input
                     type="range"
                     min="20"
                     max="100"
                     value={duplicationSpacing}
                     onChange={(e) => setDuplicationSpacing(Number(e.target.value))}
                     className="w-full"
                   />
                   <span className="text-xs text-gray-500">{duplicationSpacing}px</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                   <button
                     onClick={() => duplicateInPattern('horizontal', Math.floor(duplicationSpacing / 10), duplicationSpacing)}
                     disabled={selectedIds.length === 0}
                     className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                   >
                     ↔️ Horizontal
                   </button>
                   <button
                     onClick={() => duplicateInPattern('vertical', Math.floor(duplicationSpacing / 10), duplicationSpacing)}
                     disabled={selectedIds.length === 0}
                     className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                   >
                     ↕️ Vertical
                   </button>
                   <button
                     onClick={() => duplicateInPattern('grid', Math.floor(duplicationSpacing / 10), duplicationSpacing)}
                     disabled={selectedIds.length === 0}
                     className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                   >
                     ⊞ Grilla
                   </button>
                   <button
                     onClick={() => duplicateInPattern('diagonal', Math.floor(duplicationSpacing / 10), duplicationSpacing)}
                     disabled={selectedIds.length === 0}
                     className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                   >
                     ↗️ Diagonal
                   </button>
                 </div>
               </div>
             </div>
           </div>

           {/* Panel: Capas */}
           <div className="bg-white border border-gray-200 rounded-lg">
             <button
               onClick={() => setShowLayersPanel(!showLayersPanel)}
               className="w-full p-3 text-left font-medium rounded-t-lg bg-teal-100 text-teal-700 hover:bg-teal-200"
             >
               📚 Capas
             </button>
             <div className={`p-3 border-t border-gray-200 ${showLayersPanel ? 'block' : 'hidden'}`}>
               <div className="space-y-2">
                 {layers.map(layer => (
                   <div key={layer.name} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                     <div className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         checked={layer.visible}
                         onChange={() => toggleLayerVisibility(layer.name)}
                         className="rounded"
                       />
                       <span className="text-sm">{layer.name}</span>
                     </div>
                     <span className="text-xs text-gray-500">{layer.elements || 0}</span>
                   </div>
                 ))}
                 <button
                   onClick={() => {
                     const newLayer = `Capa ${layers.length + 1}`;
                     setLayers(prev => [...prev, { name: newLayer, visible: true, elements: 0 }]);
                   }}
                   className="w-full px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                 >
                   + Nueva Capa
                 </button>
               </div>
             </div>
           </div>

           {/* Panel: Plantillas */}
           <div className="bg-white border border-gray-200 rounded-lg">
             <button
               onClick={() => setShowTemplatesPanel(!showTemplatesPanel)}
               className="w-full p-3 text-left font-medium rounded-t-lg bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
             >
               📄 Plantillas
             </button>
             <div className={`p-3 border-t border-gray-200 ${showTemplatesPanel ? 'block' : 'hidden'}`}>
               <div className="space-y-3">
                 <div>
                   <input
                     type="text"
                     placeholder="Nombre de plantilla"
                     value={newTemplateName}
                     onChange={(e) => setNewTemplateName(e.target.value)}
                     className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                   />
                   <button
                     onClick={() => {
                       saveAsTemplate(newTemplateName);
                       setNewTemplateName('');
                     }}
                     disabled={!newTemplateName.trim()}
                     className="w-full mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                   >
                     💾 Guardar Plantilla
                   </button>
                 </div>
                 <div className="space-y-2">
                   {templates.map(template => (
                     <div key={template.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                       <span className="text-sm">{template.name}</span>
                       <div className="flex items-center space-x-1">
                         <button
                           onClick={() => loadTemplate(template)}
                           className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                         >
                           📂
                         </button>
                         <button
                           onClick={() => setTemplates(prev => prev.filter(t => t.id !== template.id))}
                           className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                         >
                           🗑️
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </div>

           {/* Panel: Exportación */}
           <div className="bg-white border border-gray-200 rounded-lg">
             <button
               onClick={() => setShowExportPanel(!showExportPanel)}
               className="w-full p-3 text-left font-medium rounded-t-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
             >
               📤 Exportación
             </button>
             <div className={`p-3 border-t border-gray-200 ${showExportPanel ? 'block' : 'hidden'}`}>
               <div className="space-y-2">
                 <button
                   onClick={exportToPNG}
                   disabled={exporting || elements.length === 0}
                   className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                 >
                   {exporting ? '⏳ Exportando...' : '🖼️ Exportar PNG'}
                 </button>
                 <button
                   onClick={exportToPDF}
                   disabled={exporting || elements.length === 0}
                   className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                 >
                   {exporting ? '⏳ Exportando...' : '📄 Exportar PDF'}
                 </button>
               </div>
             </div>
           </div>

           {/* Panel: Información */}
           <div className="bg-white border border-gray-200 rounded-lg">
             <button
               onClick={() => setShowInfoPanel(!showInfoPanel)}
               className="w-full p-3 text-left font-medium rounded-t-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
             >
               ℹ️ Información
             </button>
             <div className={`p-3 border-t border-gray-200 ${showInfoPanel ? 'block' : 'hidden'}`}>
               <div className="text-sm text-gray-600 space-y-2">
                 <div>Elementos: {elements.length}</div>
                 <div>Seleccionados: {selectedIds.length}</div>
                 <div className="pt-2 border-t border-gray-200">
                   <div className="font-medium mb-2">Atajos de Teclado:</div>
                   <div className="space-y-1 text-xs">
                     <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+Z</kbd> Deshacer</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+Y</kbd> Rehacer</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+C</kbd> Copiar</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+V</kbd> Pegar</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">Ctrl+S</kbd> Guardar</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">Del</kbd> Eliminar</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">Esc</kbd> Deseleccionar</div>
                     <div className="pt-1 border-t border-gray-200"></div>
                     <div><kbd className="bg-gray-100 px-1 rounded">M</kbd> Mesa</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">S</kbd> Silla</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">T</kbd> Texto</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">R</kbd> Rectángulo</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">C</kbd> Círculo</div>
                     <div><kbd className="bg-gray-100 px-1 rounded">P</kbd> Polígono</div>
                   </div>
                 </div>
               </div>
             </div>
           </div>

          {/* Panel: Acciones */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-3">
              <div className="space-y-2">
                <button
                  onClick={() => onSave && onSave(elements)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  💾 Guardar
                </button>
                <button
                  onClick={onCancel}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área de trabajo principal */}
      <div className="flex-1 flex flex-col">
        {/* Canvas principal */}
        <div className="flex-1 p-4">
          <div className="bg-white border border-gray-300 rounded-lg p-4 h-full">
            {/* Canvas de Konva */}
            <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
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
                  {/* Imagen de fondo */}
                  {backgroundImage && (
                    <Image
                      image={backgroundImage}
                      x={backgroundPosition.x}
                      y={backgroundPosition.y}
                      scaleX={backgroundScale}
                      scaleY={backgroundScale}
                      opacity={backgroundOpacity}
                      listening={false}
                    />
                  )}

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
                  
                  {/* Zonas personalizables */}
                  {renderCustomZones()}
                  
                  {/* Transformador para elementos seleccionados */}
                  {showTransformer && selectedIds.length > 0 && (
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        // Limitar el redimensionamiento mínimo
                        return newBox.width < 5 || newBox.height < 5 ? oldBox : newBox;
                      }}
                    />
                  )}
                  
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

        {/* Panel inferior con propiedades y zonas */}
        <div className="h-64 bg-white border-t border-gray-200 flex">
          {/* Panel de propiedades */}
          <div className="flex-1 p-4 border-r border-gray-200">
            <h3 className="font-semibold mb-3">🔧 Propiedades del Elemento</h3>
            {selectedIds.length === 1 ? (
              (() => {
                const element = elements.find(el => el._id === selectedIds[0]);
                if (!element) return <div className="text-gray-500">Selecciona un elemento</div>;
                 
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
              })()
            ) : (
              <div className="text-gray-500">Selecciona un elemento para ver sus propiedades</div>
            )}
          </div>

                     {/* Panel de zonas */}
           <div className="w-80 p-4">
             <h3 className="font-semibold mb-3">🎨 Gestión de Zonas</h3>
             <div className="space-y-2">
               {zonas.map(zona => (
                 <div key={zona.id} className="p-2 border border-gray-200 rounded">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center space-x-2">
                       <div 
                         className="w-4 h-4 rounded"
                         style={{ backgroundColor: zona.color }}
                       ></div>
                       <span className="text-sm font-medium">{zona.nombre}</span>
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
                   <div className="text-xs text-gray-500 space-y-1">
                     <div>Aforo: {zona.aforo || 0}</div>
                     <div>Numerada: {zona.numerada ? 'Sí' : 'No'}</div>
                   </div>
                 </div>
               ))}
             </div>
              
             {/* Agregar nueva zona */}
             <div className="mt-3 pt-3 border-t border-gray-200">
               <div className="space-y-2">
                 <input
                   type="text"
                   placeholder="Nombre de zona"
                   value={newZoneName}
                   onChange={(e) => setNewZoneName(e.target.value)}
                   className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                 />
                 <div className="flex items-center space-x-2">
                   <input
                     type="number"
                     placeholder="Aforo"
                     value={newZoneAforo}
                     onChange={(e) => setNewZoneAforo(Number(e.target.value))}
                     className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                   />
                   <label className="flex items-center space-x-1 text-xs">
                     <input
                       type="checkbox"
                       checked={newZoneNumerada}
                       onChange={(e) => setNewZoneNumerada(e.target.checked)}
                       className="rounded"
                     />
                     <span>Numerada</span>
                   </label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <input
                     type="color"
                     value={newZoneColor}
                     onChange={(e) => setNewZoneColor(e.target.value)}
                     className="w-8 h-8 border-none rounded cursor-pointer"
                   />
                   <button
                     onClick={addNewZone}
                     disabled={!newZoneName.trim()}
                     className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                   >
                     + Agregar Zona
                   </button>
                 </div>
               </div>
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

      {/* Modal para agregar sillas automáticamente */}
      {showAddSeatsModal && selectedMesaForSeats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">🪑 Agregar Sillas Automáticamente</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mesa seleccionada:</label>
                <div className="px-3 py-2 bg-gray-100 rounded text-sm">
                  {selectedMesaForSeats.nombre || 'Mesa sin nombre'}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Número de sillas:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  defaultValue={4}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  id="seatsCount"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Espaciado desde mesa:</label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  defaultValue={40}
                  className="w-full"
                  id="seatsSpacing"
                />
                <span className="text-xs text-gray-500">40px</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const seatsCount = Number(document.getElementById('seatsCount').value);
                    const spacing = Number(document.getElementById('seatsSpacing').value);
                    addSeatsAroundTable(selectedMesaForSeats, seatsCount, spacing);
                    setShowAddSeatsModal(false);
                    setSelectedMesaForSeats(null);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ✅ Agregar Sillas
                </button>
                <button
                  onClick={() => {
                    setShowAddSeatsModal(false);
                    setSelectedMesaForSeats(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearMapaMain;
