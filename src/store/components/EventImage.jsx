import React, { useState, useMemo, useCallback } from 'react';
import resolveImageUrl, { resolveEventImageWithTenant } from '../../utils/resolveImageUrl';
import { useTenant } from '../../contexts/TenantContext';
import OptimizedImage from '../../components/OptimizedImage';

const EventImage = ({ 
  event, 
  imageType = 'banner', // 'banner', 'portada', 'obraImagen'
  className = '',
  fallbackText = null,
  showDebug = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { currentTenant } = useTenant();

  const DEBUG = showDebug === true && process.env.NODE_ENV === 'development';
  if (DEBUG) {
    console.log('🖼️ [EventImage] Component initialized:', {
      eventId: event?.id,
      eventName: event?.nombre || event?.name,
      imageType,
      tenantId: currentTenant?.id,
      hasTenant: !!currentTenant,
      showDebug
    });
  }

  // Función para obtener imágenes del evento (memoizada)
  const getEventImages = useCallback(() => {
    if (!event?.imagenes) return {};
    
    try {
      if (typeof event.imagenes === 'string') {
        return JSON.parse(event.imagenes);
      }
      return event.imagenes;
    } catch (e) {
      console.error('Error parsing event images:', e);
      return {};
    }
  }, [event?.imagenes]);

  // Función para obtener URL de imagen (memoizada)
  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    
    try {
      const resolvedUrl = resolveImageUrl(imagePath, 'eventos');
      if (DEBUG) {
        console.log('🖼️ [EventImage] Resolved URL:', resolvedUrl);
      }
      return resolvedUrl;
    } catch (error) {
      console.error('Error resolving image URL:', error);
      return null;
    }
  }, [DEBUG]);

  // Memoizar las imágenes del evento
  const images = useMemo(() => getEventImages(), [getEventImages]);
  
  // Memoizar el path de la imagen
  const imagePath = useMemo(() => 
    images[imageType] || images.portada || images.obraImagen || images.banner,
    [images, imageType]
  );
  
  // Memoizar la URL de la imagen
  const imageUrl = useMemo(() => {
    if (currentTenant?.id && event?.id) {
      return resolveEventImageWithTenant(event, imageType, currentTenant.id);
    }
    return imagePath ? getImageUrl(imagePath) : null;
  }, [currentTenant?.id, event, imageType, imagePath, getImageUrl]);
  
  if (DEBUG) {
    console.log('🖼️ [EventImage] Debug info:', {
      eventId: event?.id,
      tenantId: currentTenant?.id,
      imageType,
      imagePath,
      imageUrl,
      images: getEventImages(),
      imageData: images[imageType] || images.portada || images.obraImagen || images.banner
    });
  }
  
  // Memoizar texto para fallback
  const fallbackChar = useMemo(() => {
    const eventName = event?.nombre || event?.name || 'E';
    return fallbackText || (typeof eventName === 'string' ? eventName.charAt(0) : 'E');
  }, [event?.nombre, event?.name, fallbackText]);
  
  // Memoizar URL de fallback
  const fallbackUrl = useMemo(() => 
    `https://placehold.co/400x300/E0F2F7/000?text=${fallbackChar}`,
    [fallbackChar]
  );

  const handleImageError = useCallback(() => {
    console.warn('🖼️ [EventImage] Image failed to load:', imageUrl);
    setImageError(true);
  }, [imageUrl]);

  const handleImageLoad = useCallback(() => {
    if (DEBUG) console.log('🖼️ [EventImage] Image loaded successfully:', imageUrl);
    setImageLoaded(true);
  }, [DEBUG, imageUrl]);

  // Usar OptimizedImage para mejor performance
  const finalImageUrl = imageError ? fallbackUrl : (imageUrl || fallbackUrl);
  // Priorizar imágenes principales - siempre priorizar para tarjetas de eventos
  const isPriority = imageType === 'banner' || imageType === 'portada' || imageType === 'logoHorizontal' || true; // Siempre priorizar en lista de eventos

  // Si no hay URL de imagen válida, mostrar fallback inmediatamente
  const hasValidImageUrl = imageUrl && imageUrl !== fallbackUrl && !imageUrl.includes('placehold.co');
  
  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`} style={{ minHeight: '192px' }}>
      {hasValidImageUrl ? (
        <>
          <OptimizedImage
            src={imageUrl}
            alt={event?.nombre || event?.name || 'Evento'}
            className="w-full h-full"
            priority={isPriority}
            objectFit="cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
            placeholder={fallbackUrl}
          />
          {/* Indicador de carga */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
              <div className="text-gray-400 text-sm">Cargando...</div>
            </div>
          )}
        </>
      ) : (
        <div 
          className="w-full h-full bg-gray-200 flex items-center justify-center"
          style={{ 
            backgroundColor: '#f0f2f5',
            minHeight: '192px'
          }}
        >
          <div 
            className="text-gray-400 text-4xl font-bold"
            style={{ color: '#bfbfbf' }}
          >
            {fallbackChar}
          </div>
        </div>
      )}
      
      {/* Debug info */}
      {showDebug && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-10">
          <div>Evento: {event?.nombre || event?.name}</div>
          <div>Tipo: {imageType}</div>
          <div>Path: {imagePath}</div>
          <div>URL: {imageUrl}</div>
          <div>Error: {imageError ? 'Sí' : 'No'}</div>
          <div>Loaded: {imageLoaded ? 'Sí' : 'No'}</div>
          <div>Priority: {isPriority ? 'Sí' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default EventImage;
