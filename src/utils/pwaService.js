/**
 * Servicio para gestionar PWA: registro de service worker, install prompt, etc.
 */

// Registrar Service Worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('[PWA] Service Worker registrado:', registration.scope);
      
      // Verificar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] Nueva versión del Service Worker encontrada');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nueva versión disponible
            console.log('[PWA] Nueva versión disponible. Recarga la página para actualizar.');
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
    console.warn('[PWA] Service Workers no soportados en este navegador');
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
    console.warn('[PWA] No hay prompt de instalación disponible');
    return false;
  }
  
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('[PWA] Resultado de instalación:', outcome);
    
    if (outcome === 'accepted') {
      console.log('[PWA] Usuario aceptó instalar la app');
      return true;
    } else {
      console.log('[PWA] Usuario rechazó instalar la app');
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
      console.log('[PWA] Background sync registrado:', tag);
      return true;
    } catch (error) {
      console.error('[PWA] Error registrando background sync:', error);
      return false;
    }
  } else {
    console.warn('[PWA] Background Sync no soportado');
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

export default {
  registerServiceWorker,
  promptPWAInstall,
  installPWA,
  isPWAInstalled,
  canInstallPWA,
  registerBackgroundSync,
  getConnectionStatus,
  onConnectionChange
};

