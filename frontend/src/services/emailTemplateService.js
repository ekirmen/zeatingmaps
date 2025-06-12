const API_BASE_URL = process.env.REACT_APP_API_URL + '/api';

export const fetchEmailTemplates = async (token) => {
  const res = await fetch(`${API_BASE_URL}/email-templates`, {
    headers: { Authorization: token }
  });
  if (!res.ok) throw new Error('Error fetching templates');
  return res.json();
};

export const saveEmailTemplate = async (type, data, token) => {
  const res = await fetch(`${API_BASE_URL}/email-templates/${type}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error saving template');
  return res.json();
};
