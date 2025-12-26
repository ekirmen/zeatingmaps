// Hook para manejar creación y gestión de asientos
import { v4 as uuidv4 } from 'uuid';

export const useMapaSeats = (elements, setElements, selectedZone, numSillas) => {
  const precisePositioning = {
    round: (value) => parseFloat(value.toFixed(2)),
  };

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
      state: 'available',
      fill: '#00d6a4',
      stroke: '#a8aebc',
      opacity: 1
    };
  };

  const addSillasToMesa = (mesaId, cantidad = numSillas, sillaShape = 'rect') => {
    if (!mesaId || typeof mesaId !== 'string' || cantidad <= 0) return;

    setElements(prev => {
      const mesa = Array.isArray(prev) ? prev.find(el => el._id === mesaId) : null;
      if (!mesa || mesa.type !== 'mesa') {
        return prev;
      }

      const elementosSinSillas = prev.filter(el => el.type !== 'silla' || el.parentId !== mesaId);
      const TAMAÑO_SILLA = 20;
      const MARGEN_SILLA = 15;
      const nuevasSillas = [];

      const mesaWidth = mesa.shape === 'rect' ? Math.max(mesa.width || 120, 30) : null;
      const mesaHeight = mesa.shape === 'rect' ? Math.max(mesa.height || 80, 30) : null;
      const mesaRadius = mesa.shape === 'circle' ? Math.max(mesa.radius || 60, 20) : null;
      const mesaX = mesa.posicion?.x || 0;
      const mesaY = mesa.posicion?.y || 0;

      if (mesa.shape === 'circle') {
        const radioSillas = mesaRadius + MARGEN_SILLA + TAMAÑO_SILLA / 2;
        
        for (let i = 0; i < cantidad; i++) {
          const angulo = (i * 2 * Math.PI) / cantidad - Math.PI / 2;
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

      return [...elementosSinSillas, ...nuevasSillas];
    });
  };

  const limpiarSillasDuplicadas = () => {
    setElements(prev => {
      const sillas = prev.filter(el => el.type === 'silla');
      
      const sillasPorMesa = {};
      sillas.forEach(silla => {
        if (!sillasPorMesa[silla.parentId]) {
          sillasPorMesa[silla.parentId] = [];
        }
        sillasPorMesa[silla.parentId].push(silla);
      });
      
      const sillasUnicas = [];
      Object.entries(sillasPorMesa).forEach(([mesaId, sillasMesa]) => {
        const posiciones = new Set();
        sillasMesa.forEach(silla => {
          const posKey = `${silla.posicion.x},${silla.posicion.y}`;
          if (!posiciones.has(posKey)) {
            posiciones.add(posKey);
            sillasUnicas.push(silla);
          }
        });
      });
      
      const elementosNoSillas = prev.filter(el => el.type !== 'silla');
      return [...elementosNoSillas, ...sillasUnicas];
    });
  };

  return {
    addSillasToMesa,
    limpiarSillasDuplicadas,
    crearSilla
  };
};
