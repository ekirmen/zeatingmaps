import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Stage, Layer, Circle, Rect, Text, Label, Tag, Transformer, Group, Line, RegularPolygon, Image } from "react-konva";
import { useSeatLockStore } from "../../../components/seatLockStore";
import { message, Button, Popover, Slider, Switch, ColorPicker, Space, Divider, Input, InputNumber, Upload } from "antd";
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  InfoCircleOutlined,
  SettingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  MagicOutlined,
  LayerOutlined,
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined
} from "@ant-design/icons";

const SeatingMap = ({
  mapa,
  onSeatClick,
  selectedZona,
  availableZonas,
  blockMode = false,
  abonoMode = false,
  abonoSeats = [],
  tempBlocks = [],
  containerRef,
  onSelectCompleteTable,
}) => {
  // ===== REFS =====
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const backgroundImageRef = useRef(null);
  
  // ===== ESTADOS PRINCIPALES =====
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });
  const [hoveredTable, setHoveredTable] = useState(null);
  const [showSeatLegend, setShowSeatLegend] = useState(false);
  
  // ===== ESTADOS DE TRANSFORMADOR VISUAL =====
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showTransformer, setShowTransformer] = useState(true);
  const [transformerMode, setTransformerMode] = useState('select'); // 'select', 'resize', 'rotate'
  
  // ===== ESTADOS DE EFECTOS VISUALES =====
  const [showShadows, setShowShadows] = useState(true);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowBlur, setShadowBlur] = useState(8);
  const [shadowOffsetX, setShadowOffsetX] = useState(3);
  const [shadowOffsetY, setShadowOffsetY] = useState(3);
  const [enhancedVisuals, setEnhancedVisuals] = useState(true);
  
  // ===== ESTADOS DE CAPAS =====
  const [layers, setLayers] = useState({
    background: { visible: true, locked: false, name: 'Fondo' },
    seats: { visible: true, locked: false, name: 'Asientos' },
    zones: { visible: true, locked: false, name: 'Zonas' },
    labels: { visible: true, locked: false, name: 'Etiquetas' },
    grid: { visible: true, locked: false, name: 'Grid' }
  });
  
  // ===== ESTADOS DE ZONAS PERSONALIZABLES =====
  const [customZones, setCustomZones] = useState([]);
  const [showCustomZonePanel, setShowCustomZonePanel] = useState(false);
  const [isCreatingCustomZone, setIsCreatingCustomZone] = useState(false);
  const [customZonePoints, setCustomZonePoints] = useState([]);
  
  // ===== ESTADOS DE CONFIGURACIÓN =====
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  
  // ===== ESTADOS DE IMAGEN DE FONDO =====
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundImageConfig, setBackgroundImageConfig] = useState({
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    rotation: 0,
    shadowColor: '#000000',
    shadowBlur: 10,
    shadowOffsetX: 5,
    shadowOffsetY: 5,
    borderColor: '#ffffff',
    borderWidth: 2,
    showBorder: true,
    showShadow: true
  });
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  
  // ===== ESTADOS DE DEBUG =====
  const [debugInfo, setDebugInfo] = useState({
    mapaReceived: false,
    mesasCount: 0,
    sillasCount: 0,
    lastRender: Date.now()
  });

  // Obtener funciones de seat lock
  const { isSeatLocked, isSeatLockedByMe } = useSeatLockStore();

  // Memoizar el mapa de colores para evitar re-creación
  const colorMap = useMemo(() => ({
    pagado: "#9ca3af",
    reservado: "#ef4444",
    anulado: "#9ca3af",
    bloqueado: "#dc2626",
    disponible: "#60a5fa",
  }), []);

  // Memoizar el ID de la zona seleccionada
  const selectedZonaId = useMemo(() => 
    selectedZona ? selectedZona._id || selectedZona.id : null,
    [selectedZona]
  );

  // ===== EFECTO PARA DEBUG Y MONITOREO =====
  useEffect(() => {
    const newDebugInfo = {
      mapaReceived: !!mapa,
      mesasCount: mapa?.mesas?.length || 0,
      sillasCount: mapa?.mesas?.reduce((total, mesa) => total + (mesa.sillas?.length || 0), 0) || 0,
      lastRender: Date.now()
    };
    
    setDebugInfo(newDebugInfo);
    console.log('[SeatingMap] Debug Info:', newDebugInfo);
    console.log('[SeatingMap] Mapa recibido:', mapa);
    console.log('[SeatingMap] Mesas:', mapa?.mesas);
  }, [mapa]);

  // ===== EFECTO PARA MANEJAR EL TRANSFORMADOR =====
  useEffect(() => {
    if (transformerRef.current && selectedSeats.length > 0) {
      const stage = stageRef.current;
      const selectedNodes = selectedSeats.map(seatId => 
        stage.findOne(`#${seatId}`)
      ).filter(Boolean);
      
      if (selectedNodes.length > 0) {
        transformerRef.current.nodes(selectedNodes);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedSeats]);

  // ===== FUNCIONES DE TRANSFORMADOR VISUAL =====
  const handleSeatSelection = useCallback((seatId, event) => {
    if (event.evt.ctrlKey || event.evt.metaKey) {
      // Selección múltiple con Ctrl/Cmd
      setSelectedSeats(prev => 
        prev.includes(seatId) 
          ? prev.filter(id => id !== seatId)
          : [...prev, seatId]
      );
    } else {
      // Selección única
      setSelectedSeats([seatId]);
    }
    
    // Llamar a la función original de selección
    onSeatClick && onSeatClick(seatId);
  }, [onSeatClick]);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  // ===== FUNCIONES DE EFECTOS VISUALES =====
  const getSeatShadow = useCallback((seat) => {
    if (!showShadows) return null;
    
    const shadowConfig = {
      color: shadowColor,
      blur: shadowBlur,
      offsetX: shadowOffsetX,
      offsetY: shadowOffsetY
    };
    
    // Sombras especiales según el estado
    if (seat.estado === 'reservado') {
      shadowConfig.color = '#FF6B6B';
      shadowConfig.blur = 12;
    } else if (seat.estado === 'pagado') {
      shadowConfig.color = '#4CAF50';
      shadowConfig.blur = 6;
    } else if (seat.estado === 'bloqueado') {
      shadowConfig.color = '#9C27B0';
      shadowConfig.blur = 15;
    }
    
    return shadowConfig;
  }, [showShadows, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY]);

  // ===== FUNCIONES DE IMAGEN DE FONDO =====
  const handleBackgroundImageUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        setBackgroundImage(img);
        setBackgroundImageUrl(e.target.result);
        message.success('Imagen de fondo cargada exitosamente');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    return false; // Prevenir upload automático
  }, []);

  const removeBackgroundImage = useCallback(() => {
    setBackgroundImage(null);
    setBackgroundImageUrl('');
    message.info('Imagen de fondo removida');
  }, []);

  const updateBackgroundConfig = useCallback((key, value) => {
    setBackgroundImageConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // ===== FUNCIONES DE ZONAS PERSONALIZABLES =====
  const startCustomZoneCreation = useCallback(() => {
    setIsCreatingCustomZone(true);
    setCustomZonePoints([]);
    message.info('Haz clic en el canvas para crear puntos de la zona. Doble clic para finalizar.');
  }, []);

  const addCustomZonePoint = useCallback((x, y) => {
    if (!isCreatingCustomZone) return;
    
    const newPoint = { x, y, id: Date.now() };
    setCustomZonePoints(prev => [...prev, newPoint]);
    
    if (customZonePoints.length >= 2) {
      const zone = {
        id: Date.now(),
        name: `Zona Personalizada ${customZones.length + 1}`,
        color: '#FF6B6B',
        points: [...customZonePoints, newPoint],
        price: 0,
        capacity: 0
      };
      setCustomZones(prev => [...prev, zone]);
      setIsCreatingCustomZone(false);
      setCustomZonePoints([]);
      message.success('Zona personalizada creada exitosamente');
    }
  }, [isCreatingCustomZone, customZonePoints, customZones.length]);

  // ===== FUNCIONES DE CAPAS =====
  const toggleLayer = useCallback((layerName) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        visible: !prev[layerName].visible
      }
    }));
  }, []);

  const lockLayer = useCallback((layerName) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: {
        ...prev[layerName],
        locked: !prev[layerName].locked
      }
    }));
  }, []);

  // ===== FUNCIONES DE ZOOM Y PAN =====
  useEffect(() => {
    const stage = stageRef.current;
    const container = stage?.container();

    const handleWheel = (e) => {
      e.preventDefault();
      const scaleBy = 1.1;
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      const newScale = Math.min(Math.max(e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy, 0.5), 5);

      setScale(newScale);
      setPosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    };

    container?.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container?.removeEventListener("wheel", handleWheel);
    };
  }, [scale, position]);

  const handleDragEnd = useCallback((e) => {
    setPosition(e.target.position());
  }, []);

  // ===== FUNCIÓN DE RENDERIZADO DE ASIENTOS MEJORADA =====
  const renderSeat = useCallback((silla, mesa) => {
    if (!silla || !silla._id) {
      console.warn('[SeatingMap] Asiento inválido:', silla);
      return null;
    }

    const seatZonaId =
      typeof silla.zona === "object" ? silla.zona._id || silla.zona.id : silla.zona;
    
    const isAvailable = blockMode ? true : (availableZonas?.includes(seatZonaId) || !availableZonas);
    const isAbono = abonoMode && abonoSeats.includes(silla._id);
    const isSelected = selectedZonaId && selectedZonaId === seatZonaId;
    const isTransformerSelected = selectedSeats.includes(silla._id);

    const isTempBlock = tempBlocks.includes(silla._id);
    let baseFill = isTempBlock ? "red" : colorMap[silla.estado] || colorMap["disponible"];
    
    // Colores mejorados con efectos visuales
    if (enhancedVisuals) {
      if (isTransformerSelected) {
        baseFill = '#FFD700'; // Dorado para asientos seleccionados
      } else if (isAbono) {
        baseFill = '#FF9800'; // Naranja para abonos
      } else if (isSelected) {
        baseFill = '#4CAF50'; // Verde para zona seleccionada
      }
    }

    const shadow = getSeatShadow(silla);
    const isLocked = isSeatLocked(silla._id);
    const isLockedByMe = isSeatLockedByMe(silla._id);

    // Validar posición del asiento
    if (!silla.posicion || typeof silla.posicion.x !== 'number' || typeof silla.posicion.y !== 'number') {
      console.warn('[SeatingMap] Posición inválida para asiento:', silla._id, silla.posicion);
      return null;
    }

    return (
      <Group
        key={silla._id}
        id={silla._id}
        x={silla.posicion.x}
        y={silla.posicion.y}
        draggable={false}
        onClick={(e) => handleSeatSelection(silla._id, e)}
        onTap={(e) => handleSeatSelection(silla._id, e)}
      >
        <Circle
          radius={silla.radius || 8}
          fill={baseFill}
          stroke={isLocked ? (isLockedByMe ? "#FFD700" : "#FF0000") : "#000000"}
          strokeWidth={isLocked ? 3 : 1}
          shadowColor={shadow?.color}
          shadowBlur={shadow?.blur}
          shadowOffsetX={shadow?.offsetX}
          shadowOffsetY={shadow?.offsetY}
          opacity={enhancedVisuals ? 0.9 : 1}
        />
        
        {/* Etiqueta del asiento */}
        {layers.labels.visible && (
          <Text
            text={silla.nombre || silla._id}
            fontSize={8}
            fill="#000000"
            x={-15}
            y={-5}
            listening={false}
          />
        )}
        
        {/* Indicadores visuales adicionales */}
        {enhancedVisuals && (
          <>
            {/* Indicador de estado */}
            <Circle
              radius={3}
              fill={colorMap[silla.estado] || colorMap["disponible"]}
              x={12}
              y={-12}
              listening={false}
            />
            
            {/* Indicador de zona */}
            {silla.zona && (
              <Circle
                radius={2}
                fill={typeof silla.zona === 'object' ? silla.zona.color : '#FF6B6B'}
                x={-12}
                y={-12}
                listening={false}
              />
            )}
          </>
        )}
      </Group>
    );
  }, [
    availableZonas, 
    blockMode, 
    abonoMode, 
    abonoSeats, 
    selectedZonaId, 
    tempBlocks, 
    colorMap, 
    enhancedVisuals,
    getSeatShadow,
    layers.labels.visible,
    isSeatLocked,
    isSeatLockedByMe,
    handleSeatSelection,
    selectedSeats
  ]);

  // ===== FUNCIÓN DE RENDERIZADO DE MESAS MEJORADA =====
  const renderTable = useCallback((mesa) => {
    if (!mesa || !mesa._id) {
      console.warn('[SeatingMap] Mesa inválida:', mesa);
      return null;
    }

    // Validar posición de la mesa
    if (!mesa.posicion || typeof mesa.posicion.x !== 'number' || typeof mesa.posicion.y !== 'number') {
      console.warn('[SeatingMap] Posición inválida para mesa:', mesa._id, mesa.posicion);
      return null;
    }

    const isSelected = selectedZonaId && selectedZonaId === (mesa.zona?._id || mesa.zona?.id);
    const shadow = getSeatShadow(mesa);
    
    return (
      <Group
        key={mesa._id}
        x={mesa.posicion.x}
        y={mesa.posicion.y}
        draggable={false}
        onMouseEnter={() => setHoveredTable(mesa)}
        onMouseLeave={() => setHoveredTable(null)}
      >
        <Rect
          width={mesa.width || 60}
          height={mesa.height || 40}
          fill={isSelected ? "#4CAF50" : "#8BC34A"}
          stroke="#2E7D32"
          strokeWidth={2}
          cornerRadius={5}
          shadowColor={shadow?.color}
          shadowBlur={shadow?.blur}
          shadowOffsetX={shadow?.offsetX}
          shadowOffsetY={shadow?.offsetY}
          opacity={enhancedVisuals ? 0.9 : 1}
        />
        
        {/* Etiqueta de la mesa */}
        {layers.labels.visible && (
          <Text
            text={mesa.nombre || `Mesa ${mesa._id}`}
            fontSize={10}
            fill="#000000"
            x={mesa.width / 2 - 20}
            y={mesa.height / 2 - 5}
            listening={false}
            align="center"
          />
        )}
        
        {/* Asientos de la mesa */}
        {mesa.sillas && layers.seats.visible && 
          mesa.sillas.map(silla => renderSeat(silla, mesa)).filter(Boolean)
        }
      </Group>
    );
  }, [
    selectedZonaId, 
    getSeatShadow, 
    enhancedVisuals, 
    layers.labels.visible, 
    layers.seats.visible, 
    renderSeat
  ]);

  // ===== FUNCIÓN DE RENDERIZADO DE ZONAS PERSONALIZABLES =====
  const renderCustomZones = useCallback(() => {
    if (!layers.zones.visible) return null;
    
    return (
      <>
        {/* Zonas personalizadas existentes */}
        {customZones.map(zone => (
          <Group key={zone.id}>
            {/* Polígono de la zona */}
            {zone.points.length > 2 && (
              <Line
                points={zone.points.flatMap(point => [point.x, point.y])}
                stroke={zone.color}
                strokeWidth={3}
                closed={true}
                fill={`${zone.color}20`}
                listening={false}
              />
            )}
            
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
                listening={false}
              />
            ))}
            
            {/* Etiqueta de la zona */}
            <Text
              text={zone.name}
              fontSize={12}
              fill={zone.color}
              x={zone.points[0]?.x || 0}
              y={(zone.points[0]?.y || 0) - 20}
              listening={false}
              fontStyle="bold"
            />
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
  }, [customZones, isCreatingCustomZone, customZonePoints, layers.zones.visible]);

  // ===== FUNCIÓN DE RENDERIZADO DE GRID =====
  const renderGrid = useCallback(() => {
    if (!showGrid || !layers.grid.visible) return null;
    
    const stage = stageRef.current;
    if (!stage) return null;
    
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    const lines = [];
    
    // Líneas verticales
    for (let i = 0; i <= stageWidth; i += gridSize) {
      lines.push(
        <Line
          key={`v${i}`}
          points={[i, 0, i, stageHeight]}
          stroke="#e2e8f0"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    
    // Líneas horizontales
    for (let i = 0; i <= stageHeight; i += gridSize) {
      lines.push(
        <Line
          key={`h${i}`}
          points={[0, i, stageWidth, i]}
          stroke="#e2e8f0"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    
    return <Group>{lines}</Group>;
  }, [showGrid, layers.grid.visible, gridSize]);

  // ===== FUNCIÓN DE RENDERIZADO DE IMAGEN DE FONDO =====
  const renderBackgroundImage = useCallback(() => {
    if (!backgroundImage || !layers.background.visible) return null;
    
    return (
      <Image
        ref={backgroundImageRef}
        image={backgroundImage}
        x={backgroundImageConfig.x}
        y={backgroundImageConfig.y}
        scaleX={backgroundImageConfig.scale}
        scaleY={backgroundImageConfig.scale}
        rotation={backgroundImageConfig.rotation}
        opacity={backgroundImageConfig.opacity}
        shadowColor={backgroundImageConfig.showShadow ? backgroundImageConfig.shadowColor : undefined}
        shadowBlur={backgroundImageConfig.showShadow ? backgroundImageConfig.shadowBlur : undefined}
        shadowOffsetX={backgroundImageConfig.showShadow ? backgroundImageConfig.shadowOffsetX : undefined}
        shadowOffsetY={backgroundImageConfig.showShadow ? backgroundImageConfig.shadowOffsetY : undefined}
        stroke={backgroundImageConfig.showBorder ? backgroundImageConfig.borderColor : undefined}
        strokeWidth={backgroundImageConfig.showBorder ? backgroundImageConfig.borderWidth : undefined}
        listening={false}
      />
    );
  }, [backgroundImage, backgroundImageConfig, layers.background.visible]);

  // ===== PANEL DE CONFIGURACIÓN =====
  const ConfigPanel = () => (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">⚙️ Configuración</h3>
        <Button
          size="small"
          icon={<SettingOutlined />}
          onClick={() => setShowConfigPanel(!showConfigPanel)}
        />
      </div>
      
      {showConfigPanel && (
        <div className="space-y-3">
          {/* Capas */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">📁 Capas</h4>
            {Object.entries(layers).map(([key, layer]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{layer.name}</span>
                <Space>
                  <Switch
                    size="small"
                    checked={layer.visible}
                    onChange={() => toggleLayer(key)}
                  />
                  <Switch
                    size="small"
                    checked={layer.locked}
                    onChange={() => lockLayer(key)}
                  />
                </Space>
              </div>
            ))}
          </div>
          
          <Divider className="my-2" />
          
          {/* Efectos Visuales */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">✨ Efectos</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Sombras</span>
                <Switch
                  size="small"
                  checked={showShadows}
                  onChange={setShowShadows}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Visuales Mejorados</span>
                <Switch
                  size="small"
                  checked={enhancedVisuals}
                  onChange={setEnhancedVisuals}
                />
              </div>
            </div>
          </div>
          
          <Divider className="my-2" />
          
          {/* Grid */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">🔲 Grid</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Mostrar</span>
                <Switch
                  size="small"
                  checked={showGrid}
                  onChange={setShowGrid}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Tamaño</span>
                <Slider
                  size="small"
                  min={10}
                  max={50}
                  value={gridSize}
                  onChange={setGridSize}
                  style={{ width: 80 }}
                />
              </div>
            </div>
          </div>
          
          <Divider className="my-2" />
          
          {/* Zonas Personalizables */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">🎯 Zonas</h4>
            <Button
              size="small"
              type="primary"
              onClick={startCustomZoneCreation}
              disabled={isCreatingCustomZone}
              className="w-full"
            >
              {isCreatingCustomZone ? 'Creando...' : 'Crear Zona'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // ===== PANEL DE IMAGEN DE FONDO =====
  const BackgroundImagePanel = () => (
    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">🖼️ Imagen de Fondo</h3>
        <Button
          size="small"
          icon={<PictureOutlined />}
          onClick={() => setShowBackgroundPanel(!showBackgroundPanel)}
        />
      </div>
      
      {showBackgroundPanel && (
        <div className="space-y-3">
          {/* Upload de imagen */}
          <div>
            <Upload
              beforeUpload={handleBackgroundImageUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button size="small" icon={<UploadOutlined />} className="w-full">
                Cargar Imagen
              </Button>
            </Upload>
          </div>

          {backgroundImage && (
            <>
              <Divider className="my-2" />
              
              {/* Posición X, Y */}
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-600">Posición X</span>
                  <Slider
                    size="small"
                    min={-500}
                    max={500}
                    value={backgroundImageConfig.x}
                    onChange={(value) => updateBackgroundConfig('x', value)}
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-600">Posición Y</span>
                  <Slider
                    size="small"
                    min={-500}
                    max={500}
                    value={backgroundImageConfig.y}
                    onChange={(value) => updateBackgroundConfig('y', value)}
                  />
                </div>
              </div>

              {/* Escala */}
              <div>
                <span className="text-xs text-gray-600">Escala</span>
                <Slider
                  size="small"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={backgroundImageConfig.scale}
                  onChange={(value) => updateBackgroundConfig('scale', value)}
                />
              </div>

              {/* Rotación */}
              <div>
                <span className="text-xs text-gray-600">Rotación</span>
                <Slider
                  size="small"
                  min={0}
                  max={360}
                  value={backgroundImageConfig.rotation}
                  onChange={(value) => updateBackgroundConfig('rotation', value)}
                />
              </div>

              {/* Opacidad */}
              <div>
                <span className="text-xs text-gray-600">Opacidad</span>
                <Slider
                  size="small"
                  min={0}
                  max={1}
                  step={0.1}
                  value={backgroundImageConfig.opacity}
                  onChange={(value) => updateBackgroundConfig('opacity', value)}
                />
              </div>

              <Divider className="my-2" />

              {/* Sombra */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Sombra</span>
                  <Switch
                    size="small"
                    checked={backgroundImageConfig.showShadow}
                    onChange={(checked) => updateBackgroundConfig('showShadow', checked)}
                  />
                </div>
                {backgroundImageConfig.showShadow && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-600">Color Sombra</span>
                      <ColorPicker
                        value={backgroundImageConfig.shadowColor}
                        onChange={(color) => updateBackgroundConfig('shadowColor', color.toHexString())}
                        size="small"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Desenfoque</span>
                      <Slider
                        size="small"
                        min={0}
                        max={50}
                        value={backgroundImageConfig.shadowBlur}
                        onChange={(value) => updateBackgroundConfig('shadowBlur', value)}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Offset X</span>
                      <Slider
                        size="small"
                        min={-20}
                        max={20}
                        value={backgroundImageConfig.shadowOffsetX}
                        onChange={(value) => updateBackgroundConfig('shadowOffsetX', value)}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Offset Y</span>
                      <Slider
                        size="small"
                        min={-20}
                        max={20}
                        value={backgroundImageConfig.shadowOffsetY}
                        onChange={(value) => updateBackgroundConfig('shadowOffsetY', value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Borde */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Borde</span>
                  <Switch
                    size="small"
                    checked={backgroundImageConfig.showBorder}
                    onChange={(checked) => updateBackgroundConfig('showBorder', checked)}
                  />
                </div>
                {backgroundImageConfig.showBorder && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-600">Color Borde</span>
                      <ColorPicker
                        value={backgroundImageConfig.borderColor}
                        onChange={(color) => updateBackgroundConfig('borderColor', color.toHexString())}
                        size="small"
                      />
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Ancho Borde</span>
                      <Slider
                        size="small"
                        min={1}
                        max={20}
                        value={backgroundImageConfig.borderWidth}
                        onChange={(value) => updateBackgroundConfig('borderWidth', value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Divider className="my-2" />

              {/* Botón para remover */}
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={removeBackgroundImage}
                className="w-full"
              >
                Remover Imagen
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  // ===== PANEL DE HERRAMIENTAS =====
  const ToolsPanel = () => (
    <div className="absolute top-20 left-4 bg-white p-3 rounded-lg shadow-lg border">
      <div className="space-y-2">
        <Button
          size="small"
          icon={<ZoomInOutlined />}
          onClick={() => setScale(Math.min(scale * 1.2, 5))}
        />
        <Button
          size="small"
          icon={<ZoomOutOutlined />}
          onClick={() => setScale(Math.max(scale / 1.2, 0.5))}
        />
        <Button
          size="small"
          icon={<LayerOutlined />}
          onClick={() => setShowCustomZonePanel(!showCustomZonePanel)}
        />
        <Button
          size="small"
          icon={<MagicOutlined />}
          onClick={() => setEnhancedVisuals(!enhancedVisuals)}
        />
      </div>
    </div>
  );

  // ===== PANEL DE ZONAS PERSONALIZABLES =====
  const CustomZonePanel = () => (
    showCustomZonePanel && (
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
        <h3 className="font-semibold text-gray-800 mb-3">🎯 Zonas Personalizables</h3>
        
        {customZones.length > 0 ? (
          <div className="space-y-2">
            {customZones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{zone.name}</span>
                <Button
                  size="small"
                  danger
                  onClick={() => setCustomZones(prev => prev.filter(z => z.id !== zone.id))}
                >
                  🗑️
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay zonas personalizadas</p>
        )}
      </div>
    )
  );

  // ===== PANEL DE DEBUG =====
  const DebugPanel = () => (
    <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border text-xs">
      <div className="space-y-1">
        <div>🔄 Último render: {new Date(debugInfo.lastRender).toLocaleTimeString()}</div>
        <div>📊 Mapa recibido: {debugInfo.mapaReceived ? '✅' : '❌'}</div>
        <div>🏗️ Mesas: {debugInfo.mesasCount}</div>
        <div>🪑 Asientos: {debugInfo.sillasCount}</div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {/* Canvas de Konva Mejorado */}
      <Stage
        ref={stageRef}
        width={containerRef?.current?.clientWidth || 800}
        height={containerRef?.current?.clientHeight || 600}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={true}
        onDragEnd={handleDragEnd}
        onMouseDown={(e) => {
          if (isCreatingCustomZone) {
            const stage = e.target.getStage();
            const point = stage.getPointerPosition();
            const adjustedPoint = {
              x: (point.x - position.x) / scale,
              y: (point.y - position.y) / scale
            };
            addCustomZonePoint(adjustedPoint.x, adjustedPoint.y);
          }
        }}
      >
        <Layer>
          {/* Imagen de fondo */}
          {renderBackgroundImage()}
          
          {/* Grid de fondo */}
          {renderGrid()}
          
          {/* Zonas personalizables */}
          {renderCustomZones()}
          
          {/* Mesas y asientos */}
          {mapa?.mesas && Array.isArray(mapa.mesas) && mapa.mesas.length > 0 ? (
            mapa.mesas.map(renderTable).filter(Boolean)
          ) : (
            <Text
              text="No hay mesas disponibles"
              x={400}
              y={300}
              fontSize={16}
              fill="#999"
              align="center"
            />
          )}
          
          {/* Transformador para asientos seleccionados */}
          {showTransformer && selectedSeats.length > 0 && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limitar el redimensionamiento mínimo
                return newBox.width < 10 || newBox.height < 10 ? oldBox : newBox;
              }}
            />
          )}
        </Layer>
      </Stage>

      {/* Paneles de control */}
      <ConfigPanel />
      <BackgroundImagePanel />
      <ToolsPanel />
      <CustomZonePanel />
      <DebugPanel />

      {/* Leyenda de asientos */}
      {showSeatLegend && (
        <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Leyenda</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(colorMap).map(([estado, color]) => (
              <div key={estado} className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-600 capitalize">{estado}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón para mostrar/ocultar leyenda */}
      <Button
        className="absolute bottom-4 right-4"
        size="small"
        onClick={() => setShowSeatLegend(!showSeatLegend)}
      >
        📊
      </Button>
    </div>
  );
};

export default SeatingMap;
