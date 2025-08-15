import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Text, Ellipse, Line, Image, Circle } from 'react-konva';
import './CrearMapa.css';
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

  // Estados adicionales para funcionalidad simplificada
  const [syncLoading, setSyncLoading] = useState(false);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [addingChairRow, setAddingChairRow] = useState(false);
  const [rowStart, setRowStart] = useState(null);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [loadedZonas, setLoadedZonas] = useState([]);

  // Cargar zonas al iniciar
  useEffect(() => {
    const loadZonas = async () => {
      try {
        const zonasData = await fetchZonasPorSala(salaId);
        setLoadedZonas(zonasData);
      } catch (error) {
        console.error('Error cargando zonas:', error);
        setLoadedZonas([]);
      }
    };
    loadZonas();
  }, [salaId]);

  // Cargar mapa al iniciar
  useEffect(() => {
    if (salaId) {
      loadMapa();
    }
  }, [salaId, loadMapa]);

  // Agregar elementos de prueba si no hay ninguno
  useEffect(() => {
    if (elements.length === 0 && salaId) {
      // Agregar una mesa de prueba
      const mesaPrueba = {
        id: 'mesa-1',
        type: 'mesa',
        x: 200,
        y: 200,
        width: 120,
        height: 80,
        nombre: 'Mesa 1',
        zonaId: null,
        tenant_id: salaId, // Agregar tenant_id
        sillas: [
          {
            id: 'silla-1',
            type: 'silla',
            x: 10,
            y: 10,
            width: 20,
            height: 20,
            numero: 1,
            fila: 'A',
            zonaId: null,
            estado: 'available',
            shape: 'circle',
            tenant_id: salaId
          },
          {
            id: 'silla-2',
            type: 'silla',
            x: 35,
            y: 10,
            width: 20,
            height: 20,
            numero: 2,
            fila: 'A',
            zonaId: null,
            estado: 'available',
            shape: 'square',
            tenant_id: salaId
          },
          {
            id: 'silla-3',
            type: 'silla',
            x: 10,
            y: 35,
            width: 20,
            height: 20,
            numero: 3,
            fila: 'B',
            zonaId: null,
            estado: 'available',
            shape: 'circle',
            tenant_id: salaId
          },
          {
            id: 'silla-4',
            type: 'silla',
            x: 35,
            y: 35,
            width: 20,
            height: 20,
            numero: 4,
            fila: 'B',
            zonaId: null,
            estado: 'available',
            shape: 'square',
            tenant_id: salaId
          }
        ]
      };
      
      setElements([mesaPrueba]);
    }
  }, [elements.length, salaId, setElements]);

  const handleSyncSeats = async () => {
    setSyncLoading(true);
    try {
      await syncSeatsForSala(salaId, deleteMissing);
      message.success('Asientos sincronizados correctamente');
      await loadMapa();
    } catch (error) {
      message.error('Error sincronizando asientos: ' + error.message);
    } finally {
      setSyncLoading(false);
    }
  };

  // Funciones para los botones del menú
  const handleCrearMesa = () => {
    const nuevaMesa = {
      id: `mesa-${Date.now()}`,
      type: 'mesa',
      x: 300 + Math.random() * 100,
      y: 300 + Math.random() * 100,
      width: 120,
      height: 80,
      nombre: `Mesa ${elements.filter(e => e.type === 'mesa').length + 1}`,
      zonaId: null,
      tenant_id: salaId,
      sillas: []
    };
    setElements([...elements, nuevaMesa]);
    message.success('Mesa creada correctamente');
  };

  const handleCrearSeccion = () => {
    setActiveMode('section');
    setIsCreatingSection(true);
    message.info('Haz clic en el mapa para crear puntos de sección');
  };

  const handleCrearFilaAsientos = () => {
    const nuevaFila = {
      id: `fila-${Date.now()}`,
      type: 'fila',
      x: 100,
      y: 100,
      asientos: 6,
      fila: 'A',
      zonaId: null
    };
    // Aquí se implementaría la lógica para crear una fila de asientos
    message.info('Funcionalidad de fila de asientos en desarrollo');
  };

  const handleCrearAsiento = () => {
    const nuevoAsiento = {
      id: `silla-${Date.now()}`,
      type: 'silla',
      x: 150 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      width: 20,
      height: 20,
      numero: elements.filter(e => e.type === 'silla').length + 1,
      fila: 'A',
      zonaId: null,
      estado: 'available',
      shape: Math.random() > 0.5 ? 'circle' : 'square', // Forma aleatoria
      tenant_id: salaId
    };
    setElements([...elements, nuevoAsiento]);
    message.success('Asiento creado correctamente');
  };

  const handleCrearAsientoRedondo = () => {
    const nuevoAsiento = {
      id: `silla-${Date.now()}`,
      type: 'silla',
      x: 150 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      width: 20,
      height: 20,
      numero: elements.filter(e => e.type === 'silla').length + 1,
      fila: 'A',
      zonaId: null,
      estado: 'available',
      shape: 'circle',
      tenant_id: salaId
    };
    setElements([...elements, nuevoAsiento]);
    message.success('Asiento redondo creado correctamente');
  };

  const handleCrearAsientoCuadrado = () => {
    const nuevoAsiento = {
      id: `silla-${Date.now()}`,
      type: 'silla',
      x: 150 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      width: 20,
      height: 20,
      numero: elements.filter(e => e.type === 'silla').length + 1,
      fila: 'A',
      zonaId: null,
      estado: 'available',
      shape: 'square',
      tenant_id: salaId
    };
    setElements([...elements, nuevoAsiento]);
    message.success('Asiento cuadrado creado correctamente');
  };

  const handleGuardarMapa = async () => {
    try {
      await saveMapa();
      message.success('Mapa guardado correctamente');
    } catch (error) {
      message.error('Error guardando el mapa: ' + error.message);
    }
  };

  const handleLimpiarSeccion = () => {
    setSectionPoints([]);
    setIsCreatingSection(false);
    setActiveMode('select');
    message.info('Puntos de sección limpiados');
  };

  const handleEliminarSeleccionados = () => {
    if (selectedIds.length === 0) {
      message.warning('No hay elementos seleccionados');
      return;
    }
    const nuevosElementos = elements.filter(element => !selectedIds.includes(element.id));
    setElements(nuevosElementos);
    setSelectedIds([]);
    message.success(`${selectedIds.length} elemento(s) eliminado(s)`);
  };

  const handleLimpiarTodo = () => {
    setElements([]);
    setSelectedIds([]);
    setSectionPoints([]);
    setIsCreatingSection(false);
    setActiveMode('select');
    message.success('Mapa limpiado completamente');
  };

  // Renderizado simplificado de controles superiores
  const renderTopControls = () => (
    <div className="top-controls">
      <span className="control-label">Eliminar obsoletos</span>
      <Switch 
        checked={deleteMissing} 
        onChange={setDeleteMissing}
      />
      <Button 
        type="primary" 
        onClick={handleSyncSeats}
        loading={syncLoading}
      >
        Sincronizar seats
      </Button>
      <Button 
        onClick={handleCrearMesa}
      >
        Crear Mesa Prueba
      </Button>
      <Button 
        type="primary"
        onClick={handleGuardarMapa}
        loading={isSaving}
      >
        💾 Guardar
      </Button>
      <Button 
        danger
        onClick={handleEliminarSeleccionados}
        disabled={selectedIds.length === 0}
      >
        🗑️ Eliminar ({selectedIds.length})
      </Button>
      <Button 
        danger
        onClick={handleLimpiarTodo}
        disabled={elements.length === 0}
      >
        🧹 Limpiar Todo
      </Button>
      <Button 
        onClick={() => setShowAdvancedControls(true)}
      >
        🐛 Debug Elementos
      </Button>
    </div>
  );

  // Renderizado de estado de guardado
  const renderSavingStatus = () => (
    <div className="saving-status">
      <span>
        ✅ Mapa guardado: {new Date().toLocaleTimeString()}
      </span>
    </div>
  );

  // Renderizado de elementos del mapa
  const renderElements = useMemo(() => {
    return elements.map((element) => {
      if (element.type === 'mesa') {
        return (
          <Mesa
            key={element.id}
            mesa={element}
            isSelected={selectedIds.includes(element.id)}
            onClick={() => selectElement(element.id)}
            onDragEnd={(e) => {
              updateElementProperty(element.id, 'x', e.target.x());
              updateElementProperty(element.id, 'y', e.target.y());
            }}
            getSeatColor={getSeatColor}
            getZonaColor={getZonaColor}
            getBorderColor={getBorderColor}
            showZones={showZones}
            selectedZone={selectedZone}
            showConnections={showConnections}
            connectionStyle={connectionStyle}
          />
        );
      } else if (element.type === 'silla') {
        return (
          <Silla
            key={element.id}
            silla={element}
            isSelected={selectedIds.includes(element.id)}
            onClick={() => selectElement(element.id)}
            onDragEnd={(e) => {
              updateElementProperty(element.id, 'x', e.target.x());
              updateElementProperty(element.id, 'y', e.target.y());
            }}
            getSeatColor={getSeatColor}
            getZonaColor={getZonaColor}
            getBorderColor={getBorderColor}
            showZones={showZones}
            selectedZone={selectedZone}
            showConnections={showConnections}
            connectionStyle={connectionStyle}
          />
        );
      }
      return null;
    });
  }, [elements, selectedIds, showZones, selectedZone, showConnections, connectionStyle, getSeatColor, getZonaColor, getBorderColor]);

  // Renderizado de zonas
  const renderZonas = useMemo(() => {
    if (!showZones) return null;
    return zones.map((zona) => (
      <Zonas
        key={zona.id}
        zona={zona}
        isSelected={selectedZone?.id === zona.id}
        onClick={() => setSelectedZone(zona)}
        getZonaColor={getZonaColor}
      />
    ));
  }, [zones, showZones, selectedZone, getZonaColor]);

  // Renderizado de cuadrícula
  const renderGrid = useMemo(() => (
    <Grid 
      gridSize={20} 
      width={window.innerWidth - 320} 
      height={window.innerHeight} 
    />
  ), []);

  // Renderizado de puntos de sección
  const renderSectionPoints = useMemo(() => {
    return sectionPoints.map((point, index) => (
      <Circle
        key={index}
        x={point.x}
        y={point.y}
        radius={5}
        fill="#0066FF"
        stroke="#0033CC"
        strokeWidth={2}
        onClick={() => handleSectionClick(point)}
      />
    ));
  }, [sectionPoints]);

  // Manejadores de eventos del stage
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
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Funciones de zoom mejoradas
  const handleZoomIn = () => {
    const newZoom = zoom * 1.2;
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = zoom / 1.2;
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const handleStageClick = (e) => {
    if (e.target === e.target.getStage()) {
      if (activeMode === 'section' && isCreatingSection) {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();
        const newPoint = {
          x: pointer.x,
          y: pointer.y
        };
        setSectionPoints([...sectionPoints, newPoint]);
        message.success(`Punto de sección agregado: ${sectionPoints.length + 1}`);
      } else {
        clearSelection();
      }
    }
  };



  return (
    <div className="crear-mapa-container" data-testid="crear-mapa">
      {/* Panel derecho - Información y acciones pendientes */}
      <div className="info-panel">
        <div className="topRightInfo" id="topRightInfo">
          <div className="labelingMessages" id="labelingMessages">
            <label className="error-title">
              Acciones pendientes
            </label>
            <div className="info-item" id="numberOfUnlabeledSeats">
              <span className="info-count">4</span> Asientos sin numeración &nbsp;
              <a href="#" className="info-link">
                <i className="fas fa-eye"></i>
              </a>
            </div>
            <div className="info-item" id="numberOfUnlabeledTables">
              <span className="info-count">1</span> Mesas sin numeración
            </div>
            <div className="info-item">
              <span className="info-count">{selectedIds.length}</span> Elementos seleccionados
            </div>
            <div className="info-item">
              <span className="info-count">{elements.length}</span> Elementos totales
            </div>
            {sectionPoints.length > 0 && (
              <div className="info-item">
                <span className="info-count">{sectionPoints.length}</span> Puntos de sección
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel izquierdo - MenuMapa simplificado */}
      <aside className="editor-sidebar">
        <h3 className="editor-title">🛠 Editor de Mapa</h3>
        
        {/* Información de la sala */}
        <div className="sala-info">
          <div className="sala-info-row">
            <span className="sala-info-label">Sala</span>
            <span className="sala-info-value">sala 1</span>
          </div>
          <div className="sala-info-row">
            <span className="sala-info-label">Asientos</span>
            <span className="sala-info-value">{elements.filter(e => e.type === 'silla').length}</span>
          </div>
        </div>

        {/* Modos de edición */}
        <div className="edit-modes">
          <h4>Modos de Edición</h4>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${activeMode === 'select' ? 'active' : ''}`}
              onClick={() => setActiveMode('select')}
            >
              👆 Seleccionar
            </button>
            <button 
              className={`mode-button ${activeMode === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveMode('edit')}
            >
              ✏️ Editar
            </button>
          </div>
        </div>

        {/* Menú principal */}
        <div className="main-menu">
          <div className="menu-tabs">
            <button className="menu-tab active">
              ✏️ Editar
            </button>
            <button className="menu-tab">
              🔢 Numeración
            </button>
            <button className="menu-tab">
              ⚙️ Config
            </button>
          </div>
          
          <div className="menu-content">
            {/* Secciones */}
            <div className="menu-section">
              <button className="section-header">
                <span>Secciones</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up">
                  <path d="m18 15-6-6-6 6"></path>
                </svg>
              </button>
              <div className="section-content">
                <button className="section-button" onClick={handleCrearSeccion}>
                  📐 Crear Sección
                </button>
                {sectionPoints.length > 0 && (
                  <button className="section-button" onClick={handleLimpiarSeccion} style={{ marginTop: '0.5rem', backgroundColor: '#f56565', color: 'white' }}>
                    🗑️ Limpiar Sección ({sectionPoints.length})
                  </button>
                )}
                <p className="section-help">Haz clic en el mapa para crear puntos de sección</p>
              </div>
            </div>

            {/* Filas de Asientos */}
            <div className="menu-section">
              <button className="section-header">
                <span>Filas de Asientos</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
              <div className="section-content">
                <button className="section-button" onClick={handleCrearFilaAsientos}>
                  🪑 Crear Fila de Asientos
                </button>
                <p className="section-help">Crea una fila de asientos numerados</p>
              </div>
            </div>

            {/* Zonas No Numeradas */}
            <div className="menu-section">
              <button className="section-header">
                <span>Zonas No Numeradas</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
              <div className="section-content">
                <button className="section-button" onClick={handleCrearAsiento}>
                  🪑 Crear Asiento Individual
                </button>
                <button className="section-button" onClick={handleCrearAsientoRedondo} style={{ marginTop: '0.5rem', backgroundColor: '#48BB78' }}>
                  🔵 Asiento Redondo
                </button>
                <button className="section-button" onClick={handleCrearAsientoCuadrado} style={{ marginTop: '0.5rem', backgroundColor: '#ED8936' }}>
                  ⬜ Asiento Cuadrado
                </button>
                <p className="section-help">Crea asientos individuales en el mapa</p>
              </div>
            </div>

            {/* Mesas */}
            <div className="menu-section">
              <button className="section-header">
                <span>Mesas</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
            </div>

            {/* Formas */}
            <div className="menu-section">
              <button className="section-header">
                <span>Formas</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
            </div>

            {/* Textos */}
            <div className="menu-section">
              <button className="section-header">
                <span>Textos</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Zonas y Ajustes */}
        <div className="menu-section">
          <button className="section-header">
            <span>Zonas y Ajustes</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </button>
        </div>

        {/* Herramientas de Selección */}
        <div className="menu-section">
          <button className="section-header">
            <span>Herramientas de Selección</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </button>
        </div>

        {/* Configuración de Sillas */}
        <div className="menu-section">
          <button className="section-header">
            <span>Configuración de Sillas</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </button>
          <div className="section-content">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button className="section-button" style={{ flex: 1, backgroundColor: '#48BB78', color: 'white' }}>
                🔵 Redondos
              </button>
              <button className="section-button" style={{ flex: 1, backgroundColor: '#ED8936', color: 'white' }}>
                ⬜ Cuadrados
              </button>
            </div>
            <p className="section-help">Configura la forma predeterminada de los asientos</p>
          </div>
        </div>

        {/* Herramientas */}
        <div className="menu-section">
          <button className="section-header">
            <span>Herramientas</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </button>
        </div>
      </aside>

      {/* Área principal del mapa */}
      <div className="map-area">
        {/* Controles superiores */}
        {renderTopControls()}
        
        {/* Estado de guardado */}
        {renderSavingStatus()}
        
        {/* Indicador de paneo */}
        {isPanning && (
          <div className="panning-indicator">
            🖱️ Paneando mapa... Haz clic para soltar
          </div>
        )}
        
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
        
        {/* Controles de zoom */}
        <div className="zoom-controls">
          <button 
            className="zoom-button primary" 
            title="Zoom In"
            onClick={handleZoomIn}
          >
            🔍+
          </button>
          <button 
            className="zoom-button primary" 
            title="Zoom Out"
            onClick={handleZoomOut}
          >
            🔍-
          </button>
          <button 
            className="zoom-button secondary" 
            title="Reset Zoom"
            onClick={handleResetZoom}
          >
            🎯
          </button>
        </div>
        
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
