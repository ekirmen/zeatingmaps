const sanitizeUrl = (value) => {
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

const resolveSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return sanitizeUrl(window.location.origin) || 'http://localhost:3000';
  }

  const envUrl = resolveEnvSiteUrl();
  return envUrl || 'http://localhost:3000';
};

const resolveStoreBaseUrl = () => {
  const envStoreUrl = resolveEnvStoreUrl();
  if (envStoreUrl) {
    return envStoreUrl;
  }

  return joinUrl(resolveSiteUrl(), '/store');
};

const resolveStoreResetPasswordUrl = () => joinUrl(resolveStoreBaseUrl(), '/reset-password');

const SITE_URL = resolveSiteUrl();
const STORE_BASE_URL = resolveStoreBaseUrl();
const STORE_RESET_PASSWORD_URL = resolveStoreResetPasswordUrl();

export default SITE_URL;
export {
  SITE_URL,
  STORE_BASE_URL,
  STORE_RESET_PASSWORD_URL,
  resolveSiteUrl,
  resolveStoreBaseUrl,
  resolveStoreResetPasswordUrl,
};
