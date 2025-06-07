import React from 'react';
import DatosBasicos from './DatosBasicos';
import DisenoEspectaculo from './DisenoEspectaculo';
import ConfiguracionVenta from './ConfiguracionVenta';
import ConfiguracionBoletas from './ConfiguracionBoletas';
import OpcionesAvanzadas from './OpcionesAvanzadas';
import { useState } from 'react';
import { uploadFile } from '../../../services/eventoService';
import './EditForm.css';

const EditForm = ({
  activeTab,
  setActiveTab,
  eventoData,
  setEventoData,
  setMenuVisible,
  handleSave,
  handleImageChange,
  imagePreview,
  files
}) => {
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setEventoData(prev => ({
        ...prev,
        imagenes: {
          ...prev.imagenes,
          [name]: files[0]
        }
      }));
    } else if (type === 'checkbox') {
      setEventoData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setEventoData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filePath = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      setEventoData(prev => ({
        ...prev,
        imagenes: {
          ...prev.imagenes,
          [fieldName]: filePath
        }
      }));
    } catch (error) {
      alert('Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="menu-overlay">
      <div className="menu-container">
        <div className="tabs">
          <button 
            className={activeTab === 'datosBasicos' ? 'active' : ''} 
            onClick={() => setActiveTab('datosBasicos')}
          >
            Datos Básicos
          </button>
          <button 
            className={activeTab === 'diseno' ? 'active' : ''} 
            onClick={() => setActiveTab('diseno')}
          >
            Diseño del espectáculo
          </button>
          <button 
            className={activeTab === 'venta' ? 'active' : ''} 
            onClick={() => setActiveTab('venta')}
          >
            Configuración de venta
          </button>
          <button 
            className={activeTab === 'boletas' ? 'active' : ''} 
            onClick={() => setActiveTab('boletas')}
          >
            Configuración boletas
          </button>
          <button 
            className={activeTab === 'avanzadas' ? 'active' : ''} 
            onClick={() => setActiveTab('avanzadas')}
          >
            Opciones avanzadas
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'datosBasicos' && (
            <div>
              <DatosBasicos 
                eventoData={eventoData} 
                setEventoData={setEventoData}
                handleChange={handleChange}
              />
              <div className="image-upload-section">
                <label>Imagen Principal</label>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'espectaculo')}
                  accept="image/*"
                  disabled={isUploading}
                />
                
                {isUploading && (
                  <div className="upload-progress">
                    <div 
                      className="progress-bar"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      {uploadProgress}%
                    </div>
                  </div>
                )}
                
                {eventoData?.imagenes?.espectaculo && (
                  <img 
                    src={`http://localhost:5000${eventoData.imagenes.espectaculo}`}
                    alt="Vista previa"
                    className="preview-image"
                  />
                )}
              </div>
            </div>
          )}
          {activeTab === 'diseno' && (
            <DisenoEspectaculo 
              eventoData={eventoData} 
              setEventoData={setEventoData}
              handleChange={handleChange}
            />
          )}
          {activeTab === 'venta' && (
            <ConfiguracionVenta 
              eventoData={eventoData} 
              setEventoData={setEventoData}
              handleChange={handleChange}
            />
          )}
          {activeTab === 'boletas' && (
            <ConfiguracionBoletas 
              eventoData={eventoData} 
              setEventoData={setEventoData}
              handleChange={handleChange}
            />
          )}
          {activeTab === 'avanzadas' && (
            <OpcionesAvanzadas 
              eventoData={eventoData} 
              setEventoData={setEventoData}
              handleChange={handleChange}
            />
          )}
        </div>

        <div className="menu-actions">
          <button onClick={() => setMenuVisible(false)}>Cancelar</button>
          <button onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default EditForm;