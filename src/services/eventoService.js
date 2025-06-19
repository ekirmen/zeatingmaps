import API_BASE_URL from '../utils/apiBase';
const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

export const fetchEventos = async (token) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/events`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    throw new Error('Error fetching events');
  }
  return res.json();
};

export const getEventos = fetchEventos;

export const deleteEvento = async (id, token) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Error deleting event');
  }
};

export const duplicateEvento = async (id, token) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/events/${id}/duplicate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Error duplicating event');
  }
  return res.json();
};

export const saveEvento = async (eventoData, token, files = {}) => {
  const formData = new FormData();
  formData.append('data', JSON.stringify(eventoData));
  Object.entries(files).forEach(([key, file]) => {
    if (file) formData.append(key, file);
  });

  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL_WITH_API}/events`, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData
  });
  if (!res.ok) {
    throw new Error('Error saving event');
  }
  return res.json();
};
