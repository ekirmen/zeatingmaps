// Hook simplificado que combina funcionalidades de mapas
import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';
import { useMapaScaling } from './useMapaScaling';
import { useMapaSeatStates } from './useMapaSeatStates';
import { useMapaPositioning } from './useMapaPositioning';
import { useMapaBackground } from './useMapaBackground';
import { useMapaConnections } from './useMapaConnections';
import { useMapaSeats } from './useMapaSeats';

export const useMapaElementsSimplified = (elements, setElements, selectedIds, selectedZone, numSillas) => {
  // Hooks especializados
  const { scaleElement, scaleSystem } = useMapaScaling(elements, setElements);
  const { changeSeatState, seatStates } = useMapaSeatStates(elements, setElements);
  const { precisePositioning, snapToCustomGrid, snapToGrid } = useMapaPositioning(elements, setElements);
  const { setBackgroundImage, updateBackground, removeBackground, backgroundSystem } = useMapaBackground(elements, setElements);
  const { autoConnectSeats, connectionThreshold } = useMapaConnections(elements, setElements);
  const { addSillasToMesa, limpiarSillasDuplicadas } = useMapaSeats(elements, setElements, selectedZone, numSillas);

  // Creación de mesa
  const addMesa = (shape = 'rect') => {
    const id = 'mesa_' + uuidv4();
    const nuevaMesa = {
      _id: id,
      type: 'mesa',
      shape,
      posicion: { x: 200, y: 200 },
      radius: shape === 'circle' ? 60 : undefined,
      width: shape === 'rect' ? 120 : undefined,
      height: shape === 'rect' ? 80 : undefined,
      nombre: 'Mesa ' + (elements.filter(e => e.type === 'mesa').length + 1),
      sillas: [],
      zonaId: selectedZone?.id || null,
      fila: '',
      scale: 1.0
    };
    setElements(prev => [...prev, nuevaMesa]);
    return nuevaMesa;
  };

  // Asignar zona a elementos seleccionados
  const assignZoneToSelected = (zoneId) => {
    if (!zoneId) return;
    
    setElements(prev => prev.map(el => {
      if (selectedIds.includes(el._id)) {
        return { ...el, zonaId: zoneId };
      }
      return el;
    }));
    
    message.success('Zona asignada a elementos seleccionados');
  };

  // Actualizar propiedades de elementos
  const updateElementProperty = (id, property, value) => {
    setElements(prev => prev.map(el => {
      if (el._id === id) {
        if (property === 'posicion' && value.x !== undefined && value.y !== undefined) {
          if (!precisePositioning.validate(value.x, value.y)) {
            message.error('Coordenadas fuera de rango válido');
            return el;
          }
          value = {
            x: precisePositioning.round(value.x),
            y: precisePositioning.round(value.y)
          };
        }
        
        return { ...el, [property]: value };
      }
      return el;
    }));
  };

  // Actualizar tamaño de elementos
  const updateElementSize = (id, newWidth, newHeight) => {
    setElements(prev =>
      prev.map(el =>
        el._id === id ? { ...el, width: newWidth, height: newHeight } : el
      )
    );
  };

  // Eliminar elementos seleccionados
  const deleteSelectedElements = () => {
    setElements(prev => prev.filter(el => {
      if (selectedIds.includes(el._id)) return false;
      if (el.type === 'silla' && selectedIds.includes(el.parentId)) return false;
      if (el.type === 'conexion' && 
          (selectedIds.includes(el.startSeatId) || selectedIds.includes(el.endSeatId))) return false;
      return true;
    }));
  };

  return {
    // Funciones básicas
    addMesa,
    addSillasToMesa,
    updateElementProperty,
    updateElementSize,
    deleteSelectedElements,
    limpiarSillasDuplicadas,
    snapToGrid,
    assignZoneToSelected,
    
    // Funciones de escalado
    scaleElement,
    scaleSystem,
    
    // Funciones de estados de asientos
    changeSeatState,
    seatStates,
    
    // Funciones de conexiones
    autoConnectSeats,
    connectionThreshold,
    
    // Funciones de coordenadas precisas
    precisePositioning,
    snapToCustomGrid,
    
    // Funciones de fondo
    setBackgroundImage,
    updateBackground,
    removeBackground,
    backgroundSystem
  };
};
