import API_BASE_URL from './apiBase';

export default function resolveImageUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${API_BASE_URL}${url}`;
}
