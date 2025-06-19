import React, { useState } from 'react';

const FormatoEntrada = () => {
  const [selectedFormat, setSelectedFormat] = useState('printAtHome');
  const [pdfPreview, setPdfPreview] = useState(null);

  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Handle image upload logic here
    console.log(`Uploading ${imageType} image:`, file);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPdfPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // Add save logic here
    console.log('Saving configuration...');
  };

  return (
    <div className="formato-entrada-container">
      <h2>Configuración de formatos de impresión</h2>
      
      <div className="large-12 columns" id="format-list-configurable">
        {/* Print At Home Format */}
        <div className="ticket-format-element format_pah">
          <div className="format-element-cont">
            <div className="element-info">
              <span>Formato Print At Home</span>
              <h4>DIN-A4</h4>
            </div>
            <div className="default-format">
              <div className="default-format-select">
                <label>
                  Se ha seleccionado el diseño de formato
                  <input 
                    type="text" 
                    id="inputDesignPaper-1" 
                    value="Print at home entrada" 
                    disabled 
                  />
                </label>
              </div>
              <div className="default-format-options">
                <button className="btn-option-ball">
                  <i className="palco4icon palco4icon-edit"></i>
                </button>
                <button className="btn-option-ball">
                  <i className="palco4icon palco4icon-eye"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Passbook Format */}
        <div className="ticket-format-element format_passbook">
          <div className="format-element-cont">
            <div className="element-info">
              <span>Formato Passbook</span>
              <h4>Passbook</h4>
            </div>
            <div className="default-format">
              <div className="default-format-select">
                <label>
                  Se ha seleccionado el diseño de formato
                  <input 
                    type="text" 
                    id="inputDesignPaper-3" 
                    value="Sports passbook" 
                    disabled 
                  />
                </label>
              </div>
              <div className="default-format-options">
                <button className="btn-option-ball">
                  <i className="palco4icon palco4icon-edit"></i>
                </button>
                <button className="btn-option-ball">
                  <i className="palco4icon palco4icon-eye"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Box Office Format 1 */}
        <div className="ticket-format-element format_boxoffice">
          <div className="format-element-cont">
            <div className="element-info">
              <span>Formato de taquilla</span>
              <h4>80mm continuos</h4>
            </div>
            <div className="default-format">
              <div className="default-format-select">
                <label>
                  Se ha seleccionado el diseño de formato
                  <input 
                    type="text" 
                    id="inputDesignPaper-2" 
                    value="Continuo 80mm entrada" 
                    disabled 
                  />
                </label>
              </div>
              <div className="default-format-options">
                <button className="btn-option-ball">
                  <i className="palco4icon palco4icon-edit"></i>
                </button>
                <button className="btn-option-ball">
                  <i className="palco4icon palco4icon-eye"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Box Office Format 2 */}
        <div className="ticket-format-element format_boxoffice">
          <div className="format-element-cont">
            <div className="element-info">
              <span>Formato de taquilla</span>
              <h4>139x50</h4>
            </div>
            <div className="default-format">
              <div className="default-format-select">
                <label>
                  Se ha seleccionado el diseño de formato
                  <input 
                    type="text" 
                    id="inputDesignPaper-28" 
                    value="139x50_BMT_IMAGE" 
                    disabled 
                  />
                </label>
              </div>
              <div className="default-format-options">
                <button className="btn-option-ball">
                  <i className="palco4icon palco4icon-edit"></i>
                </button>
                <button className="btn-option-ball">
                  <i className="palco4icon palco4icon-eye"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="save-section">
        <button className="save-button" onClick={handleSave}>
          Guardar Configuración
        </button>
      </div>

      <section className="pdf-upload">
        <h3>Formato de Tickets PDF</h3>
        <div className="pdf-preview">
          {pdfPreview ? (
            <iframe 
              src={pdfPreview} 
              width="100%" 
              height="500px"
              title="PDF Preview"
            />
          ) : (
            <p>No se ha cargado ningún PDF</p>
          )}
        </div>
        <input
          type="file"
          accept=".pdf"
          onChange={handlePdfUpload}
        />
      </section>

      <section className="images-upload">
        <h3>Imágenes de los formatos de impresión</h3>
        <p>Las imágenes para los formatos de ticket deben ir en formato PNG y pueden tener el fondo transparente.</p>
        
        <div className="image-upload-grid">
          {[
            { type: 'logoHorizontal', label: 'Logo horizontal (640x200)' },
            { type: 'banner', label: 'Banner (750x196)' },
            { type: 'logoVertical', label: 'Logo vertical (400x600)' },
            { type: 'bannerPublicidad', label: 'Banner publicidad (500x700)' },
            { type: 'logoCuadrado', label: 'Logo cuadrado (600x600)' }
          ].map((image) => (
            <div key={image.type} className="image-upload-item">
              <h5>{image.label}</h5>
              <div className="image-preview">
                <p>.jpg .png</p>
              </div>
              <div className="upload-buttons">
                <input
                  type="file"
                  accept=".jpg,.png"
                  onChange={(e) => handleImageUpload(e, image.type)}
                />
                <button>Modificar</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="legal-terms">
        <h3>TÉRMINOS Y CONDICIONES</h3>
        <div className="terms-container">
          <div className="term">
            <label>Términos legales 1</label>
            <textarea rows={6} />
          </div>
          <div className="term">
            <label>Términos legales 2</label>
            <textarea rows={6} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default FormatoEntrada;