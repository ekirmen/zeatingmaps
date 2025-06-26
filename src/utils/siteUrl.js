const raw = process.env.REACT_APP_SITE_URL || window.location.origin;
const SITE_URL = raw.replace(/\/+$/, '');
export default SITE_URL;
export { SITE_URL };
