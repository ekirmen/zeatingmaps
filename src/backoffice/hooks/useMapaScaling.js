// Hook para manejar escalado de elementos del mapa
export 

  const scaleElement = (elementId, scaleFactor) => {
    setElements(prev => prev.map(el => {
      if (el._id === elementId) {

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
