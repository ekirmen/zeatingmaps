import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../utils/apiBase';
import { supabase } from '../../../supabaseClient';
import { useTenant } from '../../../contexts/TenantContext';
import resolveImageUrl, { resolveEventImageWithTenant } from '../../../utils/resolveImageUrl';

const ConfiguracionBoletas = ({ eventoData, setEventoData }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [pdfOption, setPdfOption] = useState('single');
  const { currentTenant } = useTenant();
  const [uploading, setUploading] = useState(false);

  // Update initial state with existing images
  const getPreview = (img, imageType) => {
    // Si es un objeto con publicUrl (de Supabase)

      return img.publicUrl;
    }

    // Si es un objeto con url (de Supabase)
    if (img && typeof img === 'object' && img.url) {
      // Si ya es una URL completa, devolverla
      if (/^https?:\/\//i.test(img.url)) {
        return img.url;
      }
      // Si es una ruta relativa, construir URL completa
      const bucketName = img.bucket || `tenant-${currentTenant?.id}`;
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${img.url}`;
    }

    // Si es un string
    if (typeof img === 'string') {
      // Leave absolute URLs untouched
      if (/^https?:\/\//i.test(img)) {
        return img;
      }
      // Try to resolve using new tenant structure
      if (currentTenant?.id && eventoData?.id) {
        const resolvedUrl = resolveEventImageWithTenant(eventoData, imageType, currentTenant.id);
        if (resolvedUrl) return resolvedUrl;
      }
      // Otherwise prefix with API base URL
      return `${API_BASE_URL}${img}`;
    }

    if (img instanceof File) {
      return URL.createObjectURL(img);
    }

    return null;
  };

  const [imagesPreviews, setImagesPreviews] = useState({
    logoHorizontal: getPreview(eventoData.imagenes?.logoHorizontal, 'logoHorizontal'),
    banner: getPreview(eventoData.imagenes?.banner, 'banner'),
    logoVertical: getPreview(eventoData.imagenes?.logoVertical, 'logoVertical'),
    bannerPublicidad: getPreview(eventoData.imagenes?.bannerPublicidad, 'bannerPublicidad'),
    logoCuadrado: getPreview(eventoData.imagenes?.logoCuadrado, 'logoCuadrado'),
    logoPassbook: getPreview(eventoData.imagenes?.logoPassbook, 'logoPassbook'),
    passBookBanner: getPreview(eventoData.imagenes?.passBookBanner, 'passBookBanner'),
    icono: getPreview(eventoData.imagenes?.icono, 'icono')
  });

  // Sincronizar previews cuando cambien los datos del evento
  useEffect(() => {
    if (eventoData?.imagenes) {
      setImagesPreviews({
        logoHorizontal: getPreview(eventoData.imagenes?.logoHorizontal, 'logoHorizontal'),
        banner: getPreview(eventoData.imagenes?.banner, 'banner'),
        logoVertical: getPreview(eventoData.imagenes?.logoVertical, 'logoVertical'),
        bannerPublicidad: getPreview(eventoData.imagenes?.bannerPublicidad, 'bannerPublicidad'),
        logoCuadrado: getPreview(eventoData.imagenes?.logoCuadrado, 'logoCuadrado'),
        logoPassbook: getPreview(eventoData.imagenes?.logoPassbook, 'logoPassbook'),
        passBookBanner: getPreview(eventoData.imagenes?.passBookBanner, 'passBookBanner'),
        icono: getPreview(eventoData.imagenes?.icono, 'icono')
      });
    }
  }, [eventoData?.imagenes, currentTenant?.id, eventoData?.id]);

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
      return {
        url: filePath,
        publicUrl: publicUrl,
        bucket: bucketName,
        fileName: fileName,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('❌ [ConfiguracionBoletas] Error subiendo imagen:', error);
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
        setImagesPreviews(prev => ({
          ...prev,
          [imageType]: imageData.publicUrl
        }));

        // Actualizar datos del evento con metadatos de la imagen
        setEventoData(prev => {
          const newData = {
            ...prev,
            imagenes: {
              ...prev.imagenes,
              [imageType]: imageData
            }
          };
          return newData;
        });
      } catch (error) {
        console.error('❌ [ConfiguracionBoletas] Error procesando imagen:', error);
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

  // Remove or comment out the handleSave function since we don't need it
  // 
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
    <div className="tab-content space-y-6">

      <section className="ticket-formats space-y-4">
        <h4 className="font-semibold text-lg mb-4">Formatos de boleta</h4>

        {/* Diseño responsive: vertical en mobile, horizontal en desktop */}
        <div className="space-y-4">
          {/* Mobile: Vertical Stack */}
          <div className="flex flex-col md:hidden space-y-3">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
              <input
                type="checkbox"
                checked={selectedFormat === 'pdf'}
                onChange={() => setSelectedFormat('pdf')}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
              />
              <span className="text-sm font-medium text-gray-700">Permitir boletas en formato PDF</span>
            </label>
            {selectedFormat === 'pdf' && (
              <div className="pl-8 space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200 cursor-pointer">
                  <input
                    type="radio"
                    name="pdfOption"
                    value="all"
                    checked={pdfOption === 'all'}
                    onChange={(e) => setPdfOption(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Todas las entradas en el mismo PDF</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white rounded border border-gray-200 cursor-pointer">
                  <input
                    type="radio"
                    name="pdfOption"
                    value="single"
                    checked={pdfOption === 'single'}
                    onChange={(e) => setPdfOption(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Un PDF por entrada</span>
                </label>
              </div>
            )}
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
              <input
                type="checkbox"
                checked={eventoData?.datosBoleto?.habilitarWallet || false}
                onChange={(e) => {
                  setEventoData(prev => ({
                    ...prev,
                    datosBoleto: {
                      ...prev.datosBoleto,
                      habilitarWallet: e.target.checked
                    }
                  }));
                }}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
              />
              <span className="text-sm font-medium text-gray-700">Habilitar Wallet (pkpass)</span>
            </label>
            {eventoData?.datosBoleto?.habilitarWallet && (
              <div className="pl-8 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>ℹ️ Información:</strong> Los tickets se enviarán automáticamente en formato .pkpass (Apple Wallet/Google Wallet) en los correos de confirmación de compra.
                </p>
              </div>
            )}
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
              <input type="checkbox" className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2" />
              <span className="text-sm font-medium text-gray-700">Permitir impresión en taquilla</span>
            </label>
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            <div className="col-span-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex flex-col gap-2 cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedFormat === 'pdf'}
                    onChange={() => setSelectedFormat('pdf')}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700">PDF</span>
                </div>
                {selectedFormat === 'pdf' && (
                  <div className="pl-7 space-y-2 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pdfOption"
                        value="all"
                        checked={pdfOption === 'all'}
                        onChange={(e) => setPdfOption(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">Mismo PDF</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pdfOption"
                        value="single"
                        checked={pdfOption === 'single'}
                        onChange={(e) => setPdfOption(e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-600">PDF por entrada</span>
                    </label>
                  </div>
                )}
              </label>
            </div>

            <div className="col-span-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex flex-col gap-2 cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={eventoData?.datosBoleto?.habilitarWallet || false}
                    onChange={(e) => {
                      setEventoData(prev => ({
                        ...prev,
                        datosBoleto: {
                          ...prev.datosBoleto,
                          habilitarWallet: e.target.checked
                        }
                      }));
                    }}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Wallet (pkpass)</span>
                </div>
                <span className="text-xs text-gray-500 pl-7">Apple/Google Wallet</span>
                {eventoData?.datosBoleto?.habilitarWallet && (
                  <div className="pl-7 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-blue-800">
                      Se enviará por correo electrónico en formato .pkpass
                    </p>
                  </div>
                )}
              </label>
            </div>

            <div className="col-span-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:ring-offset-2" />
                <span className="text-sm font-medium text-gray-700">Impresión en taquilla</span>
              </label>
            </div>
          </div>
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
                accept=".jpg,.png,.webp"
                onChange={(e) => handleImageChange(e, 'logoHorizontal')}
                id="logoHorizontal"
                disabled={uploading}
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded disabled:opacity-50"
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Subiendo...
                </div>
              )}
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
                accept=".jpg,.png,.webp"
                onChange={(e) => handleImageChange(e, 'banner')}
                id="banner"
                disabled={uploading}
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded disabled:opacity-50"
              />
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Subiendo...
                </div>
              )}
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
                accept=".jpg,.png,.webp"
                onChange={(e) => handleImageChange(e, 'logoVertical')}
                id="logoVertical"
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
                accept=".jpg,.png,.webp"
                onChange={(e) => handleImageChange(e, 'bannerPublicidad')}
                id="bannerPublicidad"
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
                accept=".jpg,.png,.webp"
                onChange={(e) => handleImageChange(e, 'logoCuadrado')}
                id="logoCuadrado"
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
                accept=".jpg,.png,.webp"
                onChange={(e) => handleImageChange(e, 'logoPassbook')}
                id="logoPassbook"
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
                accept=".jpg,.png,.webp"
                onChange={(e) => handleImageChange(e, 'passBookBanner')}
                id="passBookBanner"
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
                accept=".jpg,.png,.webp"
                onChange={(e) => handleImageChange(e, 'icono')}
                id="icono"
                disabled={uploading}
                className="file:px-3 file:py-1 file:border file:border-gray-300 file:rounded disabled:opacity-50"
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
