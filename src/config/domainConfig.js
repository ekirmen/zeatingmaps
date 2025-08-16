// Configuración por dominio para mostrar diferentes funcionalidades
export const getDomainConfig = (hostname) => {
  // Extraer el dominio principal y subdominio
  const domain = hostname.split('.').slice(-2).join('.');
  // const subdomain = hostname.split('.')[0]; // No utilizado actualmente

  // Configuración por dominio
  const domainConfigs = {
    'veneventos.com': {
      name: 'Veneventos',
      theme: {
        primaryColor: '#1890ff',
        secondaryColor: '#52c41a',
        logo: '/assets/logo-veneventos.png'
      },
      features: {
        showSaaS: true,
        showStore: true,
        showBackoffice: true,
        showTicketing: true,
        showEvents: true,
        showVenues: true
      },
      branding: {
        companyName: 'Veneventos - Sistema Principal',
        tagline: 'Sistema de Eventos Profesional',
        contactEmail: 'info@veneventos.com'
      }
    },
    'kreatickets.com': {
      name: 'Kreatickets',
      theme: {
        primaryColor: '#722ed1',
        secondaryColor: '#eb2f96',
        logo: '/assets/logo-kreatickets.png'
      },
      features: {
        showSaaS: false,
        showStore: true,
        showBackoffice: false,
        showTicketing: true,
        showEvents: true,
        showVenues: false
      },
      branding: {
        companyName: 'Kreatickets',
        tagline: 'Plataforma de Venta de Entradas',
        contactEmail: 'support@kreatickets.com'
      }
    },
    'ticketera.com': {
      name: 'Ticketera',
      theme: {
        primaryColor: '#fa8c16',
        secondaryColor: '#f5222d',
        logo: '/assets/logo-ticketera.png'
      },
      features: {
        showSaaS: true,
        showStore: true,
        showBackoffice: true,
        showTicketing: true,
        showEvents: true,
        showVenues: true
      },
      branding: {
        companyName: 'Ticketera',
        tagline: 'Solución Completa de Ticketing',
        contactEmail: 'admin@ticketera.com'
      }
    }
  };

  // Configuración por defecto para dominios no configurados
  const defaultConfig = {
    name: 'ZeatingMaps',
    theme: {
      primaryColor: '#1890ff',
      secondaryColor: '#52c41a',
      logo: '/assets/logo.png'
    },
    features: {
      showSaaS: true, // Habilitado por defecto para nuevos dominios
      showStore: true,
      showBackoffice: true,
      showTicketing: true,
      showEvents: true,
      showVenues: true
    },
    branding: {
      companyName: 'ZeatingMaps',
      tagline: 'Sistema de Gestión de Eventos',
      contactEmail: 'info@zeatingmaps.com'
    }
  };

  // Retornar configuración específica del dominio o la por defecto
  return domainConfigs[domain] || defaultConfig;
};

// Función helper para obtener configuración del dominio actual
export const getCurrentDomainConfig = () => {
  if (typeof window !== 'undefined') {
    return getDomainConfig(window.location.hostname);
  }
  return getDomainConfig('localhost');
};

// Función para verificar si mostrar SaaS
export const shouldShowSaaS = () => {
  const config = getCurrentDomainConfig();
  return config.features.showSaaS;
};

// Función para verificar si mostrar Store
export const shouldShowStore = () => {
  const config = getCurrentDomainConfig();
  return config.features.showStore;
};

// Función para verificar si mostrar Backoffice
export const shouldShowBackoffice = () => {
  const config = getCurrentDomainConfig();
  return config.features.showBackoffice;
};

// Función para obtener tema del dominio
export const getDomainTheme = () => {
  const config = getCurrentDomainConfig();
  return config.theme;
};

// Función para obtener branding del dominio
export const getDomainBranding = () => {
  const config = getCurrentDomainConfig();
  return config.branding;
};

// Función para detectar si es el dominio principal (sistema.veneventos.com)
export const isMainDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'sistema.veneventos.com';
  }
  return false;
};

// Función para obtener configuración dinámica desde la base de datos
export const getDynamicDomainConfig = async (supabase, hostname) => {
  try {
    // Buscar configuración en la base de datos
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .or(`full_url.eq.${hostname},subdomain.eq.${hostname.split('.')[0]}`)
      .single();

    if (error || !tenant) {
      return null;
    }

    // Retornar configuración personalizada del tenant
    return {
      id: tenant.id,
      name: tenant.company_name,
      theme: {
        primaryColor: tenant.theme_config?.primaryColor || tenant.primary_color || '#1890ff',
        secondaryColor: tenant.theme_config?.secondaryColor || tenant.secondary_color || '#52c41a',
        logo: tenant.theme_config?.logo || tenant.logo_url || '/assets/logo.png'
      },
      features: {
        showSaaS: tenant.feature_flags?.showSaaS ?? true,
        showStore: tenant.feature_flags?.showStore ?? true,
        showBackoffice: tenant.feature_flags?.showBackoffice ?? true,
        showTicketing: tenant.feature_flags?.showTicketing ?? true,
        showEvents: tenant.feature_flags?.showEvents ?? true,
        showVenues: tenant.feature_flags?.showVenues ?? true
      },
      branding: {
        companyName: tenant.branding_config?.companyName || tenant.company_name,
        tagline: tenant.branding_config?.tagline || 'Sistema de Gestión de Eventos',
        contactEmail: tenant.branding_config?.contactEmail || tenant.contact_email
      },
      customRoutes: tenant.custom_routes || [],
      isMainDomain: tenant.is_main_domain || false,
      tenantType: tenant.tenant_type || 'company'
    };
  } catch (error) {
    console.error('Error obteniendo configuración dinámica:', error);
    return null;
  }
};

export const forceUpdate = Date.now(); 