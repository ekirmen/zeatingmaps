import { supabase } from '../../supabaseClient';

class AuditService {
  constructor() {
    this.currentUser = null;
    this.remoteLoggingDisabled = false;
  }

  isAuthError(error) {
    if (!error) return false;

    const message = (error.message || '').toLowerCase();
    const hint = (error.hint || '').toLowerCase();

    return (
      error.code === '42501' ||
      error.code === 'PGRST301' ||
      error.status === 401 ||
      error.status === 403 ||
      message.includes('permission denied') ||
      message.includes('no api key found') ||
      message.includes('apikey') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      hint.includes('no `apikey`') ||
      hint.includes('api key')
    );
  }

  async storeLocally(auditData) {
    try {
      const existing = JSON.parse(localStorage.getItem('audit_logs_backup') || '[]');
      existing.push({ ...auditData, fallback: true });
      localStorage.setItem('audit_logs_backup', JSON.stringify(existing.slice(-500)));
    } catch (storageError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AUDIT] No se pudo guardar el log localmente:', storageError);
      }
    }
  }

  // Inicializar servicio de auditoría
  async initialize() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUser = user;
      return true;
    } catch (error) {
      console.error('Error initializing audit service:', error);
      return false;
    }
  }

  // Registrar acción de auditoría
  async logAction(action, details, tenantId = null, resourceId = null) {
    try {
      if (this.remoteLoggingDisabled) {
        await this.storeLocally({
          action,
          details: JSON.stringify(details),
          tenant_id: tenantId,
          resource_id: resourceId,
          created_at: new Date().toISOString()
        });
        return null;
      }

      // Asegurar sesión y usuario actualizados
      if (!this.currentUser) {
        await this.initialize();
      }

      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult?.data?.session;

      if (!session?.access_token) {
        await this.storeLocally({
          action,
          details: JSON.stringify(details),
          tenant_id: tenantId,
          resource_id: resourceId,
          created_at: new Date().toISOString()
        });
        return null;
      }

      const auditData = {
        tenant_id: tenantId,
        user_id: this.currentUser?.id,
        action,
        details: JSON.stringify(details),
        resource_id: resourceId,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert([auditData])
        .select()
        .single();

      if (error) {
        if (this.isAuthError(error)) {
          this.remoteLoggingDisabled = true;
          if (process.env.NODE_ENV === 'development') {
            console.warn('[AUDIT] Registro remoto deshabilitado por error de permisos:', error.message || error.hint);
          }
          await this.storeLocally(auditData);
          return null;
        }

        throw error;
      }
      return data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logging audit action:', error);
      }
      await this.storeLocally({
        action,
        details: JSON.stringify(details),
        tenant_id: tenantId,
        resource_id: resourceId,
        created_at: new Date().toISOString(),
        error: error?.message
      });
      return null;
    }
  }

  // Obtener IP del cliente (simulado)
  async getClientIP() {
    try {
      // En un entorno real, esto vendría del servidor
      return '127.0.0.1';
    } catch (error) {
      return 'unknown';
    }
  }

  // Logs específicos para diferentes acciones

  // Crear tenant
  async logTenantCreation(tenantData) {
    return await this.logAction('tenant_created', {
      company_name: tenantData.company_name,
      plan_type: tenantData.plan_type,
      contact_email: tenantData.contact_email
    }, tenantData.id);
  }

  // Actualizar tenant
  async logTenantUpdate(tenantId, oldData, newData) {
    const changes = this.getObjectChanges(oldData, newData);
    return await this.logAction('tenant_updated', {
      changes,
      old_data: oldData,
      new_data: newData
    }, tenantId);
  }

  // Eliminar tenant
  async logTenantDeletion(tenantData) {
    return await this.logAction('tenant_deleted', {
      company_name: tenantData.company_name,
      plan_type: tenantData.plan_type,
      contact_email: tenantData.contact_email
    }, tenantData.id);
  }

  // Cambio de plan
  async logPlanChange(tenantId, oldPlan, newPlan) {
    return await this.logAction('plan_changed', {
      old_plan: oldPlan,
      new_plan: newPlan,
      reason: 'manual_change'
    }, tenantId);
  }

  // Suspensión de tenant
  async logTenantSuspension(tenantId, reason) {
    return await this.logAction('tenant_suspended', {
      reason,
      suspended_at: new Date().toISOString()
    }, tenantId);
  }

  // Reactivación de tenant
  async logTenantReactivation(tenantId, reason) {
    return await this.logAction('tenant_reactivated', {
      reason,
      reactivated_at: new Date().toISOString()
    }, tenantId);
  }

  // Configuración de email
  async logEmailConfigChange(tenantId, configType, changes) {
    return await this.logAction('email_config_changed', {
      config_type: configType,
      changes
    }, tenantId);
  }

  // Acceso al sistema
  async logSystemAccess(tenantId, action) {
    return await this.logAction('system_access', {
      action,
      accessed_at: new Date().toISOString()
    }, tenantId);
  }

  // Error del sistema
  async logSystemError(error, context) {
    return await this.logAction('system_error', {
      error_message: error.message,
      error_stack: error.stack,
      context
    });
  }

  // Obtener cambios entre objetos
  getObjectChanges(oldObj, newObj) {
    const changes = {};
    
    for (const key in newObj) {
      if (oldObj[key] !== newObj[key]) {
        changes[key] = {
          old: oldObj[key],
          new: newObj[key]
        };
      }
    }
    
    return changes;
  }

  // Obtener logs de auditoría
  async getAuditLogs(filters = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          tenants!audit_logs_tenant_id_fkey (
            company_name,
            contact_email
          ),
          profiles!audit_logs_user_id_fkey (
            nombre,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  // Obtener estadísticas de auditoría
  async getAuditStats() {
    try {
      const [
        { count: totalLogs },
        { count: todayLogs },
        { count: tenantLogs },
        { count: systemLogs }
      ] = await Promise.all([
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', this.getTodayStart()),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).not('tenant_id', 'is', null),
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }).is('tenant_id', null)
      ]);

      return {
        total: totalLogs || 0,
        today: todayLogs || 0,
        tenant: tenantLogs || 0,
        system: systemLogs || 0
      };
    } catch (error) {
      console.error('Error getting audit stats:', error);
      return {
        total: 0,
        today: 0,
        tenant: 0,
        system: 0
      };
    }
  }

  // Obtener inicio del día actual
  getTodayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString();
  }

  // Obtener acciones más comunes
  async getTopActions(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .gte('created_at', this.getTodayStart());

      if (error) throw error;

      const actionCounts = {};
      data.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      return Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([action, count]) => ({ action, count }));
    } catch (error) {
      console.error('Error getting top actions:', error);
      return [];
    }
  }

  // Exportar logs de auditoría
  async exportAuditLogs(filters = {}) {
    try {
      const logs = await this.getAuditLogs({ ...filters, limit: 10000 });
      
      const csvData = logs.map(log => ({
        created_at: log.created_at,
        action: log.action,
        tenant: log.tenants?.company_name || 'N/A',
        user: log.profiles?.nombre || 'System',
        ip_address: log.ip_address,
        details: log.details
      }));

      return csvData;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return [];
    }
  }

  // Limpiar logs antiguos
  async cleanupOldLogs(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      return false;
    }
  }

  // Buscar en logs
  async searchLogs(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          tenants!audit_logs_tenant_id_fkey (
            company_name,
            contact_email
          ),
          profiles!audit_logs_user_id_fkey (
            nombre,
            email
          )
        `)
        .or(`action.ilike.%${searchTerm}%,details.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      // Aplicar filtros adicionales
      if (filters.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching audit logs:', error);
      return [];
    }
  }
}

export default new AuditService();
