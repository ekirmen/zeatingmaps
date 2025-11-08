/**
 * Servicio de auditoría completo
 * Registra todas las acciones críticas del sistema para trazabilidad completa
 */

import { supabase } from '../supabaseClient';
import { hashData } from '../utils/encryption';

class AuditService {
  constructor() {
    this.currentUser = null;
    this.tenantId = null;
    this.sessionId = null;
    this.initializeSession();
  }

  /**
   * Inicializar sesión de auditoría
   */
  async initializeSession() {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUser = user;
      
      // Obtener tenant ID del contexto
      const tenantId = localStorage.getItem('currentTenantId');
      this.tenantId = tenantId;
      
      // Generar o recuperar session ID
      let sessionId = localStorage.getItem('auditSessionId');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('auditSessionId', sessionId);
      }
      this.sessionId = sessionId;
    } catch (error) {
      console.error('[AUDIT] Error inicializando sesión:', error);
    }
  }

  /**
   * Obtener IP del cliente (simulado, en producción usar servicio real)
   */
  async getClientIP() {
    try {
      // En producción, esto debería venir del servidor
      // Por ahora, usar un servicio externo o almacenar en el servidor
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Registrar acción de auditoría
   * @param {string} action - Tipo de acción (ej: 'payment_created', 'seat_locked', 'user_login')
   * @param {object} details - Detalles de la acción
   * @param {object} options - Opciones adicionales
   */
  async logAction(action, details = {}, options = {}) {
    try {
      // Actualizar usuario si es necesario
      if (!this.currentUser) {
        await this.initializeSession();
      }

      const {
        resourceId = null,
        resourceType = null,
        severity = 'info', // 'info', 'warning', 'error', 'critical'
        tenantId = this.tenantId,
        userId = this.currentUser?.id || null,
        metadata = {}
      } = options;

      // Obtener información del contexto
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;
      const timestamp = new Date().toISOString();
      const url = window.location.href;
      const referrer = document.referrer || null;

      // Hashear datos sensibles si es necesario
      const hashedDetails = await this.hashSensitiveFields(details);

      // Preparar datos de auditoría
      const auditData = {
        action,
        details: JSON.stringify(hashedDetails),
        metadata: JSON.stringify(metadata),
        resource_id: resourceId,
        resource_type: resourceType,
        severity,
        tenant_id: tenantId,
        user_id: userId,
        session_id: this.sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        url,
        referrer,
        created_at: timestamp
      };

      // Insertar en la base de datos
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([auditData])
        .select()
        .single();

      if (error) {
        console.error('[AUDIT] Error registrando acción:', error);
        // Fallback: almacenar localmente si falla la inserción
        await this.storeLocally(auditData);
        return null;
      }

      console.log('[AUDIT] Acción registrada:', action, data.id);
      return data;
    } catch (error) {
      console.error('[AUDIT] Error en logAction:', error);
      // Fallback: almacenar localmente
      await this.storeLocally({
        action,
        details: JSON.stringify(details),
        error: error.message,
        created_at: new Date().toISOString()
      });
      return null;
    }
  }

  /**
   * Hashear campos sensibles en los detalles
   */
  async hashSensitiveFields(details) {
    const sensitiveFields = [
      'password',
      'cardNumber',
      'cvv',
      'token',
      'secret',
      'apiKey',
      'privateKey',
      'pin'
    ];

    const hashed = { ...details };

    for (const field of sensitiveFields) {
      if (hashed[field]) {
        const hash = await hashData(hashed[field]);
        if (hash) {
          hashed[field] = `[HASHED:${hash.substring(0, 8)}...]`;
        }
      }
    }

    return hashed;
  }

  /**
   * Almacenar registro localmente como fallback
   */
  async storeLocally(auditData) {
    try {
      const localLogs = JSON.parse(localStorage.getItem('audit_logs_backup') || '[]');
      localLogs.push(auditData);
      
      // Mantener solo los últimos 100 registros
      if (localLogs.length > 100) {
        localLogs.shift();
      }
      
      localStorage.setItem('audit_logs_backup', JSON.stringify(localLogs));
    } catch (error) {
      console.error('[AUDIT] Error almacenando localmente:', error);
    }
  }

  /**
   * Registrar transacción de pago
   */
  async logPayment(action, paymentData, options = {}) {
    return this.logAction(
      `payment_${action}`,
      {
        transactionId: paymentData.transactionId || paymentData.id,
        orderId: paymentData.orderId || paymentData.locator,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        paymentMethod: paymentData.paymentMethod,
        gateway: paymentData.gateway,
        status: paymentData.status,
        userId: paymentData.userId || paymentData.user?.id,
        eventId: paymentData.eventId || paymentData.evento_id,
        functionId: paymentData.functionId || paymentData.funcion_id,
        seats: paymentData.seats?.map(s => s.id || s._id) || []
      },
      {
        ...options,
        resourceId: paymentData.transactionId || paymentData.id,
        resourceType: 'payment_transaction',
        severity: action === 'failed' || action === 'error' ? 'error' : 'info'
      }
    );
  }

  /**
   * Registrar acción de asiento
   */
  async logSeatAction(action, seatData, options = {}) {
    return this.logAction(
      `seat_${action}`,
      {
        seatId: seatData.seatId || seatData.id || seatData._id,
        functionId: seatData.functionId || seatData.funcionId,
        eventId: seatData.eventId || seatData.evento_id,
        action: action,
        sessionId: seatData.sessionId,
        userId: seatData.userId || seatData.user?.id,
        previousStatus: seatData.previousStatus,
        newStatus: seatData.newStatus
      },
      {
        ...options,
        resourceId: seatData.seatId || seatData.id || seatData._id,
        resourceType: 'seat',
        severity: 'info'
      }
    );
  }

  /**
   * Registrar acción de usuario
   */
  async logUserAction(action, userData, options = {}) {
    return this.logAction(
      `user_${action}`,
      {
        userId: userData.userId || userData.id,
        email: userData.email,
        action: action,
        role: userData.role,
        permissions: userData.permissions
      },
      {
        ...options,
        resourceId: userData.userId || userData.id,
        resourceType: 'user',
        severity: action === 'login' || action === 'logout' ? 'info' : 'warning'
      }
    );
  }

  /**
   * Registrar acción de seguridad
   */
  async logSecurityEvent(eventType, eventData, options = {}) {
    return this.logAction(
      `security_${eventType}`,
      {
        eventType,
        ...eventData
      },
      {
        ...options,
        severity: 'warning',
        resourceType: 'security'
      }
    );
  }

  /**
   * Obtener logs de auditoría
   */
  async getLogs(filters = {}, limit = 100) {
    try {
      const {
        action = null,
        userId = null,
        tenantId = this.tenantId,
        resourceType = null,
        severity = null,
        startDate = null,
        endDate = null
      } = filters;

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (action) {
        query = query.ilike('action', `%${action}%`);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      if (severity) {
        query = query.eq('severity', severity);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[AUDIT] Error obteniendo logs:', error);
      return [];
    }
  }

  /**
   * Obtener trazabilidad de una transacción
   */
  async getTransactionTrace(transactionId) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`resource_id.eq.${transactionId},details->>'transactionId'.eq.${transactionId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('[AUDIT] Error obteniendo trazabilidad:', error);
      return [];
    }
  }
}

// Singleton
const auditService = new AuditService();

export default auditService;

