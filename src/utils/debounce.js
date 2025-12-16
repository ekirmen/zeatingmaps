/**
 * Utilidad para debounce de funciones
 * Evita ejecutar una función demasiado frecuentemente
 */

export function debounce(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    let timeout; // Fix variable scope
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Utilidad para throttle de funciones
 * Ejecuta una función como máximo una vez cada X milisegundos
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}