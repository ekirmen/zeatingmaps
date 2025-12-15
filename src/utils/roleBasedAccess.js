// 🚀 Utilidad para Control de Acceso Basado en Roles
// Este archivo maneja la lógica de permisos en el frontend

// =====================================================
// CONSTANTES DE ROLES
// =====================================================

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  EVENT_MANAGER: 'event_manager',
  SALES_MANAGER: 'sales_manager',
  BOX_OFFICE: 'box_office',
  CUSTOMER_SUPPORT: 'customer_support',
  MARKETING: 'marketing',
  REPORTS: 'reports',
  FINANCE: 'finance',
  TECHNICAL: 'technical',
};

// =====================================================
// PERMISOS POR ROL
// =====================================================

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    'dashboard',
    'administracion',
    'recintos',
    'plano',
    'usuarios',
    'liquidaciones',
    'programacion',
    'crm',
    'reports',
    'personalizacion',
    'boleteria',
    'panel_saas',
    'gestión_de_tenants',
    'gestión_de_usuarios',
    'gestión_de_facturación',
    'configuración_del_sistema',
  ],
  [ROLES.TENANT_ADMIN]: [
    'dashboard',
    'administracion',
    'recintos',
    'plano',
    'usuarios',
    'liquidaciones',
    'programacion',
    'crm',
    'reports',
    'personalizacion',
    'boleteria',
    'usuarios_del_tenant',
    'configuración_del_tenant',
    'facturación_del_tenant',
    'saas',
    'saas_roles',
    'saas_settings',
    'saas_billing',
    'saas_payment_gateways',
    'saas_api_explorer',
    'settings',
    'seat_settings',
    'printer_settings',
    'email_config',
    'audit_logs',
    'refund_management',
    'payment_analytics',
    'payment_gateways',
    'entradas',
    'productos',
    'plantillas_productos',
    'comisiones',
    'ivas',
    'descuentos',
    'abonos',
    'afiliados',
    'email_campaigns',
    'eventos',
    'funciones',
    'mailchimp',
    'formularios',
    'notificaciones',
    'encuestas',
    'email_campaigns',
    'tags',
    'formato_entrada',
    'legal_texts',
    'webstudio',
    'pages',
    'webcolors',
  ],
  [ROLES.EVENT_MANAGER]: [
    'dashboard',
    'recintos',
    'plano',
    'programacion',
    'boleteria',
    'crear_eventos',
    'editar_eventos',
    'publicar_eventos',
  ],
  [ROLES.SALES_MANAGER]: [
    'dashboard',
    'ventas',
    'reports',
    'ver_ventas',
    'crear_ventas',
    'editar_ventas',
    'cancelar_ventas',
    'reembolsos',
    'reportes_de_ventas',
  ],
  [ROLES.BOX_OFFICE]: [
    'dashboard',
    'ventas',
    'boleteria',
    'ver_ventas',
    'crear_ventas',
    'editar_ventas',
    'cancelar_ventas',
  ],
  [ROLES.CUSTOMER_SUPPORT]: [
    'dashboard',
    'crm',
    'tickets_de_soporte',
    'datos_de_clientes',
    'reportes_de_soporte',
  ],
  [ROLES.MARKETING]: ['dashboard', 'crm', 'campañas_de_marketing', 'email_marketing', 'analytics'],
  [ROLES.REPORTS]: [
    'dashboard',
    'reports',
    'analytics',
    'reportes_de_ventas',
    'reportes_de_soporte',
  ],
  [ROLES.FINANCE]: [
    'dashboard',
    'reports',
    'ver_finanzas',
    'editar_finanzas',
    'gestión_de_facturas',
    'procesamiento_de_pagos',
  ],
  [ROLES.TECHNICAL]: [
    'dashboard',
    'reports',
    'soporte_técnico',
    'acceso_a_api',
    'logs_del_sistema',
  ],
};

// =====================================================
// FUNCIONES DE VERIFICACIÓN DE PERMISOS
// =====================================================

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {Object} user - Objeto usuario con role y permissions

 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;

  // Super admin tiene todos los permisos
  if (user.role === ROLES.SUPER_ADMIN) return true;

  // Verificar permisos del rol
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  if (rolePermissions.includes(permission)) return true;

  // Verificar permisos personalizados del usuario
  if (user.permissions && user.permissions[permission]) return true;

  return false;
};

/**
 * Verifica si un usuario tiene acceso a una ruta específica
 * @param {Object} user - Objeto usuario
 * @param {string} route - Ruta a verificar
 * @returns {boolean}
 */
export const hasRouteAccess = (user, route) => {
  const routePermissions = {
    '/dashboard': 'dashboard',
    '/dashboard/recintos': 'recintos',
    '/dashboard/plano': 'plano',
    '/dashboard/usuarios': 'usuarios',
    '/dashboard/liquidaciones': 'liquidaciones',
    '/dashboard/programacion': 'programacion',
    '/dashboard/crm': 'crm',
    '/dashboard/reports': 'reports',
    '/dashboard/personalizacion': 'personalizacion',
    '/dashboard/boleteria': 'boleteria',
    '/dashboard/panel-saas': 'panel_saas',
  };

  const requiredPermission = routePermissions[route];
  if (!requiredPermission) return true; // Ruta sin restricciones

  return hasPermission(user, requiredPermission);
};

