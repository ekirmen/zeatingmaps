import React, { useEffect, useState, useMemo, useRef } from 'react';
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
    
    // Estados de fila de asientos
    isCreatingSeatRow, setIsCreatingSeatRow,
    seatRowStart, setSeatRowStart,
    seatRowDirection, setSeatRowDirection,
    
    // Estados de paneo
    isPanning, setIsPanning,
    stagePosition, setStagePosition,
    hasUnsavedChanges, setHasUnsavedChanges,
    isLoading, setIsLoading,
    isSaving, setIsSaving,
    uploadProgress, setUploadProgress,
    
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
    
    // Funciones de fila de asientos
    iniciarFilaAsientos,
    actualizarFilaAsientos,
    finalizarFilaAsientos,
    añadirSillasAFila,
    handleSeatRowSelect,
    
    // Funciones de paneo
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    
  } = useCrearMapa();

  const { getSeatColor, getZonaColor, getBorderColor } = useSeatColors();

  // Estados locales adicionales
  const [loadedZonas, setLoadedZonas] = useState([]);
  const [salaInfo, setSalaInfo] = useState(null);
  const [loadingSala, setLoadingSala] = useState(false);
  const [showNumeracion, setShowNumeracion] = useState(false);
  const [addingChairRow, setAddingChairRow] = useState(false);
  const [rowStart, setRowStart] = useState(null);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  
  // Estados para búsqueda de sala eliminados - ya no se necesitan

  // Referencias
  const stageRef = useRef();
  const isDraggingRef = useRef(false);

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
        limpiarSeleccion();
      }
    }
  };

  const handleElementClick = (elementId, e) => {
    e.cancelBubble = true;
    
    if (e.evt.ctrlKey || e.evt.metaKey) {
      // Selección múltiple con Ctrl/Cmd
      // Implementar selección múltiple si es necesario
      selectElement(elementId);
    } else {
      // Selección simple
      selectElement(elementId);
    }
    
    // Si es una silla de una fila, mostrar el tooltip
    const element = elements.find(el => el._id === elementId);
    if (element && element.type === 'silla' && element.esFila) {
      // Buscar la primera silla de la fila para mostrar el tooltip
      const primeraSilla = elements.find(el => 
        el.type === 'silla' && el.filaId === element.filaId
      );
      if (primeraSilla) {
        // Pasar la información al MenuMapa para mostrar el tooltip
        // Esto se manejará a través del selectedElement
      }
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
        x: Math.round(newPos.x),
        y: Math.round(newPos.y)
      });
    }
  };

  // ===== RENDERIZADO DE ELEMENTOS =====
  
  const renderElements = useMemo(() => {
    console.log('Renderizando elementos:', elements.length, elements);
    
    // Filtrar elementos válidos
    const validElements = elements.filter(element => 
      element && 
      element._id && 
      element.type && 
      element.posicion && 
      typeof element.posicion.x === 'number' && 
      typeof element.posicion.y === 'number'
    );
    
    console.log('Elementos válidos:', validElements.length, validElements);
    
    return validElements.map(element => {
      const isSelected = selectedIds.includes(element._id);
      
      switch (element.type) {
        case 'mesa':
          if (!element.width || !element.height) {
            console.warn('Mesa sin dimensiones válidas:', element);
            return null;
          }
          return (
            <Mesa
              key={element._id}
              element={element}
              isSelected={isSelected}
              onClick={(e) => handleElementClick(element._id, e)}
              onDoubleClick={(e) => handleElementDoubleClick(element._id, e)}
              onDragEnd={(e) => handleElementDragEnd(element._id, e)}
              draggable={activeMode === 'select'}
            />
          );
          
        case 'silla':
          if (!element.radius) {
            console.warn('Silla sin radio válido:', element);
            return null;
          }
          return (
            <Silla
              key={element._id}
              element={element}
              isSelected={isSelected}
              onClick={(e) => handleElementClick(element._id, e)}
              onDragEnd={(e) => handleElementDragEnd(element._id, e)}
              draggable={activeMode === 'select'}
            />
          );
          
        case 'text':
          if (!element.text) {
            console.warn('Texto sin contenido válido:', element);
            return null;
          }
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
          if (!element.width || !element.height) {
            console.warn('Rectángulo sin dimensiones válidas:', element);
            return null;
          }
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
          if (!element.radius) {
            console.warn('Círculo sin radio válido:', element);
            return null;
          }
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
          if (!element.points || !Array.isArray(element.points) || element.points.length < 4) {
            console.warn('Línea sin puntos válidos:', element);
            return null;
          }
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
  }, [elements, selectedIds, activeMode]);

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
    return (
      <Grid
        size={20}
        scale={zoom}
        stagePosition={stagePosition}
      />
    );
  }, [zoom, stagePosition]);

  // ===== RENDERIZADO DE ZONAS =====
  
  const renderZonas = useMemo(() => {
    console.log('Renderizando zonas:', { 
      showZones, 
      zonesCount: zones.length, 
      loadedZonasCount: loadedZonas.length,
      zones, 
      loadedZonas 
    });
    
    if (!showZones) {
      console.log('Zonas deshabilitadas');
      return null;
    }
    
    // Usar loadedZonas en lugar de zones si zones está vacío
    const zonasParaRenderizar = zones.length > 0 ? zones : loadedZonas;
    
    if (!zonasParaRenderizar || zonasParaRenderizar.length === 0) {
      console.log('No hay zonas disponibles para renderizar');
      return null;
    }
    
    console.log('Renderizando zonas:', zonasParaRenderizar);
    
    return (
      <Zonas
        zones={zonasParaRenderizar}
        selectedZone={selectedZone}
        onZoneSelect={setSelectedZone}
        onZoneToggle={() => {}} // Implementar si es necesario
      />
    );
  }, [showZones, zones, loadedZonas, selectedZone]);

  // ===== RENDERIZADO DE CONTROLES SUPERIORES =====
  
  const renderTopControls = () => (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg p-3 flex items-center space-x-3">
      {/* Información de Sala */}
      <div className="flex items-center space-x-2">
        <div className="text-sm font-medium text-gray-900">
          Sala: {salaInfo ? salaInfo.nombre : 'Cargando...'}
        </div>
        {salaInfo && (
          <div className="text-xs text-gray-500">
            Asientos: {elements.filter(el => el.type === 'silla').length}
          </div>
        )}
      </div>
      
      <div className="w-px h-6 bg-gray-300" />
      
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
      <Tooltip title="Reset Zoom (100%)">
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            setZoom(1.0);
            setStagePosition({ x: 0, y: 0 });
          }}
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
      
      {/* Toggle Zonas */}
      <Tooltip title={showZones ? "Ocultar Zonas" : "Mostrar Zonas"}>
        <Button
          icon={<SettingOutlined />}
          onClick={() => setShowZones(!showZones)}
          type={showZones ? 'primary' : 'default'}
          size="small"
        >
          Zonas
        </Button>
      </Tooltip>
      
      <div className="w-px h-6 bg-gray-300" />
      
      {/* Limpiar Elementos Inválidos */}
      <Tooltip title="Limpiar Elementos Inválidos">
         <Button
           icon={<ReloadOutlined />}
           onClick={limpiarElementosInvalidos}
           size="small"
           danger
         />
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
  
  // Esta función ya no se usa, la información se muestra en los controles superiores

  // ===== CARGA INICIAL =====
  
  useEffect(() => {
    if (!salaId) return;
    
    const cargarDatos = async () => {
      try {
        setIsLoading(true);
        
        // Cargar zonas y información de la sala en paralelo
        console.log('Cargando zonas y datos de sala...');
        const [zonasData, salaData] = await Promise.all([
          fetchZonasPorSala(salaId),
          fetchSalaById(salaId)
        ]);
        
        console.log('Zonas cargadas:', zonasData);
        console.log('Datos de sala:', salaData);
        
        setLoadedZonas(zonasData);
        setSalaInfo(salaData);
        
                 // Cargar mapa existente
         console.log('Cargando mapa para sala:', salaId);
         await loadMapa(salaId);
         console.log('Mapa cargado, elementos:', elements);
         
         // Limpiar elementos inválidos después de cargar
         setTimeout(() => {
           limpiarElementosInvalidos();
         }, 1000);
         
       } catch (error) {
        console.error('Error cargando datos:', error);
        message.error('Error cargando datos de la sala');
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarDatos();
  }, [salaId, loadMapa]);

  // Inicializar búsqueda de salas eliminado - ya no se necesita

  // Establecer zoom inicial a 100%
  useEffect(() => {
    setZoom(1.0);
    setStagePosition({ x: 0, y: 0 });
    
    // Habilitar zonas por defecto
    setShowZones(true);
    console.log('Estado inicial: zonas habilitadas, zoom 100%');
  }, []);

  // Cargar información de la sala
  useEffect(() => {
    const loadSalaInfo = async () => {
      if (!salaId) return;
      
      setLoadingSala(true);
      try {
        console.log('Cargando información de la sala:', salaId);
        
        const salaData = await fetchSalaById(salaId);
        setSalaInfo({
          id: salaData.id,
          nombre: salaData.nombre,
          asientos: 0 // Esto se puede calcular después
        });
        console.log('Información de la sala cargada:', salaData);
      } catch (error) {
        console.error('Error al cargar información de la sala:', error);
        // En caso de error, usar información básica
        setSalaInfo({
          id: salaId,
          nombre: `Sala ${salaId}`,
          asientos: 0
        });
      } finally {
        setLoadingSala(false);
      }
    };

    loadSalaInfo();
  }, [salaId]);

  // Funciones de búsqueda de salas eliminadas - ya no se necesitan

  // ===== LIMPIEZA DE ELEMENTOS INVÁLIDOS =====
  
  const limpiarElementosInvalidos = () => {
    const elementosValidos = elements.filter(element => 
      element && 
      element._id && 
      element.type && 
      element.posicion && 
      typeof element.posicion.x === 'number' && 
      typeof element.posicion.y === 'number'
    );
    
    if (elementosValidos.length !== elements.length) {
      console.log(`Limpiando elementos inválidos: ${elements.length} -> ${elementosValidos.length}`);
      setElements(elementosValidos);
      message.info(`Se limpiaron ${elements.length - elementosValidos.length} elementos inválidos`);
    }
  };

  // ===== SINCRONIZACIÓN DE ASIENTOS =====
  
  const handleSyncSeats = async () => {
    if (!salaId) return;
    
    try {
      setSyncLoading(true);
      await syncSeatsForSala(salaId, deleteMissing);
      message.success('Asientos sincronizados correctamente');
      
      // Recargar mapa después de sincronización
      await loadMapa(salaId);
      
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
        
        // Funciones básicas
        updateElementProperty={updateElementProperty}
        updateElementSize={updateElementSize}
        duplicarElementos={duplicarElementos}
        crearSeccion={crearSeccion}
        limpiarSeleccion={limpiarSeleccion}
        assignZoneToSelected={assignZoneToSelected}
        
        // Funciones de fila de asientos
        iniciarFilaAsientos={iniciarFilaAsientos}
        actualizarFilaAsientos={actualizarFilaAsientos}
        finalizarFilaAsientos={finalizarFilaAsientos}
        añadirSillasAFila={añadirSillasAFila}
        
        // Funciones existentes
        addMesa={addMesa}
        addSillasToMesa={addSillasToMesa}
        snapToGrid={snapToGrid}
        setActiveMode={setActiveMode}
        setNumSillas={setNumSillas}
        setSillaShape={setSillaShape}
        
        // Funciones para el tooltip
        setElements={setElements}
        handleSeatRowSelect={handleSeatRowSelect}
        
        // Elementos del mapa
        elements={elements}
        
        // Dirección de fila de asientos
        seatRowDirection={seatRowDirection}
      />

      {/* Área principal del mapa */}
      <div className="flex-1 relative">
        {/* Controles superiores */}
        {renderTopControls()}
        
                 {/* Indicador de paneo */}
         {renderPanningIndicator()}
         
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
            onAdd={() => {}} // Implementar si es necesario
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
