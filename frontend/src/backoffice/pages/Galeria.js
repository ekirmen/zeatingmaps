import React, { useEffect, useState, useCallback } from 'react';
import { fetchImagenes, uploadImagen, deleteImagen } from '../../services/galeriaService';

const Galeria = () => {
  const [imagenes, setImagenes] = useState([]);
  const token = localStorage.getItem('token');

  const cargarImagenes = useCallback(async () => {
    try {
      const data = await fetchImagenes(token);
      setImagenes(data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    cargarImagenes();
  }, [cargarImagenes]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert('La imagen debe pesar 1MB o menos');
      return;
    }
    try {
      await uploadImagen(file, token);
      cargarImagenes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm('¿Eliminar imagen?')) return;
    try {
      await deleteImagen(name, token);
      cargarImagenes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Galería</h2>
      <input type="file" accept=".jpg,.png" onChange={handleUpload} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {imagenes.map((img) => (
          <div key={img.name} className="relative">
            <img src={img.url} alt={img.name} className="w-full h-auto" />
            <button
              className="absolute top-1 right-1 bg-red-600 text-white px-2 py-1 text-xs"
              onClick={() => handleDelete(img.name)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Galeria;
