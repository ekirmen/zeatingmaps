// Configuración de endpoints de API para producción
const API_BASE_URL = 'https://sistema.veneventos.com';

export const API_ENDPOINTS = {
  // Grid Sale - Modo Grid
  GRID_SALE: {
    LOAD_ZONAS: `${API_BASE_URL}/api/grid-sale/load-zonas`,
    VALIDATE_SALE: `${API_BASE_URL}/api/grid-sale/validate-sale`,
    PROCESS_SALE: `${API_BASE_URL}/api/grid-sale/process-sale`,
    GET_SALE_STATUS: `${API_BASE_URL}/api/grid-sale/sale-status`
  },
  
  // Payment Gateways - Pasarelas de Pago
  PAYMENT: {
    TEST_STRIPE: `${API_BASE_URL}/api/payment/test-stripe-connection`,
    TEST_PAYPAL: `${API_BASE_URL}/api/payment/test-paypal-connection`,
    PROCESS_STRIPE: `${API_BASE_URL}/api/payment/process-stripe`,
    PROCESS_PAYPAL: `${API_BASE_URL}/api/payment/process-paypal`,
    REFUND_PAYMENT: `${API_BASE_URL}/api/payment/refund`
  },
  
  // SaaS - Sistema SaaS
  SAAS: {
    USERS: `${API_BASE_URL}/api/saas/users`,
    TENANTS: `${API_BASE_URL}/api/saas/tenants`,
    ANALYTICS: `${API_BASE_URL}/api/saas/analytics`,
    DASHBOARD_STATS: `${API_BASE_URL}/api/saas/dashboard-stats`,
    USER_MANAGEMENT: `${API_BASE_URL}/api/saas/user-management`,
    ROLE_MANAGEMENT: `${API_BASE_URL}/api/saas/role-management`
  },
  
  // Events - Eventos
  EVENTS: {
    LIST: `${API_BASE_URL}/api/events/list`,
    CREATE: `${API_BASE_URL}/api/events/create`,
    UPDATE: `${API_BASE_URL}/api/events/update`,
    DELETE: `${API_BASE_URL}/api/events/delete`,
    GET_BY_ID: `${API_BASE_URL}/api/events/get-by-id`,
    GET_BY_SLUG: `${API_BASE_URL}/api/events/get-by-slug`
  },
  
  // Functions - Funciones
  FUNCTIONS: {
    LIST: `${API_BASE_URL}/api/functions/list`,
    CREATE: `${API_BASE_URL}/api/functions/create`,
    UPDATE: `${API_BASE_URL}/api/functions/update`,
    DELETE: `${API_BASE_URL}/api/functions/delete`,
    GET_BY_EVENT: `${API_BASE_URL}/api/functions/get-by-event`
  },
  
  // Zones - Zonas
  ZONES: {
    LIST: `${API_BASE_URL}/api/zones/list`,
    CREATE: `${API_BASE_URL}/api/zones/create`,
    UPDATE: `${API_BASE_URL}/api/zones/update`,
    DELETE: `${API_BASE_URL}/api/zones/delete`,
    GET_BY_SALA: `${API_BASE_URL}/api/zones/get-by-sala`
  },
  
  // Templates - Plantillas
  TEMPLATES: {
    LIST: `${API_BASE_URL}/api/templates/list`,
    CREATE: `${API_BASE_URL}/api/templates/create`,
    UPDATE: `${API_BASE_URL}/api/templates/update`,
    DELETE: `${API_BASE_URL}/api/templates/delete`,
    GET_BY_RECINTO_SALA: `${API_BASE_URL}/api/templates/get-by-recinto-sala`
  },
  
  // Sales - Ventas
  SALES: {
    LIST: `${API_BASE_URL}/api/sales/list`,
    CREATE: `${API_BASE_URL}/api/sales/create`,
    UPDATE: `${API_BASE_URL}/api/sales/update`,
    CANCEL: `${API_BASE_URL}/api/sales/cancel`,
    GET_BY_ID: `${API_BASE_URL}/api/sales/get-by-id`,
    GET_BY_EVENT: `${API_BASE_URL}/api/sales/get-by-event`,
    GET_BY_CLIENT: `${API_BASE_URL}/api/sales/get-by-client`
  },
  
  // Tickets - Entradas
  TICKETS: {
    LIST: `${API_BASE_URL}/api/tickets/list`,
    CREATE: `${API_BASE_URL}/api/tickets/create`,
    VALIDATE: `${API_BASE_URL}/api/tickets/validate`,
    GET_BY_CODE: `${API_BASE_URL}/api/tickets/get-by-code`,
    GET_BY_SALE: `${API_BASE_URL}/api/tickets/get-by-sale`
  },
  
  // Clients - Clientes
  CLIENTS: {
    LIST: `${API_BASE_URL}/api/clients/list`,
    CREATE: `${API_BASE_URL}/api/clients/create`,
    UPDATE: `${API_BASE_URL}/api/clients/update`,
    DELETE: `${API_BASE_URL}/api/clients/delete`,
    SEARCH: `${API_BASE_URL}/api/clients/search`,
    GET_BY_ID: `${API_BASE_URL}/api/clients/get-by-id`
  },
  
  // Venues - Recintos
  VENUES: {
    LIST: `${API_BASE_URL}/api/venues/list`,
    CREATE: `${API_BASE_URL}/api/venues/create`,
    UPDATE: `${API_BASE_URL}/api/venues/update`,
    DELETE: `${API_BASE_URL}/api/venues/delete`,
    GET_BY_TENANT: `${API_BASE_URL}/api/venues/get-by-tenant`
  },
  
  // Rooms - Salas
  ROOMS: {
    LIST: `${API_BASE_URL}/api/rooms/list`,
    CREATE: `${API_BASE_URL}/api/rooms/create`,
    UPDATE: `${API_BASE_URL}/api/rooms/update`,
    DELETE: `${API_BASE_URL}/api/rooms/delete`,
    GET_BY_VENUE: `${API_BASE_URL}/api/rooms/get-by-venue`
  },
  
  // Security - Seguridad
  SECURITY: {
    AUDIT_LOGS: `${API_BASE_URL}/api/security/audit-logs`,
    SECURITY_ALERTS: `${API_BASE_URL}/api/security/alerts`,
    LOGIN_ATTEMPTS: `${API_BASE_URL}/api/security/login-attempts`,
    SUSPICIOUS_ACTIVITY: `${API_BASE_URL}/api/security/suspicious-activity`
  },
  
  // Analytics - Analíticas
  ANALYTICS: {
    DASHBOARD: `${API_BASE_URL}/api/analytics/dashboard`,
    SALES_REPORT: `${API_BASE_URL}/api/analytics/sales-report`,
    EVENT_REPORT: `${API_BASE_URL}/api/analytics/event-report`,
    CLIENT_REPORT: `${API_BASE_URL}/api/analytics/client-report`,
    REVENUE_REPORT: `${API_BASE_URL}/api/analytics/revenue-report`
  },
  
  // Notifications - Notificaciones
  NOTIFICATIONS: {
    SEND_EMAIL: `${API_BASE_URL}/api/notifications/send-email`,
    SEND_SMS: `${API_BASE_URL}/api/notifications/send-sms`,
    SEND_PUSH: `${API_BASE_URL}/api/notifications/send-push`,
    GET_TEMPLATES: `${API_BASE_URL}/api/notifications/get-templates`
  },
  
  // Reports - Reportes
  REPORTS: {
    GENERATE: `${API_BASE_URL}/api/reports/generate`,
    DOWNLOAD: `${API_BASE_URL}/api/reports/download`,
    SCHEDULE: `${API_BASE_URL}/api/reports/schedule`,
    GET_SCHEDULED: `${API_BASE_URL}/api/reports/get-scheduled`
  }
};

// Función helper para hacer requests
export const apiRequest = async (endpoint, options = {}) => {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Función para obtener headers de autenticación
export const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Función para manejar errores de API
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.message.includes('401')) {
    // Token expirado o no válido
    window.location.href = '/login';
    return;
  }
  
  if (error.message.includes('403')) {
    // Sin permisos
    return 'No tienes permisos para realizar esta acción';
  }
  
  if (error.message.includes('404')) {
    // Recurso no encontrado
    return 'El recurso solicitado no existe';
  }
  
  if (error.message.includes('500')) {
    // Error del servidor
    return 'Error interno del servidor. Intenta más tarde';
  }
  
  return error.message || 'Error desconocido';
};

export default API_ENDPOINTS;
