/**
 * Servicio para gestionar PWA: registro de service worker, install prompt, etc.
 */

// Registrar Service Worker
export const registerServiceWorker = async () => {
  // Verificar si el service worker está deshabilitado
  if (localStorage.getItem('disableServiceWorker') === 'true') {
    return null;
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Siempre verificar actualizaciones del service worker
      });
      // Verificar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión disponible
            // Aquí podrías mostrar un banner al usuario
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Error registrando Service Worker:', error);
      return null;
    }
  } else {
    return null;
  }
};

// Solicitar instalación de PWA
export const promptPWAInstall = () => {
  // Verificar si el navegador soporta beforeinstallprompt
  return new Promise((resolve) => {
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      resolve(deferredPrompt);
    });

    // Si ya pasó el evento, resolver inmediatamente
    if (window.deferredPrompt) {
      resolve(window.deferredPrompt);
    }
  });
};

// Instalar PWA
export const installPWA = async (deferredPrompt) => {
  if (!deferredPrompt) {
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('[PWA] Error en instalación:', error);
    return false;
  }
};

// Verificar si la app está instalada
export const isPWAInstalled = () => {
  // Verificar si está en modo standalone (iOS)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Verificar si está en modo standalone (Android)
  if (window.navigator.standalone === true) {
    return true;
  }

  // Verificar si hay un service worker activo
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return true;
  }

  return false;
};

// Verificar si se puede instalar
export const canInstallPWA = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Sincronizar en background (Background Sync API)
export const registerBackgroundSync = async (tag = 'sync-payments') => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      return true;
    } catch (error) {
      console.error('[PWA] Error registrando background sync:', error);
      return false;
    }
  } else {
    return false;
  }
};

// Obtener estado de conexión
export const getConnectionStatus = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
  }

  return {
    online: navigator.onLine,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  };
};

// Suscribirse a cambios de conexión
export const onConnectionChange = (callback) => {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => {
        callback(getConnectionStatus());
      });
    }
  }

  window.addEventListener('online', () => {
    callback(getConnectionStatus());
  });

  window.addEventListener('offline', () => {
    callback(getConnectionStatus());
  });
};

// Asignar a variable antes de exportar
const pwaService = {
  registerServiceWorker,
  promptPWAInstall,
  installPWA,
  isPWAInstalled,
  canInstallPWA,
  registerBackgroundSync,
  getConnectionStatus,
  onConnectionChange
};

export default pwaService;