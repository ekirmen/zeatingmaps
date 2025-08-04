import { v4 as uuidv4 } from 'uuid';

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

    setElements(prev => {
      const mesa = prev.find(el => el._id === mesaId);
      if (!mesa || mesa.type !== 'mesa') return prev;

      const nuevos = prev.filter(el => el.type !== 'silla' || el.parentId !== mesaId);
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

      return [...nuevos, ...nuevasSillas];
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

  return {
    addMesa,
    addSillasToMesa,
    updateElementProperty,
    updateElementSize,
    deleteSelectedElements,
  };
};