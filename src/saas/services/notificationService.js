import { supabase } from '../../supabaseClient';

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.realtimeSubscription = null;
  }

  // Inicializar suscripción en tiempo real
  async initializeRealtime() {
    try {
      this.realtimeSubscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          payload => {
            this.handleNewNotification(payload.new);
          }
        )
        .subscribe();

      return true;
    } catch (error) {
      console.error('Error initializing realtime notifications:', error);
      return false;
    }
  }

  // Manejar nueva notificación
  handleNewNotification(notification) {
    // Notificar a todos los listeners
    this.listeners.forEach(callback => {
      callback(notification);
    });

    // Mostrar notificación del navegador si está disponible
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }

  // Suscribirse a notificaciones
  subscribe(callback) {
    const id = Date.now().toString();
    this.listeners.set(id, callback);
    return id;
  }

  // Desuscribirse de notificaciones
  unsubscribe(id) {
    this.listeners.delete(id);
  }

  // Crear notificación
  async createNotification(tenantId, type, title, message, data = {}) {
    try {
      const notificationData = {
        tenant_id: tenantId,
        type,
        title,
        message,
        data: JSON.stringify(data),
        read: false,
        created_at: new Date().toISOString(),
      };

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Obtener notificaciones de un tenant
  async getTenantNotifications(tenantId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting tenant notifications:', error);
      return [];
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(tenantId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('tenant_id', tenantId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Obtener contador de notificaciones no leídas
  async getUnreadCount(tenantId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Solicitar permisos de notificación del navegador
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Enviar notificación de sistema
  async sendSystemNotification(title, message, type = 'info') {
    try {
      // Obtener todos los tenants activos
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('status', 'active');

      if (error) throw error;

      // Crear notificación para cada tenant
      const notifications = tenants.map(tenant => ({
        tenant_id: tenant.id,
        type: `system_${type}`,
        title,
        message,
        read: false,
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase.from('notifications').insert(notifications);

      if (insertError) throw insertError;

      return true;
    } catch (error) {
      console.error('Error sending system notification:', error);
      return false;
    }
  }

  // Enviar notificación de mantenimiento
  async sendMaintenanceNotification(startTime, endTime, description) {
    const title = 'Mantenimiento Programado';
    const message = `El sistema estará en mantenimiento desde ${startTime} hasta ${endTime}. ${description}`;

    return await this.sendSystemNotification(title, message, 'warning');
  }

  // Enviar notificación de actualización
  async sendUpdateNotification(version, features) {
    const title = 'Actualización del Sistema';
    const message = `El sistema ha sido actualizado a la versión ${version}. Nuevas características: ${features.join(', ')}`;

    return await this.sendSystemNotification(title, message, 'info');
  }

  // Enviar notificación de alerta de seguridad
  async sendSecurityAlert(description, action) {
    const title = 'Alerta de Seguridad';
    const message = `${description} Acción requerida: ${action}`;

    return await this.sendSystemNotification(title, message, 'error');
  }

  // Limpiar notificaciones antiguas
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return false;
    }
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats() {
    try {
      const [
        { count: totalNotifications },
        { count: unreadNotifications },
        { count: systemNotifications },
        { count: paymentNotifications },
      ] = await Promise.all([
        supabase.from('notifications').select('*', { count: 'exact', head: true }),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('read', false),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .like('type', 'system_%'),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .like('type', 'payment_%'),
      ]);

      return {
        total: totalNotifications || 0,
        unread: unreadNotifications || 0,
        system: systemNotifications || 0,
        payment: paymentNotifications || 0,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        system: 0,
        payment: 0,
      };
    }
  }

  // Destruir servicio
  destroy() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    this.listeners.clear();
  }
}

export default new NotificationService();
