import { useParams } from 'react-router-dom';
import { useEffect, useRef, useCallback, useState } from 'react';
import { message } from 'antd';

import { useMapaState } from './useMapaState';
import { useMapaLoadingSaving } from './usemapaloadingsaving';
import { useMapaElements } from './useMapaElements';
import { useMapaSelection } from './useMapaSelection';
import { useMapaZones } from './usemapazones';
import { useMapaZoomStage } from './useMapaZoomStage';
import { useMapaGraphicalElements } from './useMapaGraphicalElements';
import { fetchZonasPorSala } from '../services/apibackoffice';
import { useTenant } from '../../contexts/TenantContext';

export const useCrearMapa = () => {
  const { salaId } = useParams();
  const { currentTenant } = useTenant();
  const hasLoadedInitialData = useRef(false); // Referencia para evitar recargas múltiples
  
  // Sistema de auto-guardado con debounce
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef(null);
  const autoSaveDelay = 2000; // 2 segundos de delay

  // Estado para modo de edición
  const [activeMode, setActiveMode] = useState('select');
  const [sectionPoints, setSectionPoints] = useState([]);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  
  // Estado para paneo
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  // Estado para escalado
  const [selectedScale, setSelectedScale] = useState(1.0);
  const [showScaleControls, setShowScaleControls] = useState(false);

  // Estado para estados de asientos
  const [selectedSeatState, setSelectedSeatState] = useState('available');

  // Estado para conexiones
  const [showConnections, setShowConnections] = useState(true);
  const [connectionStyle, setConnectionStyle] = useState('dashed');

  // Estado para fondo
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundScale, setBackgroundScale] = useState(1.0);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3);
  const [showBackgroundInWeb, setShowBackgroundInWeb] = useState(true);

  // Estado global
  const {
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
  } = useMapaState();

  // Cargar zonas al iniciar o cambiar salaId
  useEffect(() => {
    async function cargarZonas() {
      if (!salaId) return;
      try {
        const data = await fetchZonasPorSala(salaId);
        setZones(data);
      } catch (error) {
        console.error('Error cargando zonas:', error);
        setZones([]);
      }
    }
    cargarZonas();
  }, [salaId, setZones]);

  // Lógica mesas y sillas
  const {
    addMesa,
    addSillasToMesa,
    updateElementProperty: baseUpdateElementProperty,
    updateElementSize: baseUpdateElementSize,
    deleteSelectedElements,
         limpiarSillasDuplicadas: handleLimpiarSillasDuplicadas,
    snapToGrid,
         assignZoneToSelected: handleAssignZoneToSelected,
    
    // Nuevas funciones de escalado
    scaleElement,
    scaleSystem,
    
    // Nuevas funciones de estados de asientos
    changeSeatState,
    seatStates,
    
    // Nuevas funciones de conexiones
    autoConnectSeats,
    connectionThreshold,
    
    // Nuevas funciones de coordenadas precisas
    precisePositioning,
    snapToCustomGrid,
    
    // Nuevas funciones de fondo
    setBackgroundImage: baseSetBackgroundImage,
    updateBackground,
    removeBackground,
    backgroundSystem
  } = useMapaElements(elements, setElements, selectedIds, selectedZone, numSillas);

  // Wrappers to keep selectedElement in sync when editing properties or size
  const updatePropertyAndSelection = (id, property, value) => {
    baseUpdateElementProperty(id, property, value);
    if (selectedElement && selectedElement._id === id) {
      setSelectedElement(prev => ({ ...prev, [property]: value }));
    }
  };

  const updateSizeAndSelection = (id, width, height) => {
    baseUpdateElementSize(id, width, height);
    if (selectedElement && selectedElement._id === id) {
      setSelectedElement(prev => ({ ...prev, width, height }));
    }
  };

  // Funciones para agregar mesa cuadrada o circular que llaman a addMesa
  const agregarMesaCuadrada = () => addMesa('rect');
  const agregarMesaCircular = () => addMesa('circle');

  // Lógica elementos gráficos
  const {
    addTextElement,
    addRectangleElement,
    addEllipseElement,
    addLineElement,
    addChairRow,
    addSeccion,
  } = useMapaGraphicalElements(elements, setElements, selectedZone);

  // Lógica de selección
  const {
    selectElement,
    selectMultipleElements,
    clearSelection,
    selectGroup,
  } = useMapaSelection(elements, selectedIds, setSelectedIds, setSelectedElement);

  // Lógica de zonas
  const {
    addZone,
    updateZone,
    deleteZone,
    toggleZoneVisibility,
  } = useMapaZones(zones, setZones, selectedZone, setSelectedZone);

  // Lógica de zoom y stage
  const {
    handleZoom,
    resetZoom,
    centerStage,
  } = useMapaZoomStage(zoom, setZoom, setStagePosition);

  // Lógica de carga y guardado
  const {
    loadMapa,
    saveMapa,
    isLoading,
    isSaving,
    uploadProgress,
  } = useMapaLoadingSaving(elements, zones, salaId, currentTenant, setHasUnsavedChanges);

  // ===== NUEVAS FUNCIONES DE ESCALADO =====
  
  // Función para escalar elementos seleccionados
  const scaleSelectedElements = (scaleFactor) => {
    if (selectedIds.length === 0) {
      message.warning('Selecciona elementos para escalar');
      return;
    }

    selectedIds.forEach(id => {
      scaleElement(id, scaleFactor);
    });

    setSelectedScale(scaleFactor);
    message.success(`Elementos escalados a ${(scaleFactor * 100).toFixed(0)}%`);
  };

  // Función para escalar elemento específico
  const scaleElementById = (elementId, scaleFactor) => {
    scaleElement(elementId, scaleFactor);
    setSelectedScale(scaleFactor);
  };

  // ===== NUEVAS FUNCIONES DE ESTADOS DE ASIENTOS =====
  
  // Función para cambiar estado de asientos seleccionados
  const changeSelectedSeatsState = (newState) => {
    if (selectedIds.length === 0) {
      message.warning('Selecciona asientos para cambiar estado');
      return;
    }

    const asientosSeleccionados = elements.filter(el => 
      selectedIds.includes(el._id) && el.type === 'silla'
    );

    if (asientosSeleccionados.length === 0) {
      message.warning('Solo se pueden cambiar estados de asientos');
      return;
    }

    asientosSeleccionados.forEach(asiento => {
      changeSeatState(asiento._id, newState);
    });

    setSelectedSeatState(newState);
    message.success(`${asientosSeleccionados.length} asientos cambiados a estado: ${newState}`);
  };

  // Función para cambiar estado de todos los asientos de una mesa
  const changeMesaSeatsState = (mesaId, newState) => {
    const sillasMesa = elements.filter(el => 
      el.type === 'silla' && el.parentId === mesaId
    );

    if (sillasMesa.length === 0) {
      message.warning('Esta mesa no tiene asientos');
      return;
    }

    sillasMesa.forEach(asiento => {
      changeSeatState(asiento._id, newState);
    });

    message.success(`${sillasMesa.length} asientos de la mesa cambiados a estado: ${newState}`);
  };

  // ===== NUEVAS FUNCIONES DE CONEXIONES =====
  
  // Función para crear conexiones manuales
  const createManualConnection = (startSeatId, endSeatId) => {
    if (startSeatId === endSeatId) {
      message.error('No se puede conectar un asiento consigo mismo');
      return;
    }

    const startSeat = elements.find(el => el._id === startSeatId);
    const endSeat = elements.find(el => el._id === endSeatId);

    if (!startSeat || !endSeat || startSeat.type !== 'silla' || endSeat.type !== 'silla') {
      message.error('Solo se pueden conectar asientos');
      return;
    }

    // Verificar si ya existe una conexión
    const existingConnection = elements.find(el => 
      el.type === 'conexion' && 
      ((el.startSeatId === startSeatId && el.endSeatId === endSeatId) ||
       (el.startSeatId === endSeatId && el.endSeatId === startSeatId))
    );

    if (existingConnection) {
      message.warning('Ya existe una conexión entre estos asientos');
      return;
    }

    const nuevaConexion = {
      _id: `conexion_${Date.now()}`,
      type: 'conexion',
      startSeatId,
      endSeatId,
      stroke: '#8b93a6',
      strokeWidth: 2,
      opacity: 0.6,
      dash: connectionStyle === 'dashed' ? [5, 5] : undefined
    };

    setElements(prev => [...prev, nuevaConexion]);
    message.success('Conexión creada manualmente');
  };

  // Función para remover conexiones
  const removeConnections = (connectionIds) => {
    setElements(prev => prev.filter(el => 
      !(el.type === 'conexion' && connectionIds.includes(el._id))
    ));
    message.success('Conexiones removidas');
  };

  // Función para cambiar estilo de conexiones
  const changeConnectionStyle = (newStyle) => {
    setConnectionStyle(newStyle);
    setElements(prev => prev.map(el => {
      if (el.type === 'conexion') {
        return {
          ...el,
          dash: newStyle === 'dashed' ? [5, 5] : undefined
        };
      }
      return el;
    }));
    message.success(`Estilo de conexiones cambiado a: ${newStyle}`);
  };

  // ===== NUEVAS FUNCIONES DE FONDO =====
  
  // Función para establecer imagen de fondo
  const handleSetBackgroundImage = (imageUrl, options = {}) => {
    const backgroundOptions = {
      scale: backgroundScale,
      opacity: backgroundOpacity,
      position: { x: 0, y: 0 },
      showInWeb,
      showInEditor: true,
      ...options
    };

    baseSetBackgroundImage(imageUrl, backgroundOptions);
    setBackgroundImage(imageUrl);
  };

  // Función para actualizar propiedades del fondo
  const handleUpdateBackground = (updates) => {
    updateBackground(updates);
    
    if (updates.scale !== undefined) setBackgroundScale(updates.scale);
    if (updates.opacity !== undefined) setBackgroundOpacity(updates.opacity);
    if (updates.showInWeb !== undefined) setShowBackgroundInWeb(updates.showInWeb);
  };

  // Función para remover imagen de fondo
  const handleRemoveBackground = () => {
    removeBackground();
    setBackgroundImage(null);
    setBackgroundScale(1.0);
    setBackgroundOpacity(0.3);
  };

  // ===== FUNCIONES EXISTENTES MANTENIDAS =====

  // Función para duplicar elementos
  const duplicarElementos = () => {
    if (selectedIds.length === 0) {
      message.warning('Selecciona elementos para duplicar');
      return;
    }

    const elementosSeleccionados = elements.filter(el => selectedIds.includes(el._id));
    const nuevosElementos = [];

    elementosSeleccionados.forEach(elemento => {
      const nuevoElemento = {
        ...elemento,
        _id: `${elemento.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        posicion: {
          x: elemento.posicion.x + 50,
          y: elemento.posicion.y + 50
        }
      };

      // Si es una mesa, duplicar también sus sillas
      if (elemento.type === 'mesa') {
        const sillasMesa = elements.filter(el => 
          el.type === 'silla' && el.parentId === elemento._id
        );

        sillasMesa.forEach(silla => {
          const nuevaSilla = {
            ...silla,
            _id: `silla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            parentId: nuevoElemento._id,
            posicion: {
              x: silla.posicion.x + 50,
              y: silla.posicion.y + 50
            }
          };
          nuevosElementos.push(nuevaSilla);
        });
      }

      nuevosElementos.push(nuevoElemento);
    });

    setElements(prev => [...prev, ...nuevosElementos]);
    message.success(`${nuevosElementos.length} elementos duplicados`);
  };

  // Función para crear sección
  const crearSeccion = () => {
    setIsCreatingSection(true);
    setSectionPoints([]);
    setActiveMode('section');
    message.info('Modo sección activado - Haz clic para crear puntos de la sección');
  };

  // Función para manejar clics en modo sección
  const handleSectionClick = (event) => {
    if (!isCreatingSection || activeMode !== 'section') return;

    const stage = event.target.getStage();
    const point = stage.getPointerPosition();
    
    setSectionPoints(prev => {
      const newPoints = [...prev, point];
      
      // Si tenemos suficientes puntos, crear la sección
      if (newPoints.length >= 3) {
        const seccion = addSeccion(newPoints);
        setIsCreatingSection(false);
        setActiveMode('select');
        setSectionPoints([]);
        message.success('Sección creada exitosamente');
      }
      
      return newPoints;
    });
  };

  // Función para limpiar selección
  const limpiarSeleccion = () => {
    clearSelection();
    setSelectedElement(null);
    message.info('Selección limpiada');
  };

  // Función para asignar zona a elementos seleccionados
  const handleAssignZoneToSelected = (zoneId) => {
    if (!zoneId) {
      message.warning('Selecciona una zona válida');
      return;
    }
    
    assignZoneToSelected(zoneId);
  };

  // Función para ajustar a cuadrícula
  const handleSnapToGrid = (gridSize = 20) => {
    snapToCustomGrid(gridSize);
  };

  // Función para limpiar sillas duplicadas
  const handleLimpiarSillasDuplicadas = () => {
    limpiarSillasDuplicadas();
  };

  // Función para guardar
  const handleSave = () => {
    saveMapa();
  };

  // Funciones de paneo
  const handlePanStart = (event) => {
    if (event.evt.button === 1) { // Botón central del mouse
      setIsPanning(true);
      setPanStart({ x: event.evt.clientX, y: event.evt.clientY });
    }
  };

  const handlePanMove = (event) => {
    if (isPanning) {
      const deltaX = event.evt.clientX - panStart.x;
      const deltaY = event.evt.clientY - panStart.y;
      
      setStagePosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setPanStart({ x: event.evt.clientX, y: event.evt.clientY });
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Auto-guardado cuando hay cambios
  useEffect(() => {
    if (hasUnsavedChanges && !isSaving) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveMapa();
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, isSaving, saveMapa]);

  // Cargar mapa al iniciar
  useEffect(() => {
    if (!hasLoadedInitialData.current && salaId) {
      loadMapa();
      hasLoadedInitialData.current = true;
    }
  }, [salaId, loadMapa]);

  return {
    // Estados
    elements,
    zones,
    selectedIds,
    showZones,
    selectedZone,
    selectedElement,
    numSillas,
    zoom,
    selectionRect,
    sillaShape,
    activeMode,
    sectionPoints,
    isCreatingSection,
    isPanning,
    stagePosition,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    uploadProgress,
    
    // Estados de escalado
    selectedScale,
    showScaleControls,
    scaleSystem,
    
    // Estados de asientos
    selectedSeatState,
    seatStates,
    
    // Estados de conexiones
    showConnections,
    connectionStyle,
    connectionThreshold,
    
    // Estados de fondo
    backgroundImage,
    backgroundScale,
    backgroundOpacity,
    showBackgroundInWeb,
    backgroundSystem,
    
    // Funciones básicas
    addMesa,
    addSillasToMesa,
    updateElementProperty: updatePropertyAndSelection,
    updateElementSize: updateSizeAndSelection,
    deleteSelectedElements,
    limpiarSillasDuplicadas,
    snapToGrid: handleSnapToGrid,
    assignZoneToSelected,
    
    // Funciones de escalado
    scaleElement: scaleElementById,
    scaleSelectedElements,
    
    // Funciones de estados de asientos
    changeSeatState,
    changeSelectedSeatsState,
    changeMesaSeatsState,
    
    // Funciones de conexiones
    autoConnectSeats,
    createManualConnection,
    removeConnections,
    changeConnectionStyle,
    
    // Funciones de coordenadas precisas
    precisePositioning,
    snapToCustomGrid,
    
    // Funciones de fondo
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
    selectElement,
    selectMultipleElements,
    clearSelection,
    selectGroup,
    
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
    saveMapa: handleSave,
    
    // Funciones de duplicación y sección
    duplicarElementos,
    crearSeccion,
    handleSectionClick,
    limpiarSeleccion,
    
    // Funciones de paneo
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    
    // Setters
    setElements,
    setZones,
    setSelectedIds,
    setShowZones,
    setSelectedZone,
    setSelectedElement,
    setNumSillas,
    setZoom,
    setSelectionRect,
    setSillaShape,
    setActiveMode,
    setSectionPoints,
    setIsCreatingSection,
    setIsPanning,
    setStagePosition,
    setHasUnsavedChanges,
    setSelectedScale,
    setShowScaleControls,
    setSelectedSeatState,
    setShowConnections,
    setConnectionStyle,
    setBackgroundImage,
    setBackgroundScale,
    setBackgroundOpacity,
    setShowBackgroundInWeb
  };
};
