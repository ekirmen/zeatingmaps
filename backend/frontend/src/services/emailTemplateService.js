import API_BASE_URL from '../utils/apiBase';
const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

export const fetchEmailTemplates = async (token) => {
  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL_WITH_API}/email-templates`, {
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error('Error fetching templates');
  return res.json();
};

export const saveEmailTemplate = async (type, data, token) => {
  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL_WITH_API}/email-templates/${type}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error saving template');
  return res.json();
};
