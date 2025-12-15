import { useEffect, useState, useCallback } from 'react';

const imageCache = new Map();

const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src));
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const useImagePreloader = (imageUrls = [], options = {}) => {
  const { priority = false, onComplete, onError } = options;
  const [loadedImages, setLoadedImages] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const preload = useCallback(async (urls) => {
    if (!Array.isArray(urls) || urls.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const promises = urls.map(url => preloadImage(url));
      const images = await Promise.all(promises);
      
      const newLoadedImages = new Map();
      urls.forEach((url, index) => {
        newLoadedImages.set(url, images[index]);
      });
      
      setLoadedImages(newLoadedImages);
      if (onComplete) onComplete(newLoadedImages);
    } catch (err) {
      setError(err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [onComplete, onError]);

  useEffect(() => {
    if (imageUrls.length > 0) {
      if (priority || typeof requestIdleCallback === 'undefined') {
        preload(imageUrls);
      } else {
        requestIdleCallback(() => {
          preload(imageUrls);
        }, { timeout: 2000 });
      }
    }
  }, [imageUrls.join(','), priority, preload]);

  return {
    loadedImages,
    loading,
    error,
    preload,
  };
};

export default useImagePreloader;