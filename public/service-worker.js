/**
 * Service Worker para PWA
 * Maneja caché offline, background sync y notificaciones push
 */

const CACHE_NAME = 'veneventos-v1';
const RUNTIME_CACHE = 'veneventos-runtime-v1';
const OFFLINE_URL = '/offline.html';

// Archivos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/logo192.png',
  '/logo512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Cacheando archivos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Instalación completada');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('[ServiceWorker] Error en instalación:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Eliminar caches antiguos
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('[ServiceWorker] Activación completada');
      return self.clients.claim(); // Tomar control de todas las páginas
    })
  );
});

// Estrategia: Network First, luego Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // No interceptar si no es una request GET/HEAD
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return;
  }

  try {
    const url = new URL(request.url);

    // Ignorar requests a APIs externas y Supabase (dejar que pasen directamente)
    if (url.origin.includes('supabase.co') || 
        url.origin.includes('googleapis.com') ||
        url.origin.includes('gstatic.com') ||
        url.origin.includes('vercel.app') ||
        url.pathname.startsWith('/api/') ||
        url.pathname.includes('service-worker.js')) {
      // No interceptar - dejar que pasen directamente
      return;
    }

    // Para recursos estáticos CSS/JS, NO interceptar por defecto
    // Esto previene problemas de MIME types y permite que Vercel aplique headers correctos
    // El service worker NO interceptará estos requests para evitar el error "Refused to apply style"
    if (request.destination === 'style' || request.destination === 'script') {
      // Limpiar cache de versiones con MIME types incorrectos en background (no bloqueante)
      event.waitUntil(
        (async () => {
          try {
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(request);
            if (cached) {
              const contentType = cached.headers.get('content-type');
              // Si el MIME type es incorrecto, eliminar del cache
              if (request.destination === 'style' && contentType && !contentType.includes('text/css')) {
                console.warn('[ServiceWorker] Limpiando CSS cacheado con MIME type incorrecto:', contentType);
                await cache.delete(request).catch(() => {});
              } else if (request.destination === 'script' && contentType && !contentType.includes('javascript')) {
                console.warn('[ServiceWorker] Limpiando JS cacheado con MIME type incorrecto:', contentType);
                await cache.delete(request).catch(() => {});
              }
            }
          } catch (error) {
            // Ignorar errores de cache - no crítico
          }
        })()
      );
      
      // NO interceptar - dejar que el request pase directamente
      // Esto permite que Vercel aplique los headers correctos (Content-Type: text/css)
      // y previene el error "Refused to apply style from ... because its MIME type ('text/plain') is not a supported stylesheet MIME type"
      return;
    }

    // Para imágenes y fuentes, usar cache first pero con manejo de errores robusto
    if (request.destination === 'image' || request.destination === 'font') {
      event.respondWith(
        cacheFirst(request).catch(error => {
          console.warn('[ServiceWorker] Error en cacheFirst para imagen/fuente:', error);
          return fetch(request);
        })
      );
      return;
    }

    // Para HTML y navegación, usar Network First
    if (request.mode === 'navigate') {
      event.respondWith(
        networkFirst(request).catch(error => {
          console.warn('[ServiceWorker] Error en networkFirst para navegación:', error);
          return fetch(request).catch(() => {
            return caches.match(OFFLINE_URL) || new Response('Offline', { status: 503 });
          });
        })
      );
      return;
    }

    // Para otros recursos, no interceptar si hay dudas
    // Solo interceptar si podemos manejar el error de forma segura
    return;
  } catch (error) {
    // Si hay cualquier error, NO interceptar el request
    console.error('[ServiceWorker] Error en fetch event listener, no interceptando:', error);
    return;
  }
});

