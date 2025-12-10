import React from 'react';
import DatosBasicos from './DatosBasicos';
import DisenoEspectaculo from './DisenoEspectaculo';
import ConfiguracionVenta from './ConfiguracionVenta';
import ConfiguracionBoletas from './ConfiguracionBoletas';
import API_BASE_URL from '../../../utils/apiBase';
import resolveImageUrl from '../../../utils/resolveImageUrl';
import OpcionesAvanzadas from './OpcionesAvanzadas';
import FacebookPixelConfig from './FacebookPixelConfig';
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

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    setEventoData(prev => ({
      ...prev,
      imagenes: {
        ...prev.imagenes,
        [fieldName]: file
      }
    }));
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
          <button 
            className={activeTab === 'facebook' ? 'active' : ''} 
            onClick={() => setActiveTab('facebook')}
          >
            Píxel Facebook
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
                  onChange={(e) => handleFileChange(e, 'espectaculo')}
                  accept="image/*"
                />

                {Array.isArray(eventoData?.imagenes?.espectaculo) &&
                  eventoData.imagenes.espectaculo.length > 0 && (
                    <img
                      src={
                        eventoData.imagenes.espectaculo[0] instanceof File
                          ? URL.createObjectURL(eventoData.imagenes.espectaculo[0])
                          : resolveImageUrl(eventoData.imagenes.espectaculo[0])
                      }
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
          {activeTab === 'facebook' && (
            <FacebookPixelConfig 
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
