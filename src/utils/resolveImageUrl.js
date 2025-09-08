// Función para resolver URLs de imágenes desde Supabase Storage
export default function resolveImageUrl(imagePath, bucket = 'eventos', tenantId = null, eventId = null) {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  // Si ya es una URL completa, devolverla tal como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Si es una ruta relativa, construir la URL de Supabase Storage
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.warn('REACT_APP_SUPABASE_URL no está definida');
    return imagePath;
  }

  // Limpiar la ruta de la imagen
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // Nueva estructura: tenant_id/event_id/image_name
  let finalPath = cleanPath;
  
  if (tenantId && eventId) {
    // Si tenemos tenant_id y event_id, usar la nueva estructura
    finalPath = `${tenantId}/${eventId}/${cleanPath}`;
    console.log('🖼️ [resolveImageUrl] Nueva estructura:', finalPath);
  } else if (tenantId) {
    // Si solo tenemos tenant_id, usar estructura por empresa
    finalPath = `${tenantId}/${cleanPath}`;
    console.log('🖼️ [resolveImageUrl] Estructura por empresa:', finalPath);
  }
  
  // Construir la URL completa para Supabase Storage
  const storageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${finalPath}`;
  
  return storageUrl;
}

// Función específica para imágenes de eventos
export function resolveEventImageUrl(eventId, imageName, tenantId = null) {
  if (!eventId || !imageName) {
    return null;
  }
  
  // Nueva estructura: tenant_id/event_id/image_name
  return resolveImageUrl(imageName, 'eventos', tenantId, eventId);
}

// Función para obtener URL de imagen de evento con tenant_id
export function resolveEventImageWithTenant(event, imageType, tenantId) {
  if (!event) {
    return null;
  }
  
  // Obtener imágenes del evento
  let images = {};
  try {
    if (typeof event.imagenes === 'string') {
      images = JSON.parse(event.imagenes);
    } else {
      images = event.imagenes || {};
    }
  } catch (e) {
    console.error('Error parsing event images:', e);
    return null;
  }
  
  // Obtener la imagen específica
  const imageData = images[imageType] || images.portada || images.obraImagen || images.banner;
  
  if (!imageData) {
    return null;
  }
  
  // Si la imagen ya tiene bucket específico, usarlo
  if (imageData.bucket) {
    const imagePath = imageData.url || imageData.publicUrl || imageData.src;
    return resolveImageUrl(imagePath, imageData.bucket);
  }
  
  // Si la imagen ya tiene publicUrl, usarlo directamente
  if (imageData.publicUrl) {
    return imageData.publicUrl;
  }
  
  // Si tenemos tenant_id, usar la nueva estructura en bucket 'eventos'
  if (tenantId && event.id) {
    const imagePath = imageData.url || imageData.src;
    return resolveImageUrl(imagePath, 'eventos', tenantId, event.id);
  }
  
  // Fallback: usar la estructura antigua
  const imagePath = imageData.url || imageData.src;
  return resolveImageUrl(imagePath, 'eventos');
}

// Función para obtener URL de imagen con bucket por tenant
export function resolveEventImageWithTenantBucket(event, imageType, tenantId) {
  if (!event || !tenantId) {
    return null;
  }
  
  // Obtener imágenes del evento
  let images = {};
  try {
    if (typeof event.imagenes === 'string') {
      images = JSON.parse(event.imagenes);
    } else {
      images = event.imagenes || {};
    }
  } catch (e) {
    console.error('Error parsing event images:', e);
    return null;
  }
  
  // Obtener la imagen específica
  const imageData = images[imageType] || images.portada || images.obraImagen || images.banner;
  
  if (!imageData) {
    return null;
  }
  
  const imagePath = imageData.url || imageData.publicUrl || imageData.src;
  const bucketName = `tenant-${tenantId}`;
  
  return resolveImageUrl(imagePath, bucketName);
}

// Función para obtener todas las imágenes de un evento
export function getEventImages(eventId) {
  if (!eventId) {
    return [];
  }
  
  // Esta función podría ser expandida para listar todas las imágenes de un evento
  // Por ahora, devuelve un array vacío que puede ser poblado con las imágenes conocidas
  return [];
}
