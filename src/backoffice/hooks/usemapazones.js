export const useMapaZones = (elements, setElements, selectedIds, selectedZone) => {

 // 🔁 Aplica la zona a sillas seleccionadas directamente o anidadas dentro de mesas
 const assignZoneToSillas = () => {
  if (!selectedZone || selectedIds.length === 0) {
    console.warn('Selecciona al menos una silla o mesa y una zona');
    return;
  }

  setElements(prev =>
    prev.map(el => {
      // 👉 Silla individual seleccionada
      if (el.type === 'silla' && selectedIds.includes(el._id)) {
        return {
          ...el,
          zonaId: selectedZone.id,
        };
      }

      // 👉 Mesa seleccionada: aplicar zona a todas sus sillas
      if (el.type === 'mesa' && selectedIds.includes(el._id)) {
        const nuevasSillas = (el.sillas || []).map(silla => ({
          ...silla,
          zonaId: selectedZone.id,
        }));
        return {
          ...el,
          zonaId: selectedZone.id,
          sillas: nuevasSillas,
        };
      }

      // 👉 Mesa no seleccionada, pero con algunas sillas seleccionadas
      if (el.type === 'mesa' && el.sillas) {
        const nuevasSillas = el.sillas.map(silla => {
          if (selectedIds.includes(silla._id)) {
            return {
              ...silla,
              zonaId: selectedZone.id,
            };
          }
          return silla;
        });
        return {
          ...el,
          sillas: nuevasSillas,
        };
      }

      // Otros elementos sin cambios
      return el;
    })
  );
};

 // 🔁 Aplica la zona a todos los elementos seleccionados (mesas, sillas, textos, etc.)
  const assignZoneToSelected = () => {
    if (!selectedZone || selectedIds.length === 0) {
      console.warn('Selecciona al menos un elemento y una zona');
      return;
    }

    setElements(prev =>
      prev.map(el => {
        if (selectedIds.includes(el._id)) {
          // 👉 Si es mesa, también asignar zona a sus sillas
        const nuevasSillas = (el.sillas || []).map(silla => ({
          ...silla,
          zonaId: selectedZone.id,
        }));

        return {
          ...el,
          zonaId: selectedZone.id,
          sillas: nuevasSillas,
        };
        }

        return el;
      })
    );
  };

  return {
    assignZoneToSillas,
    assignZoneToSelected,
  };
};