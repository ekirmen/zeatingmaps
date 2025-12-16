// Hook para manejar imagen de fondo del mapa
import { message } from '../../utils/antdComponents';

const useMapaBackground = ({ backgroundSystem, setElements }) => {

  const setBackgroundImage = (imageUrl, options = {}) => {
    const backgroundElement = {
      _id: 'background_image',
      type: 'background',
      imageUrl,
      scale: options.scale || backgroundSystem.scale,
      opacity: options.opacity || backgroundSystem.opacity,
      position: options.position || backgroundSystem.position,
      showInWeb: options.showInWeb !== undefined ? options.showInWeb : backgroundSystem.showInWeb,
      showInEditor: options.showInEditor !== undefined ? options.showInEditor : backgroundSystem.showInEditor
    };

    setElements(prev => {
      const sinFondo = prev.filter(el => el.type !== 'background');
      return [...sinFondo, backgroundElement];
    });

    message.success('Imagen de fondo establecida');
  };

  const updateBackground = (updates) => {
    setElements(prev => prev.map(el => {
      if (el.type === 'background') {
        return { ...el, ...updates };
      }
      return el;
    }));
  };

  const removeBackground = () => {
    setElements(prev => prev.filter(el => el.type !== 'background'));
    message.success('Imagen de fondo removida');
  };

  return {
    setBackgroundImage,
    updateBackground,
    removeBackground,
    backgroundSystem
  };
};


export default useMapaBackground;
