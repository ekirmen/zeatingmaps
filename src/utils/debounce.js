/**
 * Utilidad para debounce de funciones
 * Evita ejecutar una función demasiado frecuentemente
 */

const AutoWrapped_9v8w9n = (props) => {
  export function debounce(func, wait) {
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
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

};

export default AutoWrapped_9v8w9n;