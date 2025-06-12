import React, { useEffect, useState, useCallback } from 'react';
import { fetchImagenes, uploadImagen, deleteImagen } from '../../services/galeriaService';

const Galeria = () => {
  const [imagenes, setImagenes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert('La imagen debe pesar 1MB o menos');
      return;
    }
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    try {
      await uploadImagen(selectedFile, token);
      setSelectedFile(null);
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
      <div className="flex items-center gap-2 mb-4">
        <input type="file" accept=".jpg,.png" onChange={handleFileChange} />
        <button
          onClick={handleSave}
          disabled={!selectedFile}
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        {imagenes.map((img) => (
          <div key={img.name} className="relative w-40 h-40">
            <img
              src={img.url}
              alt={img.name}
              className="object-cover w-full h-full rounded"
            />
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
