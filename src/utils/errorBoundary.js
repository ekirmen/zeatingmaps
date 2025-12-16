/**
 * Sistema de manejo de errores robusto para la aplicación
 * Captura errores de inicialización y referencias circulares
 */

// Función para capturar errores no manejados
export const setupGlobalErrorHandling = () => {
  // Capturar errores de JavaScript
  window.addEventListener('error', (event) => {
    console.error('🚨 [ERROR_HANDLER] Error de JavaScript capturado:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString()
    });

    // Si es un error de inicialización, intentar recuperar
    if (event.message.includes('Cannot access') || event.message.includes('before initialization')) {
      // Limpiar caché y reintentar
      setTimeout(() => {
        try {
          window.location.reload();
        } catch (reloadError) {
          console.error('❌ [ERROR_HANDLER] No se pudo recargar la página:', reloadError);
        }
      }, 2000);
    }
  });

  // Capturar promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 [ERROR_HANDLER] Promesa rechazada no manejada:', {
      reason: event.reason,
      timestamp: new Date().toISOString()
    });
  });

  // Capturar errores de recursos
  window.addEventListener('error', (event) => {
    if (event.target && event.target.tagName) {
      // Error de recurso capturado
    }
  }, true);
};

// Función para verificar si hay problemas de inicialización
export const checkInitializationIssues = () => {
  const issues = [];

  // Verificar si hay múltiples instancias de Supabase
  if (window.supabase && window.__supabaseClient) {
    issues.push('Múltiples instancias de Supabase detectadas');
  }

  // Verificar si hay contextos duplicados
  if (window.__contexts) {
    const contextNames = Object.keys(window.__contexts);
    const duplicates = contextNames.filter((name, index) => contextNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      issues.push(`Contextos duplicados: ${duplicates.join(', ')}`);
    }
  }

  // Verificar si hay variables no inicializadas
  try {
    // Intentar acceder a variables que podrían no estar inicializadas
    if (typeof window.zn !== 'undefined') {
      issues.push('Variable "zn" detectada en el scope global');
    }
  } catch (error) {
    // Esta es la condición esperada
  }


  return issues;
};

// Función para limpiar problemas de inicialización
export const cleanupInitializationIssues = () => {
  try {
    // Limpiar instancias duplicadas de Supabase
    if (window.__supabaseClient) {
      delete window.__supabaseClient;
    }

    // Limpiar contextos duplicados
    if (window.__contexts) {
      const contextNames = Object.keys(window.__contexts);
      contextNames.forEach(name => {
        if (window.__contexts[name] && typeof window.__contexts[name] === 'object') {
          // Verificar si el contexto tiene propiedades duplicadas
          const props = Object.getOwnPropertyNames(window.__contexts[name]);
          const duplicates = props.filter((prop, index) => props.indexOf(prop) !== index);
          if (duplicates.length > 0) {
          }
        }
      });
    }

    // Limpiar variables problemáticas del scope global
    const globalVars = ['zn', 'undefined', 'null'];
    globalVars.forEach(varName => {
      if (typeof window[varName] !== 'undefined') {
        delete window[varName];
      }
    });
  } catch (error) {
    console.error('❌ [ERROR_HANDLER] Error durante la limpieza:', error);
  }
};

// Función para recuperar de errores de inicialización
export const recoverFromInitializationError = async () => {
  try {
    // Limpiar problemas detectados
    cleanupInitializationIssues();

    // Esperar un poco antes de reintentar
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verificar si los problemas persisten
    const remainingIssues = checkInitializationIssues();

    if (remainingIssues.length === 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('❌ [ERROR_HANDLER] Error durante la recuperación:', error);
    return false;
  }
};

// Función para configurar el sistema de manejo de errores
export const setupErrorHandling = () => {
  setupGlobalErrorHandling();

  // Verificar problemas de inicialización periódicamente
  const checkInterval = setInterval(() => {
    const issues = checkInitializationIssues();
    if (issues.length > 0) {
      // Intentar recuperar automáticamente
      recoverFromInitializationError().then(success => {
        if (!success) {
          console.error('❌ [ERROR_HANDLER] No se pudo recuperar automáticamente');
        }
      });
    }
  }, 30000); // Verificar cada 30 segundos

  // Limpiar el intervalo al desmontar
  return () => {
    clearInterval(checkInterval);
  };
};

// Exportar por defecto
const errorBoundaryUtils = {
  setupGlobalErrorHandling,
  checkInitializationIssues,
  cleanupInitializationIssues,
  recoverFromInitializationError,
  setupErrorHandling
};

export default errorBoundaryUtils;
