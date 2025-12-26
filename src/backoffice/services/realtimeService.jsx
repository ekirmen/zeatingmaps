// Servicio para sincronización en tiempo real usando Edge Functions
// En lugar de Realtime de Supabase

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.pollingIntervals = new Map();
    this.lastUpdateTimes = new Map();
    this.callbacks = new Map();
    this.isApiAvailable = true; // Estado de disponibilidad de la API
  }

  // Suscribirse a cambios de una sala específica
  async subscribeToSala(salaId, onUpdate) {
    if (this.subscriptions.has(salaId)) {
      return;
    }
    try {
      // Registrar callback
      this.callbacks.set(salaId, onUpdate);

      // Iniciar polling para verificar cambios
      this.startPolling(salaId);

      // Marcar como suscrito
      this.subscriptions.set(salaId, true);
    } catch (error) {
      console.error(`[RealtimeService] Error al suscribirse a sala ${salaId}:`, error);
      throw error;
    }
  }

  // Desuscribirse de una sala
  unsubscribeFromSala(salaId) {
    if (!this.subscriptions.has(salaId)) {
      return;
    }
    // Detener polling
    this.stopPolling(salaId);

    // Limpiar recursos
    this.subscriptions.delete(salaId);
    this.callbacks.delete(salaId);
    this.lastUpdateTimes.delete(salaId);
  }

  // Iniciar polling para una sala
  startPolling(salaId) {
    if (this.pollingIntervals.has(salaId)) {
      return; // Ya está activo
    }

    const interval = setInterval(async () => {
      await this.checkForUpdates(salaId);
    }, 2000); // Verificar cada 2 segundos

    this.pollingIntervals.set(salaId, interval);
  }

  // Detener polling para una sala
  stopPolling(salaId) {
    const interval = this.pollingIntervals.get(salaId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(salaId);
    }
  }

  // Verificar si hay actualizaciones
  async checkForUpdates(salaId) {
    try {
      // Verificar si la API está disponible antes de hacer la petición
      if (!this.isApiAvailable) {
        return;
      }

      const response = await fetch('/api/realtime-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaId,
          action: 'get_updates'
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          this.isApiAvailable = false;
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.isApiAvailable = false;
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        const lastUpdate = this.lastUpdateTimes.get(salaId);
        const currentUpdate = result.data.updated_at;

        // Si es la primera vez o hay una actualización más reciente
        if (!lastUpdate || new Date(currentUpdate) > new Date(lastUpdate)) {
          // Actualizar timestamp
          this.lastUpdateTimes.set(salaId, currentUpdate);

          // Llamar callback
          const callback = this.callbacks.get(salaId);
          if (callback) {
            callback(result.data);
          }
        }
      }

      // Si llegamos aquí, la API está funcionando correctamente
      if (!this.isApiAvailable) {
        this.isApiAvailable = true;
      }

    } catch (error) {
      console.error(`[RealtimeService] Error al verificar actualizaciones para sala ${salaId}:`, error);

      // Si es un error de red o similar, deshabilitar temporalmente la API
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        this.isApiAvailable = false;

        // Programar reintento en 30 segundos
        setTimeout(() => {
          this.isApiAvailable = true;
        }, 30000);
      }
    }
  }

  // Notificar un cambio a otros clientes
  async notifyChange(salaId, data) {
    try {
      const response = await fetch('/api/realtime-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaId,
          action: 'notify_change',
          data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
    } catch (error) {
      console.error(`[RealtimeService] Error al notificar cambio para sala ${salaId}:`, error);
    }
  }

  // Verificar estado de la API
  async checkApiHealth() {
    try {
      const response = await fetch('/api/realtime-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaId: 'health-check',
          action: 'get_updates'
        })
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          this.isApiAvailable = true;
          return true;
        }
      }

      this.isApiAvailable = false;
      return false;
    } catch (error) {
      console.error('[RealtimeService] Error al verificar estado de la API:', error);
      this.isApiAvailable = false;
      return false;
    }
  }

  // Reactivar API manualmente
  reactivateApi() {
    this.isApiAvailable = true;
  }

  // Obtener estado de suscripciones
  getSubscriptionStatus() {
    const status = {};
    for (const [salaId, isSubscribed] of this.subscriptions) {
      status[salaId] = {
        subscribed: isSubscribed,
        lastUpdate: this.lastUpdateTimes.get(salaId),
        hasPolling: this.pollingIntervals.has(salaId)
      };
    }

    // Agregar estado general del servicio
    status.service = {
      apiAvailable: this.isApiAvailable,
      totalSubscriptions: this.subscriptions.size,
      totalPolling: this.pollingIntervals.size
    };

    return status;
  }

  // Limpiar todas las suscripciones
  cleanup() {
    for (const salaId of this.subscriptions.keys()) {
      this.unsubscribeFromSala(salaId);
    }
  }
}

// Instancia singleton
const realtimeService = new RealtimeService();

// Cleanup al cerrar la página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.cleanup();
  });
}

export default realtimeService;
