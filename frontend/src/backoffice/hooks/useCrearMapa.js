import { useParams } from 'react-router-dom';
import { useEffect } from 'react';

import { useMapaState } from './useMapaState';
import { useMapaLoadingSaving } from './usemapaloadingsaving';
import { useMapaElements } from './useMapaElements';
import { useMapaSelection } from './useMapaSelection';
import { useMapaZones } from './usemapazones';
import { useMapaZoomStage } from './useMapaZoomStage';
import { useMapaGraphicalElements } from './useMapaGraphicalElements';

export const useCrearMapa = () => {
  const { salaId } = useParams();

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
        // Aquí debes tener tu función fetchZonasPorSala que trae las zonas desde backend
        const response = await fetch(`/api/zonas?salaId=${salaId}`);
        const data = await response.json();
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
    updateElementProperty,
    updateElementSize,
    deleteSelectedElements,
  } = useMapaElements(elements, setElements, selectedIds, selectedZone, numSillas);

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

  // Zoom y tamaño
  const {
    stageRef,
    stageSize,
    handleWheelZoom,
    zoomIn,
    zoomOut,
  } = useMapaZoomStage(zoom, setZoom);

  // Guardar y cargar mapa
  const {
    handleSave,
  } = useMapaLoadingSaving(salaId, elements, zones, setElements, setZones);

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
    updateElementProperty,
    updateElementSize,
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
