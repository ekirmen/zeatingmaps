// Hook para manejar escalado de elementos del mapa

const useMapaScaling = ({ setElements }) => {
  const scaleSystem = {
    min: 0.1,
    max: 5.0,
    step: 0.1
  };

  const scaleElement = (elementId, scaleFactor) => {
    setElements(prev => prev.map(el => {
      if (el._id === elementId) {
        const newScale = Math.max(scaleSystem.min, Math.min(scaleSystem.max, (el.scale || 1) * scaleFactor));
        return {
          ...el,
          scale: newScale,
          width: el.width ? el.width * newScale : el.width,
          height: el.height ? el.height * newScale : el.height,
          radius: el.radius ? el.radius * newScale : el.radius
        };
      }
      return el;
    }));
  };

  return {
    scaleElement,
    scaleSystem
  };
};

export default useMapaScaling;