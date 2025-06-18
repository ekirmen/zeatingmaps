const API_BASE_URL = (process.env.REACT_APP_API_URL || '') + '/api';

export const fetchImagenes = async (token) => {
  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL}/galeria`, {
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error('Error loading images');
  return res.json();
};

export const uploadImagen = async (file, token) => {
  const formData = new FormData();
  formData.append('image', file);
  const authHeader = token && !token.startsWith('Bearer ')
    ? `Bearer ${token}`
    : token;
  const res = await fetch(`${API_BASE_URL}/galeria`, {
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
  const res = await fetch(`${API_BASE_URL}/galeria/${filename}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error('Error deleting image');
  return res.json();
};
