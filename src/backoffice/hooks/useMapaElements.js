import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';

export const useMapaElements = (elements, setElements, selectedIds, selectedZone, numSillas) => {

  // Función auxiliar para crear sillas (movida aquí)
  const crearSilla = ({ mesaId, x, y, numero, sillaShape, zonaId }) => {
    const TAMAÑO_SILLA = 20;
    return {
      _id: `silla_${uuidv4()}`,
      type: 'silla',
      parentId: mesaId,
      posicion: { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 },
      width: TAMAÑO_SILLA,
      height: TAMAÑO_SILLA,
      numero,
      shape: sillaShape,
      zonaId,
      rotation: 0,
      fila: ''
    };
  };
  // Creación de una nueva mesa
  const addMesa = (shape = 'rect') => {
    const id = 'mesa_' + uuidv4();
    const nuevaMesa = {
      _id: id,
      type: 'mesa',
      shape,
      posicion: { x: 200, y: 200 },
      radius: shape === 'circle' ? 60 : undefined,
      width: shape === 'rect' ? 120 : undefined, // Set initial width for rect
      height: shape === 'rect' ? 80 : undefined, // Set initial height for rect
      nombre: 'Mesa ' + (elements.filter(e => e.type === 'mesa').length + 1),
      sillas: [], // This 'sillas' array is not used for rendering chairs anymore
      zonaId: selectedZone?.id || null,
      fila: ''
    };
    setElements(prev => [...prev, nuevaMesa]);
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
      const MARGEN_SILLA = 15; // Aumentado el margen para mejor separación
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
            x: Math.round(x * 100) / 100, 
            y: Math.round(y * 100) / 100,
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
          { len: mesaWidth, hor: true, startX: mesaX + mesaWidth, startY: mesaY + mesaHeight + MARGEN_SILLA, dx: -1, dy: 0 },
          { len: mesaHeight, hor: false, startX: mesaX - MARGEN_SILLA - TAMAÑO_SILLA, startY: mesaY + mesaHeight, dx: 0, dy: -1 },
        ];
        for (let s = 0; s < sides.length && colocadas < cantidad; s++) {
          const side = sides[s];
          const restantes = cantidad - colocadas;
          const porLado = Math.max(1, Math.ceil(restantes / (sides.length - s)));
          for (let i = 0; i < porLado && colocadas < cantidad; i++) {
            const factor = (i + 1) / (porLado + 1);
            const x = side.hor
              ? side.startX + side.dx * (side.len * factor - (side.dx === -1 ? TAMAÑO_SILLA : 0)) - (side.hor ? TAMAÑO_SILLA / 2 : 0)
              : side.startX - (side.hor ? TAMAÑO_SILLA / 2 : 0);
            const y = side.hor
              ? side.startY
              : side.startY + side.dy * (side.len * factor - (side.dy === -1 ? TAMAÑO_SILLA : 0)) - (side.hor ? 0 : TAMAÑO_SILLA / 2);
            nuevasSillas.push(crearSilla({
              mesaId, x, y,
              numero: colocadas + 1,
              sillaShape,
              zonaId: selectedZone?.id || mesa.zonaId
            }));
            colocadas++;
          }
        }
      }

      console.log(`[addSillasToMesa] Agregando ${nuevasSillas.length} nuevas sillas a mesa ${mesaId}`);
      console.log(`[addSillasToMesa] Nuevas sillas:`, nuevasSillas);
      const resultado = [...elementosSinSillas, ...nuevasSillas];
      console.log(`[addSillasToMesa] Total de elementos después de agregar sillas:`, resultado.length);
      return resultado;
    });
  };

  // Actualización de propiedades de elementos
  const updateElementProperty = (id, property, value) => {
    setElements(prev =>
      prev.map(el => {
        if (el._id === id) {
          return { ...el, [property]: value };
        }
        // The logic below for updating chairs nested in mesa.sillas is likely
        // not needed anymore since chairs are top-level elements with parentId
        /*
        if (el.type === 'mesa' && el.sillas) {
          const nuevasSillas = el.sillas.map(silla =>
            silla._id === id ? { ...silla, [property]: value } : silla
          );
          // Si alguna silla fue actualizada, retornar la mesa con las sillas actualizadas
          if (nuevasSillas.some((silla, index) => silla !== el.sillas[index])) {
             return { ...el, sillas: nuevasSillas };
          }
        }
        */
        return el; // Retornar el elemento sin cambios si no es el que buscamos
      })
    );
  };


  // Actualización de tamaño de elementos
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
      return true;
    }));
    // setSelectedIds([]); // La deselección se manejará en el hook de selección
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

  // Función para ajustar elementos a la cuadrícula
  const snapToGrid = () => {
    console.log('[snapToGrid] Ajustando elementos a la cuadrícula');
    
    setElements(prev => {
      const GRID_SIZE = 20; // Tamaño de la cuadrícula
      
      return prev.map(element => {
        if (element.posicion) {
          const newX = Math.round(element.posicion.x / GRID_SIZE) * GRID_SIZE;
          const newY = Math.round(element.posicion.y / GRID_SIZE) * GRID_SIZE;
          
          if (newX !== element.posicion.x || newY !== element.posicion.y) {
            console.log(`[snapToGrid] Ajustando ${element.type} ${element._id}: (${element.posicion.x}, ${element.posicion.y}) -> (${newX}, ${newY})`);
            return {
              ...element,
              posicion: { x: newX, y: newY }
            };
          }
        }
        return element;
      });
    });
    
    message.success('Elementos ajustados a la cuadrícula');
  };

  return {
    addMesa,
    addSillasToMesa,
    updateElementProperty,
    updateElementSize,
    deleteSelectedElements,
    limpiarSillasDuplicadas,
    snapToGrid,
  };
};