import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Text, Ellipse, Line, Image } from 'react-konva';
import { Mesa, Silla } from './compMapa/MesaSilla';
import Grid from './compMapa/Grid';
import Zonas from './compMapa/Zonas';
import MenuMapa from './compMapa/MenuMapa';
import EditPopup from './compMapa/EditPopup';
import FilaPopup from './compMapa/FilaPopup';
import AdvancedEditPopup from './compMapa/AdvancedEditPopup';
import { useCrearMapa } from '../hooks/useCrearMapa';
import { fetchZonasPorSala, fetchSalaById } from '../services/apibackoffice';
import { message, Switch, Button, Progress, Tooltip } from 'antd';
import { syncSeatsForSala } from '../services/apibackoffice';
import { useSeatColors } from '../../hooks/useSeatColors';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  SaveOutlined, 
  UndoOutlined,
  RedoOutlined,
  ReloadOutlined,
  PictureOutlined,
  LinkOutlined,
  SettingOutlined
} from '@ant-design/icons';

const CrearMapa = () => {
  const { salaId } = useParams();

  const {
    // Estados básicos
    elements, setElements,
    zones, setZones,
    selectedIds, setSelectedIds,
    showZones, setShowZones,
    selectedZone, setSelectedZone,
    selectedElement, setSelectedElement,
    numSillas, setNumSillas,
    zoom, setZoom,
    selectionRect, setSelectionRect,
    sillaShape, setSillaShape,
    activeMode, setActiveMode,
    sectionPoints, setSectionPoints,
    isCreatingSection, setIsCreatingSection,
    isPanning, setIsPanning,
    stagePosition, setStagePosition,
    hasUnsavedChanges, setHasUnsavedChanges,
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    uploadProgress, setUploadProgress,
    
    // Nuevos estados de escalado
    selectedScale, setSelectedScale,
    showScaleControls, setShowScaleControls,
    scaleSystem,
    
    // Nuevos estados de asientos
    selectedSeatState, setSelectedSeatState,
    seatStates,
    
    // Nuevos estados de conexiones
    showConnections, setShowConnections,
    connectionStyle, setConnectionStyle,
    connectionThreshold, setConnectionThreshold,
    
    // Nuevos estados de fondo
    backgroundImage, setBackgroundImage,
    backgroundScale, setBackgroundScale,
    backgroundOpacity, setBackgroundOpacity,
    showBackgroundInWeb, setShowBackgroundInWeb,
    backgroundSystem,
    
    // Funciones básicas
    addMesa,
    addSillasToMesa,
    selectElement,
    selectGroup,
    updateElementProperty,
    updateElementSize,
    deleteSelectedElements,
    limpiarSillasDuplicadas,
    snapToGrid,
    assignZoneToSelected,
    
    // Nuevas funciones de escalado
    scaleElement,
    scaleSelectedElements,
    
    // Nuevas funciones de estados de asientos
    changeSeatState,
    changeSelectedSeatsState,
    changeMesaSeatsState,
    
    // Nuevas funciones de conexiones
    autoConnectSeats,
    createManualConnection,
    removeConnections,
    changeConnectionStyle,
    
    // Nuevas funciones de coordenadas precisas
    precisePositioning,
    snapToCustomGrid,
    
    // Nuevas funciones de fondo
    setBackgroundImage: handleSetBackgroundImage,
    updateBackground: handleUpdateBackground,
    removeBackground: handleRemoveBackground,
    
    // Funciones de elementos gráficos
    addTextElement,
    addRectangleElement,
    addEllipseElement,
    addLineElement,
    addChairRow,
    addSeccion,
    
    // Funciones de selección
    selectMultipleElements,
    clearSelection,
    
    // Funciones de zonas
    addZone,
    updateZone,
    deleteZone,
    toggleZoneVisibility,
    
    // Funciones de zoom y stage
    handleZoom,
    resetZoom,
    centerStage,
    
    // Funciones de carga y guardado
    loadMapa,
    saveMapa,
    
    // Funciones de duplicación y sección
    duplicarElementos,
    crearSeccion,
    handleSectionClick,
    limpiarSeleccion,
    
    // Funciones de paneo
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    

  } = useCrearMapa();

  const { getSeatColor, getZonaColor, getBorderColor } = useSeatColors();

  // Estados locales adicionales
  const [loadedZonas, setLoadedZonas] = useState([]);
  const [salaInfo, setSalaInfo] = useState(null);
  const [showNumeracion, setShowNumeracion] = useState(false);
  const [addingChairRow, setAddingChairRow] = useState(false);
  const [rowStart, setRowStart] = useState(null);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  // ===== MANEJADORES DE EVENTOS =====
  
  const handleStageWheel = (e) => {
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
  };

  const handleStageClick = (e) => {
    if (activeMode === 'section') {
      handleSectionClick(e);
    } else {
      // Selección normal
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        clearSelection();
      }
    }
  };

  const handleElementClick = (elementId, e) => {
    e.cancelBubble = true;
    
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Selección múltiple con Ctrl/Cmd
      selectMultipleElements(elementId);
    } else {
      // Selección simple
      selectElement(elementId);
    }
  };

  const handleElementDoubleClick = (elementId, e) => {
    e.cancelBubble = true;
    
    const element = elements.find(el => el._id === elementId);
    if (element && element.type === 'mesa') {
      selectGroup(elementId);
    }
  };

  const handleElementDragEnd = (elementId, e) => {
    const element = elements.find(el => el._id === elementId);
    if (element) {
      const newPos = e.target.position();
      updateElementProperty(elementId, 'posicion', {
        x: precisePositioning.round(newPos.x),
        y: precisePositioning.round(newPos.y)
      });
    }
  };

  // ===== RENDERIZADO DE ELEMENTOS =====
  
  const renderElements = useMemo(() => {
    return elements.map(element => {
      const isSelected = selectedIds.includes(element._id);
      
      switch (element.type) {
        case 'mesa':
          return (
            <Mesa
              key={element._id}
              element={element}
              isSelected={isSelected}
              onClick={(e) => handleElementClick(element._id, e)}
              onDoubleClick={(e) => handleElementDoubleClick(element._id, e)}
              onDragEnd={(e) => handleElementDragEnd(element._id, e)}
              draggable={activeMode === 'select'}
              scale={element.scale || 1}
            />
          );
          
        case 'silla':
          return (
            <Silla
              key={element._id}
              element={element}
              isSelected={isSelected}
              onClick={(e) => handleElementClick(element._id, e)}
              onDragEnd={(e) => handleElementDragEnd(element._id, e)}
              draggable={activeMode === 'select'}
              scale={element.scale || 1}
              fill={element.fill || seatStates.available.fill}
              stroke={element.stroke || seatStates.available.stroke}
              opacity={element.opacity || seatStates.available.opacity}
            />
          );
          
        case 'conexion':
          if (!showConnections) return null;
          
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
              stroke={element.stroke}
              strokeWidth={element.strokeWidth}
              opacity={element.opacity}
              dash={element.dash}
            />
          );
          
        case 'background':
          if (!element.showInEditor) return null;
          
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
          
        case 'seccion':
          return (
            <Line
              key={element._id}
              points={element.points.flatMap(p => [p.x, p.y])}
              fill={element.fill}
              stroke={element.stroke}
              strokeWidth={element.strokeWidth}
              closed={true}
              opacity={0.3}
            />
          );
          
        case 'text':
          return (
            <Text
              key={element._id}
              x={element.posicion.x}
              y={element.posicion.y}
              text={element.text}
              fontSize={element.fontSize || 16}
              fill={element.fill || '#000'}
              draggable={activeMode === 'select'}
              onClick={(e) => handleElementClick(element._id, e)}
              onDragEnd={(e) => handleElementDragEnd(element._id, e)}
            />
          );
          
        case 'rect':
          return (
            <Rect
              key={element._id}
              x={element.posicion.x}
              y={element.posicion.y}
              width={element.width}
              height={element.height}
              fill={element.fill || 'transparent'}
              stroke={element.stroke || '#000'}
              strokeWidth={element.strokeWidth || 1}
              draggable={activeMode === 'select'}
              onClick={(e) => handleElementClick(element._id, e)}
              onDragEnd={(e) => handleElementDragEnd(element._id, e)}
            />
          );
          
        case 'circle':
          return (
            <Ellipse
              key={element._id}
              x={element.posicion.x}
              y={element.posicion.y}
              radiusX={element.radius}
              radiusY={element.radius}
              fill={element.fill || 'transparent'}
              stroke={element.stroke || '#000'}
              strokeWidth={element.strokeWidth || 1}
              draggable={activeMode === 'select'}
              onClick={(e) => handleElementClick(element._id, e)}
              onDragEnd={(e) => handleElementDragEnd(element._id, e)}
            />
          );
          
        case 'line':
          return (
            <Line
              key={element._id}
              points={element.points}
              stroke={element.stroke || '#000'}
              strokeWidth={element.strokeWidth || 1}
              draggable={activeMode === 'select'}
              onClick={(e) => handleElementClick(element._id, e)}
              onDragEnd={(e) => handleElementDragEnd(element._id, e)}
            />
          );
          
        default:
          return null;
      }
    });
  }, [elements, selectedIds, activeMode, showConnections, seatStates, precisePositioning]);

  // ===== RENDERIZADO DE PUNTOS DE SECCIÓN =====
  
  const renderSectionPoints = useMemo(() => {
    if (!isCreatingSection || sectionPoints.length === 0) return null;
    
    return (
      <>
        {/* Línea que conecta los puntos */}
        {sectionPoints.length > 1 && (
          <Line
            points={sectionPoints.flatMap(p => [p.x, p.y])}
            stroke="#FF6B6B"
            strokeWidth={2}
            dash={[5, 5]}
          />
        )}
        
        {/* Puntos individuales */}
        {sectionPoints.map((point, index) => (
          <Ellipse
            key={index}
            x={point.x}
            y={point.y}
            radiusX={4}
            radiusY={4}
            fill="#FF6B6B"
            stroke="#D63031"
            strokeWidth={1}
          />
        ))}
      </>
    );
  }, [isCreatingSection, sectionPoints]);

  // ===== RENDERIZADO DE CUADRÍCULA =====
  
  const renderGrid = useMemo(() => {
    if (!showScaleControls) return null;
    
    return (
      <Grid
        size={20}
        scale={zoom}
        stagePosition={stagePosition}
        showScale={true}
        scaleSystem={scaleSystem}
      />
    );
  }, [showScaleControls, zoom, stagePosition, scaleSystem]);

  // ===== RENDERIZADO DE ZONAS =====
  
  const renderZonas = useMemo(() => {
    if (!showZones) return null;
    
    return (
      <Zonas
        zones={zones}
        selectedZone={selectedZone}
        onZoneSelect={setSelectedZone}
        onZoneToggle={toggleZoneVisibility}
      />
    );
  }, [showZones, zones, selectedZone, toggleZoneVisibility]);

  // ===== RENDERIZADO DE CONTROLES SUPERIORES =====
  
  const renderTopControls = () => (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg p-3 flex items-center space-x-3">
      {/* Zoom */}
      <div className="flex items-center space-x-2">
        <Tooltip title="Zoom Out">
          <Button
            icon={<ZoomOutOutlined />}
            onClick={() => handleZoom(zoom * 0.9)}
            size="small"
          />
        </Tooltip>
        <span className="text-sm font-medium min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Tooltip title="Zoom In">
          <Button
            icon={<ZoomInOutlined />}
            onClick={() => handleZoom(zoom * 1.1)}
            size="small"
          />
        </Tooltip>
      </div>
      
      <div className="w-px h-6 bg-gray-300" />
      
      {/* Reset Zoom */}
      <Tooltip title="Reset Zoom">
        <Button
          icon={<ReloadOutlined />}
          onClick={resetZoom}
          size="small"
        />
      </Tooltip>
      
      <div className="w-px h-6 bg-gray-300" />
      
      {/* Guardar */}
      <Tooltip title="Guardar Mapa">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={saveMapa}
          loading={isSaving}
          size="small"
        >
          Guardar
        </Button>
      </Tooltip>
      
      <div className="w-px h-6 bg-gray-300" />
      
      {/* Controles Avanzados */}
      <Tooltip title="Controles Avanzados">
        <Button
          icon={<SettingOutlined />}
          onClick={() => setShowAdvancedControls(!showAdvancedControls)}
          type={showAdvancedControls ? 'primary' : 'default'}
          size="small"
        />
      </Tooltip>
    </div>
  );

  // ===== RENDERIZADO DE INDICADOR DE PANEO =====
  
  const renderPanningIndicator = () => {
    if (!isPanning) return null;
    
    return (
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
        🖱️ Paneando mapa...
      </div>
    );
  };

  // ===== RENDERIZADO DE PROGRESO DE GUARDADO =====
  
  const renderSavingProgress = () => {
    if (!isSaving) return null;
    
    return (
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
        <div className="flex items-center space-x-2 mb-2">
          <SaveOutlined className="text-blue-600" />
          <span className="text-sm font-medium">Guardando mapa...</span>
        </div>
        <Progress percent={uploadProgress} size="small" />
      </div>
    );
  };

  // ===== RENDERIZADO DE ESTADO DE CAMBIOS =====
  
  const renderChangesStatus = () => {
    if (!hasUnsavedChanges) return null;
    
    return (
      <div className="absolute bottom-4 left-4 z-10 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg">
        ⚠️ Cambios sin guardar
      </div>
    );
  };

  // ===== RENDERIZADO DE INFORMACIÓN DE SALA =====
  
  const renderSalaInfo = () => {
    if (!salaInfo) return null;
    
    return (
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <div className="text-sm font-medium text-gray-900">{salaInfo.nombre}</div>
        <div className="text-xs text-gray-500">
          {elements.filter(el => el.type === 'silla').length} asientos
        </div>
        <div className="text-xs text-gray-500">
          {elements.filter(el => el.type === 'mesa').length} mesas
        </div>
      </div>
    );
  };

  // ===== CARGA INICIAL =====
  
  useEffect(() => {
    if (!salaId) return;
    
    const cargarDatos = async () => {
      try {
        setIsLoading(true);
        
        // Cargar zonas y información de la sala en paralelo
        const [zonasData, salaData] = await Promise.all([
          fetchZonasPorSala(salaId),
          fetchSalaById(salaId)
        ]);
        
        setLoadedZonas(zonasData);
        setSalaInfo(salaData);
        
        // Cargar mapa existente
        await loadMapa();
        
      } catch (error) {
        console.error('Error cargando datos:', error);
        message.error('Error cargando datos de la sala');
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, [salaId, loadMapa]);

  // ===== SINCRONIZACIÓN DE ASIENTOS =====
  
  const handleSyncSeats = async () => {
    if (!salaId) return;
    
    try {
      setSyncLoading(true);
      await syncSeatsForSala(salaId, deleteMissing);
      message.success('Asientos sincronizados correctamente');
      
      // Recargar mapa después de sincronización
      await loadMapa();
      
    } catch (error) {
      console.error('Error sincronizando asientos:', error);
      message.error('Error sincronizando asientos');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Panel izquierdo - MenuMapa */}
      <MenuMapa
        // Estados básicos
        selectedElement={selectedElement}
        activeMode={activeMode}
        sectionPoints={sectionPoints}
        isCreatingSection={isCreatingSection}
        zones={loadedZonas}
        selectedZone={selectedZone}
        numSillas={numSillas}
        sillaShape={sillaShape}
        
        // Nuevos estados de escalado
        selectedScale={selectedScale}
        showScaleControls={showScaleControls}
        scaleSystem={scaleSystem}
        
        // Nuevos estados de asientos
        selectedSeatState={selectedSeatState}
        seatStates={seatStates}
        
        // Nuevos estados de conexiones
        showConnections={showConnections}
        connectionStyle={connectionStyle}
        connectionThreshold={connectionThreshold}
        
        // Nuevos estados de fondo
        backgroundImage={backgroundImage}
        backgroundScale={backgroundScale}
        backgroundOpacity={backgroundOpacity}
        showBackgroundInWeb={showBackgroundInWeb}
        backgroundSystem={backgroundSystem}
        
        // Funciones básicas
        updateElementProperty={updateElementProperty}
        updateElementSize={updateElementSize}
        duplicarElementos={duplicarElementos}
        crearSeccion={crearSeccion}
        limpiarSeleccion={limpiarSeleccion}
        assignZoneToSelected={assignZoneToSelected}
        
        // Nuevas funciones de escalado
        scaleElement={scaleElement}
        scaleSelectedElements={scaleSelectedElements}
        
        // Nuevas funciones de estados de asientos
        changeSeatState={changeSeatState}
        changeSelectedSeatsState={changeSelectedSeatsState}
        changeMesaSeatsState={changeMesaSeatsState}
        
        // Nuevas funciones de conexiones
        autoConnectSeats={autoConnectSeats}
        createManualConnection={createManualConnection}
        removeConnections={removeConnections}
        changeConnectionStyle={changeConnectionStyle}
        
        // Nuevas funciones de coordenadas precisas
        precisePositioning={precisePositioning}
        snapToCustomGrid={snapToCustomGrid}
        
        // Nuevas funciones de fondo
        setBackgroundImage={handleSetBackgroundImage}
        updateBackground={handleUpdateBackground}
        removeBackground={handleRemoveBackground}
        
        // Funciones existentes
        addMesa={addMesa}
        addSillasToMesa={addSillasToMesa}
        snapToGrid={snapToGrid}
        setActiveMode={setActiveMode}
        setNumSillas={setNumSillas}
        setSillaShape={setSillaShape}
      />

      {/* Área principal del mapa */}
      <div className="flex-1 relative">
        {/* Controles superiores */}
        {renderTopControls()}
        
        {/* Indicador de paneo */}
        {renderPanningIndicator()}
        
        {/* Información de sala */}
        {renderSalaInfo()}
        
        {/* Progreso de guardado */}
        {renderSavingProgress()}
        
        {/* Estado de cambios */}
        {renderChangesStatus()}
        
        {/* Stage de Konva */}
        <Stage
          width={window.innerWidth - 320} // 320px para el panel izquierdo
          height={window.innerHeight}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleStageWheel}
          onClick={handleStageClick}
          onMouseDown={handlePanStart}
          onMousemove={handlePanMove}
          onMouseup={handlePanEnd}
          draggable={false}
        >
          {/* Capa de fondo */}
          <Layer>
            {/* Cuadrícula */}
            {renderGrid}
            
            {/* Zonas */}
            {renderZonas}
          </Layer>
          
          {/* Capa principal */}
          <Layer>
            {/* Elementos del mapa */}
            {renderElements}
            
            {/* Puntos de sección */}
            {renderSectionPoints}
            
            {/* Rectángulo de selección */}
            {selectionRect && (
              <Rect
                x={selectionRect.startX}
                y={selectionRect.startY}
                width={selectionRect.endX - selectionRect.startX}
                height={selectionRect.endY - selectionRect.startY}
                stroke="#0066FF"
                strokeWidth={1}
                dash={[5, 5]}
                fill="rgba(0, 102, 255, 0.1)"
              />
            )}
          </Layer>
        </Stage>
        
        {/* Popups y modales */}
        {selectedElement && (
          <EditPopup
            element={selectedElement}
            onUpdate={updateElementProperty}
            onClose={() => setSelectedElement(null)}
          />
        )}
        
        {addingChairRow && (
          <FilaPopup
            onAdd={addChairRow}
            onClose={() => setAddingChairRow(false)}
            startPoint={rowStart}
          />
        )}
        
        {showAdvancedControls && (
          <AdvancedEditPopup
            onClose={() => setShowAdvancedControls(false)}
            onSyncSeats={handleSyncSeats}
            syncLoading={syncLoading}
            deleteMissing={deleteMissing}
            setDeleteMissing={setDeleteMissing}
          />
        )}
      </div>
    </div>
  );
};

export default CrearMapa;
