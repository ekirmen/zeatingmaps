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
  const [currentTool, setCurrentTool] = useState('mesa');
  
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
  const [selectedZone, setSelectedZone] = useState(null);
  
  // ===== ESTADOS DE CONFIGURACIÓN =====
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  
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
        }
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
        setActiveMode('select');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
    }
  }, []);

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
    
    updateElementProperty(elementId, 'posicion', finalPosition);
  }, [snapToGrid, gridSize, updateElementProperty]);

  const handleElementDragEnd = useCallback((elementId) => {
    addToHistory(elements, `Mover elemento ${elementId}`);
  }, [elements, addToHistory]);

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

  // ===== FUNCIONES DE MENÚ CONTEXTUAL =====
  const handleContextMenu = useCallback((e) => {
    e.evt.preventDefault();
    // Implementar menú contextual si es necesario
  }, []);

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
        backgroundOpacity
      }
    };
    
    onSave(mapaData);
    message.success('Mapa guardado exitosamente');
  }, [elements, gridSize, showGrid, snapToGrid, backgroundImage, backgroundPosition, backgroundScale, backgroundOpacity, onSave]);

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

  // ===== RENDERIZADO DE ELEMENTOS =====
  const renderElement = (element) => {
    const isSelected = selectedIds.includes(element._id);
    const commonProps = {
      key: element._id,
      draggable: activeMode === 'select',
      onClick: () => handleElementClick(element._id),
      onDragMove: (e) => handleElementDrag(element._id, e.target.position()),
      onDragEnd: () => handleElementDragEnd(element._id),
      onContextMenu: handleContextMenu,
      rotation: element.rotation || 0,
      opacity: element.opacity || 1
    };

    switch (element.type) {
      case 'mesa':
        return (
          <Rect
            {...commonProps}
            x={element.posicion.x}
            y={element.posicion.y}
            width={element.width}
            height={element.height}
            fill={element.zona?.color || element.fill}
            stroke={isSelected ? '#FFD700' : element.stroke}
            strokeWidth={isSelected ? 3 : element.strokeWidth}
            cornerRadius={element.mesaType === 'circular' ? Math.min(element.width, element.height) / 2 : 0}
          />
        );
      
      case 'silla':
        return (
          <Circle
            {...commonProps}
            x={element.posicion.x + element.width / 2}
            y={element.posicion.y + element.height / 2}
            radius={element.width / 2}
            fill={element.zona?.color || element.fill}
            stroke={isSelected ? '#FFD700' : element.stroke}
            strokeWidth={isSelected ? 3 : element.strokeWidth}
          />
        );
      
      case 'texto':
        return (
          <Text
            {...commonProps}
            x={element.posicion.x}
            y={element.posicion.y}
            text={element.nombre || 'Texto'}
            fontSize={element.fontSize || 16}
            fill={element.fill || '#000000'}
            fontStyle={element.fontStyle || 'normal'}
            fontFamily={element.fontFamily || 'Arial'}
          />
        );
      
      default:
        return null;
    }
  };

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
            <div className="flex gap-1">
              <Button
                type={activeMode === 'select' ? 'primary' : 'default'}
                onClick={() => setActiveMode('select')}
                size="small"
                title="Modo Selección"
              >
                ✋
              </Button>
              <Button
                type={activeMode === 'pan' ? 'primary' : 'default'}
                onClick={() => setActiveMode('pan')}
                size="small"
                title="Modo Pan"
              >
                🖐️
              </Button>
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

        {/* ===== PANEL DE PROPIEDADES RÁPIDAS ===== */}
        {selectedIds.length > 0 && (
          <div className="p-3 border-b border-gray-200">
            <Title level={5} className="mb-3">⚙️ Propiedades Rápidas</Title>
            <div className="space-y-3">
              {(() => {
                const selectedElement = elements.find(el => selectedIds.includes(el._id));
                if (!selectedElement) return null;

                return (
                  <>
                    {/* Nombre */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Nombre</label>
                      <Input
                        size="small"
                        value={selectedElement.nombre || ''}
                        onChange={(e) => updateElementProperty(selectedElement._id, 'nombre', e.target.value)}
                        placeholder="Nombre del elemento"
                      />
                    </div>

                    {/* Posición X */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Posición X</span>
                        <span className="text-xs font-mono text-gray-500">{Math.round(selectedElement.posicion?.x || 0)}px</span>
                      </div>
                      <Slider
                        min={0}
                        max={2000}
                        value={selectedElement.posicion?.x || 0}
                        onChange={(value) => updateElementProperty(selectedElement._id, 'posicion', { 
                          ...selectedElement.posicion, 
                          x: value 
                        })}
                        size="small"
                        tooltip={{ formatter: (value) => `${value}px` }}
                      />
                    </div>

                    {/* Posición Y */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Posición Y</span>
                        <span className="text-xs font-mono text-gray-500">{Math.round(selectedElement.posicion?.y || 0)}px</span>
                      </div>
                      <Slider
                        min={0}
                        max={1400}
                        value={selectedElement.posicion?.y || 0}
                        onChange={(value) => updateElementProperty(selectedElement._id, 'posicion', { 
                          ...selectedElement.posicion, 
                          y: value 
                        })}
                        size="small"
                        tooltip={{ formatter: (value) => `${value}px` }}
                      />
                    </div>

                    {/* Tamaño (solo para elementos con width/height) */}
                    {(selectedElement.width || selectedElement.height) && (
                      <>
                        {/* Ancho */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Ancho</span>
                            <span className="text-xs font-mono text-gray-500">{selectedElement.width || 0}px</span>
                          </div>
                          <Slider
                            min={20}
                            max={500}
                            value={selectedElement.width || 0}
                            onChange={(value) => updateElementProperty(selectedElement._id, 'width', value)}
                            size="small"
                            tooltip={{ formatter: (value) => `${value}px` }}
                          />
                        </div>

                        {/* Alto */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Alto</span>
                            <span className="text-xs font-mono text-gray-500">{selectedElement.height || 0}px</span>
                          </div>
                          <Slider
                            min={20}
                            max={500}
                            value={selectedElement.height || 0}
                            onChange={(value) => updateElementProperty(selectedElement._id, 'height', value)}
                            size="small"
                            tooltip={{ formatter: (value) => `${value}px` }}
                          />
                        </div>
                      </>
                    )}

                    {/* Radio (solo para círculos) */}
                    {selectedElement.radius && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Radio</span>
                          <span className="text-xs font-mono text-gray-500">{selectedElement.radius}px</span>
                        </div>
                        <Slider
                          min={10}
                          max={200}
                          value={selectedElement.radius}
                          onChange={(value) => updateElementProperty(selectedElement._id, 'radius', value)}
                          size="small"
                          tooltip={{ formatter: (value) => `${value}px` }}
                        />
                      </div>
                    )}

                    {/* Rotación */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Rotación</span>
                        <span className="text-xs font-mono text-gray-500">{Math.round(selectedElement.rotation || 0)}°</span>
                      </div>
                      <Slider
                        min={0}
                        max={360}
                        value={selectedElement.rotation || 0}
                        onChange={(value) => updateElementProperty(selectedElement._id, 'rotation', value)}
                        size="small"
                        tooltip={{ formatter: (value) => `${value}°` }}
                      />
                    </div>

                    {/* Opacidad */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Opacidad</span>
                        <span className="text-xs font-mono text-gray-500">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
                      </div>
                      <Slider
                        min={10}
                        max={100}
                        value={(selectedElement.opacity || 1) * 100}
                        onChange={(value) => updateElementProperty(selectedElement._id, 'opacity', value / 100)}
                        size="small"
                        tooltip={{ formatter: (value) => `${value}%` }}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

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
              title="Modo Selección"
            />
            <Button
              type={activeMode === 'pan' ? 'primary' : 'default'}
              icon={<EyeOutlined />}
              onClick={() => setActiveMode('pan')}
              size="small"
              title="Modo Pan"
            />
            <Divider type="vertical" />
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
        </Stage>
      </div>
    </div>
  );
};

export default CrearMapaMain;
