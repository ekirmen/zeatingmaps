import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Circle, Rect, Text as KonvaText, Line, Image, Group, RegularPolygon, Star } from 'react-konva';
import { 
  Button, 
  Card, 
  Space, 
  Input, 
  Select, 
  Slider, 
  Switch, 
  message, 
  Tooltip, 
  Divider,
  Row,
  Col,
  Typography,
  Badge,
  Popconfirm,
  Modal,
  Form,
  InputNumber,
  ColorPicker,
  Upload,
  Progress
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  ClearOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  PictureOutlined,
  LinkOutlined,
  SettingOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  AppstoreOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignBottomOutlined,
  FullscreenOutlined,
  CompressOutlined,
  DownloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useMapaElements } from '../../hooks/useMapaElements';
import { useMapaState } from '../../hooks/useMapaState';
import { useMapaSelection } from '../../hooks/useMapaSelection';
import { useMapaZoomStage } from '../../hooks/useMapaZoomStage';
import { useMapaGraphicalElements } from '../../hooks/useMapaGraphicalElements';
import { useMapaLoadingSaving } from '../../hooks/usemapaloadingsaving';
import { useMapaZones } from '../../hooks/usemapazones';
import { supabase } from '../../../supabaseClient';
import { fetchZonasPorSala } from '../../services/apibackoffice';
import Grid from '../compMapa/Grid';
import MenuMapa from '../compMapa/MenuMapa';
import AdvancedEditPopup from '../compMapa/AdvancedEditPopup';
import EditPopup from '../compMapa/EditPopup';
import FilaPopup from '../compMapa/FilaPopup';
import IconSelector from '../compMapa/IconSelector';
import PropiedadesMesa from '../compMapa/propiedades/PropiedadesMesa';
import PropiedadesSilla from '../compMapa/propiedades/PropiedadesSilla';
import ZonaManager from './ZonaManager';
import ContextMenu from './ContextMenu';
import MesaTypeMenu from './MesaTypeMenu';
import BackgroundFilterMenu from './BackgroundFilterMenu';
import BackgroundImageManager from './BackgroundImageManager';


const { Option } = Select;
const { Text, Title } = Typography;
const { TextArea } = Input;

