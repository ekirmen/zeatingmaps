import React, { memo } from 'react';
import { Layer } from 'react-konva';
import { BackgroundImage } from './SeatingMapUnified';

/**
 * Componente optimizado para renderizar la capa de imágenes de fondo
 * Memoizado para evitar re-renders innecesarios
 */
const BackgroundLayer = memo(({ backgroundElements }) => {
  if (!backgroundElements || !Array.isArray(backgroundElements) || backgroundElements.length === 0) {
    return null;
  }

  return (
    <Layer>
      {backgroundElements.map(bg => (
        <BackgroundImage 
          key={`bg_${bg._id || bg.id || bg.imageUrl || bg.url || bg.src}`} 
          config={bg} 
        />
      ))}
    </Layer>
  );
});

BackgroundLayer.displayName = 'BackgroundLayer';

export default BackgroundLayer;
