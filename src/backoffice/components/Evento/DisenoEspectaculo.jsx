import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../utils/apiBase';
import { supabase } from '../../../supabaseClient';
import { useTenant } from '../../../contexts/TenantContext';
import resolveImageUrl, { resolveEventImageWithTenant } from '../../../utils/resolveImageUrl';

const DisenoEspectaculo = ({ eventoData, setEventoData }) => {
  const { currentTenant } = useTenant();
  const [uploading, setUploading] = useState(false);

  // Update the image preview handling for new bucket structure
  const getPreview = (img, imageType) => {
    // Si es un objeto con publicUrl (de Supabase)
    if (img && typeof img === 'object' && img.publicUrl) {
      return img.publicUrl;
    }

    // Si es un objeto con url (de Supabase)
    if (img && typeof img === 'object' && img.url) {
      // Si ya es una URL completa, devolverla
      if (/^https?:\/\//i.test(img.url)) {
        return img.url;
      }
      // Si es una ruta relativa, construir URL completa
      const bucketName = img.bucket || `tenant-${currentTenant?.id}`;
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${img.url}`;
    }

    // Si es un string
    if (typeof img === 'string') {
      // If it's already an absolute URL, return it unchanged
      if (/^https?:\/\//i.test(img)) {
        return img;
      }
      // Try to resolve using new tenant structure
      if (currentTenant?.id && eventoData?.id) {
        const resolvedUrl = resolveEventImageWithTenant(eventoData, imageType, currentTenant.id);
        if (resolvedUrl) return resolvedUrl;
      }
      // Fallback to old API base URL
      return `${API_BASE_URL}${img}`;
    }

    if (img instanceof File) {
      return URL.createObjectURL(img);
    }

    return null;
  };

  const [imagesPreviews, setImagesPreviews] = useState({
    banner: getPreview(eventoData.imagenes?.banner, 'banner'),
    obraImagen: getPreview(eventoData.imagenes?.obraImagen, 'obraImagen'),
    portada: getPreview(eventoData.imagenes?.portada, 'portada'),
    logoHorizontal: getPreview(eventoData.imagenes?.logoHorizontal, 'logoHorizontal'),
    logoVertical: getPreview(eventoData.imagenes?.logoVertical, 'logoVertical'),
    bannerPublicidad: getPreview(eventoData.imagenes?.bannerPublicidad, 'bannerPublicidad'),
    logoCuadrado: getPreview(eventoData.imagenes?.logoCuadrado, 'logoCuadrado'),
    logoPassbook: getPreview(eventoData.imagenes?.logoPassbook, 'logoPassbook'),
    passbookBanner: getPreview(eventoData.imagenes?.passbookBanner, 'passbookBanner'),
    icono: getPreview(eventoData.imagenes?.icono, 'icono'),
    espectaculo: Array.isArray(eventoData.imagenes?.espectaculo)
      ? eventoData.imagenes.espectaculo.map(img => getPreview(img, 'espectaculo')).filter(Boolean)
      : []
  });

  // Sincronizar previews cuando cambien los datos del evento
  useEffect(() => {
    if (eventoData?.imagenes) {
      setImagesPreviews({
        banner: getPreview(eventoData.imagenes?.banner, 'banner'),
        obraImagen: getPreview(eventoData.imagenes?.obraImagen, 'obraImagen'),
        portada: getPreview(eventoData.imagenes?.portada, 'portada'),
        logoHorizontal: getPreview(eventoData.imagenes?.logoHorizontal, 'logoHorizontal'),
        logoVertical: getPreview(eventoData.imagenes?.logoVertical, 'logoVertical'),
        bannerPublicidad: getPreview(eventoData.imagenes?.bannerPublicidad, 'bannerPublicidad'),
        logoCuadrado: getPreview(eventoData.imagenes?.logoCuadrado, 'logoCuadrado'),
        logoPassbook: getPreview(eventoData.imagenes?.logoPassbook, 'logoPassbook'),
        passbookBanner: getPreview(eventoData.imagenes?.passbookBanner, 'passbookBanner'),
        icono: getPreview(eventoData.imagenes?.icono, 'icono'),
        espectaculo: Array.isArray(eventoData.imagenes?.espectaculo)
          ? eventoData.imagenes.espectaculo.map(img => getPreview(img, 'espectaculo')).filter(Boolean)
          : []
      });
    }
  }, [eventoData?.imagenes, currentTenant?.id, eventoData?.id]);

  // Store uploaded images when saving instead of immediately

  // Nueva función para subir imagen a Supabase Storage
  const uploadImageToSupabase = async (file, imageType) => {
    if (!currentTenant?.id) {
      throw new Error('No tenant ID available');
    }

    const bucketName = `tenant-${currentTenant.id}`;
    const eventId = eventoData?.id || 'temp';
    const fileName = `${imageType}_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `${eventId}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      return {
        url: filePath,
        publicUrl: publicUrl,
        bucket: bucketName,
        fileName: fileName,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('❌ [DisenoEspectaculo] Error subiendo imagen:', error);
      throw error;
    }
  };

  const handleImageChange = async (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // Aumentado a 5MB
      alert('La imagen debe pesar menos de 5MB');
      return;
    }

    const dimensions = {
      banner: { width: 2560, height: 1713 },
      obraImagen: { width: 1200, height: 1800 },
      portada: { width: 2400, height: 1256 }
    };

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      const reqDim = dimensions[imageType];
      if (reqDim && (img.width !== reqDim.width || img.height !== reqDim.height)) {
        alert(`La imagen debe medir ${reqDim.width}x${reqDim.height}px`);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      try {
        setUploading(true);

        // Subir imagen a Supabase Storage
        const imageData = await uploadImageToSupabase(file, imageType);

        // Actualizar preview con URL pública
        if (imageType === 'espectaculo') {
          setImagesPreviews(prev => ({
            ...prev,
            espectaculo: [...prev.espectaculo, imageData.publicUrl]
          }));
        } else {
          setImagesPreviews(prev => ({
            ...prev,
            [imageType]: imageData.publicUrl
          }));
        }

        // Actualizar datos del evento con metadatos de la imagen
        setEventoData(prev => {
          const newData = {
            ...prev,
            imagenes: {
              ...prev.imagenes,
              [imageType]: imageType === 'espectaculo'
                ? [...(prev.imagenes?.espectaculo || []), imageData]
                : imageData
            }
          };
          return newData;
        });
      } catch (error) {
        console.error('❌ [DisenoEspectaculo] Error procesando imagen:', error);
        alert(`Error al subir la imagen: ${error.message}`);
        URL.revokeObjectURL(previewUrl);
      } finally {
        setUploading(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      alert('No se pudo leer la imagen');
      setUploading(false);
    };

    img.src = previewUrl;
  };

  const deleteEspectaculoImage = async (index) => {
    const imageToDelete = eventoData.imagenes?.espectaculo?.[index];

    // Eliminar de Supabase Storage si tiene datos de bucket
    if (imageToDelete?.bucket && imageToDelete?.url) {
      try {
        const { error } = await supabase.storage
          .from(imageToDelete.bucket)
          .remove([imageToDelete.url]);

        if (error) throw error;
      } catch (error) {
        console.error('❌ [DisenoEspectaculo] Error eliminando imagen de Supabase:', error);
        // Continuar con la eliminación local aunque falle en Supabase
      }
    }

    // Actualizar estado local
    const updatedPreviews = imagesPreviews.espectaculo.filter((_, i) => i !== index);
    const updatedData = eventoData.imagenes?.espectaculo?.filter((_, i) => i !== index);

    setImagesPreviews(prev => ({
      ...prev,
      espectaculo: updatedPreviews
    }));

    setEventoData(prev => ({
      ...prev,
      imagenes: {
        ...prev.imagenes,
        espectaculo: updatedData
      }
    }));
  };

  const handleDescriptionChange = (value) => {
    setEventoData(prev => ({ ...prev, descripcionHTML: value }));
  };

  const handleSummaryChange = (e) => {
    setEventoData(prev => ({ ...prev, resumenDescripcion: e.target.value }));
  };

  const handleVideoUrlChange = (e) => {
    setEventoData(prev => ({ ...prev, videoURL: e.target.value }));
  };

  return (
    <div className="diseno-container space-y-8 max-w-7xl mx-auto">
      {/* Descripción */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-blue-600">📝</span> Descripción del Evento
        </h3>
        <textarea
          value={eventoData.descripcion || ''}
          onChange={(e) => {
            setEventoData(prev => ({ ...prev, descripcion: e.target.value }));
          }}
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          rows={6}
          placeholder="Escribe la descripción del evento aquí..."
        />
      </section>

      {/* Resumen */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-blue-600">📋</span> Resumen de Descripción
        </h3>
        <textarea
          value={eventoData.resumenDescripcion || ''}
          onChange={handleSummaryChange}
          placeholder="Escribe un resumen breve aquí"
          rows={4}
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </section>

      {/* Imágenes Principales */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-blue-600">🖼️</span> Imágenes Principales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { type: 'banner', label: 'Banner', dimensions: '2560x1713', width: '100%', height: '200px' },
            { type: 'obraImagen', label: 'Imagen de Obra', dimensions: '1200x1800', width: '100%', height: '280px' },
            { type: 'portada', label: 'Portada', dimensions: '2400x1256', width: '100%', height: '200px' }
          ].map(({ type, label, dimensions, width, height }) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">{label}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{dimensions}</span>
              </div>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
                style={{ width, height }}
              >
                {imagesPreviews[type] ? (
                  <img
                    src={imagesPreviews[type]}
                    alt={`Preview ${type}`}
                    className="w-full h-full object-contain"
                    onLoad={() => console.log(`✅ [DisenoEspectaculo] Imagen ${type} cargada:`, imagesPreviews[type])}
                    onError={() => console.error(`❌ [DisenoEspectaculo] Error cargando imagen ${type}:`, imagesPreviews[type])}
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-gray-400 text-4xl mb-2">📷</div>
                    <p className="text-sm text-gray-500">Sin imagen</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => handleImageChange(e, type)}
                disabled={uploading}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Logos */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-blue-600">🎯</span> Logos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { type: 'logoHorizontal', label: 'Logo Horizontal', dimensions: '640x200', height: '120px' },
            { type: 'logoVertical', label: 'Logo Vertical', dimensions: '400x600', height: '180px' },
            { type: 'logoCuadrado', label: 'Logo Cuadrado', dimensions: '600x600', height: '150px' },
            { type: 'icono', label: 'Icono', dimensions: '360x360', height: '150px' }
          ].map(({ type, label, dimensions, height }) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-700">{label}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{dimensions}</span>
              </div>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
                style={{ width: '100%', height }}
              >
                {imagesPreviews[type] ? (
                  <img
                    src={imagesPreviews[type]}
                    alt={`Preview ${type}`}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-gray-400 text-3xl mb-1">🏷️</div>
                    <p className="text-xs text-gray-500">Sin logo</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => handleImageChange(e, type)}
                disabled={uploading}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Imágenes Especiales */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-blue-600">✨</span> Imágenes Especiales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { type: 'bannerPublicidad', label: 'Banner Publicidad', dimensions: '500x700', height: '200px' },
            { type: 'logoPassbook', label: 'Logo Passbook', dimensions: '450x150', height: '120px' },
            { type: 'passbookBanner', label: 'Passbook Banner', dimensions: '753x200', height: '120px' }
          ].map(({ type, label, dimensions, height }) => (
            <div key={type} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">{label}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{dimensions}</span>
              </div>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
                style={{ width: '100%', height }}
              >
                {imagesPreviews[type] ? (
                  <img
                    src={imagesPreviews[type]}
                    alt={`Preview ${type}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-gray-400 text-3xl mb-1">🎫</div>
                    <p className="text-xs text-gray-500">Sin imagen</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => handleImageChange(e, type)}
                disabled={uploading}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Galería del Espectáculo */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-blue-600">🎭</span> Galería del Espectáculo
        </h3>

        {imagesPreviews.espectaculo.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {imagesPreviews.espectaculo.map((img, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={img}
                    alt={`Espectáculo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteEspectaculoImage(index)}
                  title="Eliminar imagen"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex-1">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => handleImageChange(e, 'espectaculo')}
              disabled={uploading}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
            />
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Subiendo...
            </div>
          )}
        </div>
      </section>

      {/* Video URL */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-blue-600">🎥</span> Video del Evento
        </h3>
        <input
          type="text"
          value={eventoData.videoURL || ''}
          onChange={handleVideoUrlChange}
          placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        <p className="mt-2 text-sm text-gray-500">Ingresa la URL de YouTube, Vimeo u otra plataforma de video</p>
      </section>
    </div>
  );
};

export default DisenoEspectaculo;