const CrearMapaEditor = ({ 
  salaId, 
  onSave, 
  onCancel,
  initialMapa = null,
  isEditMode = false 
}) => {
  // ===== ESTADOS PRINCIPALES =====
  const [mapa, setMapa] = useState(initialMapa || {
    id: null,
    nombre: 'Nuevo Mapa',
    descripcion: '',
    sala_id: salaId,
    contenido: {
      elementos: [],
      zonas: [],
      configuracion: {
        gridSize: 20,
        showGrid: true,
        snapToGrid: true,
        background: null,
        dimensions: { width: 1200, height: 800 }
      }
    },
    estado: 'draft'
  });

  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [activeMode, setActiveMode] = useState('select');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [sectionPoints, setSectionPoints] = useState([]);
  const [numSillas, setNumSillas] = useState(4);
  const [sillaShape, setSillaShape] = useState('rect');
  
  // ===== ESTADOS AVANZADOS =====
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [showZonesPanel, setShowZonesPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  
  // ===== ESTADOS DE ESCALADO Y ZOOM =====
  const [scale, setScale] = useState(0.8); // Zoom inicial más pequeño para ver más contenido
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [minScale, setMinScale] = useState(0.1);
  const [maxScale, setMaxScale] = useState(5); // Zoom máximo más alto para más detalle
  
  // ===== ESTADOS DE HISTORIAL =====
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [maxHistorySize] = useState(50);
  
  // ===== ESTADOS DE FONDO =====
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundScale, setBackgroundScale] = useState(1);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3);
  const [showBackgroundInWeb, setShowBackgroundInWeb] = useState(true);
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 0, y: 0 });
  
  // ===== ESTADOS DE CONEXIONES =====
  const [showConnections, setShowConnections] = useState(true);
  const [connectionStyle, setConnectionStyle] = useState('solid');
  const [connectionThreshold, setConnectionThreshold] = useState(50);
  
  // ===== ESTADOS DE ESTADOS DE ASIENTOS =====
  const [selectedSeatState, setSelectedSeatState] = useState('available');
  const [seatStates, setSeatStates] = useState({
    available: { fill: '#00d6a4', stroke: '#a8aebc', opacity: 1 },
    selected: { fill: '#008e6d', stroke: '#696f7d', opacity: 1 },
    occupied: { fill: '#ff6b6b', stroke: '#d63031', opacity: 0.8 },
    blocked: { fill: '#6c5ce7', stroke: '#5f3dc4', opacity: 0.7 },
    reserved: { fill: '#fdcb6e', stroke: '#e17055', opacity: 0.9 }
  });

  // ===== ESTADOS DE ZONAS =====
  const [zonas, setZonas] = useState([]);
  const [showZonaManager, setShowZonaManager] = useState(false);

  // ===== ESTADOS DE MENÚ CONTEXTUAL =====
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // ===== ESTADOS DE FILTROS DE FONDO =====
  const [backgroundFilters, setBackgroundFilters] = useState({});
  const [showBackgroundFilters, setShowBackgroundFilters] = useState(false);
  
  // ===== ESTADOS DE PROGRESO =====
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(5);
  
  // ===== FUNCIÓN PARA CALCULAR PROGRESO =====
  const calculateProgress = useCallback(() => {
    let progress = 0;
    let step = 1;
    
    // Paso 1: Tener una sala seleccionada (25%)
    if (salaId) {
      progress += 25;
      step = 2;
    }
    
    // Paso 2: Tener al menos una zona creada (50%)
    if (zonas.length > 0) {
      progress += 25;
      step = 3;
    }
    
    // Paso 3: Tener al menos una mesa o silla (75%)
    if (elements.length > 0) {
      progress += 25;
      step = 4;
    }
    
    // Paso 4: Tener sillas asignadas a mesas (90%)
    const mesasConSillas = elements.filter(el => 
      el.type === 'mesa' && el.sillas && el.sillas.length > 0
    );
    if (mesasConSillas.length > 0) {
      progress += 15;
      step = 5;
    }
    
    // Paso 5: Mapa guardado (100%)
    if (mapa?.estado === 'active') {
      progress += 10;
      step = 5;
    }
    
    setCurrentStep(step);
    return progress;
  }, [salaId, zonas.length, elements.length, mapa?.estado]);
  
  // ===== TEXTO DE PROGRESO =====
  const getProgressText = useCallback(() => {
    const progress = calculateProgress();
    const stepTexts = {
      1: 'Seleccionar Sala',
      2: 'Crear Zonas',
      3: 'Agregar Elementos',
      4: 'Configurar Sillas',
      5: 'Finalizar Mapa'
    };
    
    return {
      percentage: progress,
      currentStep: currentStep,
      stepText: stepTexts[currentStep] || 'Completado',
      isComplete: progress >= 100
    };
  }, [calculateProgress, currentStep]);
  
  // ===== REFERENCIAS =====
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // ===== HOOKS PERSONALIZADOS =====
  const {
    addMesa,
    addSillasToMesa,
    updateElementProperty,
    updateElementSize,
    deleteSelectedElements,
    limpiarSillasDuplicadas,
    snapToGrid: snapToGridFunction,
    assignZoneToSelected,
    scaleElement,
    scaleSystem,
    changeSeatState,
    autoConnectSeats,
    setBackgroundImage: setBackgroundImageFunction,
    updateBackground,
    removeBackground,
    precisePositioning,
    snapToCustomGrid
  } = useMapaElements(elements, setElements, selectedIds, selectedZone, numSillas);

  const {
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    panToCenter,
    zoomToFit
  } = useMapaZoomStage(stageRef, scale, setScale, position, setPosition);

  // ===== EFECTOS =====
  useEffect(() => {
    if (initialMapa?.contenido?.elementos) {
      setElements(initialMapa.contenido.elementos);
      addToHistory(initialMapa.contenido.elementos, 'Carga inicial');
    }
  }, [initialMapa]);

     useEffect(() => {
     if (mapa.contenido?.configuracion) {
       setShowGrid(mapa.contenido.configuracion.showGrid);
       setSnapToGrid(mapa.contenido.configuracion.snapToGrid);
       setGridSize(mapa.contenido.configuracion.gridSize);
       
       // Restaurar configuración de imagen de fondo
       if (mapa.contenido.configuracion.background) {
         const bg = mapa.contenido.configuracion.background;
         if (bg.position) {
           setBackgroundPosition(bg.position);
         }
         if (bg.scale) {
           setBackgroundScale(bg.scale);
         }
         if (bg.opacity) {
           setBackgroundOpacity(bg.opacity);
         }
         if (bg.showInWeb !== undefined) {
           setShowBackgroundInWeb(bg.showInWeb);
         }
       }
     }
   }, [mapa]);

  // Cargar zonas de la sala
  useEffect(() => {
    const loadZonas = async () => {
      if (salaId) {
        try {
          const zonasData = await fetchZonasPorSala(salaId);
          setZonas(zonasData || []);
          console.log('Zonas cargadas:', zonasData);
        } catch (error) {
          console.error('Error cargando zonas:', error);
          message.error('Error al cargar las zonas de la sala');
        }
      }
    };

    loadZonas();
  }, [salaId]);

  useEffect(() => {
    // Actualizar progreso cuando cambien los elementos
    calculateProgress();
  }, [calculateProgress, elements, zonas, mapa?.estado]);

  // ===== FUNCIONES DE COPIAR Y PEGAR =====
  const [clipboard, setClipboard] = useState([]);
  
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
  
  // ===== FUNCIONES DE HISTORIAL =====
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

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(JSON.parse(JSON.stringify(history[newIndex].elements)));
      message.success(`Deshecho: ${history[newIndex].action}`);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(JSON.parse(JSON.stringify(history[newIndex].elements)));
      message.success(`Rehecho: ${history[newIndex].action}`);
    }
  }, [historyIndex, history]);

  // ===== FUNCIONES DE MANIPULACIÓN =====
  const handleElementClick = useCallback((elementId) => {
    setSelectedIds(prev => {
      if (prev.includes(elementId)) {
        return prev.filter(id => id !== elementId);
      } else {
        return [...prev, elementId];
      }
    });
  }, []);

  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
    }
  }, []);

  const handleElementDrag = useCallback((elementId, newPosition) => {
    if (snapToGrid) {
      newPosition.x = Math.round(newPosition.x / gridSize) * gridSize;
      newPosition.y = Math.round(newPosition.y / gridSize) * gridSize;
    }
    
    updateElementProperty(elementId, 'posicion', newPosition);
  }, [snapToGrid, gridSize, updateElementProperty]);

  const handleElementRotation = useCallback((elementId, newRotation) => {
    updateElementProperty(elementId, 'rotation', newRotation);
    
    // Si es una mesa, rotar también las sillas asociadas
    const element = elements.find(el => el._id === elementId);
    if (element && element.type === 'mesa') {
      const sillasAsociadas = elements.filter(el => el.mesaId === elementId);
      sillasAsociadas.forEach(silla => {
        // Calcular nueva posición de la silla rotada
        const mesaCenter = {
          x: element.posicion.x + (element.width || 120) / 2,
          y: element.posicion.y + (element.height || 80) / 2
        };
        
        const sillaOffset = {
          x: silla.posicion.x - mesaCenter.x,
          y: silla.posicion.y - mesaCenter.y
        };
        
        const angle = (newRotation - (element.rotation || 0)) * Math.PI / 180;
        const newX = mesaCenter.x + sillaOffset.x * Math.cos(angle) - sillaOffset.y * Math.sin(angle);
        const newY = mesaCenter.y + sillaOffset.x * Math.sin(angle) + sillaOffset.y * Math.cos(angle);
        
        updateElementProperty(silla._id, 'posicion', { x: newX, y: newY });
      });
    }
  }, [elements, updateElementProperty]);

  const handleElementResize = useCallback((elementId, newSize) => {
    updateElementSize(elementId, newSize.width, newSize.height);
  }, [updateElementSize]);

  const handleAddMesa = useCallback((type = 'rect', defaultSize = null) => {
    const nuevaMesa = addMesa(type, defaultSize);
    addToHistory(elements, `Agregar mesa ${type}`);
    message.success(`Mesa ${type} agregada`);
  }, [addMesa, elements, addToHistory]);

  const handleAddSillasToMesa = useCallback((mesaId, sillasConfig) => {
    // Implementar lógica para agregar sillas según el tipo de mesa
    const mesa = elements.find(el => el._id === mesaId);
    if (!mesa) return;

    const nuevasSillas = [];
    let sillaId = 1;

    switch (mesa.shape || mesa.type) {
      case 'rect':
        // Sillas en los 4 lados
        const { top, right, bottom, left } = sillasConfig.rect;
        
        // Sillas arriba
        for (let i = 0; i < top; i++) {
          const x = mesa.posicion.x + (mesa.width / top) * i + (mesa.width / top) / 2;
          const y = mesa.posicion.y - 25;
          const isCircle = i % 2 === 0; // Alternar entre círculo y cuadrado
          nuevasSillas.push({
            _id: `silla_${Date.now()}_${sillaId++}`,
            type: 'silla',
            posicion: { x, y },
            shape: isCircle ? 'circle' : 'rect',
            radius: isCircle ? 10 : undefined,
            width: isCircle ? undefined : 20,
            height: isCircle ? undefined : 20,
            fill: seatStates.available.fill,
            stroke: seatStates.available.stroke,
            state: 'available',
            numero: sillaId - 1,
            mesaId: mesaId
          });
        }

        // Sillas derecha
        for (let i = 0; i < right; i++) {
          const x = mesa.posicion.x + mesa.width + 25;
          const y = mesa.posicion.y + (mesa.height / right) * i + (mesa.height / right) / 2;
          const isCircle = i % 2 === 0; // Alternar entre círculo y cuadrado
          nuevasSillas.push({
            _id: `silla_${Date.now()}_${sillaId++}`,
            type: 'silla',
            posicion: { x, y },
            shape: isCircle ? 'circle' : 'rect',
            radius: isCircle ? 10 : undefined,
            width: isCircle ? undefined : 20,
            height: isCircle ? undefined : 20,
            fill: seatStates.available.fill,
            stroke: seatStates.available.stroke,
            state: 'available',
            numero: sillaId - 1,
            mesaId: mesaId
          });
        }

        // Sillas abajo
        for (let i = 0; i < bottom; i++) {
          const x = mesa.posicion.x + (mesa.width / bottom) * i + (mesa.width / bottom) / 2;
          const y = mesa.posicion.y + mesa.height + 25;
          const isCircle = i % 2 === 0; // Alternar entre círculo y cuadrado
          nuevasSillas.push({
            _id: `silla_${Date.now()}_${sillaId++}`,
            type: 'silla',
            posicion: { x, y },
            shape: isCircle ? 'circle' : 'rect',
            radius: isCircle ? 10 : undefined,
            width: isCircle ? undefined : 20,
            height: isCircle ? undefined : 20,
            fill: seatStates.available.fill,
            stroke: seatStates.available.stroke,
            state: 'available',
            numero: sillaId - 1,
            mesaId: mesaId
          });
        }

        // Sillas izquierda
        for (let i = 0; i < left; i++) {
          const x = mesa.posicion.x - 25;
          const y = mesa.posicion.y + (mesa.height / left) * i + (mesa.height / left) / 2;
          const isCircle = i % 2 === 0; // Alternar entre círculo y cuadrado
          nuevasSillas.push({
            _id: `silla_${Date.now()}_${sillaId++}`,
            type: 'silla',
            posicion: { x, y },
            shape: isCircle ? 'circle' : 'rect',
            radius: isCircle ? 10 : undefined,
            width: isCircle ? undefined : 20,
            height: isCircle ? undefined : 20,
            fill: seatStates.available.fill,
            stroke: seatStates.available.stroke,
            state: 'available',
            numero: sillaId - 1,
            mesaId: mesaId
          });
        }
        break;

      case 'circle':
        // Sillas en círculo alrededor de la mesa
        const { cantidad, radio } = sillasConfig.circle;
        const mesaCenterX = mesa.posicion.x + (mesa.radius || 60);
        const mesaCenterY = mesa.posicion.y + (mesa.radius || 60);
        const sillaRadio = radio + 25; // Radio de la mesa + distancia para sillas

        for (let i = 0; i < cantidad; i++) {
          const angle = (i * 2 * Math.PI) / cantidad;
          const x = mesaCenterX + Math.cos(angle) * sillaRadio;
          const y = mesaCenterY + Math.sin(angle) * sillaRadio;
          const isCircle = i % 2 === 0; // Alternar entre círculo y cuadrado
          
          nuevasSillas.push({
            _id: `silla_${Date.now()}_${sillaId++}`,
            type: 'silla',
            posicion: { x, y },
            shape: isCircle ? 'circle' : 'rect',
            radius: isCircle ? 10 : undefined,
            width: isCircle ? undefined : 20,
            height: isCircle ? undefined : 20,
            fill: seatStates.available.fill,
            stroke: seatStates.available.stroke,
            state: 'available',
            numero: sillaId - 1,
            mesaId: mesaId
          });
        }
        break;

      case 'hexagon':
        // Sillas en los 6 lados del hexágono
        const { lados } = sillasConfig.hexagon;
        const hexCenterX = mesa.posicion.x + (mesa.width || 100) / 2;
        const hexCenterY = mesa.posicion.y + (mesa.height || 100) / 2;
        const hexRadio = Math.max(mesa.width || 100, mesa.height || 100) / 2 + 25;

        lados.forEach((cantidad, ladoIndex) => {
          if (cantidad > 0) {
            const baseAngle = (ladoIndex * Math.PI) / 3;
            for (let i = 0; i < cantidad; i++) {
              const angle = baseAngle + (i - (cantidad - 1) / 2) * 0.3;
              const x = hexCenterX + Math.cos(angle) * hexRadio;
              const y = hexCenterY + Math.sin(angle) * hexRadio;
              const isCircle = i % 2 === 0; // Alternar entre círculo y cuadrado
              
              nuevasSillas.push({
                _id: `silla_${Date.now()}_${sillaId++}`,
                type: 'silla',
                posicion: { x, y },
                shape: isCircle ? 'circle' : 'rect',
                radius: isCircle ? 10 : undefined,
                width: isCircle ? undefined : 20,
                height: isCircle ? undefined : 20,
                fill: seatStates.available.fill,
                stroke: seatStates.available.stroke,
                state: 'available',
                numero: sillaId - 1,
                mesaId: mesaId
              });
            }
          }
        });
        break;

      case 'star':
        // Sillas en los 5 puntos de la estrella
        const { puntos } = sillasConfig.star;
        const starCenterX = mesa.posicion.x + (mesa.width || 120) / 2;
        const starCenterY = mesa.posicion.y + (mesa.height || 120) / 2;
        const starRadio = Math.max(mesa.width || 120, mesa.height || 120) / 2 + 25;

        puntos.forEach((cantidad, puntoIndex) => {
          if (cantidad > 0) {
            const baseAngle = (puntoIndex * 2 * Math.PI) / 5;
            for (let i = 0; i < cantidad; i++) {
              const angle = baseAngle + (i - (cantidad - 1) / 2) * 0.2;
              const x = starCenterX + Math.cos(angle) * starRadio;
              const y = starCenterY + Math.sin(angle) * starRadio;
              const isCircle = i % 2 === 0; // Alternar entre círculo y cuadrado
              
              nuevasSillas.push({
                _id: `silla_${Date.now()}_${sillaId++}`,
                type: 'silla',
                posicion: { x, y },
                shape: isCircle ? 'circle' : 'rect',
                radius: isCircle ? 10 : undefined,
                width: isCircle ? undefined : 20,
                height: isCircle ? undefined : 20,
                fill: seatStates.available.fill,
                stroke: seatStates.available.stroke,
                state: 'available',
                numero: sillaId - 1,
                mesaId: mesaId
              });
            }
          }
        });
        break;

      default:
        break;
    }

    // Agregar las nuevas sillas al mapa
    setElements(prev => [...prev, ...nuevasSillas]);
    
    // Actualizar la mesa con la configuración de sillas
    updateElementProperty(mesaId, 'sillasConfig', sillasConfig);
    
    addToHistory([...elements, ...nuevasSillas], `Agregar ${nuevasSillas.length} sillas a mesa ${mesa.shape || mesa.type}`);
    message.success(`${nuevasSillas.length} sillas agregadas a la mesa`);
  }, [elements, seatStates, addToHistory, updateElementProperty]);

  const handleRemoveSillasFromMesa = useCallback((mesaId) => {
    // Remover todas las sillas conectadas a esta mesa
    const sillasARemover = elements.filter(el => el.mesaId === mesaId);
    const elementosRestantes = elements.filter(el => el.mesaId !== mesaId);
    
    setElements(elementosRestantes);
    updateElementProperty(mesaId, 'sillasConfig', null);
    
    addToHistory(elementosRestantes, `Remover ${sillasARemover.length} sillas de la mesa`);
    message.success(`${sillasARemover.length} sillas removidas de la mesa`);
  }, [elements, addToHistory, updateElementProperty]);

  const handleDeleteSelected = useCallback(() => {
    deleteSelectedElements();
    addToHistory(elements, 'Eliminar elementos seleccionados');
    setSelectedIds([]);
    message.success('Elementos eliminados');
  }, [deleteSelectedElements, elements, addToHistory]);

  const handleDuplicateSelected = useCallback(() => {
    const duplicatedElements = [];
    
    selectedIds.forEach(selectedId => {
      const originalElement = elements.find(el => el._id === selectedId);
      if (originalElement) {
        const duplicatedElement = {
          ...originalElement,
          _id: `duplicate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          posicion: {
            x: originalElement.posicion.x + 50,
            y: originalElement.posicion.y + 50
          }
        };
        duplicatedElements.push(duplicatedElement);
      }
    });
    
    if (duplicatedElements.length > 0) {
      setElements(prev => [...prev, ...duplicatedElements]);
      addToHistory([...elements, ...duplicatedElements], `Duplicar ${duplicatedElements.length} elemento(s)`);
      message.success(`${duplicatedElements.length} elemento(s) duplicado(s)`);
    }
  }, [elements, selectedIds, addToHistory]);

  const handleSnapToGrid = useCallback(() => {
    snapToCustomGrid(gridSize);
    addToHistory(elements, `Ajustar a cuadrícula de ${gridSize}px`);
    message.success(`Elementos ajustados a cuadrícula de ${gridSize}px`);
  }, [snapToCustomGrid, gridSize, elements, addToHistory]);

  const handleBackgroundUpload = useCallback(async (file) => {
    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        message.error('Por favor selecciona solo archivos de imagen');
        return false;
      }
      
      // Validar tamaño (10MB máximo para mapas)
      if (file.size > 10 * 1024 * 1024) {
        message.error('La imagen debe pesar 10MB o menos');
        return false;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `mapas/${Date.now()}.${fileExt}`;
      const filePath = `mapas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(filePath);

      setBackgroundImage(publicUrl);
      setBackgroundImageFunction(publicUrl, {
        scale: backgroundScale,
        opacity: backgroundOpacity,
        showInWeb: showBackgroundInWeb
      });
      message.success('Imagen de fondo subida y cargada correctamente');
      return false; // Prevenir upload automático
    } catch (error) {
      console.error('Error uploading background image:', error);
      message.error('Error al subir la imagen de fondo');
      return false;
    }
  }, [backgroundScale, backgroundOpacity, showBackgroundInWeb, setBackgroundImageFunction]);

  const handleSave = useCallback(async () => {
    try {
      // Validar que elements sea un array
      if (!Array.isArray(elements)) {
        console.error('Elements no es un array:', elements);
        throw new Error('Error interno: los elementos del mapa no son válidos');
      }
      
             const mapaToSave = {
         ...mapa,
         contenido: {
           ...mapa.contenido,
           elementos: elements,
           configuracion: {
             gridSize,
             showGrid,
             snapToGrid,
             background: backgroundImage ? {
               image: backgroundImage,
               scale: backgroundScale,
               opacity: backgroundOpacity,
               position: backgroundPosition,
               showInWeb: showBackgroundInWeb
             } : null,
             dimensions: { width: 1200, height: 800 }
           }
         },
         estado: 'active'
       };
      
      console.log('[DEBUG] Mapa a guardar:', mapaToSave);
      console.log('[DEBUG] Contenido elementos:', mapaToSave.contenido.elementos);
      
      if (onSave) {
        await onSave(mapaToSave);
      }
      
      message.success('Mapa guardado exitosamente');
    } catch (error) {
      message.error('Error al guardar el mapa: ' + error.message);
      console.error('Error saving mapa:', error);
    }
  }, [mapa, elements, gridSize, showGrid, snapToGrid, backgroundImage, backgroundScale, backgroundOpacity, showBackgroundInWeb, onSave]);

  // ===== MANEJADOR DE TECLAS =====
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
            if (!e.shiftKey) {
              e.preventDefault();
              undo();
            } else {
              e.preventDefault();
              redo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, undo, redo]);

  // ===== FUNCIONES DE ZOOM Y PAN =====
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
    
    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, [minScale, maxScale]);

  const handleMouseDown = useCallback((e) => {
    if (e.target !== e.target.getStage()) return;
    
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    setPosition({
      x: pointer.x - (position.x - pointer.x),
      y: pointer.y - (position.y - pointer.y),
    });
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (activeMode === 'pan' && e.evt.buttons === 1) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      
      setPosition({
        x: pointer.x - (position.x - pointer.x),
        y: pointer.y - (position.y - pointer.y),
      });
    }
  }, [activeMode, position]);

  const handleDoubleClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      // Doble clic en el stage para centrar la vista
      setPosition({ x: 0, y: 0 });
      setScale(0.8);
    }
  }, []);

  // ===== FUNCIONES DE MENÚ CONTEXTUAL =====
  const handleContextMenu = useCallback((e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    
    setContextMenuPosition({
      x: e.evt.clientX,
      y: e.evt.clientY
    });
    setContextMenuVisible(true);
  }, []);

  const handleContextMenuAction = useCallback((action) => {
    switch (action) {
      case 'pan':
        setActiveMode('pan');
        break;
      case 'select':
        setActiveMode('select');
        break;
      case 'zoom-in':
        zoomIn();
        break;
      case 'zoom-out':
        zoomOut();
        break;
      case 'reset-zoom':
        resetZoom();
        break;
      case 'fit-screen':
        fitToScreen();
        break;
      case 'add-mesa':
        handleAddMesa();
        break;
      case 'add-sillas':
        // TODO: Implementar agregar sillas
        break;
      case 'add-texto':
        // TODO: Implementar agregar texto
        break;
      case 'add-area':
        // TODO: Implementar agregar área
        break;
      case 'edit':
        setShowPropertiesPanel(true);
        break;
      case 'duplicate':
        handleDuplicateSelected();
        break;
      case 'delete':
        handleDeleteSelected();
        break;
      default:
        break;
    }
  }, [zoomIn, zoomOut, resetZoom, fitToScreen, handleAddMesa, handleDuplicateSelected, handleDeleteSelected]);

  // ===== FUNCIONES DE ZONAS =====
  const handleZonasChange = useCallback((newZonas) => {
    setZonas(newZonas);
  }, []);

  const handleAssignZone = useCallback((zonaId, elementIds) => {
    const zona = zonas.find(z => z.id === zonaId);
    if (!zona) return;

    const elementosActualizados = elements.map(el => {
      if (elementIds.includes(el._id)) {
        // Si es una mesa, asignar zona y cambiar color de relleno
        if (el.type === 'mesa') {
          return {
            ...el,
            zona: {
              id: zona.id,
              nombre: zona.nombre,
              color: zona.color
            },
            fill: zona.color // Cambiar el color de relleno de la mesa
          };
        }
        // Si es una silla, asignar zona y cambiar color de relleno
        if (el.type === 'silla') {
          return {
            ...el,
            zona: {
              id: zona.id,
              nombre: zona.nombre,
              color: zona.color
            },
            fill: zona.color // Cambiar el color de relleno de la silla
          };
        }
        // Para otros elementos
        return {
          ...el,
          zona: {
            id: zona.id,
            nombre: zona.nombre,
            color: zona.color
          }
        };
      }
      return el;
    });

    setElements(elementosActualizados);
    
    // Si se asignó zona a una mesa, también asignar a sus sillas asociadas
    elementIds.forEach(elementId => {
      const element = elements.find(el => el._id === elementId);
      if (element && element.type === 'mesa') {
        const sillasAsociadas = elements.filter(el => el.mesaId === elementId);
        if (sillasAsociadas.length > 0) {
          const sillasActualizadas = sillasAsociadas.map(silla => ({
            ...silla,
            zona: {
              id: zona.id,
              nombre: zona.nombre,
              color: zona.color
            },
            fill: zona.color // Cambiar el color de relleno de las sillas
          }));
          
          setElements(prev => prev.map(el => 
            sillasAsociadas.some(s => s._id === el._id) 
              ? sillasActualizadas.find(s => s._id === el._id)
              : el
          ));
        }
      }
    });
  }, [zonas, elements]);

  // ===== FUNCIONES DE FILTROS DE FONDO =====
  const handleBackgroundFiltersChange = useCallback((newFilters) => {
    setBackgroundFilters(newFilters);
  }, []);

  const handleBackgroundFiltersReset = useCallback(() => {
    setBackgroundFilters({});
  }, []);

  // ===== RENDERIZADO DE ELEMENTOS =====
  const renderElement = useCallback((element) => {
    const isSelected = selectedIds.includes(element._id);
    const baseProps = {
      key: element._id,
      id: element._id,
      x: element.posicion.x,
      y: element.posicion.y,
      draggable: activeMode === 'select',
      onClick: () => handleElementClick(element._id),
      onDragEnd: (e) => handleElementDrag(element._id, { x: e.target.x(), y: e.target.y() }),
             onTransformEnd: (e) => {
         const node = e.target;
         handleElementResize(element._id, {
           width: node.width() * node.scaleX(),
           height: node.height() * node.scaleY()
         });
         // Manejar rotación
         if (node.rotation() !== (element.rotation || 0)) {
           handleElementRotation(element._id, node.rotation());
         }
         node.scaleX(1);
         node.scaleY(1);
       },
      onMouseEnter: (e) => {
        // Mostrar tooltip
        const tooltipRect = e.target.parent.findOne('Rect[fill="rgba(0,0,0,0.8)"]');
        const tooltipText = e.target.parent.findOne('KonvaText[fill="white"]');
        if (tooltipRect && tooltipText) {
          tooltipRect.visible(true);
          tooltipText.visible(true);
          e.target.getStage().draw();
        }
      },
      onMouseLeave: (e) => {
        // Ocultar tooltip
        const tooltipRect = e.target.parent.findOne('Rect[fill="rgba(0,0,0,0.8)"]');
        const tooltipText = e.target.parent.findOne('KonvaText[fill="white"]');
        if (tooltipRect && tooltipText) {
          tooltipRect.visible(false);
          tooltipText.visible(false);
          e.target.getStage().draw();
        }
      }
    };

    switch (element.type) {
      case 'mesa':
        const mesaWidth = element.width || 120;
        const mesaHeight = element.height || 80;
        const mesaRadius = element.radius || 60;
        
        return (
          <Group 
            key={element._id} 
            {...baseProps}
            rotation={element.rotation || 0}
          >
            {element.shape === 'circle' ? (
              <Circle
                radius={mesaRadius}
                fill={element.fill || '#f0f0f0'}
                stroke={isSelected ? '#1890ff' : '#d9d9d9'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={element.opacity || 1}
              />
            ) : element.shape === 'hexagon' ? (
              <RegularPolygon
                sides={6}
                radius={Math.max(mesaWidth, mesaHeight) / 2}
                fill={element.fill || '#f0f0f0'}
                stroke={isSelected ? '#1890ff' : '#d9d9d9'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={element.opacity || 1}
              />
            ) : element.shape === 'star' ? (
              <Star
                numPoints={5}
                innerRadius={Math.min(mesaWidth, mesaHeight) / 3}
                outerRadius={Math.max(mesaWidth, mesaHeight) / 2}
                fill={element.fill || '#f0f0f0'}
                stroke={isSelected ? '#1890ff' : '#d9d9d9'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={element.opacity || 1}
              />
            ) : (
              <Rect
                width={mesaWidth}
                height={mesaHeight}
                fill={element.fill || '#f0f0f0'}
                stroke={isSelected ? '#1890ff' : '#d9d9d9'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={element.opacity || 1}
                cornerRadius={element.cornerRadius || 0}
              />
            )}
            
            {/* Nombre de la mesa */}
            <KonvaText
              text={element.nombre || 'Mesa'}
              fontSize={14}
              fill="#333"
              align="center"
              width={mesaWidth}
              y={element.shape === 'circle' ? -mesaRadius - 20 : -mesaHeight / 2 - 20}
            />
            
            {/* Tooltip nativo de Konva */}
            <Rect
              x={-5}
              y={-25}
              width={150}
              height={20}
              fill="rgba(0,0,0,0.8)"
              cornerRadius={4}
              visible={false}
              listening={false}
            />
            <KonvaText
              x={0}
              y={-20}
              text={`Mesa: ${element.nombre || 'Sin nombre'} - ${element.shape || 'rect'}`}
              fontSize={12}
              fill="white"
              align="center"
              width={150}
              visible={false}
              listening={false}
            />
          </Group>
        );

            case 'silla':
        return (
          <Group key={element._id} {...baseProps}>
            {element.shape === 'circle' ? (
              <Circle
                radius={element.radius || 10}
                fill={element.fill || seatStates[element.state || 'available'].fill}
                stroke={isSelected ? '#1890ff' : seatStates[element.state || 'available'].stroke}
                strokeWidth={isSelected ? 3 : 2}
                opacity={element.opacity || 1}
              />
            ) : (
              <Rect
                width={element.width || 20}
                height={element.height || 20}
                fill={element.fill || seatStates[element.state || 'available'].fill}
                stroke={isSelected ? '#1890ff' : seatStates[element.state || 'available'].stroke}
                strokeWidth={isSelected ? 3 : 2}
                opacity={element.opacity || 1}
                cornerRadius={element.cornerRadius || 2}
              />
            )}
            {element.numero && (
              <KonvaText
                text={element.numero.toString()}
                fontSize={10}
                fill="#333"
                align="center"
                width={element.width || 20}
                y={element.height ? element.height / 2 - 5 : 7}
              />
            )}
            {/* Tooltip nativo de Konva */}
            <Rect
              x={-5}
              y={-25}
              width={130}
              height={20}
              fill="rgba(0,0,0,0.8)"
              cornerRadius={4}
              visible={false}
              listening={false}
            />
            <KonvaText
              x={0}
              y={-20}
              text={`Silla ${element.numero || 'N/A'} - ${element.state || 'available'}`}
              fontSize={12}
              fill="white"
              align="center"
              width={130}
              visible={false}
              listening={false}
            />
          </Group>
        );

      case 'conexion':
        const startSeat = elements.find(el => el._id === element.startSeatId);
        const endSeat = elements.find(el => el._id === element.endSeatId);
        if (!startSeat || !endSeat) return null;
        
        return (
          <Line
            key={element._id}
            points={[
              startSeat.posicion.x + (startSeat.width || 20) / 2,
              startSeat.posicion.y + (startSeat.height || 20) / 2,
              endSeat.posicion.x + (endSeat.width || 20) / 2,
              endSeat.posicion.y + (endSeat.height || 20) / 2
            ]}
            stroke={element.stroke || '#8b93a6'}
            strokeWidth={element.strokeWidth || 2}
            opacity={element.opacity || 0.6}
            dash={element.dash || [5, 5]}
          />
        );

      case 'background':
        if (!element.imageUrl) return null;
        return (
          <Image
            key={element._id}
            image={element.imageUrl}
            x={element.position.x}
            y={element.position.y}
            scaleX={element.scale}
            scaleY={element.scale}
            opacity={element.opacity}
            listening={false}
          />
        );

      default:
        return null;
    }
  }, [selectedIds, activeMode, handleElementClick, handleElementDrag, handleElementResize, seatStates, elements]);

  // ===== RENDERIZADO PRINCIPAL =====
  return (
         <div className="h-screen flex flex-col bg-gray-800">


      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="flex-1 flex overflow-hidden">
                 {/* ===== PANEL IZQUIERDO - MENÚ ===== */}
         <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
           {/* Flujo de Creación del Mapa */}
                       <div className="p-3 border-b border-gray-200">
              <Title level={5} className="mb-2">Flujo de Creación del Mapa</Title>
              <Text type="secondary" className="text-xs mb-3 block">
                Sigue estos pasos para crear un mapa completo y profesional
              </Text>
              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-xs ${getProgressText().currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                    getProgressText().currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>1</div>
                  <span>Seleccionar Sala</span>
                  <span className="text-gray-400">Configurar sala base</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${getProgressText().currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                    getProgressText().currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>2</div>
                  <span>Crear Zonas</span>
                  <span className="text-gray-400">Definir áreas del mapa</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${getProgressText().currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                    getProgressText().currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>3</div>
                  <span>Agregar Elementos</span>
                  <span className="text-gray-400">Mesas y sillas</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${getProgressText().currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                    getProgressText().currentStep >= 4 ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>4</div>
                  <span>Configurar Sillas</span>
                  <span className="text-gray-400">Asignar a mesas</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${getProgressText().currentStep >= 5 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                    getProgressText().currentStep >= 5 ? 'bg-green-500' : 'bg-gray-300'
                  }`}>5</div>
                  <span>Finalizar Mapa</span>
                  <span className="text-gray-400">Guardar y activar</span>
                </div>
              </div>
            </div>
            
            {/* Botones de Acción Principal */}
            <div className="p-3 border-b border-gray-200">
              <div className="space-y-2">
                <Button 
                  icon={<SaveOutlined />} 
                  type="primary" 
                  onClick={handleSave}
                  block
                  size="small"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  💾 Guardar Mapa
                </Button>
                <Button 
                  onClick={onCancel}
                  block
                  size="small"
                  className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                >
                  ❌ Cancelar
                </Button>
              </div>
              
                           {/* Botones de Deshacer/Rehacer */}
             <div className="flex gap-1 mt-2">
               <Button
                 onClick={undo}
                 disabled={historyIndex <= 0}
                 icon={<UndoOutlined />}
                 size="small"
                 title="Ctrl+Z"
                 className="flex-1"
               >
                 Deshacer
               </Button>
               <Button
                 onClick={redo}
                 disabled={historyIndex >= history.length - 1}
                 icon={<UndoOutlined style={{ transform: 'scaleX(-1)' }} />}
                 size="small"
                 title="Ctrl+Y"
                 className="flex-1"
               >
                 Rehacer
               </Button>
             </div>
             
             {/* Instrucciones de uso */}
             <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
               <div className="font-medium mb-1">💡 Atajos de teclado:</div>
               <div>• <kbd className="bg-white px-1 rounded">Ctrl+C</kbd> Copiar</div>
               <div>• <kbd className="bg-white px-1 rounded">Ctrl+V</kbd> Pegar</div>
               <div>• <kbd className="bg-white px-1 rounded">Ctrl+Z</kbd> Deshacer</div>
               <div>• <kbd className="bg-white px-1 rounded">Ctrl+Y</kbd> Rehacer</div>
               <div>• <kbd className="bg-white px-1 rounded">Rueda</kbd> Zoom</div>
               <div>• <kbd className="bg-white px-1 rounded">Doble clic</kbd> Centrar vista</div>
             </div>
            </div>
           
                                   {/* Controles de Imagen de Fondo */}
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
            
            <MenuMapa
               selectedElement={elements.find(el => selectedIds.includes(el._id))}
               activeMode={activeMode}
               sectionPoints={sectionPoints}
               isCreatingSection={isCreatingSection}
               zones={zonas}
               selectedZone={selectedZone}
              numSillas={numSillas}
              sillaShape={sillaShape}
              selectedScale={scale}
              showScaleControls={showAdvancedControls}
              scaleSystem={scaleSystem}
              selectedSeatState={selectedSeatState}
              seatStates={seatStates}
              showConnections={showConnections}
              connectionStyle={connectionStyle}
              connectionThreshold={connectionThreshold}
              backgroundImage={backgroundImage}
              backgroundScale={backgroundScale}
              backgroundOpacity={backgroundOpacity}
              showBackgroundInWeb={showBackgroundInWeb}
              updateElementProperty={updateElementProperty}
              updateElementSize={updateElementSize}
              duplicarElementos={handleDuplicateSelected}
              crearSeccion={() => {}} // TODO: Implementar secciones
              limpiarSeleccion={() => setSelectedIds([])}
              assignZoneToSelected={assignZoneToSelected}
              scaleElement={scaleElement}
              scaleSelectedElements={() => {}} // TODO: Implementar
              changeSeatState={changeSeatState}
              changeSelectedSeatsState={() => {}} // TODO: Implementar
              changeMesaSeatsState={() => {}} // TODO: Implementar
              setSelectedSeatState={setSelectedSeatState}
              autoConnectSeats={autoConnectSeats}
              createManualConnection={() => {}} // TODO: Implementar
              removeConnections={() => {}} // TODO: Implementar
              changeConnectionStyle={setConnectionStyle}
              precisePositioning={precisePositioning}
              snapToCustomGrid={handleSnapToGrid}
              setBackgroundImage={setBackgroundImageFunction}
              updateBackground={updateBackground}
              removeBackground={removeBackground}
              addMesa={handleAddMesa}
              addSillasToMesa={handleAddSillasToMesa}
              snapToGrid={handleSnapToGrid}
              setActiveMode={setActiveMode}
              setNumSillas={setNumSillas}
              setSillaShape={setSillaShape}
            />
         </div>

        {/* ===== ÁREA DE TRABAJO CENTRAL ===== */}
        <div className="flex-1 flex flex-col">
                     {/* ===== BARRA DE HERRAMIENTAS DEL MAPA ===== */}
           <div className="bg-white border-b border-gray-200 p-1">
             <Row gutter={8} align="middle">
               <Col>
                 <Space size="small">
                   <MesaTypeMenu 
                     onAddMesa={handleAddMesa}
                   />
                                       <Button 
                      icon={<CopyOutlined />} 
                      onClick={handleCopy}
                      disabled={selectedIds.length === 0}
                      title="Copiar seleccionados (Ctrl+C)"
                      size="small"
                    >
                      Copiar
                    </Button>
                    
                    <Button 
                      icon={<UploadOutlined />} 
                      onClick={handlePaste}
                      disabled={clipboard.length === 0}
                      title="Pegar elementos (Ctrl+V)"
                      size="small"
                    >
                      Pegar
                    </Button>
                    
                    <Button 
                      icon={<CopyOutlined />} 
                      onClick={handleDuplicateSelected}
                      disabled={selectedIds.length === 0}
                      title="Duplicar seleccionados"
                      size="small"
                    >
                      Duplicar
                    </Button>
                   <Button 
                     icon={<DeleteOutlined />} 
                     onClick={handleDeleteSelected}
                     disabled={selectedIds.length === 0}
                     danger
                     title="Eliminar seleccionados"
                     size="small"
                   >
                     Eliminar
                   </Button>
                   <Divider type="vertical" />
                   <Button 
                     icon={<ReloadOutlined />} 
                     onClick={handleSnapToGrid}
                     title="Ajustar a cuadrícula"
                     size="small"
                   >
                     Cuadrícula
                   </Button>
                   <Button 
                     icon={<LinkOutlined />} 
                     onClick={() => autoConnectSeats(selectedIds[0])}
                     disabled={selectedIds.length !== 1 || !elements.find(el => el._id === selectedIds[0])?.type === 'mesa'}
                     title="Conectar asientos automáticamente"
                     size="small"
                   >
                     Conectar
                   </Button>
                                       <Button 
                      icon={<AppstoreOutlined />} 
                      onClick={() => setShowZonaManager(true)}
                      title="Gestionar zonas"
                      size="small"
                    >
                      Zonas
                    </Button>
                    
                    <Divider type="vertical" />
                    
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={() => {
                        setPosition({ x: 0, y: 0 });
                        setScale(0.8);
                      }}
                      title="Centrar vista"
                      size="small"
                    >
                      Centrar
                    </Button>
                    
                    <Button 
                      icon={activeMode === 'pan' ? <EyeOutlined /> : <AimOutlined />}
                      onClick={() => setActiveMode(activeMode === 'pan' ? 'select' : 'pan')}
                      title={activeMode === 'pan' ? 'Modo Selección' : 'Modo Pan'}
                      size="small"
                      type={activeMode === 'pan' ? 'primary' : 'default'}
                    >
                      {activeMode === 'pan' ? 'Selección' : 'Pan'}
                    </Button>
                   
                 </Space>
               </Col>
               
               <Col flex="auto">
                                   <Space className="float-right" size="small">
                    <Text className="text-sm text-gray-600">
                      Modo: {activeMode === 'pan' ? '🖱️ Pan' : '👆 Selección'}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Zoom: {Math.round(scale * 100)}%
                    </Text>
                   <Button 
                     icon={<ZoomOutOutlined />} 
                     size="small"
                     onClick={zoomOut}
                     title="Zoom out"
                   />
                   <Button 
                     icon={<ZoomInOutlined />} 
                     size="small"
                     onClick={zoomIn}
                     title="Zoom in"
                   />
                   <Button 
                     icon={<ReloadOutlined />} 
                     size="small"
                     onClick={resetZoom}
                     title="Reset zoom"
                   />
                 </Space>
               </Col>
             </Row>
           </div>

                     {/* ===== CANVAS DEL MAPA ===== */}
           <div className="flex-1 canvas-container" ref={containerRef}>
             <Stage
               ref={stageRef}
               width={Math.max(2000, containerRef.current?.clientWidth || 2000)}
               height={Math.max(1400, containerRef.current?.clientHeight || 1400)}
               scaleX={scale}
               scaleY={scale}
               x={position.x}
               y={position.y}
                               onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onClick={handleStageClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                draggable={activeMode === 'pan'}
             >
               <Layer>
                 {/* Fondo */}
                 <Rect
                   width={2000}
                   height={1400}
                   fill="#ffffff"
                 />
                 
                 {/* Cuadrícula */}
                 {showGrid && (
                   <Grid 
                     width={2000} 
                     height={1400} 
                     gridSize={gridSize}
                   />
                 )}
                 
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
                 
                 {/* Elementos del mapa */}
                 {elements.map(renderElement)}
               </Layer>
             </Stage>
           </div>
        </div>

        {/* ===== PANEL DERECHO - PROPIEDADES ===== */}
        {showPropertiesPanel && selectedIds.length > 0 && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <Title level={5}>Propiedades</Title>
                             {selectedIds.length === 1 ? (
                 <ElementProperties
                   element={elements.find(el => el._id === selectedIds[0])}
                   onUpdate={(updates) => {
                     Object.entries(updates).forEach(([key, value]) => {
                       updateElementProperty(selectedIds[0], key, value);
                     });
                   }}
                   onAddSillas={handleAddSillasToMesa}
                   onRemoveSillas={handleRemoveSillasFromMesa}
                   onDuplicate={() => {
                     const element = elements.find(el => el._id === selectedIds[0]);
                     if (element) {
                       const duplicatedElement = {
                         ...element,
                         _id: `duplicate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                         posicion: {
                           x: element.posicion.x + 50,
                           y: element.posicion.y + 50
                         }
                       };
                       setElements(prev => [...prev, duplicatedElement]);
                       addToHistory([...elements, duplicatedElement], `Duplicar ${element.type}`);
                       message.success('Elemento duplicado');
                     }
                   }}
                   onDelete={() => {
                     const element = elements.find(el => el._id === selectedIds[0]);
                     if (element) {
                       const newElements = elements.filter(el => el._id !== selectedIds[0]);
                       setElements(newElements);
                       addToHistory(newElements, `Eliminar ${element.type}`);
                       setSelectedIds([]);
                       message.success('Elemento eliminado');
                     }
                   }}
                 />
               ) : (
                <div className="text-gray-600">
                  {selectedIds.length} elementos seleccionados
                </div>
              )}
            </div>
          </div>
        )}
      </div>

             {/* ===== MODALES Y POPUPS ===== */}
       <Modal
         title="Configuración Avanzada"
         open={showAdvancedControls}
         onCancel={() => setShowAdvancedControls(false)}
         footer={null}
         width={800}
       >
         <AdvancedConfiguration
           gridSize={gridSize}
           setGridSize={setGridSize}
           showGrid={showGrid}
           setShowGrid={setShowGrid}
           snapToGrid={snapToGrid}
           setSnapToGrid={setSnapToGrid}
           backgroundImage={backgroundImage}
           backgroundScale={backgroundScale}
           backgroundOpacity={backgroundOpacity}
           showBackgroundInWeb={showBackgroundInWeb}
           onBackgroundUpload={handleBackgroundUpload}
           onBackgroundUpdate={(updates) => updateBackground(updates)}
           onBackgroundRemove={removeBackground}
         />
       </Modal>

               {/* ===== GESTOR DE ZONAS ===== */}
        <Modal
          title="Gestión de Zonas"
          open={showZonaManager}
          onCancel={() => setShowZonaManager(false)}
          footer={null}
          width={800}
        >
          <ZonaManager
            zonas={zonas}
            onZonasChange={handleZonasChange}
            selectedElements={selectedIds}
            onAssignZone={handleAssignZone}
            salaId={salaId}
          />
        </Modal>

       {/* ===== FILTROS DE IMAGEN DE FONDO ===== */}
       <BackgroundFilterMenu
         backgroundImage={backgroundImage}
         filters={backgroundFilters}
         onFiltersChange={handleBackgroundFiltersChange}
         onResetFilters={handleBackgroundFiltersReset}
         visible={showBackgroundFilters}
         onClose={() => setShowBackgroundFilters(false)}
       />

       {/* ===== MENÚ CONTEXTUAL ===== */}
       <ContextMenu
         visible={contextMenuVisible}
         position={contextMenuPosition}
         onClose={() => setContextMenuVisible(false)}
         onAction={handleContextMenuAction}
         selectedElements={selectedIds}
         canPan={true}
         canZoom={true}
         canEdit={true}
       />

       

      {/* ===== POPUPS DE EDICIÓN ===== */}
      {selectedIds.length === 1 && (
        <>
          <EditPopup
            element={elements.find(el => el._id === selectedIds[0])}
            onUpdate={(updates) => {
              Object.entries(updates).forEach(([key, value]) => {
                updateElementProperty(selectedIds[0], key, value);
              });
            }}
            onClose={() => setSelectedIds([])}
          />
          <AdvancedEditPopup
            element={elements.find(el => el._id === selectedIds[0])}
            onUpdate={(updates) => {
              Object.entries(updates).forEach(([key, value]) => {
                updateElementProperty(selectedIds[0], key, value);
              });
            }}
            onClose={() => setSelectedIds([])}
          />
        </>
      )}
    </div>
  );
};

