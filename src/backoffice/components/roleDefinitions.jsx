// roleDefinitions.js

// 1. Lista Maestra de Permisos (Default: false)
// Define todas las capacidades del sistema
export const INITIAL_PERMISSIONS = {
    // Dashboard Principal
    dashboard: false,
    webstudio: false, // Nuevo Web Studio

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
    afiliados: false,
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

    // SaaS (Sistema)
    saas: false,
    saas_settings: false,
    saas_billing: false,
    saas_payment_gateways: false,
    saas_roles: false,
    saas_api_explorer: false,

    // Permisos SaaS Granulares
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

    // Funciones Especiales
    crear_usuarios: false,
    editar_usuarios: false,
    eliminar_usuarios: false,
    ver_reportes: false,
    crear_reportes: false,
    exportar_datos: false,
    configurar_sistema: false,
    acceder_saas: false,

    // Gestión de Tenants
    gestionar_tenants: false,
    asignar_tenants: false,
    ver_todos_tenants: false
};

// 2. Definición de Roles del Sistema (SaaS)
export const SAAS_ROLES = {
    super_admin: {
        label: 'Super Admin',
        permissions: (perms) => {
            // Activar TODO
            Object.keys(perms).forEach(k => perms[k] = true);
            return perms;
        }
    },
    admin_sistema: {
        label: 'Admin Sistema',
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            saas: true,
            saas_settings: true,
            saas_billing: true,
            saas_payment_gateways: true,
            saas_roles: true,
            saas_api_explorer: true,
            tenant_read: true,
            tenant_write: true,
            tenant_delete: true,
            billing_read: true,
            billing_write: true,
            analytics_read: true,
            notifications_read: true,
            notifications_write: true,
            gestionar_tenants: true,
            asignar_tenants: true,
            ver_todos_tenants: true,
            crear_usuarios: true,
            editar_usuarios: true,
            eliminar_usuarios: true
        })
    },
    gerente_sistema: {
        label: 'Gerente Sistema',
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            saas: true,
            saas_settings: true,
            saas_billing: true,
            tenant_read: true,
            tenant_write: true,
            billing_read: true,
            support_read: true,
            support_write: true,
            analytics_read: true,
            notifications_read: true,
            gestionar_tenants: true,
            asignar_tenants: true,
            ver_todos_tenants: true,
            crear_usuarios: true,
            editar_usuarios: true
        })
    },
    soporte_sistema: {
        label: 'Soporte Sistema',
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            saas: true,
            tenant_read: true,
            support_read: true,
            support_write: true,
            notifications_read: true,
            ver_todos_tenants: true
        })
    },
    visualizador_sistema: {
        label: 'Visualizador Sistema',
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            saas: true,
            tenant_read: true,
            analytics_read: true,
            notifications_read: true,
            ver_todos_tenants: true
        })
    }
};

// 3. Definición de Roles de Tenant (Recinto)
export const TENANT_ROLES = {
    tenant_admin: {
        label: 'Administrador (Dueño)',
        extends: ['admin', '1'], // Mapping legacy (deprecated but useful reference)
        permissions: (perms) => applyTenantAdminPermissions(perms)
    },
    gerente: {
        label: 'Gerente',
        extends: ['3'],
        permissions: (perms) => applyTenantAdminPermissions(perms) // Mismos que admin por ahora
    },
    taquilla: {
        label: 'Taquilla',
        extends: ['2'],
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            boleteria: true,
            entradas: true,
            eventos: true,
            funciones: true,
            reportes: true,
            ver_reportes: true
        })
    },
    call_center: {
        label: 'Call Center',
        extends: ['4'],
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            boleteria: true,
            entradas: true,
            eventos: true,
            funciones: true,
            crm: true,
            reportes: true,
            ver_reportes: true
        })
    },
    agencias: {
        label: 'Agencias',
        extends: ['5'],
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            boleteria: true,
            entradas: true,
            eventos: true,
            funciones: true,
            reportes: true,
            ver_reportes: true
        })
    },
    contenido_marketing: {
        label: 'Contenido / Marketing',
        extends: ['12'],
        permissions: (perms) => applyTenantAdminPermissions(perms) // Full access to Web Studio/Events etc
    },
    atencion_cliente: {
        label: 'Atención al Cliente',
        extends: ['7'],
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            crm: true,
            reportes: true,
            ver_reportes: true,
            refund_management: true
        })
    },
    vendedor_externo: {
        label: 'Vendedor Externo',
        extends: ['11'],
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            boleteria: true,
            entradas: true,
            eventos: true,
            funciones: true,
            crm: true,
            reportes: true,
            ver_reportes: true
        })
    },
    reportes: {
        label: 'Reportes (Auditor)',
        extends: ['6'],
        permissions: (perms) => ({
            ...perms,
            dashboard: true,
            reportes: true,
            ver_reportes: true,
            crear_reportes: true,
            exportar_datos: true,
            payment_analytics: true
        })
    },
    usuario_store: {
        label: 'Usuario Store',
        permissions: (perms) => ({
            ...perms,
            dashboard: false
        })
    },
    guest: {
        label: 'Invitado',
        permissions: (perms) => perms // Todo false
    }
};

// Helper para permisos completos de tenant
function applyTenantAdminPermissions(perms) {
    return {
        ...perms,
        dashboard: true,
        webstudio: true,
        usuarios: true,
        recintos: true,
        plano: true,
        liquidaciones: true,
        entradas: true,
        productos: true,
        plantillas_productos: true,
        donaciones: true,
        comisiones: true,
        seguros: true,
        envio: true,
        eventos: true,
        plantillas_precios: true,
        funciones: true,
        cupos: true,
        plantillas_cupos: true,
        filas_virtuales: true,
        paquetes: true,
        multipase: true,
        abonos: true,
        afiliados: true,
        iva: true,
        boleteria: true,
        reportes: true,
        crm: true,
        tags: true,
        settings: true,
        seat_settings: true,
        printer_settings: true,
        email_config: true,
        audit_logs: true,
        refund_management: true,
        payment_analytics: true,
        payment_gateways: true,
        crear_usuarios: true,
        editar_usuarios: true,
        eliminar_usuarios: true,
        ver_reportes: true,
        crear_reportes: true,
        exportar_datos: true,
        configurar_sistema: true,
        // Permisos SaaS limitados
        saas: true,
        saas_settings: true,
        saas_billing: true,
        saas_payment_gateways: true,
        saas_roles: true,
        saas_api_explorer: true
    };
}
