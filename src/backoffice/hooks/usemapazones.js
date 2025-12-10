export const useMapaZones = (elements, setElements, selectedIds, selectedZone) => {

 // 🔁 Aplica la zona a sillas seleccionadas directamente o anidadas dentro de mesas
 const assignZoneToSillas = () => {
  if (!selectedZone || selectedIds.length === 0) {
    return;
  }

  setElements(prev => {
    const selectedMesaIds = prev
      .filter(el => el.type === 'mesa' && selectedIds.includes(el._id))
      .map(mesa => mesa._id);

    return prev.map(el => {
      const isSelected = selectedIds.includes(el._id);
      const isChildOfSelectedMesa = el.type === 'silla' && selectedMesaIds.includes(el.parentId);

      if (el.type === 'silla' && (isSelected || isChildOfSelectedMesa)) {
        return {
          ...el,
          zonaId: selectedZone.id,
        };
      }

      if (el.type === 'mesa' && isSelected) {
        return {
          ...el,
          zonaId: selectedZone.id,
        };
      }

      return el;
    });
  });
};

 // 🔁 Aplica la zona a todos los elementos seleccionados (mesas, sillas, textos, etc.)
  const assignZoneToSelected = () => {
    if (!selectedZone || selectedIds.length === 0) {
      return;
    }

    setElements(prev => {
      const selectedMesaIds = prev
        .filter(el => el.type === 'mesa' && selectedIds.includes(el._id))
        .map(mesa => mesa._id);

      return prev.map(el => {
        const isSelected = selectedIds.includes(el._id);
        const isChildOfSelectedMesa = el.type === 'silla' && selectedMesaIds.includes(el.parentId);

        if (isSelected || isChildOfSelectedMesa) {
          return {
            ...el,
            zonaId: selectedZone.id,
          };
        }

        return el;
      });
    });
  };

  return {
    assignZoneToSillas,
    assignZoneToSelected,
  };
};