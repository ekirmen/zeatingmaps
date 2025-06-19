import API_BASE_URL from '../utils/apiBase';
const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

export const fetchAbonosByUser = async (userId, token) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/abonos/user/${userId}`, {
    headers: token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Error fetching abonos');
  return res.json();
};

export const createAbono = async (data, token) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/abonos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error creating abono');
  return res.json();
};

export const renewAbono = async (id, data, token) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/abonos/${id}/renew`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error renewing abono');
  return res.json();
};
