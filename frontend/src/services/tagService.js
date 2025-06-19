import API_BASE_URL from '../utils/apiBase';
const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

export const fetchTags = async () => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/tags`);
  if (!res.ok) throw new Error('Error fetching tags');
  return res.json();
};

export const createTag = async (data) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error creating tag');
  return res.json();
};

export const updateTag = async (id, data) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error updating tag');
  return res.json();
};

export const deleteTag = async (id) => {
  const res = await fetch(`${API_BASE_URL_WITH_API}/tags/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error deleting tag');
  return res.json();
};
