import API_BASE_URL from '../utils/apiBase';
const API_BASE_URL_WITH_API = API_BASE_URL + '/api';

export const fetchImagenes = async (token) => {
  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL_WITH_API}/galeria`, {
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error('Error loading images');
  return res.json();
};

export const uploadImagen = async (file, token, categoria = 'productos') => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('categoria', categoria);
  
  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL_WITH_API}/galeria`, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData
  });
  if (!res.ok) throw new Error('Error uploading image');
  return res.json();
};

export const deleteImagen = async (filename, token) => {
  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL_WITH_API}/galeria/${filename}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error('Error deleting image');
  return res.json();
};