/**
 * Verifica si un usuario puede acceder a una funcionalidad específica
 * @param {Object} user - Objeto usuario
 * @param {string} functionality - Funcionalidad a verificar
 * @returns {boolean}
 */
export const canAccessFunctionality = (user, functionality) => {
  return hasPermission(user, functionality);
};

// =====================================================
// FUNCIONES PARA EL MENÚ
// =====================================================

/**
 * Filtra elementos del menú según los permisos del usuario
 * @param {Array} menuItems - Array de elementos del menú
 * @param {Object} user - Objeto usuario
 * @returns {Array} - Menú filtrado
 */
export const filterMenuByPermissions = (menuItems, user) => {
  if (!user || !user.role) return [];

  return menuItems.filter(item => {
    // Si el item no tiene restricciones, mostrarlo
    if (!item.requiredPermission) return true;

    // Verificar si el usuario tiene el permiso requerido
    return hasPermission(user, item.requiredPermission);
  });
};

/**
 * Genera el menú completo con permisos aplicados
 * @param {Object} user - Objeto usuario
 * @returns {Array} - Menú completo filtrado
 */
export const generateFilteredMenu = user => {
  const fullMenu = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'house',
      requiredPermission: 'dashboard',
    },

    {
      id: 'administracion',
      label: 'Administración',
      icon: 'gears',
      requiredPermission: 'administracion',
      children: [
        {
          id: 'recintos',
          label: 'Recintos',
          path: '/dashboard/recintos',
          icon: 'building',
          requiredPermission: 'recintos',
        },
        {
          id: 'plano',
          label: 'Plano',
          path: '/dashboard/plano',
          icon: 'map',
          requiredPermission: 'plano',
        },
        {
          id: 'usuarios',
          label: 'Usuarios',
          path: '/dashboard/usuarios',
          icon: 'users',
          requiredPermission: 'usuarios',
        },
        {
          id: 'liquidaciones',
          label: 'Liquidaciones',
          path: '/dashboard/liquidaciones',
          icon: 'money-bill-wave',
          requiredPermission: 'liquidaciones',
        },
      ],
    },
    {
      id: 'programacion',
      label: 'Programación',
      icon: 'calendar-days',
      requiredPermission: 'programacion',
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: 'users-gear',
      requiredPermission: 'crm',
    },
    {
      id: 'reports',
      label: 'Informes',
      path: '/dashboard/reports',
      icon: 'file-lines',
      requiredPermission: 'reports',
    },
    {
      id: 'personalizacion',
      label: 'Personalización',
      icon: 'palette',
      requiredPermission: 'personalizacion',
    },
    {
      id: 'boleteria',
      label: 'Boletería',
      path: '/dashboard/boleteria',
      icon: 'ticket-simple',
      requiredPermission: 'boleteria',
    },
    {
      id: 'panel_saas',
      label: 'Panel SaaS',
      icon: 'globe',
      requiredPermission: 'panel_saas',
    },
  ];

  return filterMenuByPermissions(fullMenu, user);
};

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Obtiene el rol legible del usuario
 * @param {string} role - Rol del usuario
 * @returns {string} - Rol legible
 */
export const getReadableRole = role => {
  const roleLabels = {
    [ROLES.SUPER_ADMIN]: 'Super Administrador',
    [ROLES.TENANT_ADMIN]: 'Administrador de Tenant',
    [ROLES.EVENT_MANAGER]: 'Gestor de Eventos',
    [ROLES.SALES_MANAGER]: 'Gestor de Ventas',
    [ROLES.BOX_OFFICE]: 'Taquilla',
    [ROLES.CUSTOMER_SUPPORT]: 'Soporte al Cliente',
    [ROLES.MARKETING]: 'Marketing',
    [ROLES.REPORTS]: 'Reportes y Analytics',
    [ROLES.FINANCE]: 'Finanzas y Facturación',
    [ROLES.TECHNICAL]: 'Soporte Técnico',
  };

  return roleLabels[role] || role;
};

/**
 * Verifica si un usuario está activo
 * @param {Object} user - Objeto usuario
 * @returns {boolean}
 */
export const isUserActive = user => {
  return user && user.is_active !== false;
};

/**
 * Obtiene todos los permisos disponibles para un rol
 * @param {string} role - Rol del usuario
 * @returns {Array} - Array de permisos
 */
export const getRolePermissions = role => {
  return ROLE_PERMISSIONS[role] || [];
};

export default {
  ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  hasRouteAccess,
  canAccessFunctionality,
  filterMenuByPermissions,
  generateFilteredMenu,
  getReadableRole,
  isUserActive,
  getRolePermissions,
};
