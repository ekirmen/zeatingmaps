import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './DisenoEspectaculo.css';

const DisenoEspectaculo = ({ eventoData, setEventoData }) => {
  const [description, setDescription] = useState(eventoData.descripcionHTML || '');
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  // Update the image preview handling
  // Fix initial state image paths
  const [imagesPreviews, setImagesPreviews] = useState({
    banner: eventoData.imagenes?.banner ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.banner.split('/').pop()}` : null,
    obraImagen: eventoData.imagenes?.obraImagen ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.obraImagen.split('/').pop()}` : null,
    portada: eventoData.imagenes?.portada ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.portada.split('/').pop()}` : null,
    espectaculo: eventoData.imagenes?.espectaculo?.map(url => `http://localhost:5000/public/uploads/eventos/espectaculo/${url.split('/').pop()}`) || []
  });
  
  // Fix upload function URL handling
  const uploadImage = async (formData, imageType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/events/upload/${eventoData._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error details:', errorData);
        throw new Error(errorData.message || `Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      console.log('Upload success:', result);
      
      if (result.url) {
        // Get just the filename from the result URL
        const filename = result.url.split('/').pop();
        const fullUrl = `http://localhost:5000/public/uploads/eventos/${imageType}/${filename}`;
        
        setImagesPreviews(prev => ({
          ...prev,
          [imageType]: imageType === 'espectaculo' 
            ? [...prev.espectaculo, fullUrl]
            : fullUrl
        }));

        setEventoData(prev => ({
          ...prev,
          imagenes: {
            ...prev.imagenes,
            [imageType]: imageType === 'espectaculo' 
              ? [...(prev.imagenes?.espectaculo || []), filename]
              : filename
          }
        }));
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      console.error('Error details:', error.stack);
      alert(`Error al subir la imagen: ${error.message}`);
    }
  };
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

        const response = await fetch('http://localhost:5000/api/events/upload', {
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

  const handleImageChange = async (e, imageType) => {  // Add async keyword
      const file = e.target.files[0];
      if (!file) return;
  
      if (file.size > 5 * 1024 * 1024) {
        alert("Archivo demasiado grande (máx. 5MB)");
        return;
      }
  
      if (!file.type.startsWith('image/')) {
        alert("Solo se permiten imágenes");
        return;
      }
  
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', imageType);
  
      // Create temporary preview URL
      const tempPreviewUrl = URL.createObjectURL(file);
      
      // Update preview immediately
      if (imageType === 'espectaculo') {
        setImagesPreviews(prev => ({
          ...prev,
          espectaculo: [...prev.espectaculo, tempPreviewUrl]
        }));
      } else {
        setImagesPreviews(prev => ({
          ...prev,
          [imageType]: tempPreviewUrl
        }));
      }
  
      // Upload image and handle preview cleanup
      await uploadImage(formData, imageType);
      // Clean up temporary preview URL when upload is complete
      URL.revokeObjectURL(tempPreviewUrl);
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
      const response = await fetch(`http://localhost:5000/api/events/delete-image/${eventoData._id}?index=${index}`, {
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
    <div className="diseno-container">
      <section className="description-section">
        <h4>Descripción HTML</h4>
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

      <section className="content-section">
        <h4>Contenidos</h4>

        <div className="image-upload-grid">
          {['banner', 'obraImagen', 'portada'].map((type) => (
            <div key={type} className="image-upload-item">
              <h5>{type === 'banner' ? 'Banner (2560x1713)' :
                    type === 'obraImagen' ? 'Imagen de obra (1200x1800)' :
                    'Portada (2400x1256)'}</h5>
              <div className="image-preview" style={{ width: type === 'obraImagen' ? '200px' : '320px', height: type === 'obraImagen' ? '300px' : (type === 'portada' ? '167px' : '214px') }}>
                {imagesPreviews[type] ? (
                  <img src={imagesPreviews[type]} alt={`Preview ${type}`} />
                ) : (
                  <div className="placeholder">Esperando imagen</div>
                )}
              </div>
              <div className="upload-buttons">
                <input
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={(e) => handleImageChange(e, type)}
                />
                <button className="modify-button">Modificar</button>
              </div>
            </div>
          ))}
        </div>

        <div className="image-upload-item">
          <h5>Imágenes del espectáculo</h5>
          <div className="gallery-preview">
            {imagesPreviews.espectaculo.map((img, index) => (
              <div key={index} className="thumbnail-container">
                <img src={img} alt={`Espectáculo ${index}`} className="thumbnail" />
                <button
                  className="delete-btn"
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
          />
        </div>

        <div className="video-section">
          <h5>URL Video</h5>
          <input
            type="text"
            value={eventoData.videoURL || ''}
            onChange={handleVideoUrlChange}
            placeholder="URL del video (YouTube, Vimeo, etc)"
            className="video-input"
          />
        </div>
      </section>
    </div>
  );
};

export default DisenoEspectaculo;
