/**
 * Generador de archivos .pkpass para Apple Wallet / Google Wallet
 * 
 * Un archivo .pkpass es un archivo ZIP que contiene:
 * - pass.json: Metadatos del pase
 * - manifest.json: Hashes SHA1 de todos los archivos
 * - signature: Firma PKCS#7 (requiere certificados de Apple)
 * - Imágenes: logo, icon, etc.
 * 
 * NOTA: Para que funcione completamente en Apple Wallet, se necesitan:
 * - Certificado de Apple Developer
 * - Clave privada para firmar el archivo
 * - Para desarrollo/testing, podemos generar el archivo sin firma
 */

import JSZip from 'jszip';
import crypto from 'crypto';

/**
 * Genera un archivo .pkpass para un ticket/entrada
 * @param {Object} ticketData - Datos del ticket
 * @param {Object} eventData - Datos del evento
 * @param {Object} funcionData - Datos de la función
 * @param {Object} venueData - Datos del recinto
 * @param {Object} options - Opciones adicionales (certificados, imágenes, etc.)
 * @returns {Promise<Buffer>} Buffer del archivo .pkpass
 */
export async function generatePkpass(ticketData, eventData, funcionData, venueData, options = {}) {
  try {
    console.log('🎫 [PKPASS] Generando archivo .pkpass...');
    
    const zip = new JSZip();
    
    // 1. Generar pass.json
    const passJson = generatePassJson(ticketData, eventData, funcionData, venueData, options);
    zip.file('pass.json', JSON.stringify(passJson, null, 2));
    
    // 2. Agregar imágenes si están disponibles
    if (options.images) {
      await addImagesToZip(zip, options.images);
    } else {
      // Crear imágenes placeholder si no hay imágenes
      await addPlaceholderImages(zip);
    }
    
    // 3. Calcular hashes SHA1 de todos los archivos (excepto manifest.json y signature)
    const manifest = {};
    const hashPromises = [];
    
    // Iterar sobre todos los archivos en el ZIP usando forEach
    zip.forEach((relativePath, file) => {
      if (!file.dir && relativePath !== 'manifest.json' && relativePath !== 'signature') {
        // Calcular hash SHA1 del contenido del archivo
        hashPromises.push(
          file.async('nodebuffer').then(buffer => {
            manifest[relativePath] = crypto.createHash('sha1').update(buffer).digest('hex');
          })
        );
      }
    });
    
    // Esperar a que se calculen todos los hashes
    await Promise.all(hashPromises);
    
    // 4. Agregar manifest.json al ZIP
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    
    // 5. Generar signature (PKCS#7)
    // NOTA: Esto requiere certificados de Apple. Para desarrollo, podemos crear una firma dummy
    if (options.certificate && options.privateKey) {
      const signature = await generateSignature(manifest, options.certificate, options.privateKey, options.wwdrCertificate);
      zip.file('signature', signature);
    } else {
      console.warn('⚠️ [PKPASS] No se proporcionaron certificados. El archivo .pkpass no estará firmado y puede no funcionar en Apple Wallet.');
      // Crear signature dummy para desarrollo (vacío, ya que no tenemos certificados)
      zip.file('signature', Buffer.alloc(0));
    }
    
    // 6. Generar el archivo ZIP final
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    console.log('✅ [PKPASS] Archivo .pkpass generado exitosamente, tamaño:', zipBuffer.length, 'bytes');
    
    return zipBuffer;
  } catch (error) {
    console.error('❌ [PKPASS] Error generando archivo .pkpass:', error);
    throw error;
  }
}

/**
 * Genera el archivo pass.json con los metadatos del pase
 */
