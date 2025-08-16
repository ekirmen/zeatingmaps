import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Circle, Rect, Text as KonvaText, Line, Image, Group } from 'react-konva';
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
    }
  }, [mapa]);

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

  const handleElementResize = useCallback((elementId, newSize) => {
    updateElementSize(elementId, newSize.width, newSize.height);
  }, [updateElementSize]);

  const handleAddMesa = useCallback(() => {
    const nuevaMesa = addMesa(sillaShape);
    addToHistory(elements, 'Agregar mesa');
    message.success('Mesa agregada');
  }, [addMesa, sillaShape, elements, addToHistory]);

  const handleAddSillasToMesa = useCallback((mesaId) => {
    addSillasToMesa(mesaId, numSillas, sillaShape);
    addToHistory(elements, `Agregar ${numSillas} sillas a mesa`);
    message.success(`${numSillas} sillas agregadas a la mesa`);
  }, [addSillasToMesa, numSillas, sillaShape, elements, addToHistory]);

  const handleDeleteSelected = useCallback(() => {
    deleteSelectedElements();
    addToHistory(elements, 'Eliminar elementos seleccionados');
    setSelectedIds([]);
    message.success('Elementos eliminados');
  }, [deleteSelectedElements, elements, addToHistory]);

  const handleDuplicateSelected = useCallback(() => {
    const duplicatedElements = elements.map(el => {
      if (selectedIds.includes(el._id)) {
        return {
          ...el,
          _id: `duplicate_${Date.now()}_${Math.random()}`,
          posicion: {
            x: el.posicion.x + 50,
            y: el.posicion.y + 50
          }
        };
      }
      return el;
    });
    
    setElements(duplicatedElements);
    addToHistory(duplicatedElements, 'Duplicar elementos');
    message.success('Elementos duplicados');
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
              showInWeb: showBackgroundInWeb
            } : null,
            dimensions: { width: 1200, height: 800 }
          }
        },
        estado: 'active'
      };
      
      if (onSave) {
        await onSave(mapaToSave);
      }
      
      message.success('Mapa guardado exitosamente');
    } catch (error) {
      message.error('Error al guardar el mapa');
      console.error('Error saving mapa:', error);
    }
  }, [mapa, elements, gridSize, showGrid, snapToGrid, backgroundImage, backgroundScale, backgroundOpacity, showBackgroundInWeb, onSave]);

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
        return (
          <Group key={element._id} {...baseProps}>
            {element.shape === 'circle' ? (
              <Circle
                radius={element.radius || 60}
                fill={element.fill || '#f0f0f0'}
                stroke={isSelected ? '#1890ff' : '#d9d9d9'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={element.opacity || 1}
              />
            ) : (
              <Rect
                width={element.width || 120}
                height={element.height || 80}
                fill={element.fill || '#f0f0f0'}
                stroke={isSelected ? '#1890ff' : '#d9d9d9'}
                strokeWidth={isSelected ? 3 : 2}
                opacity={element.opacity || 1}
                cornerRadius={element.cornerRadius || 0}
              />
            )}
            <KonvaText
              text={element.nombre || 'Mesa'}
              fontSize={14}
              fill="#333"
              align="center"
              width={element.width || 120}
              y={element.height ? element.height / 2 - 7 : 36}
            />
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
              text={`Mesa: ${element.nombre || 'Sin nombre'} (${element.width || 120}x${element.height || 80})`}
              fontSize={12}
              fill="white"
              align="center"
              width={130}
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
    <div className="h-screen flex flex-col bg-gray-100">
             {/* ===== BARRA DE HERRAMIENTAS SUPERIOR ===== */}
       <div className="bg-white border-b border-gray-200 p-2">
         <Row gutter={16} align="middle">
           <Col>
             <div className="flex items-center gap-3">
               <Title level={4} className="mb-0">
                 {isEditMode ? 'Editar Mapa' : 'Crear Nuevo Mapa'}
               </Title>
               <div className="flex items-center gap-2 text-sm text-gray-600">
                 <span className="font-medium">25%</span>
                 <span>Progreso del Mapa</span>
                 <span className="text-blue-600">Paso 2 de 5</span>
                 <span className="text-green-600">🚀 Continuando...</span>
               </div>
             </div>
           </Col>
           
           <Col>
             <Space size="small">
               <Button 
                 icon={<UndoOutlined />} 
                 onClick={undo}
                 disabled={historyIndex <= 0}
                 title="Deshacer"
                 size="small"
               />
               <Button 
                 icon={<RedoOutlined />} 
                 onClick={redo}
                 disabled={historyIndex >= history.length - 1}
                 title="Rehacer"
                 size="small"
               />
               <Divider type="vertical" />
               <Button 
                 icon={<SaveOutlined />} 
                 type="primary" 
                 onClick={handleSave}
                 size="small"
               >
                 Guardar
               </Button>
               <Button onClick={onCancel} size="small">
                 Cancelar
               </Button>
             </Space>
           </Col>
           
           <Col flex="auto">
             <Space className="float-right" size="small">
               <Button 
                 icon={<EyeOutlined />}
                 type={showPreviewMode ? 'primary' : 'default'}
                 onClick={() => setShowPreviewMode(!showPreviewMode)}
                 title="Vista previa"
                 size="small"
               />
               <Button 
                 icon={<AppstoreOutlined />}
                 type={showGrid ? 'primary' : 'default'}
                 onClick={() => setShowGrid(!showGrid)}
                 title="Mostrar cuadrícula"
                 size="small"
               />
               <Button 
                 icon={<SettingOutlined />}
                 onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                 title="Controles avanzados"
                 size="small"
               />
               {backgroundImage && (
                 <Button 
                   icon={<PictureOutlined />}
                   onClick={() => setShowBackgroundFilters(true)}
                   title="Filtros de imagen"
                   size="small"
                 >
                   Filtros
                 </Button>
               )}
               <Button 
                 icon={<FullscreenOutlined />}
                 onClick={() => fitToScreen()}
                 title="Ajustar a pantalla"
                 size="small"
               />
             </Space>
           </Col>
         </Row>
       </div>

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
               <div className="flex items-center gap-2 text-xs">
                 <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">1</div>
                 <span>Configuración Básica</span>
                 <span className="text-gray-400">Información del mapa</span>
               </div>
               <div className="flex items-center gap-2 text-xs">
                 <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">2</div>
                 <span>Diseño del Mapa</span>
                 <span className="text-gray-400">Editor visual</span>
               </div>
               <div className="flex items-center gap-2 text-xs">
                 <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs">3</div>
                 <span>Validación</span>
                 <span className="text-gray-400">Verificar integridad</span>
               </div>
               <div className="flex items-center gap-2 text-xs">
                 <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs">4</div>
                 <span>Vista Previa</span>
                 <span className="text-gray-400">Revisar resultado</span>
               </div>
               <div className="flex items-center gap-2 text-xs">
                 <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs">5</div>
                 <span>Configuración Avanzada</span>
                 <span className="text-gray-400">Ajustes finales</span>
               </div>
             </div>
           </div>
           
           <MenuMapa
             selectedElement={elements.find(el => selectedIds.includes(el._id))}
             activeMode={activeMode}
             sectionPoints={sectionPoints}
             isCreatingSection={isCreatingSection}
             zones={[]} // TODO: Implementar zonas
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
                     onAddMesa={(type, defaultSize) => {
                       // TODO: Implementar diferentes tipos de mesa
                       handleAddMesa();
                     }}
                   />
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
                   <Button 
                     icon={<PlusOutlined />} 
                     onClick={() => {
                       if (selectedIds.length === 1) {
                         const element = elements.find(el => el._id === selectedIds[0]);
                         if (element?.type === 'mesa') {
                           handleAddSillasToMesa(element._id);
                         }
                       }
                     }}
                     disabled={selectedIds.length !== 1 || !elements.find(el => el._id === selectedIds[0])?.type === 'mesa'}
                     title="Añadir sillas a mesa seleccionada"
                     size="small"
                   >
                     + Sillas
                   </Button>
                 </Space>
               </Col>
               
               <Col flex="auto">
                 <Space className="float-right" size="small">
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
               onClick={handleStageClick}
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
                     x={0}
                     y={0}
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

const ElementProperties = ({ element, onUpdate }) => {
  if (!element) return null;

  switch (element.type) {
    case 'mesa':
      return <PropiedadesMesa mesa={element} onUpdate={onUpdate} />;
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
