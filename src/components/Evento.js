import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../utils/apiBase';
import resolveImageUrl from '../utils/resolveImageUrl';

const Evento = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [eventoData, setEventoData] = useState({
    imagenes: { espectaculo: [] }
  });
  const [files, setFiles] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    // Clean and verify token
    const cleanToken = token?.replace('Bearer ', '');
    if (!cleanToken) {
      console.log('No token available, redirecting to login...');
      navigate('/login');
      return;
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean token before sending
      const cleanToken = token?.replace('Bearer ', '');
      if (!cleanToken) {
        console.error('No authentication token available');
        return;
      }

      // const result = await saveEvento(eventoData, `Bearer ${cleanToken}`, files);
      console.log('Evento data:', eventoData);
      // ... rest of your submit handler
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, espectaculo: file });
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // In your JSX:
  return (
    <div>
      {/* ... other form fields ... */}
      <div className="form-group">
        <label>Imagen del Evento</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imagePreview && (
          <img 
            src={imagePreview} 
            alt="Preview" 
            style={{ maxWidth: '200px', marginTop: '10px' }}
          />
        )}
        {Array.isArray(eventoData.imagenes?.espectaculo) &&
          eventoData.imagenes.espectaculo.length > 0 &&
          !imagePreview && (
            <img
              src={resolveImageUrl(eventoData.imagenes.espectaculo[0])}
              alt="Evento"
              style={{ maxWidth: '200px', marginTop: '10px' }}
            />
          )}
      </div>
      {/* ... other form fields ... */}
    </div>
  );
};