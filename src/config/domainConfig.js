const STATIC_DOMAIN_CONFIGS = {
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

const DEFAULT_DOMAIN_CONFIG = {
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
    contactEmail: 'info@zeatingmaps.com'
  }
};

const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const normalizeHostnameInternal = (hostname = '') => {
  if (!hostname) {
    return 'localhost';
  }

  return String(hostname)
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
};

const extractDomainParts = (hostname) => {
  const normalizedHostname = normalizeHostnameInternal(hostname);
  const parts = normalizedHostname.split('.').filter(Boolean);

  if (parts.length <= 1) {
    return {
      normalizedHostname,
      apexDomain: normalizedHostname,
      subdomain: null
    };
  }

  const apexDomain = parts.slice(-2).join('.');
  const subdomain = parts.length > 2 ? parts.slice(0, parts.length - 2).join('.') : null;

  return {
    normalizedHostname,
    apexDomain,
    subdomain
  };
};

const cloneDomainConfig = (config) => {
  if (!config) {
    return null;
  }

  return {
    ...config,
    theme: { ...config.theme },
    features: { ...config.features },
    branding: { ...config.branding }
  };
};

const buildStaticDomainConfig = (hostname) => {
  const { apexDomain } = extractDomainParts(hostname);
  const config = STATIC_DOMAIN_CONFIGS[apexDomain] || DEFAULT_DOMAIN_CONFIG;
  return cloneDomainConfig(config);
};

const previewSubdomainCandidate = (subdomain) => {
  if (!subdomain) {
    return null;
  }

  const [firstSegment] = subdomain.split('-');
  return firstSegment || null;
};

export const normalizeHostname = (hostname) => normalizeHostnameInternal(hostname);

export const isLocalhostHostname = (hostname) => LOCALHOST_HOSTNAMES.has(normalizeHostnameInternal(hostname));

export const getDomainConfig = (hostname) => buildStaticDomainConfig(hostname);

export const getCurrentDomainConfig = () => {
  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return buildStaticDomainConfig(window.location.hostname);
    }
  } catch (error) {
    console.warn('Error al obtener configuración del dominio:', error);
  }

  return buildStaticDomainConfig('localhost');
};

export const shouldShowSaaS = () => getCurrentDomainConfig().features.showSaaS;

export const shouldShowStore = () => getCurrentDomainConfig().features.showStore;

export const shouldShowBackoffice = () => getCurrentDomainConfig().features.showBackoffice;

export const getDomainTheme = () => getCurrentDomainConfig().theme;

export const getDomainBranding = () => getCurrentDomainConfig().branding;

export const isMainDomain = () => {
  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return normalizeHostnameInternal(window.location.hostname) === 'sistema.veneventos.com';
    }
  } catch (error) {
    console.warn('Error al detectar dominio principal:', error);
  }

  return false;
};

export const buildConfigFromTenant = (tenant) => {
  if (!tenant) {
    return null;
  }

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
};

export const fetchTenantByHostname = async (supabase, hostname) => {
  if (!supabase) {
    return null;
  }

  const { normalizedHostname, apexDomain, subdomain } = extractDomainParts(hostname);
  const filters = new Set();

  filters.add(`full_url.eq.${normalizedHostname}`);

  if (subdomain) {
    filters.add(`subdomain.eq.${subdomain}`);
  } else {
    filters.add(`domain.eq.${apexDomain}`);
  }

  if (normalizedHostname.endsWith('.vercel.app') && subdomain) {
    const candidate = previewSubdomainCandidate(subdomain);
    if (candidate && candidate !== subdomain) {
      filters.add(`subdomain.eq.${candidate}`);
    }
  }

  const filterExpression = Array.from(filters).join(',');

  let tenant = null;

  if (filterExpression) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('status', 'active')
      .or(filterExpression)
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (Array.isArray(data) && data.length > 0) {
      tenant = data[0];
    }
  }

  if (!tenant && subdomain) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('status', 'active')
      .eq('subdomain', subdomain)
      .eq('domain', apexDomain)
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0) {
      tenant = data[0];
    }
  }

  return tenant;
};

export const getDynamicDomainConfig = async (supabase, hostname) => {
  try {
    const tenant = await fetchTenantByHostname(supabase, hostname);
    return buildConfigFromTenant(tenant);
  } catch (error) {
    console.error('Error obteniendo configuración dinámica:', error);
    return null;
  }
};

export const resolveTenantContext = async (supabase, hostname) => {
  const tenant = await fetchTenantByHostname(supabase, hostname);
  if (tenant) {
    return {
      tenant,
      domainConfig: buildConfigFromTenant(tenant)
    };
  }

  return {
    tenant: null,
    domainConfig: buildStaticDomainConfig(hostname)
  };
};

export const initializeDomainConfig = () => new Promise((resolve) => {
  const finalize = () => setTimeout(() => resolve(getCurrentDomainConfig()), 100);

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', finalize, { once: true });
    return;
  }

  finalize();
});

export const forceUpdate = Date.now();
