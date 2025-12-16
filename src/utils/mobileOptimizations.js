/**
 * Utilidades para optimizaciones específicas de mobile
 */
/**
 * Detecta si el dispositivo es mobile
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  try {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isSmallScreen = window.innerWidth <= 768;
    const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
    return mobileRegex.test(userAgent) || (isSmallScreen && hasTouch);
  } catch (e) {
    return false;
  }
};

export const getMobileThrottlingConfig = (isMobileFlag = isMobile()) => {
  return {
    delay: isMobileFlag ? 500 : 300,
    maxClicks: isMobileFlag ? 5 : 10,
    windowMs: isMobileFlag ? 7000 : 5000
  };
};

export const getCanvasConfig = (isMobileFlag = isMobile()) => {
  return {
    pixelRatio: isMobileFlag ? 1 : (window.devicePixelRatio || 1),
    batchDraw: true,
    listening: true,
    hitGraphEnabled: true,
    imageSmoothingEnabled: isMobileFlag ? false : true
  };
};

export const getOptimizedStageSize = (containerWidth, containerHeight, isMobileFlag = isMobile()) => {
  if (isMobileFlag) {
    const maxWidth = Math.min(containerWidth, 1200);
    const maxHeight = Math.min(containerHeight, 1600);
    return { width: maxWidth, height: maxHeight };
  }
  return { width: containerWidth, height: containerHeight };
};

export const debounceOptimized = (func, delay = 300, isMobileFlag = isMobile()) => {
  const optimizedDelay = isMobileFlag ? delay * 1.5 : delay;
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), optimizedDelay);
  };
};

export const throttleOptimized = (func, delay = 300, isMobileFlag = isMobile()) => {
  const optimizedDelay = isMobileFlag ? delay * 1.5 : delay;
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= optimizedDelay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

export const runNonBlocking = (func, timeout = 50) => {
  if (typeof window === 'undefined') {
    setTimeout(func, 0);
    return;
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(func, { timeout });
  } else {
    setTimeout(func, 0);
  }
};

export const optimizeImageForMobile = (url, options = {}, isMobileFlag = isMobile()) => {
  if (!url || !isMobileFlag) return url;
  try {
    if (url.includes('supabase.co/storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=${options.width || 800}&quality=${options.quality || 75}`;
    }
  } catch (e) {
    // fallback to original url
  }
  return url;
};

export const getRenderQuality = (isMobileFlag = isMobile()) => (isMobileFlag ? 'low' : 'high');

export default {
  isMobile,
  getMobileThrottlingConfig,
  getCanvasConfig,
  getOptimizedStageSize,
  debounceOptimized,
  throttleOptimized,
  runNonBlocking,
  optimizeImageForMobile,
  getRenderQuality
};

