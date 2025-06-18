const raw = process.env.REACT_APP_API_URL || '';
let base = raw.replace(/\/+$/, '');
if (base.endsWith('/api')) {
  base = base.slice(0, -4);
}
export const API_BASE_URL = base;
export default API_BASE_URL;
