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
    if (img && img.publicUrl) {
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

  


  const handleSummaryChange = (e) => {
    setEventoData(prev => ({ ...prev, resumenDescripcion: e.target.value }));
  };

  const handleVideoUrlChange = (e) => {
    setEventoData(prev => ({ ...prev, videoURL: e.target.value }));
  };

  return (
    <div className="diseno-container space-y-6">
      <section className="description-section space-y-2">
        <h4 className="font-semibold">Descripción</h4>
        <textarea
          value={eventoData.descripcion || ''}
          onChange={(e) => {
            setEventoData(prev => ({ ...prev, descripcion: e.target.value }));
          }}
          className="w-full p-3 border border-gray-300 rounded-md"
          rows={6}
          placeholder="Escribe la descripción del evento aquí..."
        />
      </section>

      <section className="summary-section">
        <h4>Resumir descripción/es</h4>
        <textarea
          value={eventoData.resumenDescripcion || ''}
          onChange={handleSummaryChange}
          placeholder="Escriba un resumen aquí"
          rows={4}
          className="summary-textarea"
        />
      </section>

      <section className="content-section space-y-4">
        <h4 className="font-semibold">Contenidos</h4>

        <div className="image-upload-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {console.log('🖼️ [DisenoEspectaculo] Renderizando previews:', imagesPreviews)}
          {[
            { type: 'banner', label: 'Banner (2560x1713)' },
            { type: 'obraImagen', label: 'Imagen de obra (1200x1800)' },
            { type: 'portada', label: 'Portada (2400x1256)' },
            { type: 'logoHorizontal', label: 'Logo horizontal (640x200)' },
            { type: 'logoVertical', label: 'Logo vertical (400x600)' },
            { type: 'bannerPublicidad', label: 'Banner publicidad (500x700)' },
            { type: 'logoCuadrado', label: 'Logo cuadrado (600x600)' },
            { type: 'logoPassbook', label: 'Logo passbook (450x150)' },
            { type: 'passbookBanner', label: 'Passbook banner (753x200)' },
            { type: 'icono', label: 'Icono (360x360)' }
          ].map(({ type, label }) => (
            <div key={type} className="image-upload-item flex flex-col gap-2 items-start">
              <h5 className="font-medium">{label}</h5>
              <div className="image-preview border border-gray-300 flex items-center justify-center" style={{
                width: type === 'logoVertical' || type === 'bannerPublicidad' ? '200px' : '320px',
                height: type === 'logoVertical' || type === 'bannerPublicidad' ? '300px' :
                       type === 'portada' ? '167px' :
                       type === 'logoHorizontal' || type === 'logoPassbook' || type === 'passbookBanner' ? '100px' : '214px'
              }}>
                {imagesPreviews[type] ? (
                  <img
                    src={imagesPreviews[type]}
                    alt={`Preview ${type}`}
                    onLoad={() => console.log(`✅ [DisenoEspectaculo] Imagen ${type} cargada:`, imagesPreviews[type])}
                    onError={() => console.error(`❌ [DisenoEspectaculo] Error cargando imagen ${type}:`, imagesPreviews[type])}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div className="placeholder text-sm text-gray-500">Esperando imagen</div>
                )}
              </div>
              <div className="upload-buttons flex items-center gap-2 mt-1">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleImageChange(e, type)}
                  disabled={uploading}
                  className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded disabled:opacity-50"
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    Subiendo...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="image-upload-item flex flex-col gap-2 mt-4">
          <div className="gallery-preview grid grid-cols-2 md:grid-cols-3 gap-2">
            {imagesPreviews.espectaculo.map((img, index) => (
              <div key={index} className="thumbnail-container relative">
                <img src={img} alt={`Espectáculo ${index}`} className="thumbnail w-full h-32 object-cover" />
                <button
                  className="delete-btn absolute top-1 right-1 bg-white rounded-full px-1 text-xs"
                  onClick={() => deleteEspectaculoImage(index)}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => handleImageChange(e, 'espectaculo')}
              disabled={uploading}
              className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded disabled:opacity-50"
            />
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Subiendo...
              </div>
            )}
          </div>
        </div>

        <div className="video-section flex flex-col gap-2 mt-4">
          <h5 className="font-medium">URL Video</h5>
          <input
            type="text"
            value={eventoData.videoURL || ''}
            onChange={handleVideoUrlChange}
            placeholder="URL del video (YouTube, Vimeo, etc)"
            className="video-input p-2 border border-gray-300 rounded"
          />
        </div>
      </section>
    </div>
  );
};

export default DisenoEspectaculo;
