import { useState } from 'react';

// Conservative implementation: provide a hook that returns common mapa state.
// This keeps API stable for callers while avoiding parse errors from corrupted file.
export default function useMapaState(initialElements = []) {
  const [elements, setElements] = useState(initialElements);
  const [selectedIds, setSelectedIds] = useState([]);
  const [zones, setZones] = useState([]);
  const [showZones, setShowZones] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [numSillas, setNumSillas] = useState(4);
  const [zoom, setZoom] = useState(1);
  const [selectionRect, setSelectionRect] = useState(null);
  const [sillaShape, setSillaShape] = useState('rect');

  return {
    elements,
    setElements,
    selectedIds,
    setSelectedIds,
    zones,
    setZones,
    showZones,
    setShowZones,
    selectedZone,
    setSelectedZone,
    selectedElement,
    setSelectedElement,
    numSillas,
    setNumSillas,
    zoom,
    setZoom,
    selectionRect,
    setSelectionRect,
    sillaShape,
    setSillaShape,
  };
}
