// Configuración por dominio para mostrar diferentes funcionalidades
export const getDomainConfig = (hostname) => {
  // Extraer el dominio principal
  const domain = hostname.split('.').slice(-2).join('.');
  const subdomain = hostname.split('.')[0];

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
        companyName: 'Veneventos - update',
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

  // Configuración por defecto
  const defaultConfig = {
    name: 'ZeatingMaps',
    theme: {
      primaryColor: '#1890ff',
      secondaryColor: '#52c41a',
      logo: '/assets/logo.png'
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
      companyName: 'ZeatingMaps',
      tagline: 'Sistema de Gestión de Eventos',
      contactEmail: 'info@  zeatingmaps.com'
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
export const forceUpdate = Date.now();