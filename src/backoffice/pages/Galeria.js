import React, { useEffect, useState, useCallback } from 'react';
import { fetchImagenes, uploadImagen, deleteImagen } from '../../services/galeriaService';

const Galeria = () => {
  const [imagenes, setImagenes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categoria, setCategoria] = useState('productos');
  const token = localStorage.getItem('token');

  const categorias = [
    { value: 'productos', label: 'Productos' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'banners', label: 'Banners' },
    { value: 'logos', label: 'Logos' },
    { value: 'otros', label: 'Otros' }
  ];

  const cargarImagenes = useCallback(async () => {
    try {
      const data = await fetchImagenes(token);
      setImagenes(data);
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
    }
  }, [token]);

  useEffect(() => {
    cargarImagenes();
  }, [cargarImagenes]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe pesar 5MB o menos');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      await uploadImagen(selectedFile, token, categoria);
      setSelectedFile(null);
      cargarImagenes();
      alert('Imagen subida correctamente');
    } catch (err) {
      console.error('Error al subir imagen:', err);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return;
    
    try {
      await deleteImagen(name, token);
      cargarImagenes();
      alert('Imagen eliminada correctamente');
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
      alert('Error al eliminar la imagen');
    }
  };

  const getCategoriaLabel = (value) => {
    const cat = categorias.find(c => c.value === value);
    return cat ? cat.label : value;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Repositorio de Imágenes</h1>
        <p className="text-gray-600">Gestiona las imágenes de productos, eventos y otros elementos de tu sitio web</p>
      </div>

      {/* Panel de subida */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Subir Nueva Imagen</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Imagen
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-1">
                Archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select 
              value={categoria} 
              onChange={(e) => setCategoria(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              onClick={handleSave}
              disabled={!selectedFile || uploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {uploading ? 'Subiendo...' : 'Subir Imagen'}
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>• Formatos soportados: JPG, PNG, GIF, WebP</p>
          <p>• Tamaño máximo: 5MB</p>
          <p>• Se recomienda usar imágenes optimizadas para mejor rendimiento</p>
        </div>
      </div>

      {/* Galería de imágenes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Imágenes Almacenadas</h2>
        
        {imagenes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay imágenes almacenadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {imagenes.map((img) => (
              <div key={img.name} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                
                {/* Información de la imagen */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 truncate" title={img.name}>
                    {img.name}
                  </p>
                  {img.categoria && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                      {getCategoriaLabel(img.categoria)}
                    </span>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-xs"
                    onClick={() => handleDelete(img.name)}
                    title="Eliminar imagen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Botón de copiar URL */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="bg-gray-800 hover:bg-gray-900 text-white p-1 rounded-full text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(img.url);
                      alert('URL copiada al portapapeles');
                    }}
                    title="Copiar URL"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Galeria;
