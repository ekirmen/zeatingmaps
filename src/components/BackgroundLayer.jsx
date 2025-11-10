import React, { memo } from 'react';
import { Layer } from 'react-konva';
import { BackgroundImage } from './SeatingMapUnified';

/**
 * Componente optimizado para renderizar la capa de imágenes de fondo
 * Memoizado para evitar re-renders innecesarios
 */
const BackgroundLayer = memo(({ backgroundElements, onImageLoadProgress }) => {
  if (!backgroundElements || !Array.isArray(backgroundElements) || backgroundElements.length === 0) {
    return null;
  }

  return (
    <Layer>
      {backgroundElements.map((bg, index) => (
        <BackgroundImage 
          key={`bg_${bg._id || bg.id || bg.imageUrl || bg.url || bg.src || index}`} 
          config={bg}
          onLoadProgress={onImageLoadProgress ? (progress) => {
            // Reportar progreso individual de cada imagen
            onImageLoadProgress(index, progress, backgroundElements.length);
          } : undefined}
        />
      ))}
    </Layer>
  );
});

BackgroundLayer.displayName = 'BackgroundLayer';

export default BackgroundLayer;
