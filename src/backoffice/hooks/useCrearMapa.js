import { useParams } from 'react-router-dom';
import { useEffect, useRef, useCallback } from 'react';

import { useMapaState } from './useMapaState';
import { useMapaLoadingSaving } from './usemapaloadingsaving';
import { useMapaElements } from './useMapaElements';
import { useMapaSelection } from './useMapaSelection';
import { useMapaZones } from './usemapazones';
import { useMapaZoomStage } from './useMapaZoomStage';
import { useMapaGraphicalElements } from './useMapaGraphicalElements';
import { fetchZonasPorSala } from '../services/apibackoffice';

export const useCrearMapa = () => {
  const { salaId } = useParams();
  const hasLoadedInitialData = useRef(false); // Referencia para evitar recargas múltiples

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

  // Zoom y stage
  const {
    stageRef,
    stageSize,
    zoomIn,
    zoomOut,
    handleWheelZoom,
  } = useMapaZoomStage();

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
    return baseHandleSave(salaId, elements, zones);
  };

  // Cargar mapa al iniciar SOLO cuando cambia salaId
  // Usar useCallback para estabilizar la función loadMapa
  const stableLoadMapa = useCallback((salaId, setElements, setZones) => {
    loadMapa(salaId, setElements, setZones);
  }, [loadMapa]);

  useEffect(() => {
    console.log('[useCrearMapa] useEffect ejecutándose:', {
      salaId,
      hasLoadedInitialData: hasLoadedInitialData.current
    });
    
    if (salaId && !hasLoadedInitialData.current) {
      console.log('[useCrearMapa] Cargando mapa inicial para sala:', salaId);
      hasLoadedInitialData.current = true;
      stableLoadMapa(salaId, setElements, setZones);
    }
  }, [salaId, stableLoadMapa, setElements, setZones]);

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
  };
};
