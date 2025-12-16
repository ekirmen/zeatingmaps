import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Assuming you use uuid for unique IDs

const useMapaGraphicalElements = ({ setElements, selectedZone, numSillas, sillaShape }) => {
  const addElement = useCallback((type, props = {}) => {
    const newElement = {
      _id: uuidv4(),
      type,
      posicion: { x: 100, y: 100 },
      zonaId: selectedZone?.id || null,
      ...props
    };
    setElements(prevElements => [...prevElements, newElement]);
  }, [setElements, selectedZone]); // Dependencies for addElement

  // Example function for adding text
  const addTextElement = useCallback(() => {
    addElement('text', {
      text: 'Nuevo Texto',
      fontSize: 16,
      fill: 'black',
      draggable: true,
    });
  }, [addElement]); // addTextElement depends on addElement

  // Example function for adding a rectangle
  const addRectangleElement = useCallback(() => {
    addElement('rect', {
      width: 100,
      height: 100,
      fill: '#cccccc',
      stroke: 'black',
      strokeWidth: 2,
      draggable: true,
    });
  }, [addElement]); // addRectangleElement depends on addElement

  // Function for adding an ellipse
  const addEllipseElement = useCallback(() => {
    addElement('ellipse', {
      radiusX: 70, // Default radius X
      radiusY: 50, // Default radius Y
      fill: '#cccccc',
      stroke: 'black',
      strokeWidth: 2,
      draggable: true,
    });
  }, [addElement]); // addEllipseElement depends on addElement

  // Function for adding a line
  const addLineElement = useCallback(() => {
    // A line needs points [x1, y1, x2, y2, ...]
    addElement('line', {
      points: [50, 50, 150, 50], // Default horizontal line points
      stroke: 'black',
      strokeWidth: 2,
      draggable: true,
    });
  }, [addElement]); // addLineElement depends on addElement

  // Add a row of chairs independent of a table
  const addChairRow = useCallback(
    (startPos = { x: 50, y: 50 }, endPos = null) => {
      const CHAIR_SIZE = 20;
      const SPACING = 10 + CHAIR_SIZE;

      let cantidad = numSillas;
      if (endPos) {
        const distancia = Math.abs(endPos.x - startPos.x);
        cantidad = Math.max(1, Math.floor(distancia / SPACING) + 1);
      }

      const nuevasSillas = [];
      for (let i = 0; i < cantidad; i++) {
        nuevasSillas.push({
          _id: uuidv4(),
          type: 'silla',
          parentId: null,
          posicion: { x: startPos.x + i * SPACING, y: startPos.y },
          width: CHAIR_SIZE,
          height: CHAIR_SIZE,
          shape: sillaShape,
          numero: i + 1,
          zonaId: selectedZone?.id || null,
          fila: ''
        });
      }
      setElements(prev => [...prev, ...nuevasSillas]);
    },
    [setElements, numSillas, sillaShape, selectedZone]
  );

  return {
    addTextElement,
    addRectangleElement,
    addEllipseElement,
    addLineElement,
    addChairRow,
  };
};

export default useMapaGraphicalElements;
