import { supabase } from '../../supabaseClient';

class AccessControlService {
  constructor() {
    this.roles = {
      super_admin: {
        name: 'Super Administrador',
        level: 100,
        permissions: ['*'], // Todos los permisos
        description: 'Acceso completo al sistema SaaS',
      },
      admin: {
        name: 'Administrador',
        level: 80,
        permissions: [
          'tenant:read',
          'tenant:write',
          'tenant:delete',
          'billing:read',
          'billing:write',
          'notifications:read',
          'notifications:write',
          'analytics:read',
          'support:read',
          'support:write',
          'settings:read',
          'settings:write',
        ],
        description: 'Administración completa de tenants',
      },
      manager: {
        name: 'Gerente',
        level: 60,
        permissions: [
          'tenant:read',
          'tenant:write',
          'billing:read',
          'notifications:read',
          'analytics:read',
          'support:read',
          'support:write',
        ],
        description: 'Gestión de tenants y soporte',
      },
      support: {
        name: 'Soporte',
        level: 40,
        permissions: ['tenant:read', 'support:read', 'support:write', 'notifications:read'],
        description: 'Solo soporte técnico',
      },
      viewer: {
        name: 'Visualizador',
        level: 20,
        permissions: ['tenant:read', 'analytics:read', 'notifications:read'],
        description: 'Solo lectura de información',
      },
    };

    this.permissions = {
      'tenant:read': 'Ver información de tenants',
      'tenant:write': 'Crear y editar tenants',
      'tenant:delete': 'Eliminar tenants',
      'billing:read': 'Ver información de facturación',
      'billing:write': 'Gestionar facturación',
      'notifications:read': 'Ver notificaciones',
      'notifications:write': 'Crear notificaciones',
      'analytics:read': 'Ver analytics y métricas',
      'support:read': 'Ver tickets de soporte',
      'support:write': 'Gestionar tickets de soporte',
      'settings:read': 'Ver configuraciones',
      'settings:write': 'Modificar configuraciones',
      'audit:read': 'Ver logs de auditoría',
      'users:read': 'Ver usuarios',
      'users:write': 'Gestionar usuarios',
      'roles:read': 'Ver roles',
      'roles:write': 'Gestionar roles',
    };
  }