// ===== COMPONENTES AUXILIARES =====

const ElementProperties = ({ element, onUpdate, onAddSillas, onRemoveSillas, onDuplicate, onDelete }) => {
  if (!element) return null;

  switch (element.type) {
    case 'mesa':
      return (
        <PropiedadesMesa 
          mesa={element} 
          onUpdate={onUpdate}
          onAddSillas={onAddSillas}
          onRemoveSillas={onRemoveSillas}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      );
    case 'silla':
      return <PropiedadesSilla silla={element} onUpdate={onUpdate} />;
    default:
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <Input
              value={element.nombre || ''}
              onChange={(e) => onUpdate({ nombre: e.target.value })}
              placeholder="Nombre del elemento"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Posición X
            </label>
            <InputNumber
              value={element.posicion?.x || 0}
              onChange={(value) => onUpdate({ posicion: { ...element.posicion, x: value } })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Posición Y
            </label>
            <InputNumber
              value={element.posicion?.y || 0}
              onChange={(value) => onUpdate({ posicion: { ...element.posicion, y: value } })}
              className="w-full"
            />
          </div>
        </div>
      );
  }
};

const AdvancedConfiguration = ({
  gridSize,
  setGridSize,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  backgroundImage,
  backgroundScale,
  backgroundOpacity,
  showBackgroundInWeb,
  onBackgroundUpload,
  onBackgroundUpdate,
  onBackgroundRemove
}) => {
  return (
    <div className="space-y-6">
      {/* Configuración de Cuadrícula */}
      <div>
        <Title level={5}>Cuadrícula</Title>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamaño de cuadrícula: {gridSize}px
            </label>
            <Slider
              min={5}
              max={100}
              step={5}
              value={gridSize}
              onChange={setGridSize}
            />
          </div>
          <div className="flex items-center space-x-4">
            <Switch
              checked={showGrid}
              onChange={setShowGrid}
            />
            <span>Mostrar cuadrícula</span>
          </div>
          <div className="flex items-center space-x-4">
            <Switch
              checked={snapToGrid}
              onChange={setSnapToGrid}
            />
            <span>Ajustar a cuadrícula</span>
          </div>
        </div>
      </div>

      {/* Configuración de Fondo */}
      <div>
        <Title level={5}>Imagen de Fondo</Title>
        <div className="space-y-4">
          <BackgroundImageManager
            onImageSelect={(imageUrl) => {
              onBackgroundUpload({ name: 'background.jpg', type: 'image/jpeg' });
              // Simular el archivo para mantener compatibilidad
              const fakeFile = new File([''], 'background.jpg', { type: 'image/jpeg' });
              fakeFile.url = imageUrl;
              onBackgroundUpload(fakeFile);
            }}
            currentImage={backgroundImage}
            onImageRemove={onBackgroundRemove}
            title=""
            description=""
          />
          
          {backgroundImage && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escala: {Math.round(backgroundScale * 100)}%
                </label>
                <Slider
                  min={10}
                  max={200}
                  step={10}
                  value={backgroundScale * 100}
                  onChange={(value) => onBackgroundUpdate({ scale: value / 100 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacidad: {Math.round(backgroundOpacity * 100)}%
                </label>
                <Slider
                  min={10}
                  max={100}
                  step={10}
                  value={backgroundOpacity * 100}
                  onChange={(value) => onBackgroundUpdate({ opacity: value / 100 })}
                />
              </div>
              <div className="flex items-center space-x-4">
                <Switch
                  checked={showBackgroundInWeb}
                  onChange={(checked) => onBackgroundUpdate({ showInWeb: checked })}
                />
                <span>Mostrar en web</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrearMapaEditor;
