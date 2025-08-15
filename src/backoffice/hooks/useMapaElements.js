import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';

export const useMapaElements = (elements, setElements, selectedIds, selectedZone, numSillas) => {

  // ===== SISTEMA DE ESCALADO AVANZADO =====
  const scaleSystem = {
    min: 0.1,
    max: 3.0,
    step: 0.1,
    default: 1.0
  };

  // Función para escalar elementos proporcionalmente
  const scaleElement = (elementId, scaleFactor) => {
    setElements(prev => prev.map(el => {
      if (el._id === elementId) {
        const newScale = Math.max(scaleSystem.min, Math.min(scaleSystem.max, scaleFactor));
        return {
          ...el,
          scale: newScale,
          width: el.width ? el.width * newScale : el.width,
          height: el.height ? el.height * newScale : el.height,
          radius: el.radius ? el.radius * newScale : el.radius
        };
      }
      return el;
    }));
  };

  // ===== ESTADOS VISUALES DE ASIENTOS =====
  const seatStates = {
    available: { fill: '#00d6a4', stroke: '#a8aebc', opacity: 1 },
    selected: { fill: '#008e6d', stroke: '#696f7d', opacity: 1 },
    occupied: { fill: '#ff6b6b', stroke: '#d63031', opacity: 0.8 },
    blocked: { fill: '#6c5ce7', stroke: '#5f3dc4', opacity: 0.7 },
    reserved: { fill: '#fdcb6e', stroke: '#e17055', opacity: 0.9 }
  };

  // Función para cambiar estado de asiento
  const changeSeatState = (seatId, newState) => {
    if (!seatStates[newState]) return;
    
    setElements(prev => prev.map(el => {
      if (el._id === seatId && el.type === 'silla') {
        return {
          ...el,
          state: newState,
          fill: seatStates[newState].fill,
          stroke: seatStates[newState].stroke,
          opacity: seatStates[newState].opacity
        };
      }
      return el;
    }));
  };

  // ===== LÍNEAS DE CONEXIÓN INTELIGENTES =====
  const connectionThreshold = 50; // Distancia máxima para conectar asientos

  // Función para conectar asientos automáticamente
  const autoConnectSeats = (mesaId) => {
    const mesa = elements.find(el => el._id === mesaId);
    if (!mesa || mesa.type !== 'mesa') return;

    const sillasMesa = elements.filter(el => el.type === 'silla' && el.parentId === mesaId);
    if (sillasMesa.length < 2) return;

    // Crear conexiones entre asientos cercanos
    const nuevasConexiones = [];
    
    for (let i = 0; i < sillasMesa.length; i++) {
      for (let j = i + 1; j < sillasMesa.length; j++) {
        const silla1 = sillasMesa[i];
        const silla2 = sillasMesa[j];
        
        const distance = Math.sqrt(
          Math.pow(silla1.posicion.x - silla2.posicion.x, 2) + 
          Math.pow(silla1.posicion.y - silla2.posicion.y, 2)
        );
        
        if (distance <= connectionThreshold) {
          nuevasConexiones.push({
            _id: `conexion_${uuidv4()}`,
            type: 'conexion',
            startSeatId: silla1._id,
            endSeatId: silla2._id,
            stroke: '#8b93a6',
            strokeWidth: 2,
            opacity: 0.6,
            dash: [5, 5]
          });
        }
      }
    }

    // Agregar conexiones al mapa
    setElements(prev => [...prev, ...nuevasConexiones]);
    
    if (nuevasConexiones.length > 0) {
      message.success(`Se crearon ${nuevasConexiones.length} conexiones automáticas`);
    }
  };

  // ===== SISTEMA DE COORDENADAS DE ALTA PRECISIÓN =====
  const precisePositioning = {
    // Redondear a 2 decimales para mayor precisión
    round: (value) => parseFloat(value.toFixed(2)),
    
    // Ajustar a cuadrícula personalizable
    snapToGrid: (value, gridSize = 5) => Math.round(value / gridSize) * gridSize,
    
    // Validar coordenadas dentro de límites razonables
    validate: (x, y) => {
      const maxCoord = 10000; // Máximo 10,000 píxeles
      return Math.abs(x) <= maxCoord && Math.abs(y) <= maxCoord;
    }
  };

  // Función para ajustar elementos a cuadrícula personalizada
  const snapToCustomGrid = (gridSize = 5) => {
    console.log(`[snapToCustomGrid] Ajustando elementos a cuadrícula de ${gridSize}px`);
    
    setElements(prev => {
      return prev.map(element => {
        if (element.posicion) {
          const newX = precisePositioning.snapToGrid(element.posicion.x, gridSize);
          const newY = precisePositioning.snapToGrid(element.posicion.y, gridSize);
          
          if (newX !== element.posicion.x || newY !== element.posicion.y) {
            console.log(`[snapToCustomGrid] Ajustando ${element.type} ${element._id}: (${element.posicion.x}, ${element.posicion.y}) -> (${newX}, ${newY})`);
            return {
              ...element,
              posicion: { 
                x: precisePositioning.round(newX), 
                y: precisePositioning.round(newY) 
              }
            };
          }
        }
        return element;
      });
    });
    
    message.success(`Elementos ajustados a cuadrícula de ${gridSize}px`);
  };

  // ===== SISTEMA DE FONDO CON ESCALADO =====
  const backgroundSystem = {
    image: null,
    scale: 1.0,
    opacity: 0.3,
    position: { x: 0, y: 0 },
    showInWeb: true,
    showInEditor: true
  };

  // Función para establecer imagen de fondo
  const setBackgroundImage = (imageUrl, options = {}) => {
    const backgroundElement = {
      _id: 'background_image',
      type: 'background',
      imageUrl,
      scale: options.scale || backgroundSystem.scale,
      opacity: options.opacity || backgroundSystem.opacity,
      position: options.position || backgroundSystem.position,
      showInWeb: options.showInWeb !== undefined ? options.showInWeb : backgroundSystem.showInWeb,
      showInEditor: options.showInEditor !== undefined ? options.showInEditor : backgroundSystem.showInEditor
    };

    setElements(prev => {
      // Remover fondo anterior si existe
      const sinFondo = prev.filter(el => el.type !== 'background');
      return [...sinFondo, backgroundElement];
    });

    message.success('Imagen de fondo establecida');
  };

  // Función para actualizar propiedades del fondo
  const updateBackground = (updates) => {
    setElements(prev => prev.map(el => {
      if (el.type === 'background') {
        return { ...el, ...updates };
      }
      return el;
    }));
  };

  // Función para remover imagen de fondo
  const removeBackground = () => {
    setElements(prev => prev.filter(el => el.type !== 'background'));
    message.success('Imagen de fondo removida');
  };

  // Función auxiliar para crear sillas (movida aquí)
  const crearSilla = ({ mesaId, x, y, numero, sillaShape, zonaId }) => {
    const TAMAÑO_SILLA = 20;
    const posicion = {
      x: precisePositioning.round(x),
      y: precisePositioning.round(y)
    };
    
    return {
      _id: `silla_${uuidv4()}`,
      type: 'silla',
      parentId: mesaId,
      posicion,
      width: TAMAÑO_SILLA,
      height: TAMAÑO_SILLA,
      numero,
      shape: sillaShape,
      zonaId,
      rotation: 0,
      fila: '',
      state: 'available', // Estado por defecto
      fill: seatStates.available.fill,
      stroke: seatStates.available.stroke,
      opacity: seatStates.available.opacity
    };
  };

  // Creación de una nueva mesa
  const addMesa = (shape = 'rect') => {
    const id = 'mesa_' + uuidv4();
    
    // Calcular el centro del canvas visible (considerando el panel izquierdo de 320px)
    const canvasWidth = window.innerWidth - 320;
    const canvasHeight = window.innerHeight;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    const nuevaMesa = {
      _id: id,
      type: 'mesa',
      shape,
      posicion: { x: centerX, y: centerY },
      radius: shape === 'circle' ? 60 : undefined,
      width: shape === 'rect' ? 120 : undefined,
      height: shape === 'rect' ? 80 : undefined,
      nombre: 'Mesa ' + (elements.filter(e => e.type === 'mesa').length + 1),
      sillas: [],
      zonaId: selectedZone?.id || null,
      fila: '',
      scale: 1.0 // Escala por defecto
    };
    setElements(prev => [...prev, nuevaMesa]);
    
    // Centrar el stage en la nueva mesa
    const canvasCenterX = (window.innerWidth - 320) / 2;
    const canvasCenterY = window.innerHeight / 2;
    
    // Ajustar la posición del stage para que la mesa esté en el centro visible
    const stageX = canvasCenterX - nuevaMesa.posicion.x;
    const stageY = canvasCenterY - nuevaMesa.posicion.y;
    
    // Disparar un evento personalizado para que el componente padre pueda actualizar la posición del stage
    window.dispatchEvent(new CustomEvent('centerStageOnMesa', {
      detail: { x: stageX, y: stageY }
    }));
    
    return nuevaMesa;
  };

  // Asignar zona a elementos seleccionados
  const addSillasToMesa = (mesaId, cantidad = numSillas, sillaShape = 'rect') => {
    if (!mesaId || typeof mesaId !== 'string' || cantidad <= 0) return;

    console.log(`[addSillasToMesa] Iniciando proceso para mesa ${mesaId} con ${cantidad} sillas`);
    console.log(`[addSillasToMesa] Elementos actuales:`, elements);

    setElements(prev => {
      const mesa = prev.find(el => el._id === mesaId);
      if (!mesa || mesa.type !== 'mesa') {
        console.log(`[addSillasToMesa] Mesa no encontrada o tipo incorrecto:`, mesa);
        return prev;
      }

      console.log(`[addSillasToMesa] Mesa encontrada:`, mesa);

      // Filtrar TODAS las sillas existentes de esta mesa para evitar duplicados
      const elementosSinSillas = prev.filter(el => el.type !== 'silla' || el.parentId !== mesaId);
      console.log(`[addSillasToMesa] Elementos antes del filtro:`, prev.length);
      console.log(`[addSillasToMesa] Elementos después del filtro:`, elementosSinSillas.length);
      console.log(`[addSillasToMesa] Eliminando ${prev.length - elementosSinSillas.length} sillas existentes de mesa ${mesaId}`);
      const TAMAÑO_SILLA = 20;
      const MARGEN_SILLA = 15;
      const nuevasSillas = [];

      const mesaWidth = mesa.shape === 'rect' ? Math.max(mesa.width || 120, 30) : null;
      const mesaHeight = mesa.shape === 'rect' ? Math.max(mesa.height || 80, 30) : null;
      const mesaRadius = mesa.shape === 'circle' ? Math.max(mesa.radius || 60, 20) : null;
      const mesaX = mesa.posicion?.x || 0;
      const mesaY = mesa.posicion?.y || 0;

      if (mesa.shape === 'circle') {
        // Mejorar el cálculo para mesas circulares
        const radioSillas = mesaRadius + MARGEN_SILLA + TAMAÑO_SILLA / 2;
        
        // Distribuir las sillas de manera más uniforme
        for (let i = 0; i < cantidad; i++) {
          // Ajustar el ángulo para que las sillas se distribuyan mejor
          const angulo = (i * 2 * Math.PI) / cantidad - Math.PI / 2; // Empezar desde arriba
          
          // Calcular posición con mejor precisión
          const x = mesaX + radioSillas * Math.cos(angulo) - TAMAÑO_SILLA / 2;
          const y = mesaY + radioSillas * Math.sin(angulo) - TAMAÑO_SILLA / 2;
          
          nuevasSillas.push(crearSilla({
            mesaId, 
            x: precisePositioning.round(x), 
            y: precisePositioning.round(y),
            numero: i + 1,
            sillaShape,
            zonaId: selectedZone?.id || mesa.zonaId
          }));
        }
      } else {
        let colocadas = 0;
        const sides = [
          { len: mesaWidth, hor: true, startX: mesaX, startY: mesaY - MARGEN_SILLA - TAMAÑO_SILLA, dx: 1, dy: 0 },
          { len: mesaHeight, hor: false, startX: mesaX + mesaWidth + MARGEN_SILLA, startY: mesaY, dx: 0, dy: 1 },
          { len: mesaWidth, hor: true, startX: mesaX, startY: mesaY + mesaHeight + MARGEN_SILLA, dx: 1, dy: 0 },
          { len: mesaHeight, hor: false, startX: mesaX - MARGEN_SILLA - TAMAÑO_SILLA, startY: mesaY, dx: 0, dy: 1 }
        ];

        for (const side of sides) {
          if (colocadas >= cantidad) break;
          
          const sillasEnLado = Math.min(
            Math.floor(side.len / (TAMAÑO_SILLA + 5)),
            cantidad - colocadas
          );
          
          for (let i = 0; i < sillasEnLado; i++) {
            const x = side.startX + (side.hor ? i * (TAMAÑO_SILLA + 5) : 0);
            const y = side.startY + (side.hor ? 0 : i * (TAMAÑO_SILLA + 5));
            
            nuevasSillas.push(crearSilla({
              mesaId,
              x: precisePositioning.round(x),
              y: precisePositioning.round(y),
              numero: colocadas + 1,
              sillaShape,
              zonaId: selectedZone?.id || mesa.zonaId
            }));
            colocadas++;
          }
        }
      }

      console.log(`[addSillasToMesa] Sillas creadas:`, nuevasSillas.length);
      const resultado = [...elementosSinSillas, ...nuevasSillas];
      console.log(`[addSillasToMesa] Total elementos después:`, resultado.length);
      
      return resultado;
    });

    // Crear conexiones automáticas después de agregar sillas
    setTimeout(() => autoConnectSeats(mesaId), 100);
  };

  // Función para asignar zona a elementos seleccionados
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

  // Función para actualizar propiedades de elementos
  const updateElementProperty = (id, property, value) => {
    setElements(prev => prev.map(el => {
      if (el._id === id) {
        // Validar coordenadas si es una posición
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

  // Función para actualizar tamaño de elementos
  const updateElementSize = (id, newWidth, newHeight) => {
    setElements(prev =>
      prev.map(el =>
        el._id === id ? { ...el, width: newWidth, height: newHeight } : el
      )
    );
  };

  const deleteSelectedElements = () => {
    setElements(prev => prev.filter(el => {
      // Si el elemento está seleccionado, eliminarlo
      if (selectedIds.includes(el._id)) return false;
      // Si el elemento es silla y su padre está seleccionado, eliminar silla
      if (el.type === 'silla' && selectedIds.includes(el.parentId)) return false;
      // Si el elemento es conexión y uno de sus asientos está seleccionado, eliminar conexión
      if (el.type === 'conexion' && 
          (selectedIds.includes(el.startSeatId) || selectedIds.includes(el.endSeatId))) return false;
      return true;
    }));
  };

  // Función para limpiar sillas duplicadas
  const limpiarSillasDuplicadas = () => {
    console.log('[limpiarSillasDuplicadas] Iniciando limpieza de sillas duplicadas');
    
    setElements(prev => {
      const sillas = prev.filter(el => el.type === 'silla');
      const mesas = prev.filter(el => el.type === 'mesa');
      
      console.log(`[limpiarSillasDuplicadas] Sillas encontradas: ${sillas.length}`);
      console.log(`[limpiarSillasDuplicadas] Mesas encontradas: ${mesas.length}`);
      
      // Agrupar sillas por mesa
      const sillasPorMesa = {};
      sillas.forEach(silla => {
        if (!sillasPorMesa[silla.parentId]) {
          sillasPorMesa[silla.parentId] = [];
        }
        sillasPorMesa[silla.parentId].push(silla);
      });
      
      // Para cada mesa, mantener solo una silla por posición
      const sillasUnicas = [];
      Object.entries(sillasPorMesa).forEach(([mesaId, sillasMesa]) => {
        const posiciones = new Set();
        sillasMesa.forEach(silla => {
          const posKey = `${silla.posicion.x},${silla.posicion.y}`;
          if (!posiciones.has(posKey)) {
            posiciones.add(posKey);
            sillasUnicas.push(silla);
          } else {
            console.log(`[limpiarSillasDuplicadas] Eliminando silla duplicada en posición ${posKey}`);
          }
        });
      });
      
      // Filtrar elementos no silla y agregar sillas únicas
      const elementosNoSillas = prev.filter(el => el.type !== 'silla');
      const resultado = [...elementosNoSillas, ...sillasUnicas];
      
      console.log(`[limpiarSillasDuplicadas] Sillas antes: ${sillas.length}, después: ${sillasUnicas.length}`);
      console.log(`[limpiarSillasDuplicadas] Total elementos: ${resultado.length}`);
      
      return resultado;
    });
  };

  // Función para ajustar elementos a la cuadrícula (mantener compatibilidad)
  const snapToGrid = () => {
    snapToCustomGrid(20); // Usar cuadrícula de 20px por defecto
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
    setBackgroundImage,
    updateBackground,
    removeBackground,
    backgroundSystem
  };
};