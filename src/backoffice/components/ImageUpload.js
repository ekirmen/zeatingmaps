// src/components/ImageUpload.js
import React, { useState } from 'react';
import API_BASE_URL from '../../utils/apiBase';

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {

    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      setUploadedImage(`${API_BASE_URL}${data.path}`);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div>
      <h2>Subir Imagen</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Subir</button>
      </form>
      {uploadedImage && (
        <div>
          <h3>Imagen subida:</h3>
          <img src={uploadedImage} alt="Subida" style={{ maxWidth: '300px' }} />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
