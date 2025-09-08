import React, { useState } from 'react';
import API_BASE_URL from '../../../utils/apiBase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '../../../supabaseClient';
import { useTenant } from '../../../contexts/TenantContext';
import resolveImageUrl, { resolveEventImageWithTenant } from '../../../utils/resolveImageUrl';

const DisenoEspectaculo = ({ eventoData, setEventoData }) => {
  const [description, setDescription] = useState(eventoData.descripcionHTML || '');
  const { currentTenant } = useTenant();
  const [uploading, setUploading] = useState(false);
  
  // Update the image preview handling for new bucket structure
  const getPreview = (img, imageType) => {
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
    espectaculo: Array.isArray(eventoData.imagenes?.espectaculo)
      ? eventoData.imagenes.espectaculo.map(img => getPreview(img, 'espectaculo')).filter(Boolean)
      : []
  });
  
  // Store uploaded images when saving instead of immediately
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean'],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        ['blockquote', 'code-block'],
      ],
      handlers: {
        image: imageHandler
      }
    }
  };

  function imageHandler() {
    const quill = this.quill;
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('file', file); // Changed from 'image' to 'file'
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      try {
        const token = localStorage.getItem('token');
        console.log('Token for upload:', token);

        if (!token) {
          throw new Error('No se encontró el token de autenticación');
        }

        const response = await fetch(`${API_BASE_URL}/api/events/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al subir la imagen');
        }

        const result = await response.json();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', result.url);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error al subir la imagen: ' + error.message);
      }
    };
  }

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
      console.log('🚀 [DisenoEspectaculo] Subiendo imagen:', {
        bucketName,
        filePath,
        fileName,
        imageType,
        fileSize: file.size
      });

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

      console.log('✅ [DisenoEspectaculo] Imagen subida exitosamente:', publicUrl);

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
        setEventoData(prev => ({
          ...prev,
          imagenes: {
            ...prev.imagenes,
            [imageType]: imageType === 'espectaculo'
              ? [...(prev.imagenes?.espectaculo || []), imageData]
              : imageData
          }
        }));

        console.log('✅ [DisenoEspectaculo] Imagen procesada exitosamente');
        
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
        console.log('🗑️ [DisenoEspectaculo] Eliminando imagen de Supabase:', imageToDelete.url);
        
        const { error } = await supabase.storage
          .from(imageToDelete.bucket)
          .remove([imageToDelete.url]);

        if (error) throw error;
        
        console.log('✅ [DisenoEspectaculo] Imagen eliminada de Supabase Storage');
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

    console.log('✅ [DisenoEspectaculo] Imagen eliminada del estado local');
  };

  const handleDescriptionChange = (value) => {
    setDescription(value);
    setEventoData(prev => ({ ...prev, descripcionHTML: value }));
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
        <h4 className="font-semibold">Descripción HTML</h4>
        <div className="editor-container">
          <ReactQuill
            value={description}
            onChange={handleDescriptionChange}
            modules={modules}
            placeholder="Escribe aquí"
            preserveWhitespace
            theme="snow"
          />
          
          {/* Mostrar HTML debajo del editor Quill */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código HTML generado:
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setEventoData(prev => ({ ...prev, descripcionHTML: e.target.value }));
              }}
              className="html-editor w-full p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
              rows={8}
              placeholder="El HTML se genera automáticamente mientras escribes..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Este es el código HTML generado automáticamente. Puedes editarlo directamente aquí si necesitas hacer ajustes manuales.
            </p>
          </div>
        </div>
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
          {['banner', 'obraImagen', 'portada'].map((type) => (
            <div key={type} className="image-upload-item flex flex-col gap-2 items-start">
              <h5 className="font-medium">
                {type === 'banner' ? 'Banner (2560x1713)' :
                    type === 'obraImagen' ? 'Imagen de obra (1200x1800)' :
                    'Portada (2400x1256)'}
              </h5>
              <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: type === 'obraImagen' ? '200px' : '320px', height: type === 'obraImagen' ? '300px' : (type === 'portada' ? '167px' : '214px') }}>
                {imagesPreviews[type] ? (
                  <img src={imagesPreviews[type]} alt={`Preview ${type}`} />
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
          <h5 className="font-medium">Imágenes del espectáculo</h5>
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
