import { useState, useMemo } from 'react';
import { message } from 'antd';

export const useZoneManagement = (selectedPlantilla, getPrecioConDescuento) => {
  const [selectedZonaId, setSelectedZonaId] = useState(null);
  const [zoneQuantities, setZoneQuantities] = useState({});

  const detallesPlantilla = useMemo(() => {
    console.log('useZoneManagement - selectedPlantilla:', selectedPlantilla);
    
    if (!selectedPlantilla?.detalles) {
      console.log('useZoneManagement - No hay detalles en la plantilla');
      return [];
    }
    
    if (Array.isArray(selectedPlantilla.detalles)) {
      console.log('useZoneManagement - Detalles ya es array:', selectedPlantilla.detalles);
      return selectedPlantilla.detalles;
    }
    
    try {
      if (typeof selectedPlantilla.detalles === 'string') {
        const parsed = JSON.parse(selectedPlantilla.detalles);
        console.log('useZoneManagement - Detalles parseados de string:', parsed);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      const result = Array.isArray(selectedPlantilla.detalles)
        ? selectedPlantilla.detalles
        : Object.values(selectedPlantilla.detalles);
      
      console.log('useZoneManagement - Detalles procesados:', result);
      return result;
    } catch (error) {
      console.error('useZoneManagement - Error procesando detalles:', error);
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