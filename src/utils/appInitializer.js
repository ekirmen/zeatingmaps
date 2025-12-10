/**
 * Utilidades para la inicialización segura de la aplicación
 * Evita problemas de timing y referencias circulares
 */

// Función para esperar a que el DOM esté listo
export const waitForDOM = () => {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
};

// Función para esperar a que un elemento esté disponible
export const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout de seguridad
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} no encontrado en ${timeout}ms`));
    }, timeout);
  });
};

// Función para esperar a que un contexto esté disponible
export const waitForContext = (contextName, timeout = 3000) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = Math.floor(timeout / 100);

    const checkContext = () => {
      attempts++;

      // Verificar si el contexto está disponible
      if (window.__contexts && window.__contexts[contextName]) {
        resolve(window.__contexts[contextName]);
        return;
      }

      if (attempts >= maxAttempts) {
        reject(new Error(`Contexto ${contextName} no disponible en ${timeout}ms`));
        return;
      }

      setTimeout(checkContext, 100);
    };

    checkContext();
  });
};

// Función para registrar un contexto globalmente
export const registerContext = (name, context) => {
  if (!window.__contexts) {
    window.__contexts = {};
  }
  window.__contexts[name] = context;
};

// Función para limpiar contextos registrados
export const clearRegisteredContexts = () => {
  if (window.__contexts) {
    Object.keys(window.__contexts).forEach(key => {
      delete window.__contexts[key];
    });
  }
};

// Función para verificar el estado de la aplicación
export const checkAppState = () => {
  const state = {
    domReady: document.readyState === 'complete',
    supabaseAvailable: !!window.supabase,
    contextsRegistered: !!window.__contexts,
    localStorageAvailable: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    sessionStorageAvailable: (() => {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })()
  };
  return state;
};

// Función para inicializar la aplicación de forma segura
export const initializeApp = async () => {
  try {
    // Esperar a que el DOM esté listo
    await waitForDOM();
    // Verificar estado inicial
    checkAppState();

    // Esperar un poco más para asegurar que todos los módulos estén cargados
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  } catch (error) {
    console.error('❌ [APP_INIT] Error durante la inicialización:', error);
    return false;
  }
};

// Función para limpiar la aplicación al desmontar
export const cleanupApp = () => {
  try {
    clearRegisteredContexts();
  } catch (error) {
  }
};

// Exportar por defecto
const appInitializerUtils = {
  waitForDOM,
  waitForElement,
  waitForContext,
  registerContext,
  clearRegisteredContexts,
  checkAppState,
  initializeApp,
  cleanupApp
};

export default appInitializerUtils;
