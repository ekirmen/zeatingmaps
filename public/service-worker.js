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
  const url = new URL(request.url);

  // Ignorar requests a APIs externas y Supabase
  if (url.origin.includes('supabase.co') || 
      url.origin.includes('googleapis.com') ||
      url.origin.includes('gstatic.com')) {
    // Network only para APIs
    return;
  }

  // Para assets estáticos, usar Cache First
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Para HTML y navegación, usar Network First
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Para otros recursos, usar Network First
  event.respondWith(networkFirst(request));
});

// Estrategia Cache First (para assets estáticos)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Error en cacheFirst:', error);
    // Retornar offline page si es navegación
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Estrategia Network First (para contenido dinámico)
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    
    // Cachear respuestas exitosas
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Red no disponible, usando cache:', error);
    
    // Intentar obtener del cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Si es navegación y no hay cache, mostrar página offline
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
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

