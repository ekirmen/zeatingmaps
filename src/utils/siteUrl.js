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

const resolveSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return sanitizeUrl(window.location.origin) || 'http://localhost:3000';
  }

  const envUrl = resolveEnvSiteUrl();
  return envUrl || 'http://localhost:3000';
};

const SITE_URL = resolveSiteUrl();

export default SITE_URL;
export { SITE_URL, resolveSiteUrl };
