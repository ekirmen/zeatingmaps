import React, { useState, useEffect } from 'react';

const ConfiguracionBoletas = ({ eventoData, setEventoData }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [pdfOption, setPdfOption] = useState('single');
  
  // Update initial state with existing images
  const getPreview = (img) => {
    if (typeof img === 'string') {
      // Image paths stored in the backend already include the folder
      return `http://localhost:5000${img}`;
    }
    if (img instanceof File) {
      return URL.createObjectURL(img);
    }
    return null;
  };

  const [imagesPreviews, setImagesPreviews] = useState({
    logoHorizontal: getPreview(eventoData.imagenes?.logoHorizontal),
    banner: getPreview(eventoData.imagenes?.banner),
    logoVertical: getPreview(eventoData.imagenes?.logoVertical),
    bannerPublicidad: getPreview(eventoData.imagenes?.bannerPublicidad),
    logoCuadrado: getPreview(eventoData.imagenes?.logoCuadrado),
    logoPassbook: getPreview(eventoData.imagenes?.logoPassbook),
    passBookBanner: getPreview(eventoData.imagenes?.passBookBanner),
    icono: getPreview(eventoData.imagenes?.icono)
  });


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
      logoHorizontal: { width: 640, height: 200 },
      banner: { width: 750, height: 196 },
      logoVertical: { width: 400, height: 600 },
      bannerPublicidad: { width: 500, height: 700 },
      logoCuadrado: { width: 600, height: 600 },
      logoPassbook: { width: 450, height: 150 },
      passBookBanner: { width: 753, height: 200 },
      icono: { width: 360, height: 360 }
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

      setImagesPreviews(prev => ({ ...prev, [imageType]: previewUrl }));
      setEventoData(prev => ({
        ...prev,
        imagenes: {
          ...prev.imagenes,
          [imageType]: file
        }
      }));
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      alert('No se pudo leer la imagen');
    };
    img.src = previewUrl;
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
    <div className="tab-codntent space-y-6">
      
      <section className="ticket-formats space-y-4">
        <h4 className="font-semibold">Formatos de boleta</h4>
        
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
        <h4 className="font-semibold">Configuración de formatos de impresión</h4>
        {/* Add print format configurations */}
      </section>

      <section className="images-upload space-y-4">
        <h4 className="font-semibold">Imágenes de los formatos de impresión</h4>
        <p className="text-sm text-gray-600">Las imágenes para los formatos de ticket deben ir en formato PNG y pueden tener el fondo transparente.</p>

        <div className="image-upload-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="image-upload-item flex flex-col gap-2 items-start">
            <h5 className="font-medium">Logo horizontal (640x200)</h5>
            <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: '320px', height: '100px' }}>
              {imagesPreviews.logoHorizontal ? (
                <img src={imagesPreviews.logoHorizontal} alt="Preview" />
              ) : (
                <div className="placeholder text-sm text-gray-500">640x200</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'logoHorizontal')}
                id="logoHorizontal"
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
              />
            </div>
          </div>

          <div className="image-upload-item flex flex-col gap-2 items-start">
            <h5 className="font-medium">Banner (750x196)</h5>
            <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: '320px', height: '84px' }}>
              {imagesPreviews.banner ? (
                <img src={imagesPreviews.banner} alt="Preview" />
              ) : (
                <div className="placeholder text-sm text-gray-500">750x196</div>
              )}
            </div>
            <div className="upload-buttons">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'banner')}
                id="banner"
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
              />
            </div>
          </div>

          <div className="image-upload-item flex flex-col gap-2 items-start">
            <h5 className="font-medium">Logo vertical (400x600)</h5>
            <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: '200px', height: '300px' }}>
              {imagesPreviews.logoVertical ? (
                <img src={imagesPreviews.logoVertical} alt="Preview" />
              ) : (
                <div className="placeholder text-sm text-gray-500">400x600</div>
              )}
            </div>
            <div className="upload-buttons flex items-center gap-2 mt-1">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'logoVertical')}
                id="logoVertical"
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
              />
            </div>
          </div>

          <div className="image-upload-item flex flex-col gap-2 items-start">
            <h5 className="font-medium">Banner publicidad (500x700)</h5>
            <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: '214px', height: '300px' }}>
              {imagesPreviews.bannerPublicidad ? (
                <img src={imagesPreviews.bannerPublicidad} alt="Preview" />
              ) : (
                <div className="placeholder text-sm text-gray-500">500x700</div>
              )}
            </div>
            <div className="upload-buttons flex items-center gap-2 mt-1">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'bannerPublicidad')}
                id="bannerPublicidad"
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
              />
            </div>
          </div>

          <div className="image-upload-item flex flex-col gap-2 items-start">
            <h5 className="font-medium">Logo cuadrado (600x600)</h5>
            <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: '200px', height: '200px' }}>
              {imagesPreviews.logoCuadrado ? (
                <img src={imagesPreviews.logoCuadrado} alt="Preview" />
              ) : (
                <div className="placeholder text-sm text-gray-500">600x600</div>
              )}
            </div>
            <div className="upload-buttons flex items-center gap-2 mt-1">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'logoCuadrado')}
                id="logoCuadrado"
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
              />
            </div>
          </div>

          <div className="image-upload-item flex flex-col gap-2 items-start">
            <h5 className="font-medium">Logo passbook (450x150)</h5>
            <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: '300px', height: '100px' }}>
              {imagesPreviews.logoPassbook ? (
                <img src={imagesPreviews.logoPassbook} alt="Preview" />
              ) : (
                <div className="placeholder text-sm text-gray-500">450x150</div>
              )}
            </div>
            <div className="upload-buttons flex items-center gap-2 mt-1">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'logoPassbook')}
                id="logoPassbook"
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
              />
            </div>
          </div>

          <div className="image-upload-item flex flex-col gap-2 items-start">
            <h5 className="font-medium">Passbook banner (753x200)</h5>
            <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: '320px', height: '85px' }}>
              {imagesPreviews.passBookBanner ? (
                <img src={imagesPreviews.passBookBanner} alt="Preview" />
              ) : (
                <div className="placeholder text-sm text-gray-500">753x200</div>
              )}
            </div>
            <div className="upload-buttons flex items-center gap-2 mt-1">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'passBookBanner')}
                id="passBookBanner"
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
              />
            </div>
          </div>

          <div className="image-upload-item flex flex-col gap-2 items-start">
            <h5 className="font-medium">Icono (360x360)</h5>
            <div className="image-preview border border-gray-300 flex items-center justify-center" style={{ width: '200px', height: '200px' }}>
              {imagesPreviews.icono ? (
                <img src={imagesPreviews.icono} alt="Preview" />
              ) : (
                <div className="placeholder text-sm text-gray-500">360x360</div>
              )}
            </div>
            <div className="upload-buttons flex items-center gap-2 mt-1">
              <input
                type="file"
                accept=".jpg,.png"
                onChange={(e) => handleImageChange(e, 'icono')}
                id="icono"
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="legal-terms space-y-2">
        <h4 className="font-semibold">Términos legales</h4>
        <div className="terms-container flex flex-col gap-2">
          <label>Términos legales 1</label>
          <textarea
            className="terms-textarea p-2 border border-gray-300 rounded"
            placeholder="Ingrese los términos legales aquí"
            rows={6}
          />
        </div>
      </section>
    </div>
  );
};

export default ConfiguracionBoletas;
