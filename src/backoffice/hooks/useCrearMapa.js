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
    limpiarSillasDuplicadas,
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
  } = useMapaGraphicalElements(elements, setElements, selectedZone, numSillas, sillaShape);

  // Lógica zoom y stage
  const {
    stageRef,
    stageSize,
    handleWheelZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    centerView,
  } = useMapaZoomStage(zoom, setZoom);

  // Selección y eventos
  const {
    selectElement,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useMapaSelection(
    elements,
    selectedIds,
    setSelectedIds,
    setSelectedElement,
    selectionRect,
    setSelectionRect,
    deleteSelectedElements
  );

  // Manejo de zonas en elementos
  const {
    assignZoneToSillas,
    assignZoneToSelected,
  } = useMapaZones(elements, setElements, selectedIds, selectedZone);



  // Carga y guardado del mapa
  const {
    isLoading,
    isSaving,
    lastSavedAt,
    loadMapa,
    handleSave: baseHandleSave,
    transformarParaGuardar
  } = useMapaLoadingSaving();

  // Wrapper para handleSave que incluye los parámetros necesarios
  const handleSave = () => {
    if (!salaId) {
      console.error('No hay sala seleccionada');
      return false;
    }
    console.log('[useCrearMapa] Ejecutando handleSave para sala:', salaId);
    const result = baseHandleSave(salaId, elements, zones);
    if (result) {
      setHasUnsavedChanges(false);
    }
    return result;
  };

  // Función de auto-guardado con debounce
  const scheduleAutoSave = useCallback(() => {
    setHasUnsavedChanges(true);
    
    // Limpiar timeout anterior si existe
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Programar nuevo auto-guardado
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges) {
        console.log('[useCrearMapa] Auto-guardando mapa...');
        handleSave();
      }
    }, autoSaveDelay);
  }, [hasUnsavedChanges, autoSaveDelay, handleSave]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Cargar mapa al iniciar SOLO cuando cambia salaId
  // Usar useCallback para estabilizar la función loadMapa
  const stableLoadMapa = useCallback((salaId) => {
    loadMapa(salaId, setElements, setZones);
  }, [loadMapa, setElements, setZones]);

  useEffect(() => {
    console.log('[useCrearMapa] useEffect ejecutándose:', {
      salaId,
      hasLoadedInitialData: hasLoadedInitialData.current
    });
    
    if (salaId && !hasLoadedInitialData.current) {
      console.log('[useCrearMapa] Cargando mapa inicial para sala:', salaId);
      hasLoadedInitialData.current = true;
      stableLoadMapa(salaId);
    }
  }, [salaId, stableLoadMapa]);

  // Función para eliminar elementos seleccionados
  const eliminarElementoSeleccionado = () => deleteSelectedElements();

  // Función para ajustar elementos a grid (imán)
  const ajustarElementosAGrid = () => {
    const gridSize = 20;
    setElements(prev =>
      prev.map(el => {
        const isSelected =
          selectedIds.includes(el._id) ||
          (el.type === 'silla' && selectedIds.includes(el.parentId));
        if (!isSelected) return el;
        const newX = Math.round(el.posicion.x / gridSize) * gridSize;
        const newY = Math.round(el.posicion.y / gridSize) * gridSize;
        return { ...el, posicion: { x: newX, y: newY } };
      })
    );
  };

  // Función para copiar elementos seleccionados
  const copiarElementos = () => {
    if (selectedIds.length === 0) return;
    const elementosACopiar = elements.filter(el => selectedIds.includes(el._id));
    localStorage.setItem('elementosCopiados', JSON.stringify(elementosACopiar));
    message.success(`${elementosACopiar.length} elementos copiados`);
  };

  // Función para pegar elementos copiados
  const pegarElementos = () => {
    const elementosCopiados = localStorage.getItem('elementosCopiados');
    if (!elementosCopiados) return;
    
    try {
      const elementos = JSON.parse(elementosCopiados);
      const nuevosElementos = elementos.map(el => ({
        ...el,
        _id: `element_${Date.now()}_${Math.random()}`,
        posicion: {
          x: el.posicion.x + 20,
          y: el.posicion.y + 20
        }
      }));
      
      setElements(prev => [...prev, ...nuevosElementos]);
      setSelectedIds(nuevosElementos.map(el => el._id));
      message.success(`${nuevosElementos.length} elementos pegados`);
    } catch (error) {
      console.error('Error al pegar elementos:', error);
    }
  };

  // Función para duplicar elementos seleccionados
  const duplicarElementos = () => {
    if (selectedIds.length === 0) return;
    const elementosADuplicar = elements.filter(el => selectedIds.includes(el._id));
    const nuevosElementos = elementosADuplicar.map(el => ({
      ...el,
      _id: `element_${Date.now()}_${Math.random()}`,
      posicion: {
        x: el.posicion.x + 20,
        y: el.posicion.y + 20
      }
    }));
    
    setElements(prev => [...prev, ...nuevosElementos]);
    setSelectedIds(nuevosElementos.map(el => el._id));
    message.success(`${nuevosElementos.length} elementos duplicados`);
  };

  // Función para crear sección personalizable
  const crearSeccion = () => {
    // Activar modo de creación de sección
    setActiveMode('section');
    message.info('Modo sección activado - Haz clic para crear puntos de la sección');
  };

  // Función para forma personalizable
  const formaPersonalizable = () => {
    // Activar modo de forma personalizable
    setActiveMode('freeform');
    message.info('Modo forma personalizable activado - Haz clic y arrastra para crear formas');
  };

  return {
    // Estados
    elements, setElements,
    selectedIds, setSelectedIds,
    zonas: zones,          // renombramos zones -> zonas
    setZonas: setZones,
    showZones, setShowZones,
    selectedZone, setSelectedZone,
    selectedElement, setSelectedElement,
    numSillas, setNumSillas,
    zoom, setZoom,
    selectionRect, setSelectionRect,
    sillaShape, setSillaShape,

    // Refs y tamaño
    stageRef,
    stageSize,

    // Funciones mesas y sillas
    addMesa,
    agregarMesaCuadrada,
    agregarMesaCircular,
    addSillasToMesa,
    updateElementProperty: updatePropertyAndSelection,
    updateElementSize: updateSizeAndSelection,
    deleteSelectedElements,
    eliminarElementoSeleccionado,
    limpiarSillasDuplicadas,

    // Selección y eventos
    selectElement,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,

    // Zonas
    assignZoneToSillas,
    assignZoneToSelected,

    // Zoom
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheelZoom,

    // Guardar
    handleSave,

    // Elementos gráficos
    addTextElement,
    addRectangleElement,
    addEllipseElement,
    addLineElement,
    addChairRow,

    // Snap grid
    snapToGrid: ajustarElementosAGrid,

    // Funciones adicionales
    copiarElementos,
    pegarElementos,
    duplicarElementos,
    crearSeccion,
    formaPersonalizable,
    
    // Auto-guardado
    scheduleAutoSave,
    hasUnsavedChanges,
    
    // Modo de edición
    activeMode,
    setActiveMode,
    sectionPoints,
    setSectionPoints,
    isCreatingSection,
    setIsCreatingSection,
  };
};