// Función especializada para manejar assets estáticos (CSS/JS) de forma segura
// Solo intercepta si hay una versión cacheada válida, de lo contrario deja que pase directamente
async function handleStaticAssetSafe(request) {
  try {
    // Solo intentar usar cache si existe una versión cacheada válida
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      // Verificar que la respuesta cacheada sea válida
      try {
        // Verificar headers de la respuesta cacheada
        const contentType = cached.headers.get('content-type');
        if (contentType && (
          contentType.includes('text/css') || 
          contentType.includes('application/javascript') ||
          contentType.includes('text/javascript')
        )) {
          // La respuesta cacheada tiene el MIME type correcto, usarla
          return cached;
        } else {
          // La respuesta cacheada tiene un MIME type incorrecto, no usarla
          console.warn('[ServiceWorker] Respuesta cacheada con MIME type incorrecto, no usando cache:', contentType);
          // Eliminar del cache para forzar una nueva descarga
          cache.delete(request).catch(() => {});
          // Dejar que pase directamente para que Vercel aplique headers correctos
          throw new Error('Invalid cached MIME type');
        }
      } catch (validationError) {
        // Si hay error validando, no usar cache
        throw validationError;
      }
    }
  } catch (cacheError) {
    // Si el cache falla o no hay versión cacheada, no interceptar
    // Esto permite que Vercel aplique los headers correctos
    throw cacheError;
  }

  // Si no hay versión cacheada válida, no interceptar
  // Esto permite que el request pase directamente y Vercel aplique headers
  throw new Error('No valid cached version');
}

