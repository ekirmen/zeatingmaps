/**
 * Componente de imagen optimizado para Core Web Vitals
 * - Lazy loading nativo
 * - WebP con fallback
 * - Responsive images
 * - Preload de imágenes críticas
 * - Placeholder para evitar CLS
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';

const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  priority = false, // Si es true, preload la imagen
  sizes = '100vw',
  srcSet,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmMGYyZjUiLz48L3N2Zz4=',
  objectFit = 'cover',
  onLoad,
  onError,
  ...props
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Si es priority, siempre está en view
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Generar srcSet automáticamente si no se proporciona
  const generatedSrcSet = useMemo(() => {
    if (srcSet) return srcSet;
    if (!src || typeof src !== 'string') return undefined;

    // Si la URL contiene parámetros de Supabase, generar srcSet con diferentes tamaños
    if (src.includes('supabase.co')) {
      const baseUrl = src.split('?')[0];
      const params = new URLSearchParams(src.split('?')[1] || '');

      // Asegurar formato WebP
      if (!params.has('format')) params.set('format', 'webp');

      const widthParam = params.get('width') || '800';

      // Generar diferentes tamaños
      const sizes = [400, 800, 1200, 1600];
      return sizes
        .map(size => {
          // Clonar params para cada tamaño
          const p = new URLSearchParams(params);
          p.set('width', size);
          p.set('quality', '80');
          return `${baseUrl}?${p.toString()} ${size}w`;
        })
        .join(', ');
    }

    return undefined;
  }, [src, srcSet]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority || isInView) return; // No necesitamos observer si es priority o ya está en view

    if (!imgRef.current) return;

    // Si el navegador no soporta Intersection Observer, cargar inmediatamente
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Cargar 50px antes de que entre en viewport
        threshold: 0.01,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [priority, isInView]);

  // Preload de imágenes críticas
  useEffect(() => {
    if (priority && src && !imageLoaded && !imageError) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (generatedSrcSet) {
        link.imageSrcSet = generatedSrcSet;
        link.imageSizes = sizes;
      }
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [priority, src, imageLoaded, imageError, generatedSrcSet, sizes]);

  const handleLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setImageError(true);
    if (onError) onError(e);
  };

  // Calcular estilo para evitar CLS
  const imageStyle = useMemo(() => {
    const style = {
      objectFit,
      ...props.style,
    };

    // Si tenemos dimensiones, establecerlas para evitar CLS
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    // Aspect ratio para mantener proporciones
    if (width && height) {
      const aspectRatio = typeof width === 'number' && typeof height === 'number'
        ? width / height
        : null;
      if (aspectRatio) {
        style.aspectRatio = aspectRatio;
      }
    }

    return style;
  }, [width, height, objectFit, props.style]);

  // No renderizar hasta que esté en view (excepto si es priority)
  // Para imágenes en tarjetas de eventos, siempre renderizar (priority=true)
  if (!isInView && !priority) {
    return (
      <div
        ref={imgRef}
        className={className}
        style={{
          width: width || '100%',
          height: height || '100%',
          backgroundColor: '#f0f2f5',
          ...imageStyle,
        }}
        aria-label={alt}
        role="img"
      />
    );
  }

  return (
    <>
      <img
        ref={imgRef}
        src={imageError ? placeholder : src} // Considerar aplicar formato webp al src principal también si es supabase
        alt={alt}
        className={className}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={generatedSrcSet}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        style={{
          ...imageStyle,
          opacity: imageLoaded ? 1 : 0,
          transition: priority ? 'none' : 'opacity 0.3s ease-in-out', // Evitar transición en LCP
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      {/* Placeholder mientras carga */}
      {!imageLoaded && !imageError && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.3,
            zIndex: -1,
          }}
        />
      )}
    </>
  );
};

export default OptimizedImage;
