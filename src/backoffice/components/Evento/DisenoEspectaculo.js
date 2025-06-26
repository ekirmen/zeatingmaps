import React, { useState } from 'react';
import API_BASE_URL from '../../../utils/apiBase';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const DisenoEspectaculo = ({ eventoData, setEventoData }) => {
  const [description, setDescription] = useState(eventoData.descripcionHTML || '');
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  // Update the image preview handling
  // Fix initial state image paths
  const getPreview = (img) => {
    if (typeof img === 'string') {
      // If it's already an absolute URL, return it unchanged
      if (/^https?:\/\//i.test(img)) {
        return img;
      }
      // Otherwise prefix with the API base URL
      return `${API_BASE_URL}${img}`;
    }
    if (img instanceof File) {
      return URL.createObjectURL(img);
    }
    return null;
  };

  const [imagesPreviews, setImagesPreviews] = useState({
    banner: getPreview(eventoData.imagenes?.banner),
    obraImagen: getPreview(eventoData.imagenes?.obraImagen),
    portada: getPreview(eventoData.imagenes?.portada),
    espectaculo: Array.isArray(eventoData.imagenes?.espectaculo)
      ? eventoData.imagenes.espectaculo.map(img => getPreview(img)).filter(Boolean)
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

  const handleImageChange = (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten imágenes JPG o PNG');
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      alert('La imagen debe pesar menos de 1MB');
      return;
    }

    const dimensions = {
      banner: { width: 2560, height: 1713 },
      obraImagen: { width: 1200, height: 1800 },
      portada: { width: 2400, height: 1256 }
    };

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const reqDim = dimensions[imageType];
      if (reqDim && (img.width !== reqDim.width || img.height !== reqDim.height)) {
        alert(`La imagen debe medir ${reqDim.width}x${reqDim.height}px`);
        URL.revokeObjectURL(previewUrl);
        return;
      }

      if (imageType === 'espectaculo') {
        setImagesPreviews(prev => ({
          ...prev,
          espectaculo: [...prev.espectaculo, previewUrl]
        }));
      } else {
        setImagesPreviews(prev => ({
          ...prev,
          [imageType]: previewUrl
        }));
      }

      setEventoData(prev => ({
        ...prev,
        imagenes: {
          ...prev.imagenes,
          [imageType]: imageType === 'espectaculo'
            ? [...(prev.imagenes?.espectaculo || []), file]
            : file
        }
      }));
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      alert('No se pudo leer la imagen');
    };
    img.src = previewUrl;
  };

  const deleteEspectaculoImage = async (index) => {
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

    // Si la imagen tiene un ID o URL identificable en el backend, envía un DELETE
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/events/delete-image/${eventoData._id}?index=${index}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error eliminando imagen');
      console.log('Imagen eliminada');
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
    }
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
          <button
            className="html-toggle"
            onClick={() => setShowHtmlEditor(!showHtmlEditor)}
          >
            Ver HTML
          </button>
          {showHtmlEditor && (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="html-editor"
              rows={10}
            />
          )}
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
                  accept=".jpg,.jpeg"
                  onChange={(e) => handleImageChange(e, type)}
                  className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
                />
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
          <input
            type="file"
            accept=".jpg,.jpeg"
            onChange={(e) => handleImageChange(e, 'espectaculo')}
            className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
          />
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