// Estrategia Cache First (para assets estáticos)
async function cacheFirst(request) {
  // Solo cachear GET y HEAD requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      return await fetch(request);
    } catch (error) {
      console.warn('[ServiceWorker] Error en fetch (no cacheable):', error);
      // Dejar que el navegador maneje el error normalmente
      return new Response('Network error', { status: 408, statusText: 'Request Timeout' });
    }
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
  } catch (cacheError) {
    console.warn('[ServiceWorker] Error accediendo al cache:', cacheError);
    // Continuar con fetch si el cache falla
  }
  
  try {
    const response = await fetch(request);
    
    // Solo cachear respuestas exitosas y que sean cacheables
    if (response && response.ok && response.status === 200) {
      try {
        // Clonar la respuesta antes de cachear
        const responseClone = response.clone();
        // Verificar que la respuesta sea cacheable
        if (responseClone.type === 'basic' || responseClone.type === 'cors') {
          const cache = await caches.open(CACHE_NAME);
          // Intentar cachear, pero no fallar si no se puede
          cache.put(request, responseClone).catch(cacheError => {
            console.warn('[ServiceWorker] No se pudo cachear:', request.url, cacheError);
          });
        }
      } catch (cacheError) {
        // Si falla el cacheo, no es crítico, continuar
        console.warn('[ServiceWorker] Error cacheando respuesta:', cacheError);
      }
    }
    return response;
  } catch (error) {
    console.warn('[ServiceWorker] Error en cacheFirst (fetch falló):', error);
    
    // Si hay un error de red, intentar devolver del cache como último recurso
    try {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
    } catch (cacheError) {
      // Ignorar errores de cache
    }
    
    // Retornar offline page si es navegación
    if (request.mode === 'navigate') {
      try {
        const offlinePage = await caches.match(OFFLINE_URL);
        if (offlinePage) {
          return offlinePage;
        }
      } catch (offlineError) {
        // Ignorar error de offline page
      }
    }
    
    // Devolver una respuesta de error en lugar de lanzar excepción
    return new Response('Network error', { 
      status: 408, 
      statusText: 'Request Timeout',
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

// Estrategia Network First (para contenido dinámico)
async function networkFirst(request) {
  // Solo cachear GET y HEAD requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      return await fetch(request);
    } catch (error) {
      console.warn('[ServiceWorker] Error en fetch (no cacheable):', error);
      // Dejar que el navegador maneje el error normalmente
      return new Response('Network error', { status: 408, statusText: 'Request Timeout' });
    }
  }

  let cache;
  try {
    cache = await caches.open(RUNTIME_CACHE);
  } catch (cacheError) {
    console.warn('[ServiceWorker] Error abriendo cache:', cacheError);
    // Continuar sin cache si no se puede abrir
    cache = null;
  }
  
  try {
    const response = await fetch(request);
    
    // Solo cachear respuestas exitosas y que sean cacheables
    if (response && response.ok && response.status === 200 && cache) {
      try {
        // Clonar la respuesta antes de cachear
        const responseClone = response.clone();
        // Verificar que la respuesta sea cacheable (básica o CORS)
        if (responseClone.type === 'basic' || responseClone.type === 'cors') {
          // Intentar cachear, pero no fallar si no se puede
          cache.put(request, responseClone).catch(cacheError => {
            console.warn('[ServiceWorker] No se pudo cachear la respuesta:', cacheError);
          });
        }
      } catch (cacheError) {
        // Si falla el cacheo, no es crítico, continuar
        console.warn('[ServiceWorker] Error cacheando respuesta:', cacheError);
      }
    }
    
    return response;
  } catch (error) {
    console.warn('[ServiceWorker] Red no disponible, intentando usar cache:', error.message);
    
    // Intentar obtener del cache solo para GET/HEAD
    if (cache && (request.method === 'GET' || request.method === 'HEAD')) {
      try {
        const cached = await cache.match(request);
        if (cached) {
          console.log('[ServiceWorker] Devolviendo desde cache:', request.url);
          return cached;
        }
      } catch (cacheError) {
        console.warn('[ServiceWorker] Error leyendo del cache:', cacheError);
      }
    }
    
    // Si es navegación y no hay cache, mostrar página offline
    if (request.mode === 'navigate') {
      try {
        const offlinePage = await caches.match(OFFLINE_URL);
        if (offlinePage) {
          return offlinePage;
        }
      } catch (offlineError) {
        // Ignorar error de offline page
      }
    }
    
    // Para assets estáticos (CSS, JS), no fallar completamente
    // Dejar que el navegador maneje el error normalmente
    if (request.destination === 'style' || request.destination === 'script') {
      // Devolver respuesta vacía para que el navegador maneje el error
      return new Response('', { 
        status: 408, 
        statusText: 'Request Timeout',
        headers: {
          'Content-Type': request.destination === 'style' ? 'text/css' : 'application/javascript'
        }
      });
    }
    
    // Para otros recursos, devolver error controlado
    return new Response('Network error', { 
      status: 408, 
      statusText: 'Request Timeout',
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}

// Background Sync para sincronizar datos cuando vuelva la conexión
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  } else if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

// Sincronizar pagos pendientes
async function syncPayments() {
  try {
    // Obtener pagos pendientes del IndexedDB
    const pendingPayments = await getPendingPayments();
    
    for (const payment of pendingPayments) {
      try {
        // Intentar procesar el pago
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment)
        });
        
        if (response.ok) {
          // Marcar como sincronizado
          await markPaymentSynced(payment.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Error sincronizando pago:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Error en syncPayments:', error);
  }
}

// Sincronizar carrito
async function syncCart() {
  try {
    // Obtener carrito del localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (cart.length > 0) {
      // Sincronizar con el servidor
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
      });
    }
  } catch (error) {
    console.error('[ServiceWorker] Error sincronizando carrito:', error);
  }
}

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push recibido:', event);
  
  let notificationData = {
    title: 'Nueva notificación',
    body: 'Tienes una nueva notificación',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'notification',
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || '/logo192.png',
        badge: '/logo192.png',
        tag: data.tag || 'notification',
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || [],
        vibrate: data.vibrate || [200, 100, 200]
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: notificationData.actions,
      vibrate: notificationData.vibrate
    })
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notificación clickeada:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Helpers para IndexedDB (simplificados)
async function getPendingPayments() {
  // Implementar lógica para obtener pagos pendientes del IndexedDB
  return [];
}

async function markPaymentSynced(paymentId) {
  // Implementar lógica para marcar pago como sincronizado
  console.log('[ServiceWorker] Pago sincronizado:', paymentId);
}

