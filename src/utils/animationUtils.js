/**
 * Utilidades para optimizar animaciones y performance
 */

/**
 * Detecta si el dispositivo es móvil o tiene recursos limitados
 */
export const isLowPerformanceDevice = () => {
  if (typeof window === 'undefined') return false;
  try {
    // Verificar si el usuario prefiere movimiento reducido
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }

    // Verificar si es móvil por ancho
    if (window.innerWidth && window.innerWidth <= 768) {
      return true;
    }

    // Verificar hardware (número de cores)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Limpia will-change después de una animación para evitar memory leaks
 * @param {HTMLElement} element - Elemento a limpiar
 * @param {string} property - Propiedad de will-change a limpiar
 */
export const cleanupWillChange = (element, property = 'auto') => {
  if (!element) return;
  
  // Remover will-change después de un pequeño delay
  setTimeout(() => {
    if (element.style) {
      element.style.willChange = property;
    }
    element.classList.remove('will-change-transform', 'will-change-opacity');
    element.classList.add('will-change-none');
  }, 300);
};

/**
 * Agrega event listeners para limpiar will-change después de animaciones
 * @param {HTMLElement} element - Elemento a optimizar
 */
export const optimizeAnimationElement = (element) => {
  if (!element || isLowPerformanceDevice()) return;
  
  const cleanup = () => cleanupWillChange(element);
  
  element.addEventListener('animationend', cleanup, { once: true });
  element.addEventListener('transitionend', cleanup, { once: true });
};

/**
 * Crea una animación CSS optimizada
 * @param {HTMLElement} element - Elemento a animar
 * @param {string} animationClass - Clase de animación CSS
 * @param {Function} onComplete - Callback cuando termine la animación
 */
export const animateWithCSS = (element, animationClass, onComplete) => {
  if (!element || isLowPerformanceDevice()) {
    // En dispositivos de bajo rendimiento, solo aplicar el estado final
    if (onComplete) onComplete();
    return;
  }
  
  // Agregar clase de animación
  element.classList.add(animationClass);
  
  // Optimizar elemento
  optimizeAnimationElement(element);
  
  // Ejecutar callback cuando termine
  if (onComplete) {
    const handleAnimationEnd = (e) => {
      if (e.target === element) {
        element.removeEventListener('animationend', handleAnimationEnd);
        element.classList.remove(animationClass);
        onComplete();
      }
    };
    element.addEventListener('animationend', handleAnimationEnd, { once: true });
  }
};

/**
 * Debounce para animaciones (evitar animaciones excesivas)
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 */
export const debounceAnimation = (func, wait = 100) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle para animaciones (limitar frecuencia)
 * @param {Function} func - Función a throttle
 * @param {number} limit - Límite de tiempo en ms
 */
export const throttleAnimation = (func, limit = 100) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Verifica si un elemento está visible en el viewport
 * @param {HTMLElement} element - Elemento a verificar
 * @param {number} threshold - Porcentaje de visibilidad (0-1)
 */
export const isElementVisible = (element, threshold = 0.1) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const vertInView = (rect.top <= windowHeight * (1 - threshold)) &&
                     (rect.bottom >= windowHeight * threshold);
  const horInView = (rect.left <= windowWidth * (1 - threshold)) &&
                    (rect.right >= windowWidth * threshold);
  
  return vertInView && horInView;
};

/**
 * Observador de intersección para animar solo elementos visibles
 * @param {HTMLElement[]} elements - Elementos a observar
 * @param {string} animationClass - Clase de animación a aplicar
 * @param {Object} options - Opciones del IntersectionObserver
 */
export const animateVisibleElements = (elements, animationClass, options = {}) => {
  if (isLowPerformanceDevice()) {
    // En dispositivos de bajo rendimiento, aplicar animación inmediatamente
    elements.forEach(el => {
      if (el) el.classList.add(animationClass);
    });
    return;
  }
  
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(animationClass);
        optimizeAnimationElement(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, defaultOptions);
  
  elements.forEach(el => {
    if (el) observer.observe(el);
  });
  
  return observer;
};

/**
 * Reemplaza animaciones de framer-motion con CSS cuando sea posible
 * @param {Object} motionProps - Props de framer-motion
 * @returns {Object} Props optimizadas para CSS
 */
export const convertMotionToCSS = (motionProps) => {
  if (isLowPerformanceDevice()) {
    return {
      style: {
        opacity: motionProps.initial?.opacity ?? 1,
        transform: 'none'
      }
    };
  }
  
  // Convertir props de framer-motion a clases CSS
  const cssClasses = [];
  
  if (motionProps.initial?.opacity === 0) {
    cssClasses.push('animate-fade-in');
  }
  
  if (motionProps.initial?.y !== undefined) {
    if (motionProps.initial.y > 0) {
      cssClasses.push('animate-slide-in-up');
    } else {
      cssClasses.push('animate-slide-in-down');
    }
  }
  
  if (motionProps.initial?.x !== undefined) {
    if (motionProps.initial.x > 0) {
      cssClasses.push('animate-slide-in-left');
    } else {
      cssClasses.push('animate-slide-in-right');
    }
  }
  
  if (motionProps.initial?.scale !== undefined && motionProps.initial.scale < 1) {
    cssClasses.push('animate-scale-in');
  }
  
  return {
    className: cssClasses.join(' ')
  };
};

export default {
  isLowPerformanceDevice,
  cleanupWillChange,
  optimizeAnimationElement,
  animateWithCSS,
  debounceAnimation,
  throttleAnimation,
  isElementVisible,
  animateVisibleElements,
  convertMotionToCSS
};

