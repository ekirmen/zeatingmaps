import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { message } from '../../utils/antdComponents';
import { INITIAL_PERMISSIONS, SAAS_ROLES, TENANT_ROLES } from './roleDefinitions';

// Contexto para el control de acceso basado en roles
const RoleContext = createContext();

// Hook para usar el contexto de roles
export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Componente proveedor de roles
export const RoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [assignedTenants, setAssignedTenants] = useState([]);
  const [canAccessAllTenants, setCanAccessAllTenants] = useState(false);

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      let user = null;

      // Intentar obtener primero la sesión local
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionData?.session?.user) {
        user = sessionData.session.user;
      } else {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          setUserRole('guest');
          setLoading(false);
          return;
        }
        user = userData?.user || null;
      }

      if (!user) {
        setUserRole('guest');
        setLoading(false);
        return;
      }

      // Obtener perfil (Profiles)
      const { data: profileById, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Fallback a login/email
      let profile = profileById;
      if ((!profile || profileError) && user.email) {
        const normalizedEmail = user.email.toLowerCase();
        const { data: profileByLogin } = await supabase
          .from('profiles')
          .select('*')
          .eq('login', normalizedEmail)
          .maybeSingle();
        if (profileByLogin) profile = profileByLogin;
      }

      // Determinar rol base
      let role = 'guest';
      let extraPermissions = {};

      if (profile) {
        let parsedPermissions = profile.permisos;
        if (typeof parsedPermissions === 'string') {
          try {
            parsedPermissions = JSON.parse(parsedPermissions);
          } catch (e) { parsedPermissions = {}; }
        }

        if (parsedPermissions?.role) {
          role = parsedPermissions.role;
        } else if (profile.role) {
          role = profile.role;
        } else if (profile.login?.includes('@')) {
          role = 'usuario_store';
        }

        extraPermissions = parsedPermissions && typeof parsedPermissions === 'object' ? parsedPermissions : {};
      } else {
        // Fallback metadata
        role = user.user_metadata?.permisos?.role || user.user_metadata?.role || 'guest';
        extraPermissions = user.user_metadata?.permisos || {};
        if (role === 'guest' && user.user_metadata?.login?.includes('@')) {
          role = 'usuario_store';
        }
      }

      // --- OPTIMIZACIÓN: Cálculo de Permisos usando roleDefinitions.js ---
      const computedPermissions = getRolePermissions(role);

      // Aplicar overrides (Permisos JSONB de la DB)
      Object.entries(extraPermissions).forEach(([key, value]) => {
        // Solo permitimos sobrescribir si la key existe en nuestro mapa de permisos
        if (Object.prototype.hasOwnProperty.call(computedPermissions, key)) {
          computedPermissions[key] = value === true; // Asegurar booleano
        }
      });

      setUserRole(role);
      setPermissions(computedPermissions);

      // Cargar tenants asignados para roles de sistema
      if (SAAS_ROLES[role]) {
        // Si está en SAAS_ROLES, es un rol de sistema
        await loadAssignedTenants(user.id, role);
      }

    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole('guest');
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica optimizada de obtención de permisos ---
  const getRolePermissions = (role) => {
    // 1. Copia limpia de permisos en falso
    const basePermissions = { ...INITIAL_PERMISSIONS };

    // 2. Buscar definición del rol en Tenant o SaaS
    let roleDef = TENANT_ROLES[role];

    // Si no está en Tenant, buscar en SaaS
    if (!roleDef) {
      roleDef = SAAS_ROLES[role];
    }

    // Si no existe, usar guest
    if (!roleDef) {
      roleDef = TENANT_ROLES['guest'];
      // O intentar buscar por alias "admin" -> "tenant_admin" si quisiéramos legacy support extra
      if (role === 'admin') roleDef = TENANT_ROLES['tenant_admin'];
    }

    // 3. Aplicar función de permisos del rol
    if (roleDef && typeof roleDef.permissions === 'function') {
      return roleDef.permissions(basePermissions);
    }

    return basePermissions;
  };

  const hasPermission = (permission) => {
    return permissions[permission] || false;
  };

  // Funci³n para verificar acceso a ruta
  const canAccess = (path) => {
    if (!userRole || userRole === 'guest' || userRole === 'usuario_store') {
      return false;
    }

    // Mapa de rutas a permisos
    const routePermissions = {
      '/dashboard': 'dashboard',
      '/dashboard/usuarios': 'usuarios',
      '/dashboard/recintos': 'recintos',
      '/dashboard/plano': 'plano',
      '/dashboard/crear-mapa': 'recintos',
      '/dashboard/liquidaciones': 'liquidaciones',
      '/dashboard/liquidacion': 'liquidaciones',
      '/dashboard/entradas': 'entradas',
      '/dashboard/productos': 'productos',
      '/dashboard/plantillas-productos': 'plantillas_productos',
      '/dashboard/donaciones': 'donaciones',
      '/dashboard/comisiones': 'comisiones',
      '/dashboard/seguros': 'seguros',
      '/dashboard/envio': 'envio',
      '/dashboard/eventos': 'eventos',
      '/dashboard/plantillas-precios': 'plantillas_precios',
      '/dashboard/funciones': 'funciones',
      '/dashboard/cupos': 'cupos',
      '/dashboard/plantillas-cupos': 'plantillas_cupos',
      '/dashboard/filas-virtuales': 'filas_virtuales',
      '/dashboard/paquetes': 'paquetes',
      '/dashboard/multipase': 'multipase',
      '/dashboard/abonos': 'abonos',
      '/dashboard/afiliados': 'afiliados',
      '/dashboard/iva': 'iva',
      '/dashboard/boleteria': 'boleteria',
      '/backoffice/boleteria': 'boleteria',
      '/dashboard/reportes': 'reportes',
      '/dashboard/crm': 'crm',
      '/dashboard/tags': 'tags',
      '/dashboard/settings': 'settings',
      '/dashboard/seat-settings': 'seat_settings',
      '/dashboard/printer-settings': 'printer_settings',
      '/dashboard/email-config': 'email_config',
      '/dashboard/audit-logs': 'audit_logs',
      '/dashboard/refund-management': 'refund_management',
      '/dashboard/payment-analytics': 'payment_analytics',
      '/dashboard/payment-gateways': 'payment_gateways',
      // SaaS
      '/dashboard/saas': 'saas',
      '/dashboard/saas/settings': 'saas_settings',
      '/dashboard/saas/billing': 'saas_billing',
      '/dashboard/saas/payment-gateways': 'saas_payment_gateways',
      '/dashboard/saas/roles': 'saas_roles',
      '/dashboard/saas/api-explorer': 'saas_api_explorer'
    };

    let permission = routePermissions[path];

    if (!permission) {
      for (const [route, perm] of Object.entries(routePermissions)) {
        if (path.startsWith(route + '/')) {
          permission = perm;
          break;
        }
      }
    }

    // Excepción Web Studio (Optimizada)
    if (path.includes('webstudio')) {
      return hasPermission('webstudio');
    }

    return permission ? hasPermission(permission) : false;
  };

  const getRole = () => userRole;
  const isAdmin = () => userRole === 'tenant_admin' || userRole === 'admin' || userRole === 'gerente';

  const loadAssignedTenants = async (userId, role) => {
    try {
      const { data, error } = await supabase
        .from('user_tenant_assignments')
        .select(`
          tenant_id,
          tenants:tenant_id(id, name, domain, status)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      const tenantList = (data || []).map(assignment => assignment.tenants).filter(Boolean);
      setAssignedTenants(tenantList);
      setCanAccessAllTenants(role === 'super_admin');
    } catch (error) {
      console.error('Error loading assigned tenants:', error);
      setAssignedTenants([]);
      setCanAccessAllTenants(false);
    }
  };

  const isStoreUser = () => userRole === 'usuario_store';
  const isSystemUser = () => !!SAAS_ROLES[userRole];

  const canAccessTenant = (tenantId) => {
    if (canAccessAllTenants) return true;
    return assignedTenants.some(tenant => tenant.id === tenantId);
  };

  const getAccessibleTenants = () => canAccessAllTenants ? 'all' : assignedTenants;

  const value = {
    userRole,
    permissions,
    loading,
    assignedTenants,
    canAccessAllTenants,
    hasPermission,
    canAccess,
    getRole,
    isAdmin,
    isStoreUser,
    isSystemUser,
    canAccessTenant,
    getAccessibleTenants,
    loadUserRole
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const ProtectedRoute = ({ children, permission, fallback = null }) => {
  const { hasPermission, loading } = useRole();
  if (loading) return <div>Cargando...</div>;
  if (!hasPermission(permission)) return fallback || <div>No tienes permisos para acceder a esta sección.</div>;
  return children;
};

export const ConditionalRender = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useRole();
  return hasPermission(permission) ? children : fallback;
};

export default RoleProvider;

