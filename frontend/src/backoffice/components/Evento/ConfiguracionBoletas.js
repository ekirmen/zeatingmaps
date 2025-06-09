import React, { useState } from 'react';

const ConfiguracionBoletas = ({ eventoData, setEventoData }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [pdfOption, setPdfOption] = useState('single');
  
  // Update initial state with existing images
  const [imagesPreviews, setImagesPreviews] = useState({
    logoHorizontal: eventoData.imagenes?.logoHorizontal ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.logoHorizontal.split('/').pop()}` : null,
    banner: eventoData.imagenes?.banner ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.banner.split('/').pop()}` : null,
    logoVertical: eventoData.imagenes?.logoVertical ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.logoVertical.split('/').pop()}` : null,
    bannerPublicidad: eventoData.imagenes?.bannerPublicidad ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.bannerPublicidad.split('/').pop()}` : null,
    logoCuadrado: eventoData.imagenes?.logoCuadrado ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.logoCuadrado.split('/').pop()}` : null,
    logoPassbook: eventoData.imagenes?.logoPassbook ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.logoPassbook.split('/').pop()}` : null,
    passBookBanner: eventoData.imagenes?.passBookBanner ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.passBookBanner.split('/').pop()}` : null,
    icono: eventoData.imagenes?.icono ? `http://localhost:5000/public/uploads/eventos/espectaculo/${eventoData.imagenes.icono.split('/').pop()}` : null
  });

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
        const filename = result.url.split('/').pop();
        const fullUrl = `http://localhost:5000/public/uploads/eventos/tickets/${filename}`;
        
        setImagesPreviews(prev => ({
          ...prev,
          [imageType]: fullUrl
        }));

        setEventoData(prev => ({
          ...prev,
          imagenes: {
            ...prev.imagenes,
            [imageType]: filename
          }
        }));
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      console.error('Error details:', error.stack);
      alert(`Error al subir la imagen: ${error.message}`);
    }
  };

  const handleImageChange = async (e, imageType) => {
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
    setImagesPreviews(prev => ({
      ...prev,
      [imageType]: tempPreviewUrl
    }));

    // Upload image
    await uploadImage(formData, imageType);
  };

  // Remove or comment out the handleSave function since we don't need it
  // const handleSave = async () => {
  //   for (const [type, file] of Object.entries(tempFiles)) {
  //     if (file) {
  //       const formData = new FormData();
  //       formData.append('file', file);
  //       formData.append('type', type);
  //       await uploadImage(formData, type);
  //     }
  //   }
  //   // Clear temporary files after upload
  //   setTempFiles({
  //     logoHorizontal: null,
  //     banner: null,
  //     logoVertical: null,
  //     bannerPublicidad: null,
  //     logoCuadrado: null,
  //     logoPassbook: null,
  //     passBookBanner: null,
  //     icono: null
  //   });
  // };

  // Add save button at the end of the images-upload section
  return (
    <div className="tab-codntent">
      
      <section className="ticket-formats">
        <h4>Formatos de boleta</h4>
        
        <div className="format-option">
          <label>
            <input
              type="checkbox"
              checked={selectedFormat === 'pdf'}
              onChange={() => setSelectedFormat('pdf')}
            />
            Permitir boletas en formato PDF
          </label>
          
          {selectedFormat === 'pdf' && (
            <div className="sub-options">
              <label>
                <input
                  type="radio"
                  name="pdfOption"
                  value="all"
                  checked={pdfOption === 'all'}
                  onChange={(e) => setPdfOption(e.target.value)}
                />
                Todas las entradas en el mismo PDF
              </label>
              <label>
                <input
                  type="radio"
                  name="pdfOption"
                  value="single"
                  checked={pdfOption === 'single'}
                  onChange={(e) => setPdfOption(e.target.value)}
                />
                Un PDF por entrada
              </label>
            </div>
          )}
        </div>

        <div className="format-option">
          <label>
            <input type="checkbox" />
            Permitir boletas en Passbook o Wallet (e-tickets)
          </label>
        </div>

        <div className="format-option">
          <label>
            <input type="checkbox" />
            Permitir impresión en taquilla
          </label>
        </div>
      </section>

      <section className="print-formats">
        <h4>Configuración de formatos de impresión</h4>
        {/* Add print format configurations */}
      </section>

      <section className="images-upload">
        <h4>Imágenes de los formatos de impresión</h4>
        <p>Las imágenes para los formatos de ticket deben ir en formato PNG y pueden tener el fondo transparente.</p>
        
        <div className="image-upload-grid">
          <div className="image-upload-item">
            <h5>Logo horizontal (640x200)</h5>
            <div className="image-preview" style={{ width: '320px', height: '100px' }}>
              {imagesPreviews.logoHorizontal ? (
                <img src={imagesPreviews.logoHorizontal} alt="Preview" />
              ) : (
                <div className="placeholder">640x200</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'logoHorizontal')}
                id="logoHorizontal"
              />
              <button className="modify-button">Modificar</button>
            </div>
          </div>

          <div className="image-upload-item">
            <h5>Banner (750x196)</h5>
            <div className="image-preview" style={{ width: '320px', height: '84px' }}>
              {imagesPreviews.banner ? (
                <img src={imagesPreviews.banner} alt="Preview" />
              ) : (
                <div className="placeholder">750x196</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'banner')}
                id="banner"
              />
              <button className="modify-button">Modificar</button>
            </div>
          </div>

          <div className="image-upload-item">
            <h5>Logo vertical (400x600)</h5>
            <div className="image-preview" style={{ width: '200px', height: '300px' }}>
              {imagesPreviews.logoVertical ? (
                <img src={imagesPreviews.logoVertical} alt="Preview" />
              ) : (
                <div className="placeholder">400x600</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'logoVertical')}
                id="logoVertical"
              />
              <button className="modify-button">Modificar</button>
            </div>
          </div>

          <div className="image-upload-item">
            <h5>Banner publicidad (500x700)</h5>
            <div className="image-preview" style={{ width: '214px', height: '300px' }}>
              {imagesPreviews.bannerPublicidad ? (
                <img src={imagesPreviews.bannerPublicidad} alt="Preview" />
              ) : (
                <div className="placeholder">500x700</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'bannerPublicidad')}
                id="bannerPublicidad"
              />
              <button className="modify-button">Modificar</button>
            </div>
          </div>

          <div className="image-upload-item">
            <h5>Logo cuadrado (600x600)</h5>
            <div className="image-preview" style={{ width: '200px', height: '200px' }}>
              {imagesPreviews.logoCuadrado ? (
                <img src={imagesPreviews.logoCuadrado} alt="Preview" />
              ) : (
                <div className="placeholder">600x600</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'logoCuadrado')}
                id="logoCuadrado"
              />
              <button className="modify-button">Modificar</button>
            </div>
          </div>

          <div className="image-upload-item">
            <h5>Logo passbook (450x150)</h5>
            <div className="image-preview" style={{ width: '300px', height: '100px' }}>
              {imagesPreviews.logoPassbook ? (
                <img src={imagesPreviews.logoPassbook} alt="Preview" />
              ) : (
                <div className="placeholder">450x150</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'logoPassbook')}
                id="logoPassbook"
              />
              <button className="modify-button">Modificar</button>
            </div>
          </div>

          <div className="image-upload-item">
            <h5>Passbook banner (753x200)</h5>
            <div className="image-preview" style={{ width: '320px', height: '85px' }}>
              {imagesPreviews.passBookBanner ? (
                <img src={imagesPreviews.passBookBanner} alt="Preview" />
              ) : (
                <div className="placeholder">753x200</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'passBookBanner')}
                id="passBookBanner"
              />
              <button className="modify-button">Modificar</button>
            </div>
          </div>

          <div className="image-upload-item">
            <h5>Icono (360x360)</h5>
            <div className="image-preview" style={{ width: '200px', height: '200px' }}>
              {imagesPreviews.icono ? (
                <img src={imagesPreviews.icono} alt="Preview" />
              ) : (
                <div className="placeholder">360x360</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'icono')}
                id="icono"
              />
              <button className="modify-button">Modificar</button>
            </div>
          </div>
        </div>
      </section>

      <section className="legal-terms">
        <h4>Términos legales</h4>
        <div className="terms-container">
          <label>Términos legales 1</label>
          <textarea 
            className="terms-textarea"
            placeholder="Ingrese los términos legales aquí"
            rows={6}
          />
        </div>
      </section>
    </div>
  );
};

export default ConfiguracionBoletas;
