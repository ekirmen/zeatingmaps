const API_BASE_URL = 'http://localhost:5000/api';

export const fetchEventos = async (token) => {
  const res = await fetch(`${API_BASE_URL}/events`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    throw new Error('Error fetching events');
  }
  return res.json();
};

export const getEventos = fetchEventos;

export const deleteEvento = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Error deleting event');
  }
};

export const duplicateEvento = async (id, token) => {
  const res = await fetch(`${API_BASE_URL}/events/${id}/duplicate`, {
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

  const res = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: { Authorization: token },
    body: formData
  });
  if (!res.ok) {
    throw new Error('Error saving event');
  }
  return res.json();
};
