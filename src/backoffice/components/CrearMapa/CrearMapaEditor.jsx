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
  QuestionCircleOutlined,
  AimOutlined,
  RobotOutlined,
  BugOutlined,
  BulbOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useMapaElements } from '../../hooks/useMapaElements';
import { useMapaState } from '../../hooks/useMapaState';
import { useMapaSelection } from '../../hooks/useMapaSelection';
import { useMapaZoomStage } from '../../hooks/useMapaZoomStage';
import { useMapaGraphicalElements } from '../../hooks/useMapaGraphicalElements';
import { useMapaLoadingSaving } from '../../hooks/usemapaloadingsaving';
import { useMapaZones } from '../../hooks/usemapazones';
import { supabase } from '../../services/supabaseClient';
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
        snapToGrid: false,
        backgroundImage: null,
        backgroundScale: 1,
        backgroundOpacity: 1,
        showBackgroundInWeb: true
      }
    },
    estado: 'borrador'
  });

  // ===== ESTADOS DE IA LOCAL =====
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiMode, setAiMode] = useState('assist'); // 'assist', 'create', 'optimize'
  const [aiIssues, setAiIssues] = useState([]);
  const [aiStats, setAiStats] = useState({
    totalElements: 0,
    mesas: 0,
    sillas: 0,
    zonas: 0,
    spaceUsage: 0
  });

  // ===== ESTADOS DE COLABORACIÓN EN TIEMPO REAL =====
  const [collaborators, setCollaborators] = useState([]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [userName, setUserName] = useState(`Usuario_${Math.random().toString(36).substr(2, 5)}`);
  const [userColor, setUserColor] = useState(`hsl(${Math.random() * 360}, 70%, 60%)`);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [otherUsersCursors, setOtherUsersCursors] = useState({});

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
  // Se define al final del componente
  
  // ===== TEXTO DE PROGRESO =====
  // Se define al final del componente
  
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

  // ===== FUNCIONES CRÍTICAS (definidas antes de useEffect) =====
  
  // Función para agregar al historial
  const addToHistory = useCallback((newElements, action) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ elements: newElements, action, timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Función para actualizar estadísticas de IA
  const updateAiStats = useCallback(() => {
    const mesas = elements.filter(el => el.type === 'mesa');
    const sillas = elements.filter(el => el.type === 'silla');
    const zonas = elements.filter(el => el.zona);
    
    const totalArea = 2000 * 1400;
    const elementosArea = elements.reduce((sum, el) => {
      if (el.width && el.height) {
        return sum + (el.width * el.height);
      }
      return sum + 400;
    }, 0);
    
    setAiStats({
      totalElements: elements.length,
      mesas: mesas.length,
      sillas: sillas.length,
      zonas: zonas.length,
      spaceUsage: (elementosArea / totalArea) * 100
    });
  }, [elements]);

  // Función para calcular progreso
  const calculateProgress = useCallback(() => {
    const steps = [
      !!salaId,
      zonas.length > 0,
      elements.filter(el => el.type === 'mesa').length > 0,
      elements.filter(el => el.type === 'silla').length > 0,
      elements.length > 0
    ];
    return steps.filter(Boolean).length;
  }, [salaId, zonas, elements]);

  // Función para obtener texto de progreso
  const getProgressText = useCallback(() => {
    const currentStep = calculateProgress();
    const totalSteps = 5;
    const percentage = (currentStep / totalSteps) * 100;
    
    let status = 'Pendiente';
    if (percentage >= 100) status = 'Completado';
    else if (percentage >= 80) status = 'Casi listo';
    else if (percentage >= 60) status = 'En progreso';
    else if (percentage >= 40) status = 'Iniciado';
    else if (percentage >= 20) status = 'Planificando';
    
    return { currentStep, totalSteps, percentage, status };
  }, [calculateProgress]);

  // ===== EFECTOS =====
  useEffect(() => {
    if (initialMapa?.contenido?.elementos) {
      setElements(initialMapa.contenido.elementos);
      // Guardar en historial después de que se definan las funciones
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

  // Comentado temporalmente para evitar TDZ
  // useEffect(() => {
  //   // Actualizar progreso cuando cambien los elementos
  //   calculateProgress();
  // }, [calculateProgress, elements, zonas, mapa?.estado]);

  // Comentado temporalmente para evitar TDZ
  // useEffect(() => {
  //   updateAiStats();
  // }, [elements, updateAiStats]);

  // ===== FUNCIONES DE COLABORACIÓN EN TIEMPO REAL =====
  
  // Inicializar Supabase Realtime
  const initializeSupabaseRealtime = useCallback(async () => {
    try {
      if (!salaId) return;
      
      // Crear canal único para esta sala
      const channel = supabase.channel(`mapa_${salaId}`)
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const users = Object.values(presenceState).flat();
          setCollaborators(users);
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('Usuario conectado:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('Usuario desconectado:', leftPresences);
        })
        .on('broadcast', { event: 'element_updated' }, (payload) => {
          handleElementUpdated(payload.payload);
        })
        .on('broadcast', { event: 'cursor_moved' }, (payload) => {
          handleCursorMoved(payload.payload);
        })
        .on('broadcast', { event: 'chat_message' }, (payload) => {
          handleChatMessage(payload.payload);
        })
        .on('broadcast', { event: 'element_created' }, (payload) => {
          handleElementCreated(payload.payload);
        })
        .on('broadcast', { event: 'element_deleted' }, (payload) => {
          handleElementDeleted(payload.payload);
        })
        .on('broadcast', { event: 'zone_assigned' }, (payload) => {
          handleZoneAssigned(payload.payload);
        });

      // Suscribirse al canal
      const status = await channel.subscribe(async (status) => {
        setConnectionStatus(status);
        if (status === 'SUBSCRIBED') {
          // Unirse a la presencia
          await channel.track({
            user_id: userName,
            user_name: userName,
            user_color: userColor,
            online_at: new Date().toISOString()
          });
        }
      });

      setRealtimeChannel(channel);
      setConnectionStatus(status);
      
    } catch (error) {
      console.error('Error inicializando Supabase Realtime:', error);
      message.error('Error al conectar con la colaboración en tiempo real');
    }
  }, [salaId, userName, userColor]);

  // Manejadores de eventos de colaboración
  const handleElementUpdated = useCallback((payload) => {
    if (payload.user_id === userName) return; // Ignorar cambios propios
    
    const { elementId, property, value } = payload;
    updateElementProperty(elementId, property, value);
    
    // Agregar mensaje al chat
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: payload.user_name,
      message: `Actualizó ${property} de ${payload.element_name || 'elemento'}`,
      timestamp: new Date().toISOString(),
      type: 'action'
    }]);
  }, [userName, updateElementProperty]);

  const handleCursorMoved = useCallback((payload) => {
    if (payload.user_id === userName) return;
    
    setOtherUsersCursors(prev => ({
      ...prev,
      [payload.user_id]: {
        x: payload.x,
        y: payload.y,
        user_name: payload.user_name,
        user_color: payload.user_color
      }
    }));
  }, [userName]);

  const handleChatMessage = useCallback((payload) => {
    if (payload.user_id === userName) return;
    
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: payload.user_name,
      message: payload.message,
      timestamp: payload.timestamp,
      type: 'chat'
    }]);
  }, [userName]);

  const handleElementCreated = useCallback((payload) => {
    if (payload.user_id === userName) return;
    
    setElements(prev => [...prev, payload.element]);
    
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: payload.user_name,
      message: `Creó ${payload.element.type} "${payload.element.nombre || 'sin nombre'}"`,
      timestamp: new Date().toISOString(),
      type: 'action'
    }]);
  }, [userName]);

  const handleElementDeleted = useCallback((payload) => {
    if (payload.user_id === userName) return;
    
    setElements(prev => prev.filter(el => el._id !== payload.elementId));
    
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: payload.user_name,
      message: `Eliminó ${payload.element_type}`,
      timestamp: new Date().toISOString(),
      type: 'action'
    }]);
  }, [userName]);

  const handleZoneAssigned = useCallback((payload) => {
    if (payload.user_id === userName) return;
    
    const { elementIds, zona } = payload;
    elementIds.forEach(elementId => {
      updateElementProperty(elementId, 'zona', zona);
      updateElementProperty(elementId, 'fill', zona.color);
    });
    
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      user: payload.user_name,
      message: `Asignó zona "${zona.nombre}" a ${elementIds.length} elementos`,
      timestamp: new Date().toISOString(),
      type: 'action'
    }]);
  }, [userName, updateElementProperty]);

  // Funciones para enviar cambios
  const sendElementChange = useCallback((elementId, property, value, elementName) => {
    if (!realtimeChannel || !isCollaborating) return;
    
    realtimeChannel.send({
      type: 'broadcast',
      event: 'element_updated',
      payload: {
        elementId,
        property,
        value,
        element_name: elementName,
        user_id: userName,
        user_name: userName,
        timestamp: new Date().toISOString()
      }
    });
  }, [realtimeChannel, isCollaborating, userName]);

  const sendCursorMove = useCallback((x, y) => {
    if (!realtimeChannel || !isCollaborating) return;
    
    realtimeChannel.send({
      type: 'broadcast',
      event: 'cursor_moved',
      payload: {
        x,
        y,
        user_id: userName,
        user_name: userName,
        user_color: userColor,
        timestamp: new Date().toISOString()
      }
    });
  }, [realtimeChannel, isCollaborating, userName, userColor]);

  const sendChatMessage = useCallback((message) => {
    if (!realtimeChannel || !isCollaborating) return;
    
    const chatMessage = {
      id: Date.now(),
      user: userName,
      message,
      timestamp: new Date().toISOString(),
      type: 'chat'
    };
    
    setChatMessages(prev => [...prev, chatMessage]);
    
    realtimeChannel.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: {
        ...chatMessage,
        user_id: userName
      }
    });
  }, [realtimeChannel, isCollaborating, userName]);

  const sendElementCreated = useCallback((element) => {
    if (!realtimeChannel || !isCollaborating) return;
    
    realtimeChannel.send({
      type: 'broadcast',
      event: 'element_created',
      payload: {
        element,
        user_id: userName,
        user_name: userName,
        timestamp: new Date().toISOString()
      }
    });
  }, [realtimeChannel, isCollaborating, userName]);

  const sendElementDeleted = useCallback((elementId, elementType) => {
    if (!realtimeChannel || !isCollaborating) return;
    
    realtimeChannel.send({
      type: 'broadcast',
      event: 'element_deleted',
      payload: {
        elementId,
        element_type: elementType,
        user_id: userName,
        user_name: userName,
        timestamp: new Date().toISOString()
      }
    });
  }, [realtimeChannel, isCollaborating, userName]);

  const sendZoneAssigned = useCallback((elementIds, zona) => {
    if (!realtimeChannel || !isCollaborating) return;
    
    realtimeChannel.send({
      type: 'broadcast',
      event: 'zone_assigned',
      payload: {
        elementIds,
        zona,
        user_id: userName,
        user_name: userName,
        timestamp: new Date().toISOString()
      }
    });
  }, [realtimeChannel, isCollaborating, userName]);

  // Conectar/Desconectar colaboración
  const toggleCollaboration = useCallback(async () => {
    if (isCollaborating) {
      // Desconectar
      if (realtimeChannel) {
        await realtimeChannel.unsubscribe();
        setRealtimeChannel(null);
      }
      setIsCollaborating(false);
      setConnectionStatus('disconnected');
      setCollaborators([]);
      setOtherUsersCursors({});
      message.success('Colaboración desactivada');
    } else {
      // Conectar
      setIsCollaborating(true);
      await initializeSupabaseRealtime();
      message.success('Colaboración activada');
    }
  }, [isCollaborating, realtimeChannel, initializeSupabaseRealtime]);

  // Inicializar colaboración cuando se monte el componente
  useEffect(() => {
    if (salaId) {
      initializeSupabaseRealtime();
    }
    
    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
    };
  }, [salaId, initializeSupabaseRealtime]);

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
  // Definida arriba; mover la implementación única aquí

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
    
    // Enviar cambio a colaboradores
    const element = elements.find(el => el._id === elementId);
    sendElementChange(elementId, 'posicion', newPosition, element?.nombre);
  }, [snapToGrid, gridSize, updateElementProperty, elements, sendElementChange]);

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
    
    // Enviar a colaboradores
    if (nuevaMesa) {
      sendElementCreated(nuevaMesa);
    }
    
    message.success(`Mesa ${type} agregada`);
  }, [addMesa, elements, addToHistory, sendElementCreated]);

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
    // Enviar a colaboradores antes de eliminar
    selectedIds.forEach(elementId => {
      const element = elements.find(el => el._id === elementId);
      if (element) {
        sendElementDeleted(elementId, element.type);
      }
    });
    
    deleteSelectedElements();
    addToHistory(elements, 'Eliminar elementos seleccionados');
    setSelectedIds([]);
    message.success('Elementos eliminados');
  }, [deleteSelectedElements, elements, addToHistory, selectedIds, sendElementDeleted]);

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
    
    // Enviar posición del cursor a colaboradores
    if (isCollaborating && e.target.getStage()) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      if (pointer) {
        sendCursorMove(pointer.x, pointer.y);
      }
    }
  }, [activeMode, position, isCollaborating, sendCursorMove]);

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

  // ===== FUNCIONES DE IA LOCAL =====
  
  // Función auxiliar para calcular distancia entre dos puntos
  const calculateDistance = useCallback((pos1, pos2) => {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
  }, []);

  // Función auxiliar para calcular posición óptima de silla
  const calculateChairPosition = useCallback((silla, mesa, index, totalSillas) => {
    const angle = (index * 360 / totalSillas) * (Math.PI / 180);
    const radius = Math.max(mesa.width, mesa.height) / 2 + 30;
    
    return {
      x: mesa.posicion.x + (mesa.width / 2) + (radius * Math.cos(angle)),
      y: mesa.posicion.y + (mesa.height / 2) + (radius * Math.sin(angle))
    };
  }, []);

  // Auto-organización inteligente de elementos
  const autoOrganizeElements = useCallback(() => {
    setIsAiProcessing(true);
    
    try {
      const mesas = elements.filter(el => el.type === 'mesa');
      const sillas = elements.filter(el => el.type === 'silla');
      
      if (mesas.length === 0) {
        message.warning('No hay mesas para organizar');
        return;
      }

      // Calcula distribución óptima
      const canvasWidth = 2000;
      const canvasHeight = 1400;
      const margin = 100;
      const spacing = 300;
      
      mesas.forEach((mesa, index) => {
        const row = Math.floor(index / 4); // 4 mesas por fila
        const col = index % 4;
        
        const newX = margin + (col * spacing);
        const newY = margin + (row * spacing);
        
        // Actualiza posición de la mesa
        updateElementProperty(mesa._id, 'posicion', { x: newX, y: newY });
        
        // Reposiciona sillas asociadas
        const sillasMesa = sillas.filter(s => s.mesaId === mesa._id);
        sillasMesa.forEach((silla, sillaIndex) => {
          const sillaPos = calculateChairPosition(silla, { ...mesa, posicion: { x: newX, y: newY } }, sillaIndex, sillasMesa.length);
          updateElementProperty(silla._id, 'posicion', sillaPos);
        });
      });
      
      message.success(`Organización automática completada: ${mesas.length} mesas reorganizadas`);
      
    } catch (error) {
      console.error('Error en auto-organización:', error);
      message.error('Error en la organización automática');
    } finally {
      setIsAiProcessing(false);
    }
  }, [elements, updateElementProperty, calculateChairPosition]);

  // Detección automática de problemas
  const detectIssues = useCallback(() => {
    setIsAiProcessing(true);
    
    try {
      const issues = [];
      const mesas = elements.filter(el => el.type === 'mesa');
      const sillas = elements.filter(el => el.type === 'silla');
      
      // Problema 1: Mesas muy cercanas
      mesas.forEach((mesa1, i) => {
        mesas.slice(i + 1).forEach(mesa2 => {
          const distance = calculateDistance(mesa1.posicion, mesa2.posicion);
          if (distance < 150) {
            issues.push({
              type: 'spacing',
              severity: 'warning',
              message: `Mesa ${mesa1.nombre || mesa1._id} y ${mesa2.nombre || mesa2._id} están muy cercanas (${Math.round(distance)}px)`,
              elements: [mesa1._id, mesa2._id]
            });
          }
        });
      });
      
      // Problema 2: Sillas sin asignar
      const sillasSinAsignar = sillas.filter(silla => !silla.mesaId);
      if (sillasSinAsignar.length > 0) {
        issues.push({
          type: 'unassigned',
          severity: 'error',
          message: `${sillasSinAsignar.length} sillas no están asignadas a mesas`,
          elements: sillasSinAsignar.map(s => s._id)
        });
      }
      
      // Problema 3: Elementos fuera de límites
      const elementosFuera = elements.filter(el => 
        el.posicion.x < 0 || el.posicion.y < 0 || 
        el.posicion.x > 1900 || el.posicion.y > 1300
      );
      
      if (elementosFuera.length > 0) {
        issues.push({
          type: 'bounds',
          severity: 'warning',
          message: `${elementosFuera.length} elementos están fuera de los límites del canvas`,
          elements: elementosFuera.map(el => el._id)
        });
      }
      
      setAiIssues(issues);
      
      if (issues.length === 0) {
        message.success('✅ No se detectaron problemas en el mapa');
      } else {
        message.warning(`⚠️ Se detectaron ${issues.length} problemas`);
      }
      
    } catch (error) {
      console.error('Error en detección de problemas:', error);
      message.error('Error en la detección automática');
    } finally {
      setIsAiProcessing(false);
    }
  }, [elements, calculateDistance]);

  // Generación de sugerencias inteligentes
  const generateDesignSuggestions = useCallback(() => {
    setIsAiProcessing(true);
    
    try {
      const suggestions = [];
      const mesas = elements.filter(el => el.type === 'mesa');
      const sillas = elements.filter(el => el.type === 'silla');
      const zonas = elements.filter(el => el.zona);
      
      // Sugerencia 1: Agrupar por zonas
      if (zonas.length < 3 && mesas.length > 5) {
        suggestions.push({
          type: 'zones',
          priority: 'high',
          message: 'Considera crear más zonas para mejor organización del evento',
          action: 'createZones'
        });
      }
      
      // Sugerencia 2: Balance de sillas
      if (mesas.length > 0) {
        const mesasConSillas = mesas.map(mesa => ({
          mesa,
          sillas: sillas.filter(s => s.mesaId === mesa._id).length
        }));
        
        const promedioSillas = mesasConSillas.reduce((sum, item) => sum + item.sillas, 0) / mesasConSillas.length;
        
        if (promedioSillas < 4) {
          suggestions.push({
            type: 'seating',
            priority: 'medium',
            message: `El promedio de sillas por mesa es ${promedioSillas.toFixed(1)}. Considera agregar más sillas para mejor aprovechamiento.`,
            action: 'addSeats'
          });
        }
      }
      
      // Sugerencia 3: Uso del espacio
      const totalArea = 2000 * 1400;
      const elementosArea = elements.reduce((sum, el) => {
        if (el.width && el.height) {
          return sum + (el.width * el.height);
        }
        return sum + 400; // Área estimada para sillas
      }, 0);
      
      const spaceUsage = (elementosArea / totalArea) * 100;
      
      if (spaceUsage < 20) {
        suggestions.push({
          type: 'space',
          priority: 'low',
          message: `El uso del espacio es solo ${spaceUsage.toFixed(1)}%. Considera agregar más elementos o reorganizar.`,
          action: 'optimizeSpace'
        });
      }
      
      setAiSuggestions(suggestions);
      
      if (suggestions.length === 0) {
        message.success('✅ Tu mapa está bien optimizado');
      } else {
        message.info(`💡 ${suggestions.length} sugerencias generadas`);
      }
      
    } catch (error) {
      console.error('Error en generación de sugerencias:', error);
      message.error('Error en la generación de sugerencias');
    } finally {
      setIsAiProcessing(false);
    }
  }, [elements]);

  // Creación automática de mesas óptimas
  const createOptimalTables = useCallback((numTables, seatsPerTable = 4) => {
    setIsAiProcessing(true);
    
    try {
      const newElements = [];
      const canvasWidth = 2000;
      const canvasHeight = 1400;
      
      // Calcula distribución óptima
      const cols = Math.ceil(Math.sqrt(numTables));
      const rows = Math.ceil(numTables / cols);
      
      const tableWidth = 120;
      const tableHeight = 80;
      const spacing = 250;
      
      for (let i = 0; i < numTables; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        // Posición calculada
        const x = 100 + (col * spacing);
        const y = 100 + (row * spacing);
        
        // Crea mesa
        const mesa = {
          _id: `mesa_ai_${Date.now()}_${i}`,
          type: 'mesa',
          nombre: `Mesa ${i + 1}`,
          posicion: { x, y },
          width: tableWidth,
          height: tableHeight,
          fill: '#4CAF50',
          stroke: '#2E7D32',
          strokeWidth: 2
        };
        
        newElements.push(mesa);
        
        // Crea sillas alrededor
        for (let j = 0; j < seatsPerTable; j++) {
          const angle = (j * 360 / seatsPerTable) * (Math.PI / 180);
          const radius = 60;
          
          const sillaX = x + (tableWidth / 2) + (radius * Math.cos(angle));
          const sillaY = y + (tableHeight / 2) + (radius * Math.sin(angle));
          
          const silla = {
            _id: `silla_ai_${Date.now()}_${i}_${j}`,
            type: 'silla',
            nombre: `Silla ${j + 1}`,
            posicion: { x: sillaX, y: sillaY },
            mesaId: mesa._id,
            width: 20,
            height: 20,
            fill: '#2196F3',
            stroke: '#1976D2',
            strokeWidth: 1,
            state: 'available'
          };
          
          newElements.push(silla);
        }
      }
      
      // Agrega elementos al mapa
      setElements(prev => [...prev, ...newElements]);
      
      message.success(`✅ ${numTables} mesas creadas automáticamente con ${seatsPerTable} sillas cada una`);
      
    } catch (error) {
      console.error('Error en creación automática:', error);
      message.error('Error en la creación automática');
    } finally {
      setIsAiProcessing(false);
    }
  }, []);

  // Creación de layouts predefinidos
  const createRestaurantLayout = useCallback((layoutType) => {
    setIsAiProcessing(true);
    
    try {
      let config;
      
      switch (layoutType) {
        case 'intimate':
          config = {
            numTables: 8,
            seatsPerTable: 2,
            colors: { table: '#FF6B9D', chair: '#FF8EAB' },
            spacing: 200,
            message: 'Layout íntimo para eventos románticos'
          };
          break;
        case 'family':
          config = {
            numTables: 6,
            seatsPerTable: 6,
            colors: { table: '#4ECDC4', chair: '#45B7AA' },
            spacing: 300,
            message: 'Layout familiar para eventos con niños'
          };
          break;
        case 'elegant':
          config = {
            numTables: 10,
            seatsPerTable: 4,
            colors: { table: '#9B59B6', chair: '#8E44AD' },
            spacing: 280,
            message: 'Layout elegante para eventos formales'
          };
          break;
        case 'fast':
          config = {
            numTables: 12,
            seatsPerTable: 4,
            colors: { table: '#F39C12', chair: '#E67E22' },
            spacing: 220,
            message: 'Layout rápido para eventos dinámicos'
          };
          break;
        default:
          config = {
            numTables: 8,
            seatsPerTable: 4,
            colors: { table: '#95A5A6', chair: '#7F8C8D' },
            spacing: 250,
            message: 'Layout estándar'
          };
      }
      
      // Limpia elementos existentes
      setElements([]);
      
      // Crea nuevo layout
      const newElements = [];
      const cols = Math.ceil(Math.sqrt(config.numTables));
      const rows = Math.ceil(config.numTables / cols);
      
      for (let i = 0; i < config.numTables; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = 100 + (col * config.spacing);
        const y = 100 + (row * config.spacing);
        
        // Mesa
        const mesa = {
          _id: `mesa_${layoutType}_${Date.now()}_${i}`,
          type: 'mesa',
          nombre: `${layoutType.charAt(0).toUpperCase() + layoutType.slice(1)} ${i + 1}`,
          posicion: { x, y },
          width: 120,
          height: 80,
          fill: config.colors.table,
          stroke: '#2C3E50',
          strokeWidth: 2
        };
        
        newElements.push(mesa);
        
        // Sillas
        for (let j = 0; j < config.seatsPerTable; j++) {
          const angle = (j * 360 / config.seatsPerTable) * (Math.PI / 180);
          const radius = 60;
          
          const sillaX = x + 60 + (radius * Math.cos(angle));
          const sillaY = y + 40 + (radius * Math.sin(angle));
          
          const silla = {
            _id: `silla_${layoutType}_${Date.now()}_${i}_${j}`,
            type: 'silla',
            nombre: `Silla ${j + 1}`,
            posicion: { x: sillaX, y: sillaY },
            mesaId: mesa._id,
            width: 20,
            height: 20,
            fill: config.colors.chair,
            stroke: '#2C3E50',
            strokeWidth: 1,
            state: 'available'
          };
          
          newElements.push(silla);
        }
      }
      
      setElements(newElements);
      message.success(`✅ Layout ${layoutType} creado: ${config.message}`);
      
    } catch (error) {
      console.error('Error en creación de layout:', error);
      message.error('Error en la creación del layout');
    } finally {
      setIsAiProcessing(false);
    }
  }, []);

  // Asignación automática de zonas
  const autoAssignZones = useCallback((strategy = 'position') => {
    setIsAiProcessing(true);
    
    try {
      const mesas = elements.filter(el => el.type === 'mesa');
      
      if (mesas.length === 0) {
        message.warning('No hay mesas para asignar zonas');
        return;
      }
      
      let zonasAsignadas = 0;
      
      switch (strategy) {
        case 'position':
          // Asigna por posición en el canvas
          mesas.forEach((mesa, index) => {
            const zona = {
              id: `zona_${index + 1}`,
              nombre: `Zona ${index + 1}`,
              color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`
            };
            
            updateElementProperty(mesa._id, 'zona', zona);
            updateElementProperty(mesa._id, 'fill', zona.color);
            
            // Asigna sillas asociadas
            const sillasMesa = elements.filter(el => el.mesaId === mesa._id);
            sillasMesa.forEach(silla => {
              updateElementProperty(silla._id, 'zona', zona);
              updateElementProperty(silla._id, 'fill', zona.color);
            });
            
            zonasAsignadas++;
          });
          break;
          
        case 'density':
          // Asigna por densidad de elementos
          const densityZones = 4;
          const zoneSize = 2000 / densityZones;
          
          mesas.forEach(mesa => {
            const zoneX = Math.floor(mesa.posicion.x / zoneSize);
            const zoneY = Math.floor(mesa.posicion.y / zoneSize);
            const zoneIndex = zoneY * densityZones + zoneX;
            
            const zona = {
              id: `zona_densidad_${zoneIndex}`,
              nombre: `Zona ${zoneIndex + 1}`,
              color: `hsl(${(zoneIndex * 137.5) % 360}, 70%, 60%)`
            };
            
            updateElementProperty(mesa._id, 'zona', zona);
            updateElementProperty(mesa._id, 'fill', zona.color);
            
            const sillasMesa = elements.filter(el => el.mesaId === mesa._id);
            sillasMesa.forEach(silla => {
              updateElementProperty(silla._id, 'zona', zona);
              updateElementProperty(silla._id, 'fill', zona.color);
            });
            
            zonasAsignadas++;
          });
          break;
      }
      
      message.success(`✅ ${zonasAsignadas} mesas asignadas a zonas automáticamente`);
      
    } catch (error) {
      console.error('Error en asignación automática de zonas:', error);
      message.error('Error en la asignación automática');
    } finally {
      setIsAiProcessing(false);
    }
  }, [elements, updateElementProperty]);

  // Renombrado inteligente en lote
  const renameMesaAndChairs = useCallback((mesaId, newMesaName, chairPattern = 'Silla {n}') => {
    try {
      const mesa = elements.find(el => el._id === mesaId);
      if (!mesa) return;
      
      // Renombra mesa
      updateElementProperty(mesaId, 'nombre', newMesaName);
      
      // Renombra sillas asociadas
      const sillasMesa = elements.filter(el => el.mesaId === mesaId);
      sillasMesa.forEach((silla, index) => {
        const newChairName = chairPattern.replace('{n}', (index + 1).toString());
        updateElementProperty(silla._id, 'nombre', newChairName);
      });
      
      message.success(`✅ Mesa y ${sillasMesa.length} sillas renombradas`);
      
    } catch (error) {
      console.error('Error en renombrado:', error);
      message.error('Error en el renombrado');
    }
  }, [elements, updateElementProperty]);

  // ===== FUNCIONES PRINCIPALES =====
  // Todas las funciones useCallback se definen al final del componente



  // ===== FUNCIONES DE ZONAS =====
  // Se definen al final del componente

  // ===== FUNCIONES DE FILTROS DE FONDO =====
  // Se definen al final del componente

  // ===== RENDERIZADO DE ELEMENTOS =====
  // Se define al final del componente

  // ===== FUNCIONES PRINCIPALES =====

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
    
    // Enviar a colaboradores
    sendZoneAssigned(elementIds, zona);
  }, [zonas, elements, sendZoneAssigned]);

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
            
            {/* ===== PANELES DE IA LOCAL ===== */}
            
            {/* Panel de Asistente IA */}
            <div className="p-3 border-b border-gray-200">
              <Title level={5} className="mb-3 flex items-center gap-2">
                🤖 Asistente IA
                {isAiProcessing && <Progress type="circle" size={16} />}
              </Title>
              <div className="space-y-2">
                <Button 
                  icon={<RobotOutlined />} 
                  onClick={autoOrganizeElements}
                  disabled={isAiProcessing}
                  block
                  size="small"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  🧠 Auto-Organizar
                </Button>
                <Button 
                  icon={<BugOutlined />} 
                  onClick={detectIssues}
                  disabled={isAiProcessing}
                  block
                  size="small"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  🔍 Detectar Problemas
                </Button>
                <Button 
                  icon={<BulbOutlined />} 
                  onClick={generateDesignSuggestions}
                  disabled={isAiProcessing}
                  block
                  size="small"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  💡 Sugerencias
                </Button>
              </div>
              
              {/* Estadísticas de IA */}
              <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                <div className="font-medium mb-2">📊 Estadísticas:</div>
                <div className="grid grid-cols-2 gap-1">
                  <div>Elementos: {aiStats.totalElements}</div>
                  <div>Mesas: {aiStats.mesas}</div>
                  <div>Sillas: {aiStats.sillas}</div>
                  <div>Zonas: {aiStats.zonas}</div>
                </div>
                <div className="mt-1 text-gray-600">
                  Uso del espacio: {aiStats.spaceUsage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Panel de Creación IA */}
            <div className="p-3 border-b border-gray-200">
              <Title level={5} className="mb-3">🎯 Creación IA</Title>
              <div className="space-y-2">
                <Button 
                  icon={<AppstoreOutlined />} 
                  onClick={() => createOptimalTables(8, 4)}
                  disabled={isAiProcessing}
                  block
                  size="small"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  🎯 Crear Mesas Óptimas
                </Button>
                
                <div className="text-xs text-gray-600 mb-2">Layouts predefinidos:</div>
                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    size="small"
                    onClick={() => createRestaurantLayout('intimate')}
                    disabled={isAiProcessing}
                    className="text-xs bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    💕 Íntimo
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => createRestaurantLayout('family')}
                    disabled={isAiProcessing}
                    className="text-xs bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    👨‍👩‍👧‍👦 Familiar
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => createRestaurantLayout('elegant')}
                    disabled={isAiProcessing}
                    className="text-xs bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    ✨ Elegante
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => createRestaurantLayout('fast')}
                    disabled={isAiProcessing}
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    ⚡ Rápido
                  </Button>
                </div>
              </div>
            </div>

            {/* Panel de Control IA */}
            <div className="p-3 border-b border-gray-200">
              <Title level={5} className="mb-3">🏷️ Control IA</Title>
              <div className="space-y-2">
                <Button 
                  icon={<AppstoreOutlined />} 
                  onClick={() => autoAssignZones('position')}
                  disabled={isAiProcessing}
                  block
                  size="small"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  🏷️ Auto-Zonas
                </Button>
                <Button 
                  icon={<AppstoreOutlined />} 
                  onClick={() => autoAssignZones('density')}
                  disabled={isAiProcessing}
                  block
                  size="small"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  🏷️ Zonas por Densidad
                </Button>
              </div>
            </div>

            {/* Panel de Problemas Detectados */}
            {aiIssues.length > 0 && (
              <div className="p-3 border-b border-gray-200">
                <Title level={5} className="mb-3 text-orange-600">⚠️ Problemas Detectados</Title>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {aiIssues.map((issue, index) => (
                    <div key={index} className={`p-2 rounded text-xs ${
                      issue.severity === 'error' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="font-medium">{issue.message}</div>
                      <div className="text-gray-600">Tipo: {issue.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel de Sugerencias */}
            {aiSuggestions.length > 0 && (
              <div className="p-3 border-b border-gray-200">
                <Title level={5} className="mb-3 text-blue-600">💡 Sugerencias</Title>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className={`p-2 rounded text-xs ${
                      suggestion.priority === 'high' ? 'bg-red-50 border border-red-200' : 
                      suggestion.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' : 
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="font-medium">{suggestion.message}</div>
                      <div className="text-gray-600">Prioridad: {suggestion.priority}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== PANEL DE COLABORACIÓN EN TIEMPO REAL ===== */}
            <div className="p-3 border-b border-gray-200">
              <Title level={5} className="mb-3 flex items-center gap-2">
                👥 Colaboración en Tiempo Real
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'SUBSCRIBED' ? 'bg-green-500' : 
                  connectionStatus === 'CHANNEL_ERROR' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
              </Title>
              
              <div className="space-y-3">
                {/* Botón de conexión */}
                <Button 
                  icon={<TeamOutlined />} 
                  onClick={toggleCollaboration}
                  type={isCollaborating ? 'default' : 'primary'}
                  block
                  size="small"
                  className={isCollaborating ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                >
                  {isCollaborating ? 'Desconectar' : 'Conectar'}
                </Button>
                
                {/* Estado de conexión */}
                <div className="text-xs text-gray-600">
                  Estado: {connectionStatus === 'SUBSCRIBED' ? 'Conectado' : 
                          connectionStatus === 'CHANNEL_ERROR' ? 'Error' : 'Desconectado'}
                </div>
                
                {/* Usuarios conectados */}
                {collaborators.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-2">Usuarios conectados:</div>
                    <div className="space-y-1">
                      {collaborators.map((user, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: user.user_color }}
                          />
                          <span>{user.user_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Chat en tiempo real */}
                {isCollaborating && (
                  <div>
                    <div className="text-xs font-medium mb-2">Chat:</div>
                    <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                      {chatMessages.slice(-5).map((msg) => (
                        <div key={msg.id} className={`text-xs p-1 rounded ${
                          msg.type === 'action' ? 'bg-blue-50' : 'bg-gray-50'
                        }`}>
                          <span className="font-medium text-blue-600">{msg.user}:</span>
                          <span className="ml-1">{msg.message}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Input
                        size="small"
                        placeholder="Mensaje..."
                        onPressEnter={(e) => {
                          if (e.target.value.trim()) {
                            sendChatMessage(e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                      />
                      <Button 
                        size="small"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Mensaje..."]');
                          if (input && input.value.trim()) {
                            sendChatMessage(input.value.trim());
                            input.value = '';
                          }
                        }}
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
                    
                    {/* Botones de IA */}
                    <Button 
                      icon={<RobotOutlined />} 
                      onClick={autoOrganizeElements}
                      disabled={isAiProcessing}
                      title="Auto-organizar elementos"
                      size="small"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      🧠 IA
                    </Button>
                    
                    <Button 
                      icon={<BugOutlined />} 
                      onClick={detectIssues}
                      disabled={isAiProcessing}
                      title="Detectar problemas"
                      size="small"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      🔍
                    </Button>
                    
                    <Button 
                      icon={<BulbOutlined />} 
                      onClick={generateDesignSuggestions}
                      disabled={isAiProcessing}
                      title="Generar sugerencias"
                      size="small"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      💡
                    </Button>
                    
                    <Divider type="vertical" />
                    
                    {/* Botón de Colaboración */}
                    <Button 
                      icon={<TeamOutlined />} 
                      onClick={toggleCollaboration}
                      type={isCollaborating ? 'default' : 'primary'}
                      title={isCollaborating ? 'Desconectar colaboración' : 'Activar colaboración'}
                      size="small"
                      className={isCollaborating ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                    >
                      👥
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

               {/* ===== CAPA DE COLABORACIÓN ===== */}
               {isCollaborating && (
                 <Layer>
                   {/* Cursos de otros usuarios */}
                   {Object.entries(otherUsersCursors).map(([userId, cursor]) => (
                     <React.Fragment key={userId}>
                       {/* Círculo del cursor */}
                       <Circle
                         x={cursor.x}
                         y={cursor.y}
                         radius={8}
                         fill={cursor.user_color}
                         stroke="white"
                         strokeWidth={2}
                       />
                       {/* Nombre del usuario */}
                       <Text
                         x={cursor.x + 12}
                         y={cursor.y - 6}
                         text={cursor.user_name}
                         fontSize={12}
                         fill={cursor.user_color}
                         fontStyle="bold"
                       />
                     </React.Fragment>
                   ))}
                 </Layer>
               )}
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
