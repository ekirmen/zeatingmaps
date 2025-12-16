/**
 * Utilidades para optimización de imágenes
 * - Conversión a WebP
 * - Lazy loading
 * - Responsive images
 */

/**
 * Detecta si el navegador soporta WebP
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (e) {
    return false;
  }
};

/**
 * Convierte una URL de imagen a WebP si está disponible
 * @param {string} url - URL original de la imagen
 * @returns {string} URL de WebP o URL original
 */
export const getWebPUrl = (url) => {
  if (!url) return url;
  
  // Si ya es WebP, retornar tal cual
  if (url.toLowerCase().endsWith('.webp')) {
    return url;
  }
  
  // Si el navegador no soporta WebP, retornar original
  if (!supportsWebP()) {
    return url;
  }
  
  // Intentar convertir a WebP
  // Esto depende de cómo tu servidor/CDN maneje WebP
  // Por ejemplo, Cloudinary, Imgix, etc. tienen conversión automática
  // Aquí asumimos que puedes agregar un parámetro o cambiar la extensión
  
  // Opción 1: Cambiar extensión (si el servidor lo soporta)
  const webpUrl = url.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  // Opción 2: Agregar parámetro (para servicios como Supabase Storage)
  // const webpUrl = url.includes('?') ? `${url}&format=webp` : `${url}?format=webp`;
  
  return webpUrl;
};

/**
 * Crea un srcset responsive para imágenes
 * @param {string} baseUrl - URL base de la imagen
 * @param {Array<number>} widths - Anchos disponibles
 * @returns {string} srcset string
 */
export const createSrcSet = (baseUrl, widths = [320, 640, 768, 1024, 1280, 1920]) => {
  return widths
    .map(width => `${getWebPUrl(baseUrl)}?w=${width} ${width}w`)
    .join(', ');
};

/**
 * Obtiene el tamaño de imagen apropiado según el viewport
 * @param {number} viewportWidth - Ancho del viewport
 * @returns {number} Ancho recomendado
 */
export const getOptimalImageWidth = (viewportWidth) => {
  if (viewportWidth < 480) return 320;
  if (viewportWidth < 768) return 640;
  if (viewportWidth < 1024) return 768;
  if (viewportWidth < 1280) return 1024;
  if (viewportWidth < 1920) return 1280;
  return 1920;
};

/**
 * Crea atributos optimizados para una imagen
 * @param {string} url - URL de la imagen
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Atributos para la imagen
 */
export const getOptimizedImageProps = (url, options = {}) => {
  const {
    alt = '',
    loading = 'lazy',
    decoding = 'async',
    sizes = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    width,
    height,
    className = ''
  } = options;

  const webpUrl = getWebPUrl(url);
  const srcSet = createSrcSet(url);

  return {
    src: webpUrl,
    srcSet,
    sizes,
    alt,
    loading,
    decoding,
    width,
    height,
    className: `optimized-image ${className}`.trim(),
    style: {
      maxWidth: '100%',
      height: 'auto'
    }
  };
};

/**
 * Preload una imagen de forma optimizada
 * @param {string} url - URL de la imagen
 * @returns {Promise<HTMLImageElement>} Promise que resuelve con la imagen cargada
 */
export const preloadOptimizedImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = getWebPUrl(url);
    img.loading = 'eager';
    img.decoding = 'sync';
    
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};

/**
 * Componente de imagen optimizada
 */
export const OptimizedImage = ({ 
  src, 
  alt = '', 
  className = '',
  width,
  height,
  priority = false,
  ...props 
}) => {
  const imageProps = getOptimizedImageProps(src, {
    alt,
    className,
    width,
    height,
    loading: priority ? 'eager' : 'lazy',
    decoding: priority ? 'sync' : 'async'
  });

  return <img {...imageProps} {...props} />;
};

export default {
  supportsWebP,
  getWebPUrl,
  createSrcSet,
  getOptimalImageWidth,
  getOptimizedImageProps,
  preloadOptimizedImage,
  OptimizedImage
};