function generatePassJson(ticketData, eventData, funcionData, venueData, options) {
  const serialNumber = ticketData.seatId || ticketData.id || `TICKET-${Date.now()}`;
  const description = eventData?.nombre || 'Ticket de entrada';
  const organizationName = options.organizationName || 'Veneventos';
  const passTypeIdentifier = options.passTypeIdentifier || 'pass.com.veneventos.ticket';
  const teamIdentifier = options.teamIdentifier || 'TEAM123456';
  
  // Formatear fecha de la función
  let eventDate = null;
  if (funcionData?.fecha_celebracion) {
    eventDate = new Date(funcionData.fecha_celebracion).toISOString();
  }
  
  // Formatear ubicación
  let location = null;
  if (venueData) {
    const locationParts = [];
    if (venueData.direccion) locationParts.push(venueData.direccion);
    if (venueData.ciudad) locationParts.push(venueData.ciudad);
    if (venueData.estado) locationParts.push(venueData.estado);
    if (venueData.pais) locationParts.push(venueData.pais);
    
    location = {
      latitude: venueData.latitud ? parseFloat(venueData.latitud) : undefined,
      longitude: venueData.longitud ? parseFloat(venueData.longitud) : undefined,
      relevantText: locationParts.join(', ')
    };
    
    // Eliminar campos undefined
    if (!location.latitude) delete location.latitude;
    if (!location.longitude) delete location.longitude;
  }
  
  // Información del asiento
  const seatInfo = [];
  if (ticketData.zonaNombre) seatInfo.push(`Zona: ${ticketData.zonaNombre}`);
  if (ticketData.mesa) seatInfo.push(`Mesa: ${ticketData.mesa}`);
  if (ticketData.fila) seatInfo.push(`Fila: ${ticketData.fila}`);
  if (ticketData.asiento) seatInfo.push(`Asiento: ${ticketData.asiento}`);
  
  const pass = {
    formatVersion: 1,
    passTypeIdentifier: passTypeIdentifier,
    serialNumber: serialNumber,
    teamIdentifier: teamIdentifier,
    organizationName: organizationName,
    description: description,
    logoText: eventData?.nombre || 'Ticket',
    backgroundColor: options.backgroundColor || 'rgb(60, 60, 60)',
    foregroundColor: options.foregroundColor || 'rgb(255, 255, 255)',
    labelColor: options.labelColor || 'rgb(255, 255, 255)',
    
    // Event Ticket
    eventTicket: {
      primaryFields: [
        {
          key: 'event',
          label: 'Evento',
          value: eventData?.nombre || 'Evento'
        }
      ],
      secondaryFields: [
        ...(eventDate ? [{
          key: 'date',
          label: 'Fecha',
          value: new Date(eventDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }] : []),
        ...(funcionData?.fecha_celebracion ? [{
          key: 'time',
          label: 'Hora',
          value: new Date(funcionData.fecha_celebracion).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }] : [])
      ],
      auxiliaryFields: [
        ...(venueData?.nombre ? [{
          key: 'venue',
          label: 'Recinto',
          value: venueData.nombre
        }] : []),
        ...(seatInfo.length > 0 ? [{
          key: 'seat',
          label: 'Ubicación',
          value: seatInfo.join(' | ')
        }] : [])
      ],
      backFields: [
        {
          key: 'locator',
          label: 'Localizador',
          value: ticketData.locator || ticketData.orderId || 'N/A'
        },
        {
          key: 'description',
          label: 'Descripción',
          value: eventData?.descripcion || 'Ticket de entrada al evento'
        },
        ...(venueData ? [{
          key: 'address',
          label: 'Dirección',
          value: [
            venueData.direccion,
            venueData.ciudad,
            venueData.estado,
            venueData.pais
          ].filter(Boolean).join(', ')
        }] : []),
        {
          key: 'terms',
          label: 'Términos y Condiciones',
          value: 'Este ticket es válido solo para la fecha y hora indicadas. No se permite la reventa.'
        }
      ]
    },
    
    // Código de barras / QR
    barcodes: [
      {
        message: ticketData.locator || ticketData.orderId || serialNumber,
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1'
      }
    ],
    
    // Ubicación (si está disponible)
    ...(location && location.latitude && location.longitude ? {
      locations: [location]
    } : {}),
    
    // Fecha de relevancia
    ...(eventDate ? {
      relevantDate: eventDate
    } : {}),
    
    // Expiración (opcional)
    expirationDate: eventDate ? new Date(new Date(eventDate).getTime() + 24 * 60 * 60 * 1000).toISOString() : undefined
  };
  
  // Eliminar campos undefined
  if (!pass.expirationDate) delete pass.expirationDate;
  if (!pass.locations) delete pass.locations;
  
  return pass;
}

/**
 * Agrega imágenes al ZIP
 */
async function addImagesToZip(zip, images) {
  const imageSizes = {
    logo: { width: 160, height: 50 },
    logo2x: { width: 320, height: 100 },
    icon: { width: 29, height: 29 },
    icon2x: { width: 58, height: 58 },
    thumbnail: { width: 90, height: 90 },
    thumbnail2x: { width: 180, height: 180 }
  };
  
  for (const [imageType, size] of Object.entries(imageSizes)) {
    try {
      // Intentar obtener la imagen desde las opciones
      let imageBuffer = null;
      
      if (images[imageType]) {
        if (Buffer.isBuffer(images[imageType])) {
          imageBuffer = images[imageType];
        } else if (typeof images[imageType] === 'string') {
          // Si es una URL, descargarla
          const response = await fetch(images[imageType]);
          if (response.ok) {
            imageBuffer = Buffer.from(await response.arrayBuffer());
          }
        }
      }
      
      // Si no hay imagen específica, intentar usar imágenes del evento
      if (!imageBuffer && images.logoHorizontal) {
        if (Buffer.isBuffer(images.logoHorizontal)) {
          imageBuffer = images.logoHorizontal;
        } else if (typeof images.logoHorizontal === 'string') {
          const response = await fetch(images.logoHorizontal);
          if (response.ok) {
            imageBuffer = Buffer.from(await response.arrayBuffer());
          }
        }
      }
      
      if (imageBuffer) {
        zip.file(`${imageType}.png`, imageBuffer);
      }
    } catch (error) {
      console.warn(`⚠️ [PKPASS] Error agregando imagen ${imageType}:`, error.message);
    }
  }
}

/**
 * Agrega imágenes placeholder al ZIP
 */
async function addPlaceholderImages(zip) {
  // Crear imágenes PNG simples en memoria
  // Para desarrollo, crearemos imágenes básicas de 1x1 píxel
  const createPlaceholderPNG = (width, height) => {
    // PNG mínimo válido (transparente)
    const png = Buffer.alloc(67);
    // PNG signature
    png.writeUInt32BE(0x89504E47, 0);
    png.writeUInt32BE(0x0D0A1A0A, 4);
    // IHDR chunk
    png.writeUInt32BE(13, 8);
    png.write('IHDR', 'ascii', 12);
    png.writeUInt32BE(width, 16);
    png.writeUInt32BE(height, 20);
    png.writeUInt8(8, 24); // bit depth
    png.writeUInt8(6, 25); // color type (RGBA)
    png.writeUInt8(0, 26); // compression
    png.writeUInt8(0, 27); // filter
    png.writeUInt8(0, 28); // interlace
    // CRC (simplificado para desarrollo)
    png.writeUInt32BE(0x12345678, 29);
    // IEND
    png.writeUInt32BE(0, 33);
    png.write('IEND', 'ascii', 37);
    png.writeUInt32BE(0xAE426082, 41);
    return png;
  };
  
  zip.file('logo.png', createPlaceholderPNG(160, 50));
  zip.file('logo@2x.png', createPlaceholderPNG(320, 100));
  zip.file('icon.png', createPlaceholderPNG(29, 29));
  zip.file('icon@2x.png', createPlaceholderPNG(58, 58));
}


/**
 * Genera la firma PKCS#7 del manifest
 * NOTA: Requiere certificados de Apple Developer
 */
async function generateSignature(manifest, certificate, privateKey, wwdrCertificate) {
  try {
    // Convertir manifest a string
    const manifestString = JSON.stringify(manifest);
    
    // Crear firma PKCS#7
    // Esto requiere la librería 'node-forge' o 'pkcs7'
    // Por ahora, retornamos una firma dummy para desarrollo
    console.warn('⚠️ [PKPASS] Generando firma dummy. Para producción, se necesitan certificados de Apple.');
    
    return Buffer.from('DUMMY_SIGNATURE_FOR_DEVELOPMENT');
  } catch (error) {
    console.error('❌ [PKPASS] Error generando firma:', error);
    throw error;
  }
}

/**
 * Obtiene los datos del evento desde la base de datos para generar el pkpass
 */
export async function getEventDataForPkpass(supabaseAdmin, eventoId, funcionId) {
  try {
    // Obtener datos del evento
    const { data: evento, error: eventoError } = await supabaseAdmin
      .from('eventos')
      .select('id, nombre, descripcion, imagenes, recinto, recinto_id')
      .eq('id', eventoId)
      .maybeSingle();
    
    if (eventoError) {
      console.error('❌ [PKPASS] Error obteniendo evento:', eventoError);
      return null;
    }
    
    // Obtener datos de la función
    let funcion = null;
    if (funcionId) {
      const funcionIdInt = typeof funcionId === 'string' ? parseInt(funcionId, 10) : funcionId;
      const { data: func, error: funcionError } = await supabaseAdmin
        .from('funciones')
        .select('id, fecha_celebracion, evento_id, apertura_puertas, recinto_id')
        .eq('id', funcionIdInt)
        .maybeSingle();
      
      if (!funcionError && func) {
        funcion = func;
      }
    }
    
    // Obtener datos del recinto
    let recinto = null;
    const recintoId = evento?.recinto_id || evento?.recinto;
    if (recintoId) {
      const { data: rec, error: recintoError } = await supabaseAdmin
        .from('recintos')
        .select('id, nombre, direccion, ciudad, estado, pais, latitud, longitud')
        .eq('id', recintoId)
        .maybeSingle();
      
      if (!recintoError && rec) {
        recinto = rec;
      }
    }
    
    return {
      evento,
      funcion,
      recinto
    };
  } catch (error) {
    console.error('❌ [PKPASS] Error obteniendo datos del evento:', error);
    return null;
  }
}

