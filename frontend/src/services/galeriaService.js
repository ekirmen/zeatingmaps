const API_BASE_URL = 'http://localhost:5000/api';

export const fetchImagenes = async (token) => {
  const res = await fetch(`${API_BASE_URL}/galeria`, {
    headers: { Authorization: token }
  });
  if (!res.ok) throw new Error('Error loading images');
  return res.json();
};

export const uploadImagen = async (file, token) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE_URL}/galeria`, {
    method: 'POST',
    headers: { Authorization: token },
    body: formData
  });
  if (!res.ok) throw new Error('Error uploading image');
  return res.json();
};

export const deleteImagen = async (filename, token) => {
  const res = await fetch(`${API_BASE_URL}/galeria/${filename}`, {
    method: 'DELETE',
    headers: { Authorization: token }
  });
  if (!res.ok) throw new Error('Error deleting image');
  return res.json();
};
