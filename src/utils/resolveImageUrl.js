// Función para resolver URLs de imágenes desde Supabase Storage
export default function resolveImageUrl(imagePath, bucket = 'eventos') {
  if (!imagePath) {
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
  
  // Construir la URL completa para Supabase Storage
  const storageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  
  return storageUrl;
}

// Función específica para imágenes de eventos
export function resolveEventImageUrl(eventId, imageName) {
  if (!eventId || !imageName) {
    return null;
  }
  
  // Construir la ruta: eventos/{eventId}/{imageName}
  const imagePath = `${eventId}/${imageName}`;
  return resolveImageUrl(imagePath, 'eventos');
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
