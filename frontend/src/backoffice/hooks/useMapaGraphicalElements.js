import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Assuming you use uuid for unique IDs

export const useMapaGraphicalElements = (elements, setElements, selectedZone) => {

  // Function to add a generic element
  const addElement = useCallback((type, initialProps) => {
    const newElement = {
      _id: uuidv4(),
      type,
      posicion: { x: 50, y: 50 }, // Default position
      ...initialProps,
      zonaId: selectedZone?._id || null, // Assign selected zone if any
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

  // You will add the addChairRow function here later if needed

  return {
    addTextElement,
    addRectangleElement,
    addEllipseElement, // Return the new function
    addLineElement,    // Return the new function
    // Return other functions here as you create them
    // addChairRow,
  };
};