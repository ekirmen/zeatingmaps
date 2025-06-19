import { useEffect, useCallback, useRef } from 'react';

export const useMapaSelection = (
  elements,
  selectedIds,
  setSelectedIds,
  setSelectedElement,
  selectionRect,
  setSelectionRect,
  deleteSelectedElements
) => {
  // Ref para siempre tener el último estado de elementos, evitando closure stale
  const elementsRef = useRef(elements);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Selección individual al hacer clic en un elemento
  const selectElement = useCallback(
    (elemento) => {
      setSelectedIds([elemento._id]);
      setSelectedElement(elemento);
    },
    [setSelectedIds, setSelectedElement]
  );

  // Evento mousedown para iniciar selección o gestionar selección individual/multi
  const handleMouseDown = useCallback(
    (e) => {
      // Si clic en un elemento (no en stage vacío)
      if (e.target !== e.currentTarget) {
        const clickedNodeId = e.target.id();
        const clickedElement = elementsRef.current.find((el) => el._id === clickedNodeId);

        if (clickedElement) {
          if (selectedIds.includes(clickedElement._id)) {
            // Ya está seleccionado
            if (e.evt.ctrlKey || e.evt.metaKey) {
              // Toggle selección off
              setSelectedIds((prev) => prev.filter((id) => id !== clickedElement._id));
              setSelectedElement(null);
            }
            // Si no Ctrl, permitir drag sin cambiar selección
            return;
          }

          if (e.evt.ctrlKey || e.evt.metaKey) {
            // Añadir a selección
            setSelectedIds((prev) => [...prev, clickedElement._id]);
            setSelectedElement(null);
          } else {
            // Selección simple
            selectElement(clickedElement);
          }
        } else {
          console.warn('Elemento clickeado no encontrado en estado');
          setSelectedIds([]);
          setSelectedElement(null);
        }
        return; // No iniciar selección rectangular al clicar elemento
      }

      // Click en fondo vacío => deseleccionar todo
      setSelectedIds([]);
      setSelectedElement(null);

      // Iniciar selección rectangular
      const pos = e.target.getStage().getPointerPosition();
      setSelectionRect({ visible: true, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    },
    [selectedIds, selectElement, setSelectedIds, setSelectedElement, setSelectionRect]
  );

  // Evento mousemove para actualizar la selección rectangular (drag)
  const handleMouseMove = useCallback(
    (e) => {
      if (!selectionRect?.visible) return;
      const pos = e.target.getStage().getPointerPosition();
      setSelectionRect((prev) => ({ ...prev, x2: pos.x, y2: pos.y }));
    },
    [selectionRect, setSelectionRect]
  );

  // Evento mouseup para terminar selección rectangular y seleccionar elementos dentro
  const handleMouseUp = useCallback(() => {
    if (!selectionRect?.visible) return;

    const box = {
      x: Math.min(selectionRect.x1, selectionRect.x2),
      y: Math.min(selectionRect.y1, selectionRect.y2),
      width: Math.abs(selectionRect.x2 - selectionRect.x1),
      height: Math.abs(selectionRect.y2 - selectionRect.y1),
    };

    const selected = [];

    elementsRef.current.forEach((el) => {
      // Suponemos que el elemento tiene propiedad posicion {x,y}
      if (
        el.posicion &&
        el.posicion.x >= box.x &&
        el.posicion.x <= box.x + box.width &&
        el.posicion.y >= box.y &&
        el.posicion.y <= box.y + box.height
      ) {
        if (!selected.includes(el._id)) {
          selected.push(el._id);
        }
      }
    });

    setSelectedIds(selected);
    setSelectionRect(null);
    setSelectedElement(null); // Deselecciona elemento individual para selección múltiple
  }, [selectionRect, setSelectedIds, setSelectionRect, setSelectedElement]);

  // Listener global para tecla Suprimir/Delete para borrar elementos seleccionados
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.key === 'Delete' || e.key === 'Suprimir') && selectedIds.length > 0) {
        deleteSelectedElements();
        setSelectedIds([]);
        setSelectedElement(null);
      }
    },
    [selectedIds, deleteSelectedElements, setSelectedIds, setSelectedElement]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectElement,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