  // Obtener rol del usuario
  async getUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, permissions')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        role: data.role || 'viewer',
        permissions: data.permissions ? JSON.parse(data.permissions) : [],
      };
    } catch (error) {
      console.error('Error getting user role:', error);
      return { role: 'viewer', permissions: [] };
    }
  }

  // Verificar si el usuario tiene un permiso específico
  async hasPermission(userId, permission) {
    try {
      const userRole = await this.getUserRole(userId);

      // Super admin tiene todos los permisos
      if (userRole.role === 'super_admin') return true;

      // Verificar permisos del rol
      const rolePermissions = this.roles[userRole.role]?.permissions || [];
      if (rolePermissions.includes('*') || rolePermissions.includes(permission)) {
        return true;
      }

      // Verificar permisos personalizados del usuario
      return userRole.permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Verificar si el usuario tiene un rol específico o superior
  async hasRole(userId, requiredRole) {
    try {
      const userRole = await this.getUserRole(userId);
      const userLevel = this.roles[userRole.role]?.level || 0;
      const requiredLevel = this.roles[requiredRole]?.level || 0;

      return userLevel >= requiredLevel;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  // Asignar rol a usuario
  async assignRole(userId, role, customPermissions = []) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          role: role,
          permissions: JSON.stringify(customPermissions),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Registrar en auditoría
      await this.logAction('role_assigned', {
        user_id: userId,
        role: role,
        permissions: customPermissions,
      });

      return data;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  // Crear rol personalizado
  async createCustomRole(roleData) {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .insert([
          {
            name: roleData.name,
            description: roleData.description,
            permissions: JSON.stringify(roleData.permissions),
            level: roleData.level,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Registrar en auditoría
      await this.logAction('custom_role_created', {
        role_name: roleData.name,
        permissions: roleData.permissions,
      });

      return data;
    } catch (error) {
      console.error('Error creating custom role:', error);
      throw error;
    }
  }

  // Obtener todos los roles
  async getAllRoles() {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: false });

      if (error) throw error;

      // Combinar roles del sistema con roles personalizados
      const systemRoles = Object.entries(this.roles).map(([key, role]) => ({
        id: key,
        name: role.name,
        description: role.description,
        level: role.level,
        permissions: role.permissions,
        is_system: true,
      }));

      const customRoles = data.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        permissions: JSON.parse(role.permissions),
        is_system: false,
      }));

      return [...systemRoles, ...customRoles];
    } catch (error) {
      console.error('Error getting all roles:', error);
      return Object.entries(this.roles).map(([key, role]) => ({
        id: key,
        name: role.name,
        description: role.description,
        level: role.level,
        permissions: role.permissions,
        is_system: true,
      }));
    }
  }

  // Obtener usuarios por rol
  async getUsersByRole(role) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, email:login, role, created_at')
        .eq('role', role);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting users by role:', error);
      return [];
    }
  }

  // Obtener estadísticas de roles
  async getRoleStats() {
    try {
      const { data, error } = await supabase.from('profiles').select('role');

      if (error) throw error;

      const stats = {};
      data.forEach(profile => {
        stats[profile.role] = (stats[profile.role] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting role stats:', error);
      return {};
    }
  }

  // Crear política de acceso
  async createAccessPolicy(policyData) {
    try {
      const { data, error } = await supabase
        .from('access_policies')
        .insert([
          {
            name: policyData.name,
            description: policyData.description,
            resource: policyData.resource,
            action: policyData.action,
            conditions: JSON.stringify(policyData.conditions),
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Registrar en auditoría
      await this.logAction('access_policy_created', {
        policy_name: policyData.name,
        resource: policyData.resource,
        action: policyData.action,
      });

      return data;
    } catch (error) {
      console.error('Error creating access policy:', error);
      throw error;
    }
  }

  // Verificar acceso a recurso
  async checkResourceAccess(userId, resource, action) {
    try {
      // Verificar permisos básicos
      const hasPermission = await this.hasPermission(userId, `${resource}:${action}`);
      if (!hasPermission) return false;

      // Verificar políticas específicas
      const { data, error } = await supabase
        .from('access_policies')
        .select('*')
        .eq('resource', resource)
        .eq('action', action)
        .eq('is_active', true);

      if (error) throw error;

      // Si no hay políticas específicas, permitir acceso
      if (!data || data.length === 0) return true;

      // Verificar condiciones de las políticas
      for (const policy of data) {
        const conditions = JSON.parse(policy.conditions);
        const userRole = await this.getUserRole(userId);

        // Verificar condiciones del rol
        if (conditions.roles && !conditions.roles.includes(userRole.role)) {
          continue;
        }

        // Verificar condiciones de permisos
        if (conditions.permissions) {
          const hasRequiredPermissions = conditions.permissions.every(permission =>
            userRole.permissions.includes(permission)
          );
          if (!hasRequiredPermissions) continue;
        }

        // Si se cumple alguna política, permitir acceso
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking resource access:', error);
      return false;
    }
  }

  // Obtener permisos del usuario
  async getUserPermissions(userId) {
    try {
      const userRole = await this.getUserRole(userId);
      const rolePermissions = this.roles[userRole.role]?.permissions || [];
      const customPermissions = userRole.permissions || [];

      // Combinar permisos del rol con permisos personalizados
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];

      return allPermissions.map(permission => ({
        permission,
        description: this.permissions[permission] || permission,
      }));
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // Registrar acción en auditoría
  async logAction(action, details) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from('audit_logs').insert([
        {
          user_id: user?.id,
          action: `access_control_${action}`,
          details: JSON.stringify(details),
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  // Obtener historial de cambios de roles
  async getRoleChangeHistory(userId = null) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .like('action', 'access_control_role_%')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting role change history:', error);
      return [];
    }
  }

  // Exportar configuración de roles
  async exportRoleConfiguration() {
    try {
      const roles = await this.getAllRoles();
      const stats = await this.getRoleStats();

      return {
        roles,
        stats,
        permissions: this.permissions,
        exported_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting role configuration:', error);
      return null;
    }
  }
}

const accessControlServiceInstance = new AccessControlService();
export default accessControlServiceInstance;
