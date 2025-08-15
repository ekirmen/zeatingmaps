import { useParams } from 'react-router-dom';
import { useEffect, useRef, useCallback, useState } from 'react';
import { message } from 'antd';

import { useMapaState } from './useMapaState';
import { useMapaLoadingSaving } from './usemapaloadingsaving';
import { useMapaElements } from './useMapaElements';
import { useMapaSelection } from './useMapaSelection';
import { useMapaZones } from './usemapazones';
import { useMapaZoomStage } from './useMapaZoomStage';
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
  
  // Estado para filas de asientos
  const [isCreatingSeatRow, setIsCreatingSeatRow] = useState(false);
  const [seatRowStart, setSeatRowStart] = useState(null);
  const [seatRowDirection, setSeatRowDirection] = useState('horizontal'); // 'horizontal' o 'vertical'
  
  // Estado para paneo
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

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

  // Lógica de selección
  const {
    selectElement,
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

  // Función para iniciar creación de fila de asientos
  const iniciarFilaAsientos = (event) => {
    const stage = event.target.getStage();
    const point = stage.getPointerPosition();
    
    setIsCreatingSeatRow(true);
    setSeatRowStart(point);
    setActiveMode('fila-asientos');
    
    // Crear la primera silla
    const primeraSilla = {
      _id: `silla_${Date.now()}`,
      type: 'silla',
      posicion: { x: point.x, y: point.y },
      width: 20,
      height: 20,
      fill: '#20B2AA',
      stroke: '#008B8B',
      strokeWidth: 1,
      numero: 1,
      filaId: `fila_${Date.now()}`,
      esFila: true
    };
    
    setElements(prev => [...prev, primeraSilla]);
    message.info('Modo fila de asientos activado - Arrastra para crear más asientos');
  };

  // Función para actualizar fila de asientos durante el arrastre
  const actualizarFilaAsientos = (event) => {
    if (!isCreatingSeatRow || !seatRowStart) return;
    
    const stage = event.target.getStage();
    const currentPoint = stage.getPointerPosition();
    
    // Determinar dirección (horizontal o vertical)
    const deltaX = Math.abs(currentPoint.x - seatRowStart.x);
    const deltaY = Math.abs(currentPoint.y - seatRowStart.y);
    
    if (deltaX > deltaY) {
      setSeatRowDirection('horizontal');
    } else {
      setSeatRowDirection('vertical');
    }
    
    // Calcular cuántas sillas necesitamos
    const spacing = 25; // Espacio entre sillas
    let numSillasNecesarias;
    
    if (seatRowDirection === 'horizontal') {
      numSillasNecesarias = Math.floor(deltaX / spacing) + 1;
    } else {
      numSillasNecesarias = Math.floor(deltaY / spacing) + 1;
    }
    
    // Limitar a un máximo razonable
    numSillasNecesarias = Math.min(numSillasNecesarias, 20);
    
    // Obtener sillas existentes de esta fila
    const sillasExistentes = elements.filter(el => 
      el.type === 'silla' && el.filaId === elements[elements.length - 1]?.filaId
    );
    
    // Si necesitamos más sillas, crearlas
    if (numSillasNecesarias > sillasExistentes.length) {
      const nuevasSillas = [];
      
      for (let i = sillasExistentes.length; i < numSillasNecesarias; i++) {
        let nuevaPosicion;
        
        if (seatRowDirection === 'horizontal') {
          nuevaPosicion = {
            x: seatRowStart.x + (i * spacing),
            y: seatRowStart.y
          };
        } else {
          nuevaPosicion = {
            x: seatRowStart.x,
            y: seatRowStart.y + (i * spacing)
          };
        }
        
        const nuevaSilla = {
          _id: `silla_${Date.now()}_${i}`,
          type: 'silla',
          posicion: nuevaPosicion,
          width: 20,
          height: 20,
          fill: '#20B2AA',
          stroke: '#008B8B',
          strokeWidth: 1,
          numero: i + 1,
          filaId: sillasExistentes[0]?.filaId || `fila_${Date.now()}`,
          esFila: true
        };
        
        nuevasSillas.push(nuevaSilla);
      }
      
      setElements(prev => [...prev, ...nuevasSillas]);
    }
  };

  // Función para finalizar fila de asientos
  const finalizarFilaAsientos = () => {
    if (!isCreatingSeatRow) return;
    
    setIsCreatingSeatRow(false);
    setSeatRowStart(null);
    setActiveMode('select');
    
    const sillasCreadas = elements.filter(el => 
      el.type === 'silla' && el.esFila && el.filaId === elements[elements.length - 1]?.filaId
    );
    
    message.success(`Fila de asientos creada con ${sillasCreadas.length} asientos`);
  };

  // Función para añadir sillas a una fila existente
  const añadirSillasAFila = (filaId, cantidad = 1, direccion = 'derecha') => {
    const sillasFila = elements.filter(el => 
      el.type === 'silla' && el.filaId === filaId
    );
    
    if (sillasFila.length === 0) return;
    
    // Ordenar sillas por posición
    const sillasOrdenadas = [...sillasFila].sort((a, b) => {
      if (seatRowDirection === 'horizontal') {
        return a.posicion.x - b.posicion.x;
      } else {
        return a.posicion.y - b.posicion.y;
      }
    });
    
    const ultimaSilla = sillasOrdenadas[sillasOrdenadas.length - 1];
    const primeraSilla = sillasOrdenadas[0];
    const spacing = 25;
    
    const nuevasSillas = [];
    
    for (let i = 0; i < cantidad; i++) {
      let nuevaPosicion;
      
      if (direccion === 'derecha' || direccion === 'abajo') {
        if (seatRowDirection === 'horizontal') {
          nuevaPosicion = {
            x: ultimaSilla.posicion.x + ((i + 1) * spacing),
            y: ultimaSilla.posicion.y
          };
        } else {
          nuevaPosicion = {
            x: ultimaSilla.posicion.x,
            y: ultimaSilla.posicion.y + ((i + 1) * spacing)
          };
        }
      } else {
        if (seatRowDirection === 'horizontal') {
          nuevaPosicion = {
            x: primeraSilla.posicion.x - ((i + 1) * spacing),
            y: primeraSilla.posicion.y
          };
        } else {
          nuevaPosicion = {
            x: primeraSilla.posicion.x,
            y: primeraSilla.posicion.y - ((i + 1) * spacing)
          };
        }
      }
      
      const nuevaSilla = {
        _id: `silla_${Date.now()}_${i}`,
        type: 'silla',
        posicion: nuevaPosicion,
        width: 20,
        height: 20,
        fill: '#20B2AA',
        stroke: '#008B8B',
        strokeWidth: 1,
        numero: direccion === 'derecha' || direccion === 'abajo' 
          ? ultimaSilla.numero + i + 1 
          : primeraSilla.numero - i - 1,
        filaId: filaId,
        esFila: true
      };
      
      nuevasSillas.push(nuevaSilla);
    }
    
    setElements(prev => [...prev, ...nuevasSillas]);
    message.success(`${cantidad} sillas añadidas a la fila`);
  };

  // Función para manejar la selección de filas de asientos
  const handleSeatRowSelect = (element) => {
    if (element && element.esFila) {
      // Aquí podrías agregar lógica adicional si es necesaria
      // Por ahora solo retornamos true para indicar que es una fila válida
      return true;
    }
    return false;
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
        // Crear una línea simple como sección
        const seccion = {
          _id: `seccion_${Date.now()}`,
          type: 'line',
          points: newPoints.flatMap(p => [p.x, p.y]),
          stroke: '#FF6B6B',
          strokeWidth: 2,
          closed: true
        };
        
        setElements(prev => [...prev, seccion]);
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

  // Función para ajustar a cuadrícula
  const handleSnapToGrid = (gridSize = 20) => {
    snapToGrid(gridSize);
  };

  // Función para guardar
  const handleSave = () => {
    if (salaId && elements && zones) {
      saveMapa(salaId, elements, zones);
    } else {
      console.warn('[handleSave] Datos insuficientes para guardar:', { salaId, elementsCount: elements?.length, zonesCount: zones?.length });
    }
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
        if (salaId && elements && zones) {
          saveMapa(salaId, elements, zones);
        }
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
      loadMapa(salaId);
      hasLoadedInitialData.current = true;
      
      // Centrar el stage inicialmente para que se vea el contenido
      const centerX = (window.innerWidth - 320) / 2;
      const centerY = window.innerHeight / 2;
      setStagePosition({ x: centerX, y: centerY });
    }
  }, [salaId, loadMapa, setElements, setZones]);

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
    
    // Estados de fila de asientos
    isCreatingSeatRow,
    seatRowStart,
    seatRowDirection,
    
    // Funciones básicas
    addMesa,
    addSillasToMesa,
    updateElementProperty: updatePropertyAndSelection,
    updateElementSize: updateSizeAndSelection,
    deleteSelectedElements,
    limpiarSillasDuplicadas: handleLimpiarSillasDuplicadas,
    snapToGrid: handleSnapToGrid,
    assignZoneToSelected: handleAssignZoneToSelected,
    
    // Funciones de selección
    selectElement,
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
    
    // Setters de fila de asientos
    setIsCreatingSeatRow,
    setSeatRowStart,
    setSeatRowDirection
  };
};
