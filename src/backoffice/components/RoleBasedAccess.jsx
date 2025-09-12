import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { message } from 'antd';

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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserRole('guest');
        setLoading(false);
        return;
      }

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setUserRole('guest');
        setLoading(false);
        return;
      }

      // Determinar rol basado en el perfil
      let role = 'guest';
      
      if (profile.permisos?.role) {
        role = profile.permisos.role;
      } else if (profile.role) {
        role = profile.role;
      } else if (profile.login?.includes('@')) {
        // Si tiene email, es usuario registrado desde store
        role = 'usuario_store';
      }

      setUserRole(role);
      setPermissions(getRolePermissions(role));
      
      // Cargar tenants asignados para usuarios del sistema
      if (['super_admin', 'admin_sistema', 'gerente_sistema', 'soporte_sistema', 'visualizador_sistema'].includes(role)) {
        await loadAssignedTenants(user.id);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole('guest');
    } finally {
      setLoading(false);
    }
  };

  // Definir permisos por rol
  const getRolePermissions = (role) => {
    const permissions = {
      // Dashboard principal
      dashboard: false,
      
      // Administración
      usuarios: false,
      recintos: false,
      plano: false,
      liquidaciones: false,
      
      // Programación
      entradas: false,
      productos: false,
      plantillas_productos: false,
      donaciones: false,
      comisiones: false,
      seguros: false,
      envio: false,
      eventos: false,
      plantillas_precios: false,
      funciones: false,
      cupos: false,
      plantillas_cupos: false,
      filas_virtuales: false,
      paquetes: false,
      multipase: false,
      abonos: false,
      iva: false,
      
      // Ventas
      boleteria: false,
      reportes: false,
      crm: false,
      tags: false,
      
      // Configuración
      settings: false,
      seat_settings: false,
      printer_settings: false,
      email_config: false,
      audit_logs: false,
      refund_management: false,
      payment_analytics: false,
      payment_gateways: false,
      
      // SaaS - Nuevos roles del sistema
      saas: false,
      saas_settings: false,
      saas_billing: false,
      saas_payment_gateways: false,
      saas_roles: false,
      saas_api_explorer: false,
      
      // Permisos SaaS granulares
      tenant_read: false,
      tenant_write: false,
      tenant_delete: false,
      billing_read: false,
      billing_write: false,
      support_read: false,
      support_write: false,
      analytics_read: false,
      notifications_read: false,
      notifications_write: false,
      
      // Funciones especiales
      crear_usuarios: false,
      editar_usuarios: false,
      eliminar_usuarios: false,
      ver_reportes: false,
      crear_reportes: false,
      exportar_datos: false,
      configurar_sistema: false,
      acceder_saas: false,
      
      // Gestión de tenants
      gestionar_tenants: false,
      asignar_tenants: false,
      ver_todos_tenants: false
    };

    switch (role) {
      // ROLES DEL SISTEMA SAAS
      case 'super_admin':
        // Nivel 100 - Acceso completo al sistema SaaS
        Object.keys(permissions).forEach(key => {
          permissions[key] = true;
        });
        break;
        
      case 'admin_sistema':
        // Nivel 80 - Administración completa de tenants
        permissions.dashboard = true;
        permissions.saas = true;
        permissions.saas_settings = true;
        permissions.saas_billing = true;
        permissions.saas_payment_gateways = true;
        permissions.saas_roles = true;
        permissions.saas_api_explorer = true;
        permissions.tenant_read = true;
        permissions.tenant_write = true;
        permissions.tenant_delete = true;
        permissions.billing_read = true;
        permissions.billing_write = true;
        permissions.analytics_read = true;
        permissions.notifications_read = true;
        permissions.notifications_write = true;
        permissions.gestionar_tenants = true;
        permissions.asignar_tenants = true;
        permissions.ver_todos_tenants = true;
        permissions.crear_usuarios = true;
        permissions.editar_usuarios = true;
        permissions.eliminar_usuarios = true;
        break;
        
      case 'gerente_sistema':
        // Nivel 60 - Gestión de tenants y soporte
        permissions.dashboard = true;
        permissions.saas = true;
        permissions.saas_settings = true;
        permissions.saas_billing = true;
        permissions.tenant_read = true;
        permissions.tenant_write = true;
        permissions.billing_read = true;
        permissions.support_read = true;
        permissions.support_write = true;
        permissions.analytics_read = true;
        permissions.notifications_read = true;
        permissions.gestionar_tenants = true;
        permissions.asignar_tenants = true;
        permissions.ver_todos_tenants = true;
        permissions.crear_usuarios = true;
        permissions.editar_usuarios = true;
        break;
        
      case 'soporte_sistema':
        // Nivel 40 - Solo soporte técnico
        permissions.dashboard = true;
        permissions.saas = true;
        permissions.tenant_read = true;
        permissions.support_read = true;
        permissions.support_write = true;
        permissions.notifications_read = true;
        permissions.ver_todos_tenants = true;
        break;
        
      case 'visualizador_sistema':
        // Nivel 20 - Solo lectura de información
        permissions.dashboard = true;
        permissions.saas = true;
        permissions.tenant_read = true;
        permissions.analytics_read = true;
        permissions.notifications_read = true;
        permissions.ver_todos_tenants = true;
        break;
        
      // ROLES DE TENANT (mantener compatibilidad)
      case 'tenant_admin':
      case 'admin':
      case 'gerente':
        // Acceso completo a todo del tenant
        permissions.dashboard = true;
        permissions.usuarios = true;
        permissions.recintos = true;
        permissions.plano = true;
        permissions.liquidaciones = true;
        permissions.entradas = true;
        permissions.productos = true;
        permissions.plantillas_productos = true;
        permissions.donaciones = true;
        permissions.comisiones = true;
        permissions.seguros = true;
        permissions.envio = true;
        permissions.eventos = true;
        permissions.plantillas_precios = true;
        permissions.funciones = true;
        permissions.cupos = true;
        permissions.plantillas_cupos = true;
        permissions.filas_virtuales = true;
        permissions.paquetes = true;
        permissions.multipase = true;
        permissions.abonos = true;
        permissions.iva = true;
        permissions.boleteria = true;
        permissions.reportes = true;
        permissions.crm = true;
        permissions.tags = true;
        permissions.settings = true;
        permissions.seat_settings = true;
        permissions.printer_settings = true;
        permissions.email_config = true;
        permissions.audit_logs = true;
        permissions.refund_management = true;
        permissions.payment_analytics = true;
        permissions.payment_gateways = true;
        permissions.crear_usuarios = true;
        permissions.editar_usuarios = true;
        permissions.eliminar_usuarios = true;
        permissions.ver_reportes = true;
        permissions.crear_reportes = true;
        permissions.exportar_datos = true;
        permissions.configurar_sistema = true;
        break;
        
      case 'taquilla':
        permissions.dashboard = true;
        permissions.boleteria = true;
        permissions.entradas = true;
        permissions.eventos = true;
        permissions.funciones = true;
        permissions.reportes = true;
        permissions.ver_reportes = true;
        break;
        
      case 'call_center':
        permissions.dashboard = true;
        permissions.boleteria = true;
        permissions.entradas = true;
        permissions.eventos = true;
        permissions.funciones = true;
        permissions.crm = true;
        permissions.reportes = true;
        permissions.ver_reportes = true;
        break;
        
      case 'agencias':
        permissions.dashboard = true;
        permissions.boleteria = true;
        permissions.entradas = true;
        permissions.eventos = true;
        permissions.funciones = true;
        permissions.reportes = true;
        permissions.ver_reportes = true;
        break;
        
      case 'contenido_marketing':
        permissions.dashboard = true;
        permissions.eventos = true;
        permissions.funciones = true;
        permissions.productos = true;
        permissions.plantillas_productos = true;
        permissions.tags = true;
        break;
        
      case 'atencion_cliente':
        permissions.dashboard = true;
        permissions.crm = true;
        permissions.reportes = true;
        permissions.ver_reportes = true;
        permissions.refund_management = true;
        break;
        
      case 'vendedor_externo':
        permissions.dashboard = true;
        permissions.boleteria = true;
        permissions.entradas = true;
        permissions.eventos = true;
        permissions.funciones = true;
        permissions.crm = true;
        permissions.reportes = true;
        permissions.ver_reportes = true;
        break;
        
      case 'reportes':
        permissions.dashboard = true;
        permissions.reportes = true;
        permissions.ver_reportes = true;
        permissions.crear_reportes = true;
        permissions.exportar_datos = true;
        permissions.payment_analytics = true;
        break;
        
      case 'usuario_store':
        // Usuarios registrados desde store - NO acceso al dashboard
        permissions.dashboard = false;
        break;
        
      case 'guest':
      default:
        // Sin acceso
        break;
    }

    return permissions;
  };

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    return permissions[permission] || false;
  };

  // Función para verificar si el usuario puede acceder a una ruta
  const canAccess = (path) => {
    if (!userRole || userRole === 'guest' || userRole === 'usuario_store') {
      return false;
    }
    
    // Mapear rutas a permisos
    const routePermissions = {
      '/dashboard': 'dashboard',
      '/dashboard/usuarios': 'usuarios',
      '/dashboard/recintos': 'recintos',
      '/dashboard/plano': 'plano',
      '/dashboard/liquidaciones': 'liquidaciones',
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
      '/dashboard/iva': 'iva',
      '/dashboard/boleteria': 'boleteria',
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
      '/dashboard/saas': 'saas',
      '/dashboard/saas/settings': 'saas_settings',
      '/dashboard/saas/billing': 'saas_billing',
      '/dashboard/saas/payment-gateways': 'saas_payment_gateways',
      '/dashboard/saas/roles': 'saas_roles',
      '/dashboard/saas/api-explorer': 'saas_api_explorer'
    };

    const permission = routePermissions[path];
    return permission ? hasPermission(permission) : false;
  };

  // Función para obtener el rol del usuario
  const getRole = () => userRole;

  // Función para verificar si es administrador
  const isAdmin = () => userRole === 'admin' || userRole === 'gerente';

  // Función para cargar tenants asignados
  const loadAssignedTenants = async (userId) => {
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
      
      // Super admin puede acceder a todos los tenants
      setCanAccessAllTenants(userRole === 'super_admin');
    } catch (error) {
      console.error('Error loading assigned tenants:', error);
      setAssignedTenants([]);
      setCanAccessAllTenants(false);
    }
  };

  // Función para verificar si es usuario de store
  const isStoreUser = () => userRole === 'usuario_store';

  // Función para verificar si es usuario del sistema SaaS
  const isSystemUser = () => ['super_admin', 'admin_sistema', 'gerente_sistema', 'soporte_sistema', 'visualizador_sistema'].includes(userRole);

  // Función para verificar si puede acceder a un tenant específico
  const canAccessTenant = (tenantId) => {
    if (canAccessAllTenants) return true;
    return assignedTenants.some(tenant => tenant.id === tenantId);
  };

  // Función para obtener tenants accesibles
  const getAccessibleTenants = () => {
    if (canAccessAllTenants) return 'all';
    return assignedTenants;
  };

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

// Componente para proteger rutas
export const ProtectedRoute = ({ children, permission, fallback = null }) => {
  const { hasPermission, loading } = useRole();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!hasPermission(permission)) {
    return fallback || <div>No tienes permisos para acceder a esta sección.</div>;
  }

  return children;
};

// Componente para mostrar contenido condicionalmente
export const ConditionalRender = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useRole();
  return hasPermission(permission) ? children : fallback;
};

export default RoleProvider;
