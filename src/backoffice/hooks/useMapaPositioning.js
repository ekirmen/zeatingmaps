// Hook para manejar posicionamiento y coordenadas precisas
import { message } from '../../utils/antdComponents';

export const useMapaPositioning = (elements, setElements) => {
  const precisePositioning = {
    round: (value) => parseFloat(value.toFixed(2)),
    snapToGrid: (value, gridSize = 5) => Math.round(value / gridSize) * gridSize,
    validate: (x, y) => {
      const maxCoord = 10000;
      return Math.abs(x) <= maxCoord && Math.abs(y) <= maxCoord;
    }
  };

  const snapToCustomGrid = (gridSize = 5) => {
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

    message.success(`Elementos ajustados a cuadr­cula de ${gridSize}px`);
  };

  const snapToGrid = () => {
    snapToCustomGrid(20);
  };

  return {
    precisePositioning,
    snapToCustomGrid,
    snapToGrid
  };
};


