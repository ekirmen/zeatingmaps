import React, { memo, useEffect, useState, useMemo } from 'react';
import { Layer, Image as KonvaImage } from 'react-konva';
import resolveImageUrl from '../utils/resolveImageUrl';

const BackgroundImage = ({ config, onLoadProgress }) => {
  const rawUrl = useMemo(() => {
    let url = config.imageUrl || config.url || config.src || config.image?.url || config.image?.publicUrl || config.imageData || config.image?.data || '';
    if (url && !/^https?:\/\//i.test(url) && !/^data:/i.test(url)) {
      url = resolveImageUrl(url, 'productos') || url;
    }
    return url;
  }, [config]);

  const [img, setImg] = useState(null);

  useEffect(() => {
    if (!rawUrl) {
      setImg(null);
      if (onLoadProgress) onLoadProgress(100);
      return;
    }

    let cancelled = false;
    const image = new window.Image();
    // image.crossOrigin = 'anonymous'; // Removed to avoid CORS issues
    image.loading = 'lazy';
    image.decoding = 'async';

    image.onload = () => {
      if (!cancelled) {
        setImg(image);
        if (onLoadProgress) onLoadProgress(100);
      }
    };

    image.onerror = (err) => {
      if (!cancelled) {
        setImg(null);
        if (onLoadProgress) onLoadProgress(100);
      }
    };

    image.src = rawUrl;

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawUrl]); // Removed onLoadProgress to prevent re-fetching on parent re-renders

  const imageProps = useMemo(() => ({
    x: config.position?.x || config.posicion?.x || 0,
    y: config.position?.y || config.posicion?.y || 0,
    scaleX: config.scale || 1,
    scaleY: config.scale || 1,
    opacity: config.opacity ?? 1,
    listening: false
  }), [config]);

  if (!img) return null;
  return <KonvaImage image={img} {...imageProps} />;
};

const BackgroundLayerCore = ({ backgroundElements = [], onImageLoadProgress }) => {
  if (!backgroundElements || backgroundElements.length === 0) return null;

  return (
    <Layer>
      {backgroundElements.map((bg, index) => (
        <BackgroundImage
          key={`bg_${bg._id || bg.id || bg.imageUrl || bg.url || bg.src || index}`}
          config={bg}
          onLoadProgress={onImageLoadProgress ? (progress) => onImageLoadProgress(index, progress, backgroundElements.length) : undefined}
        />
      ))}
    </Layer>
  );
};

export default memo(BackgroundLayerCore);
