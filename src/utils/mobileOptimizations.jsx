/**
 * Utilidades para optimizaciones específicas de mobile
 */

/**
 * Detecta si el dispositivo es mobile
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  
  // Detectar por User-Agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Detectar por tamaño de pantalla
  const isSmallScreen = window.innerWidth <= 768;
  
  // Detectar por touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return mobileRegex.test(userAgent) || (isSmallScreen && hasTouch);
};

/**
 * Obtiene configuración de throttling optimizada para mobile
 */
export const getThrottleConfig = () => {
  const isMobile = isMobileDevice();
  
  return {
    delay: isMobile ? 500 : 300, // Mayor delay en mobile para evitar clicks accidentales
    maxClicks: isMobile ? 5 : 10, // Menos clicks permitidos en mobile
    windowMs: isMobile ? 7000 : 5000 // Ventana de tiempo más larga en mobile
  };
};

/**
 * Obtiene configuración de canvas optimizada para mobile
 */
export const getCanvasConfig = () => {
  const isMobile = isMobileDevice();
  
  return {
    pixelRatio: isMobile ? 1 : window.devicePixelRatio || 1, // Reducir pixel ratio en mobile
    batchDraw: true, // Usar batchDraw para mejor rendimiento
    listening: true, // Mantener eventos habilitados
    hitGraphEnabled: true, // Habilitar hit graph para mejor detección de clicks
    imageSmoothingEnabled: isMobile ? false : true, // Deshabilitar smoothing en mobile para mejor rendimiento
  };
};

/**
 * Optimiza el tamaño del Stage para mobile
 */
export const getOptimizedStageSize = (containerWidth, containerHeight) => {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // En mobile, limitar el tamaño máximo del canvas
    const maxWidth = Math.min(containerWidth, 1200);
    const maxHeight = Math.min(containerHeight, 1600);
    return { width: maxWidth, height: maxHeight };
  }
  
  return { width: containerWidth, height: containerHeight };
};

/**
 * Debounce optimizado para mobile (mayor delay)
 */
export const mobileDebounce = (func, delay) => {
  const isMobile = isMobileDevice();
  const optimizedDelay = isMobile ? delay * 1.5 : delay;
  
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), optimizedDelay);
  };
};

/**
 * Throttle optimizado para mobile (mayor delay)
 */
export const mobileThrottle = (func, delay) => {
  const isMobile = isMobileDevice();
  const optimizedDelay = isMobile ? delay * 1.5 : delay;
  
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= optimizedDelay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

/**
 * Ejecuta una función de forma no bloqueante (usando requestIdleCallback o setTimeout)
 */
export const runNonBlocking = (func, timeout = 100) => {
  if (typeof window === 'undefined') {
    func();
    return;
  }
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(func, { timeout });
  } else {
    setTimeout(func, 0);
  }
};

/**
 * Optimiza imágenes para mobile (reducir calidad/tamaño)
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  const isMobile = isMobileDevice();
  
  if (!url || !isMobile) {
    return url;
  }
  
  // Si es una URL de Supabase Storage, agregar parámetros de optimización
  if (url.includes('supabase.co/storage')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${options.width || 800}&quality=${options.quality || 75}`;
  }
  
  return url;
};

/**
 * Reduce la calidad de renderizado en mobile
 */
export const getRenderQuality = () => {
  const isMobile = isMobileDevice();
  return isMobile ? 'low' : 'high';
};

