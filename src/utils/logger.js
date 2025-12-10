/**
 * Logger utility para eliminar logs en producción
 * Solo muestra logs si NODE_ENV === 'development'
 */
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => {
    if (isDev)
  },
  warn: (...args) => {
    if (isDev)
  },
  error: (...args) => {
    // Errores siempre se muestran
    console.error(...args);
  },
  info: (...args) => {
    if (isDev)
  },
  debug: (...args) => {
    if (isDev)
  }
};

export default logger;

