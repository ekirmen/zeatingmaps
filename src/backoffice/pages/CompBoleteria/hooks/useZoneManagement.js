import { useState, useMemo } from 'react';
import { message } from 'antd';

export const useZoneManagement = (selectedPlantilla, getPrecioConDescuento) => {
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [zoneQuantities, setZoneQuantities] = useState({});

  const detallesPlantilla = useMemo(() => {
    if (!selectedPlantilla?.detalles) return [];
    if (Array.isArray(selectedPlantilla.detalles)) return selectedPlantilla.detalles;
    try {
      if (typeof selectedPlantilla.detalles === 'string') {
        const parsed = JSON.parse(selectedPlantilla.detalles);
        return Array.isArray(parsed) ? parsed : [];
      }
      return Array.isArray(selectedPlantilla.detalles)
        ? selectedPlantilla.detalles
        : Object.values(selectedPlantilla.detalles);
    } catch {
      return [];
    }
  }, [selectedPlantilla]);

  const zonePriceRanges = useMemo(() => {
    const ranges = {};
    detallesPlantilla.forEach((d) => {
      const nombre = d.zona?.nombre || d.zonaId || d.zona;
      const precio = getPrecioConDescuento(d);
      if (!ranges[nombre]) {
        ranges[nombre] = { nombre, min: precio, max: precio };
      } else {
        ranges[nombre].min = Math.min(ranges[nombre].min, precio);
        ranges[nombre].max = Math.max(ranges[nombre].max, precio);
      }
    });
    return Object.values(ranges).sort((a, b) => a.min - b.min);
  }, [detallesPlantilla, getPrecioConDescuento]);

  const handleClearZoneSelection = () => {
    setSelectedZonaId(null);
    setZoneQuantities({});
  };

  const handleQuantityChange = (zonaId, value) => {
    setZoneQuantities(prev => ({ ...prev, [zonaId]: value }));
  };

  return {
    selectedZonaId,
    setSelectedZonaId,
    zoneQuantities,
    setZoneQuantities,
    detallesPlantilla,
    zonePriceRanges,
    handleClearZoneSelection,
    handleQuantityChange
  };
}; 