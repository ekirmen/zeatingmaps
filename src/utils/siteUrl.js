const sanitizeUrl = value => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.replace(/\/+$/, '');
};

const resolveEnvSiteUrl = () => {
  const candidates = [
    process.env.REACT_APP_SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
  ];

  if (process.env.VERCEL_BRANCH_URL) {
    candidates.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    candidates.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  if (process.env.VERCEL_URL) {
    candidates.push(`https://${process.env.VERCEL_URL}`);
  }

  for (const candidate of candidates) {
    const sanitized = sanitizeUrl(candidate);
    if (sanitized) {
      return sanitized;
    }
  }

  return '';
};

const resolveEnvStoreUrl = () => {
  const candidates = [
    process.env.REACT_APP_STORE_URL,
    process.env.REACT_APP_STORE_BASE_URL,
    process.env.NEXT_PUBLIC_STORE_URL,
    process.env.NEXT_PUBLIC_STORE_BASE_URL,
    process.env.STORE_URL,
    process.env.STORE_BASE_URL,
  ];

  for (const candidate of candidates) {
    const sanitized = sanitizeUrl(candidate);
    if (sanitized) {
      return sanitized;
    }
  }

  return '';
};

const joinUrl = (base, path = '') => {
  const sanitizedBase = sanitizeUrl(base);
  if (!sanitizedBase) {
    return '';
  }

  if (!path) {
    return sanitizedBase;
  }

  return `${sanitizedBase}${path.startsWith('/') ? path : `/${path}`}`;
};

const getServerSiteUrl = (() => {
  let cachedValue = null;
  return () => {
    if (cachedValue) {
      return cachedValue;
    }

    cachedValue = resolveEnvSiteUrl() || 'http://localhost:3000';
    return cachedValue;
  };
})();

const getSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const fromWindow = sanitizeUrl(window.location.origin);
    if (fromWindow) {
      return fromWindow;
    }
  }

  return getServerSiteUrl();
};

const resolveSiteUrl = () => getSiteUrl();

const getStoreBaseUrl = () => {
  const envStoreUrl = resolveEnvStoreUrl();
  if (envStoreUrl) {
    return envStoreUrl;
  }

  return joinUrl(getSiteUrl(), '/store');
};

const resolveStoreBaseUrl = () => getStoreBaseUrl();

const getStoreResetPasswordUrl = () => joinUrl(getStoreBaseUrl(), '/reset-password');

const resolveStoreResetPasswordUrl = () => getStoreResetPasswordUrl();

export default getSiteUrl;
export {
  getSiteUrl,
  getStoreBaseUrl,
  getStoreResetPasswordUrl,
  resolveSiteUrl,
  resolveStoreBaseUrl,
  resolveStoreResetPasswordUrl,
};
