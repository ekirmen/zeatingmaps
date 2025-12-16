import API_BASE_URL from '../utils/apiBase';

const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

export const getEmailTemplates = async (authHeader) => {
  try {
    const res = await fetch(`${API_BASE_URL_WITH_API}/email-templates`, {
      headers: { Authorization: authHeader }
    });
    if (!res.ok) throw new Error('Error fetching templates');
    return res.json();
  } catch (error) {
    console.error('Error getEmailTemplates:', error);
    throw error;
  }
};

export const updateEmailTemplate = async (type, data, authHeader) => {
  try {
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
  } catch (error) {
    console.error('Error updateEmailTemplate:', error);
    throw error;
  }
};