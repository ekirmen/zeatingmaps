import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Line } from 'react-konva';
import { message, Button, Switch, Input, Select, Slider } from 'antd';
import { Mesa, Silla } from './compMapa/MesaSilla';
import SeatmapTypeSelector from './SeatmapTypeSelector';
import './CrearMapa.css';

const CrearMapa = ({ salaId }) => {
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

  // Funciones básicas
  const clearSelection = () => setSelectedElements([]);
  
  const handleElementClick = (id) => {
    if (selectedElements.includes(id)) {
      setSelectedElements(selectedElements.filter(e => e !== id));
    } else {
      setSelectedElements([...selectedElements, id]);
    }
  };
  
  const handleElementDragEnd = (id, e) => {
    // Implementar lógica de drag end si es necesario
  };
  
  const getSeatColor = () => '#48BB78';
  const getZonaColor = () => '#667eea';
  const getBorderColor = () => '#000';
  
  const saveMapa = async () => {
    setLastSavedAt(new Date().toLocaleTimeString());
    message.success('Mapa guardado correctamente');
  };

  // Función para crear templates según el tipo seleccionado
  const createTemplateByType = (type) => {
    try {
      let templateElements = [];
      
      // Template básico para todos los tipos
      templateElements = [
        {
          id: 'stage-1',
          type: 'shape',
          x: 400,
          y: 300,
          width: 100,
          height: 50,
          fill: '#2C3E50',
          stroke: '#34495E',
          strokeWidth: 2,
          tenant_id: salaId,
          name: 'Escenario'
        },
        {
          id: 'seat-1',
          type: 'silla',
          x: 300,
          y: 200,
          width: 20,
          height: 20,
          numero: 1,
          fila: 'A',
          zonaId: 'zona-1',
          estado: 'available',
          shape: 'circle',
          tenant_id: salaId
        },
        {
          id: 'seat-2',
          type: 'silla',
          x: 330,
          y: 200,
          width: 20,
          height: 20,
          numero: 2,
          fila: 'A',
          zonaId: 'zona-1',
          estado: 'available',
          shape: 'circle',
          tenant_id: salaId
        }
      ];
      
      setElements(templateElements);
      setHasMapData(true);
      setShowTypeSelector(false);
      message.success(`Template básico creado para ${type}`);
    } catch (error) {
      console.error('Error creando template:', error);
      message.error('Error al crear el template');
    }
  };

  const handleTypeSelect = (type) => {
    createTemplateByType(type);
  };

  const handleTypeSelectorCancel = () => {
    // No permitir cerrar sin seleccionar
    message.warning('Debes seleccionar un tipo de plano para continuar');
  };

  // Funciones de zoom y paneo
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1));
  const resetZoom = () => {
    setZoom(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const handlePanStart = (e) => {
    setIsPanning(true);
    setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
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

  // Función para renderizar elementos
  const renderElements = useMemo(() => {
    try {
      return elements.map((element) => {
        if (!element || !element.type) return null;
        
        switch (element.type) {
          case 'silla':
            return (
              <Silla
                key={element.id}
                silla={element}
                isSelected={selectedElements.includes(element.id)}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                getSeatColor={getSeatColor}
                getZonaColor={getZonaColor}
                getBorderColor={getBorderColor}
                showZones={true}
                selectedZone={null}
                showConnections={true}
                connectionStyle="dashed"
              />
            );
          case 'mesa':
            return (
              <Mesa
                key={element.id}
                mesa={element}
                isSelected={selectedElements.includes(element.id)}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
                getSeatColor={getSeatColor}
                getZonaColor={getZonaColor}
                getBorderColor={getBorderColor}
                showZones={true}
                selectedZone={null}
                showConnections={true}
                connectionStyle="dashed"
              />
            );
          case 'text':
            return (
              <Text
                key={element.id}
                x={element.x}
                y={element.y}
                text={element.text}
                fontSize={element.fontSize || 16}
                fill={element.fill || '#000'}
                fontStyle={element.fontStyle}
                draggable={true}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              />
            );
          case 'shape':
            return (
              <Rect
                key={element.id}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                draggable={true}
                onClick={() => handleElementClick(element.id)}
                onDragEnd={(e) => handleElementDragEnd(element.id, e)}
              />
            );
          default:
            return null;
        }
      });
    } catch (error) {
      console.error('Error renderizando elementos:', error);
      return null;
    }
  }, [elements, selectedElements, handleElementClick, handleElementDragEnd]);

  // Renderizar grid
  const renderGrid = useMemo(() => {
    try {
      if (!showGrid) return null;
      
      const gridLines = [];
      const stageWidth = 2000;
      const stageHeight = 2000;
      
      // Líneas verticales
      for (let i = 0; i <= stageWidth; i += gridSize) {
        gridLines.push(
          <Line
            key={`v-${i}`}
            points={[i, 0, i, stageHeight]}
            stroke="#e0e0e0"
            strokeWidth={0.5}
          />
        );
      }
      
      // Líneas horizontales
      for (let i = 0; i <= stageHeight; i += gridSize) {
        gridLines.push(
          <Line
            key={`h-${i}`}
            points={[0, i, stageWidth, i]}
            stroke="#e0e0e0"
            strokeWidth={0.5}
          />
        );
      }
      
      return gridLines;
    } catch (error) {
      console.error('Error renderizando grid:', error);
      return null;
    }
  }, [showGrid, gridSize]);

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
      {/* Panel izquierdo - Herramientas */}
      <aside className="editor-sidebar">
        <h3 className="editor-title">🛠 Editor de Mapa</h3>
        
        <div className="sala-info">
          <div className="info-row">
            <span>Sala:</span>
            <span className="info-value">{salaId}</span>
          </div>
          <div className="info-row">
            <span>Elementos:</span>
            <span className="info-value">{elements.length}</span>
          </div>
        </div>

        <div className="menu-section">
          <h4 className="section-header">Herramientas Básicas</h4>
          <div className="section-content">
            <Button 
              type="primary" 
              onClick={() => setShowTypeSelector(true)}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              🎯 Cambiar Tipo de Plano
            </Button>
            
            <Button 
              onClick={saveMapa}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              💾 Guardar Mapa
            </Button>
            
            <Button 
              onClick={clearSelection}
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              🧹 Limpiar Selección
            </Button>
          </div>
        </div>

        <div className="menu-section">
          <h4 className="section-header">Configuración de Grid</h4>
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <Switch
                checked={showGrid}
                onChange={setShowGrid}
              />
              <span>Mostrar Grid</span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Tamaño del Grid:</label>
              <Slider
                min={10}
                max={100}
                value={gridSize}
                onChange={setGridSize}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
          </div>
        </div>

        <div className="menu-section">
          <h4 className="section-header">Configuración de Asientos</h4>
          <div className="section-content">
            <div style={{ marginBottom: '1rem' }}>
              <label>Forma:</label>
              <Select
                value={seatShape}
                onChange={setSeatShape}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                <Select.Option value="circle">Círculo</Select.Option>
                <Select.Option value="square">Cuadrado</Select.Option>
              </Select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Tamaño:</label>
              <Slider
                min={10}
                max={50}
                value={seatSize}
                onChange={setSeatSize}
                style={{ marginTop: '0.5rem' }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Área principal del mapa */}
      <main className="map-area">
        {/* Controles superiores */}
        <div className="top-controls">
          <div className="control-group">
            <Button onClick={handleZoomIn}>🔍+</Button>
            <Button onClick={handleZoomOut}>🔍-</Button>
            <Button onClick={resetZoom}>🎯</Button>
          </div>
          
          <div className="saving-status">
            <span>✅ Mapa guardado: {lastSavedAt || 'Nunca'}</span>
          </div>
        </div>

        {/* Indicador de paneo */}
        {isPanning && (
          <div className="panning-indicator">
            <span>🖱️ Paneando - Haz clic para soltar</span>
          </div>
        )}

        {/* Stage de Konva */}
        <Stage
          ref={stageRef}
          width={window.innerWidth - 380}
          height={window.innerHeight - 100}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePosition.x}
          y={stagePosition.y}
          onMouseDown={handlePanStart}
          onMousemove={handlePanMove}
          onMouseup={handlePanEnd}
          onTouchstart={handlePanStart}
          onTouchmove={handlePanMove}
          onTouchend={handlePanEnd}
        >
          <Layer>
            {/* Grid de fondo */}
            {renderGrid}
            
            {/* Elementos del mapa */}
            {renderElements}
          </Layer>
        </Stage>

        {/* Controles de zoom */}
        <div className="zoom-controls">
          <Button onClick={handleZoomIn} className="zoom-button">🔍+</Button>
          <Button onClick={handleZoomOut} className="zoom-button">🔍-</Button>
          <Button onClick={resetZoom} className="zoom-button">🎯</Button>
        </div>
      </main>

      {/* Selector de tipos de plano */}
      {showTypeSelector && (
        <SeatmapTypeSelector
          visible={showTypeSelector}
          onSelect={handleTypeSelect}
          onCancel={handleTypeSelectorCancel}
        />
      )}
    </div>
  );
};

export default CrearMapa;
