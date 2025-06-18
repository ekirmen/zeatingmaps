const API_BASE_URL = (process.env.REACT_APP_API_URL || '') + '/api';

export const fetchAbonosByUser = async (userId, token) => {
  const res = await fetch(`${API_BASE_URL}/abonos/user/${userId}`, {
    headers: token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Error fetching abonos');
  return res.json();
};

export const createAbono = async (data, token) => {
  const res = await fetch(`${API_BASE_URL}/abonos`, {
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
  const res = await fetch(`${API_BASE_URL}/abonos/${id}/renew`, {
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
