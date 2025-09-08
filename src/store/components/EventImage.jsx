import React, { useState } from 'react';
import resolveImageUrl, { resolveEventImageWithTenant } from '../../utils/resolveImageUrl';
import { useTenant } from '../../contexts/TenantContext';

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

  // Función para obtener imágenes del evento
  const getEventImages = () => {
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
  };

  // Función para obtener URL de imagen
  const getImageUrl = (imagePath) => {
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
  };

  const images = getEventImages();
  const imagePath = images[imageType] || images.portada || images.obraImagen || images.banner;
  
  // Usar la nueva función con tenant_id
  const imageUrl = currentTenant?.id && event?.id 
    ? resolveEventImageWithTenant(event, imageType, currentTenant.id)
    : imagePath ? getImageUrl(imagePath) : null;
  
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
  
  // Texto para fallback
  const eventName = event?.nombre || event?.name || 'E';
  const fallbackChar = fallbackText || (typeof eventName === 'string' ? eventName.charAt(0) : 'E');
  
  // URL de fallback
  const fallbackUrl = `https://placehold.co/400x300/E0F2F7/000?text=${fallbackChar}`;

  const handleImageError = () => {
    console.warn('🖼️ [EventImage] Image failed to load:', imageUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    if (DEBUG) console.log('🖼️ [EventImage] Image loaded successfully:', imageUrl);
    setImageLoaded(true);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Imagen principal */}
      <img
        src={imageError ? fallbackUrl : (imageUrl || fallbackUrl)}
        alt={event?.nombre || event?.name || 'Evento'}
        className="w-full h-full object-cover"
        loading="lazy"
        crossOrigin="anonymous"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      
      {/* Indicador de carga */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Cargando...</div>
        </div>
      )}
      
      {/* Debug info */}
      {showDebug && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
          <div>Evento: {event?.nombre || event?.name}</div>
          <div>Tipo: {imageType}</div>
          <div>Path: {imagePath}</div>
          <div>URL: {imageUrl}</div>
          <div>Error: {imageError ? 'Sí' : 'No'}</div>
          <div>Loaded: {imageLoaded ? 'Sí' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default EventImage;
