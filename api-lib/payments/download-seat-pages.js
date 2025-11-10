import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { getSupabaseAdmin } from './config.js';

/**
 * Función auxiliar para limpiar texto de emojis y caracteres no compatibles con WinAnsi
 * WinAnsi solo soporta caracteres en el rango 0x00-0xFF (ASCII extendido)
 */
function cleanTextForPDF(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }
  
  // Eliminar emojis y caracteres Unicode fuera del rango WinAnsi
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis (rango general)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and map symbols (incluye 📍)
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation selectors
    .replace(/[\u{200D}]/gu, '') // Zero-width joiner
    .replace(/[\u{200B}]/gu, '') // Zero-width space
    .replace(/[\u{FEFF}]/gu, '') // Zero-width no-break space
    .trim();
}

/**
 * Función auxiliar para dibujar una línea punteada vertical
 * Nota: Esta función debe ser llamada después de que rgb esté disponible
 */
function drawDashedVerticalLine(page, x, yStart, yEnd, dashLength = 5, gapLength = 3, lineColor = null) {
  // Si no se proporciona color, crear uno por defecto (rgb debe estar disponible cuando se llame)
  const defaultColor = lineColor || { r: 0.4, g: 0.4, b: 0.4 };
  
  let currentY = yStart;
  let drawSegment = true;
  
  while (currentY < yEnd) {
    const segmentEnd = Math.min(currentY + (drawSegment ? dashLength : gapLength), yEnd);
    if (drawSegment && segmentEnd > currentY) {
      page.drawLine({
        start: { x, y: currentY },
        end: { x, y: segmentEnd },
        thickness: 1,
        color: defaultColor
      });
    }
    currentY = segmentEnd;
    drawSegment = !drawSegment;
  }
}

/**
 * Función auxiliar para dibujar una página de ticket para un asiento específico
 * Diseño de dos columnas: ticket principal (izquierda) y stub (derecha)
 */
async function drawSeatPage(pdfDoc, page, payment, seat, eventImages, venueData, pdfExtras, helveticaFont, helveticaBold, locator, currentPage = 1, totalPages = 1) {
  try {
    const { width, height } = page.getSize();
    const downloadSource = pdfExtras?.downloadSource || 'web';
    
    // Configuración de columnas
    const dividerX = width / 2; // Línea divisoria en el medio
    const leftMargin = 20;
    const rightMargin = 20;
    const leftColumnWidth = dividerX - leftMargin - 10;
    const rightColumnWidth = width - dividerX - rightMargin - 10;
    const topMargin = 20;
    const bottomMargin = 20;
    
    console.log(`📄 [PDF-PAGE] Dibujando página ${currentPage}/${totalPages} con diseño de dos columnas`);
    
    // Asegurar que eventImages es un objeto
    if (!eventImages || typeof eventImages !== 'object') {
      eventImages = {};
    }
    
    // Obtener información del asiento
    const seatId = seat?.id || seat?._id || seat?.seatId || seat?.seat_id || 'unknown';
    const zonaTxt = seat?.zonaNombre || seat?.nombreZona || (seat?.zona?.nombre) || (typeof seat?.zona === 'string' ? seat.zona : null) || seat?.zonaId || null;
    const mesaTxt = seat?.mesa || seat?.table || seat?.mesaNombre || (seat?.mesa?.nombre) || (typeof seat?.mesa === 'string' ? seat.mesa : null) || null;
    const filaTxt = seat?.fila || seat?.row || seat?.filaNombre || (seat?.fila?.nombre) || (typeof seat?.fila === 'string' ? seat.fila : null) || null;
    const asientoTxt = seat?.asiento || seat?.seat || seat?.asientoNombre || seat?.nombre || seat?.name || null;
    const precioTxt = seat?.price || seat?.precio || null;
    
    // Generar QR code único para este asiento
    let qrImageBytes = null;
    try {
      const qrData = JSON.stringify({
        seatId: seatId,
        paymentId: payment.id,
        locator: payment.locator || locator,
        timestamp: new Date().toISOString()
      });
      qrImageBytes = await QRCode.toBuffer(qrData, {
        type: 'image/png',
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
    } catch (qrError) {
      console.error(`❌ [PDF] Error generando código QR:`, qrError);
    }
    
    // Generar código alfanumérico para el asiento (similar al del ticket de referencia)
    const alphanumericCode = generateAlphanumericCode(seatId, payment.id);
    
    // ==========================================
    // BANNER SUPERIOR (cruza ambas columnas)
    // ==========================================
    const bannerHeight = 80;
    const bannerY = height - topMargin - bannerHeight;
    if (eventImages.banner || eventImages.portada) {
      const bannerImage = eventImages.banner || eventImages.portada;
      page.drawImage(bannerImage, {
        x: leftMargin,
        y: bannerY,
        width: width - leftMargin - rightMargin,
        height: bannerHeight,
      });
    }
    
    let contentStartY = bannerY - 20;
    
    // ==========================================
    // LÍNEA PUNTEADA VERTICAL DIVISORIA
    // ==========================================
    drawDashedVerticalLine(page, dividerX, bottomMargin + 50, contentStartY + 20, 5, 3, rgb(0.4, 0.4, 0.4));
    
    // ==========================================
    // COLUMNA IZQUIERDA - TICKET PRINCIPAL
    // ==========================================
    let leftY = contentStartY;
    const leftX = leftMargin;
    
    // Logo/poster vertical pequeño (si existe portada o logoVertical)
    if (eventImages.portada || eventImages.logoVertical) {
      const logoImage = eventImages.portada || eventImages.logoVertical;
      const logoWidth = 80;
      const logoHeight = 120;
      page.drawImage(logoImage, {
        x: leftX,
        y: leftY - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    }
    
    // Título del evento (al lado del logo)
    const eventTitle = pdfExtras?.eventData?.nombre || payment?.event?.nombre || payment?.evento?.nombre || 'Evento';
    const titleX = leftX + 90;
    const titleLines = wrapText(cleanTextForPDF(eventTitle), 35);
    titleLines.slice(0, 3).forEach((line, index) => {
      page.drawText(line, {
        x: titleX,
        y: leftY - (index * 18),
        size: 16,
        color: rgb(0, 0, 0),
        font: helveticaBold,
      });
    });
    leftY -= 70;
    
    // Información del recinto
    if (venueData?.nombre) {
      page.drawText(cleanTextForPDF(venueData.nombre), {
        x: leftX,
        y: leftY,
        size: 12,
        color: rgb(0.1, 0.1, 0.1),
        font: helveticaFont,
      });
      leftY -= 18;
      
      if (venueData.direccion) {
        page.drawText(cleanTextForPDF(venueData.direccion), {
          x: leftX,
          y: leftY,
          size: 10,
          color: rgb(0.3, 0.3, 0.3),
          font: helveticaFont,
        });
        leftY -= 16;
      }
      
      if (venueData.ciudad || venueData.estado) {
        const locationParts = [];
        if (venueData.ciudad) locationParts.push(venueData.ciudad);
        if (venueData.estado) locationParts.push(venueData.estado);
        page.drawText(cleanTextForPDF(locationParts.join(', ')), {
          x: leftX,
          y: leftY,
          size: 10,
          color: rgb(0.3, 0.3, 0.3),
          font: helveticaFont,
        });
        leftY -= 16;
      }
    }
    
    leftY -= 15;
    
    // Localizador e Importe
    page.drawText(`Localizador: ${cleanTextForPDF(payment.locator || locator || '')}`, {
      x: leftX,
      y: leftY,
      size: 11,
      color: rgb(0, 0, 0),
      font: helveticaBold,
    });
    leftY -= 20;
    
    const montoNum = Number(payment.monto || payment.amount || 0);
    page.drawText(`Importe: $${montoNum.toFixed(2)}`, {
      x: leftX,
      y: leftY,
      size: 11,
      color: rgb(0, 0, 0),
      font: helveticaFont,
    });
    leftY -= 25;
    
    // Código alfanumérico (centrado)
    page.drawText(cleanTextForPDF(alphanumericCode), {
      x: leftX + (leftColumnWidth / 2) - (helveticaFont.widthOfTextAtSize(alphanumericCode, 10) / 2),
      y: leftY,
      size: 10,
      color: rgb(0.2, 0.2, 0.2),
      font: helveticaFont,
    });
    leftY -= 40;
    
    // Términos y Condiciones
    const termsY = 200;
    page.drawText('TERMINOS Y CONDICIONES', {
      x: leftX,
      y: termsY,
      size: 11,
      color: rgb(0, 0, 0),
      font: helveticaBold,
    });
    
    const terms = [
      '1. Todas las ventas realizadas a traves de nuestro sistema o plataforma son finales.',
      '2. No se aceptan devoluciones, cambios ni reembolsos.',
      '3. Si la fecha del evento cambia por cualquier circunstancia, este ticket sera valido para la nueva fecha.',
      '4. Los reembolsos solo se realizaran para eventos suspendidos o reprogramados.',
      '5. Solo se reembolsara el costo del ticket.',
      '6. Al comprar este ticket, el cliente acepta nuestros terminos y condiciones.'
    ];
    
    let termsYPos = termsY - 15;
    terms.forEach(term => {
      const wrappedTerms = wrapText(cleanTextForPDF(term), 50);
      wrappedTerms.forEach(line => {
        page.drawText(line, {
          x: leftX,
          y: termsYPos,
          size: 8,
          color: rgb(0.2, 0.2, 0.2),
          font: helveticaFont,
        });
        termsYPos -= 12;
      });
    });
    
    // Información de la empresa (opcional)
    termsYPos -= 10;
    page.drawText('KREATICKETS', {
      x: leftX,
      y: termsYPos,
      size: 10,
      color: rgb(0, 0, 0),
      font: helveticaBold,
    });
    
    // ==========================================
    // COLUMNA DERECHA - STUB/ENTRADA
    // ==========================================
    let rightY = contentStartY;
    const rightX = dividerX + 15;
    
    // "ENTRADA X DE Y"
    page.drawText(`ENTRADA ${currentPage} DE ${totalPages}`, {
      x: rightX,
      y: rightY,
      size: 12,
      color: rgb(0, 0, 0),
      font: helveticaBold,
    });
    rightY -= 25;
    
    // Fecha y Hora (formato similar al ticket de referencia)
    const funcion = pdfExtras?.funcionData || payment?.funcion || null;
    if (funcion?.fecha_celebracion) {
      try {
        const fechaCelebracion = new Date(funcion.fecha_celebracion);
        const fecha = fechaCelebracion.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          timeZone: 'UTC'
        });
        const hora = fechaCelebracion.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
          hour12: false
        });
        
        // Fecha (formato: DD/MM/YY)
        page.drawText(fecha, {
          x: rightX,
          y: rightY,
          size: 11,
          color: rgb(0, 0, 0),
          font: helveticaFont,
        });
        rightY -= 18;
        
        // Hora (formato: HH:MM)
        page.drawText(hora, {
          x: rightX,
          y: rightY,
          size: 11,
          color: rgb(0, 0, 0),
          font: helveticaFont,
        });
        rightY -= 18;
      } catch (dateError) {
        console.warn('⚠️ [PDF-PAGE] Error procesando fecha:', dateError);
      }
    }
    
    // Tipo de ticket (si está disponible)
    const tipoTicket = precioTxt && Number(precioTxt) === 0 ? 'CORTESIA' : 'ENTRADA';
    page.drawText(`Tipo: ${tipoTicket}`, {
      x: rightX,
      y: rightY,
      size: 10,
      color: rgb(0, 0, 0),
      font: helveticaFont,
    });
    rightY -= 18;
    
    // Comprador
    const customerName = payment.customer_name || payment.nombre_cliente || payment.user_name || '';
    if (customerName) {
      page.drawText(`Comprador: ${cleanTextForPDF(customerName)}`, {
        x: rightX,
        y: rightY,
        size: 10,
        color: rgb(0, 0, 0),
        font: helveticaFont,
      });
      rightY -= 18;
    }
    
    rightY -= 10;
    
    // Tabla de información del asiento (similar al ticket de referencia)
    const tableHeaders = ['Zona', 'Fila', 'Asiento'];
    const tableValues = [
      cleanTextForPDF(zonaTxt || '-'),
      cleanTextForPDF(filaTxt || '-'),
      cleanTextForPDF(asientoTxt || '-')
    ];
    
    // Dibujar encabezados de tabla
    const tableStartX = rightX;
    const colWidth = Math.min(65, rightColumnWidth / 3);
    tableHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: tableStartX + (index * colWidth),
        y: rightY,
        size: 10,
        color: rgb(0, 0, 0),
        font: helveticaBold,
      });
    });
    rightY -= 18;
    
    // Dibujar valores de tabla
    tableValues.forEach((value, index) => {
      page.drawText(value, {
        x: tableStartX + (index * colWidth),
        y: rightY,
        size: 11,
        color: rgb(0, 0, 0),
        font: helveticaFont,
      });
    });
    rightY -= 50;
    
    // QR Code (centrado en la columna derecha, similar al ticket de referencia)
    if (qrImageBytes) {
      try {
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        const qrSize = 140; // QR más grande como en el ticket de referencia
        const qrX = rightX + (rightColumnWidth / 2) - (qrSize / 2);
        const qrY = rightY - qrSize - 10;
        
        page.drawImage(qrImage, {
          x: qrX,
          y: qrY,
          width: qrSize,
          height: qrSize,
        });
        
        // Código alfanumérico debajo del QR (centrado)
        const codeText = cleanTextForPDF(alphanumericCode);
        const codeWidth = helveticaFont.widthOfTextAtSize(codeText, 10);
        page.drawText(codeText, {
          x: qrX + (qrSize / 2) - (codeWidth / 2),
          y: qrY - 25,
          size: 10,
          color: rgb(0.2, 0.2, 0.2),
          font: helveticaFont,
        });
      } catch (qrError) {
        console.error('❌ [PDF] Error embediendo QR:', qrError);
      }
    }
    
    // Poster del evento en la parte inferior de la columna derecha (si existe)
    if (eventImages.portada || eventImages.banner) {
      const posterImage = eventImages.portada || eventImages.banner;
      const posterHeight = Math.min(180, (bottomMargin + 200) - 100); // Ajustar altura según espacio disponible
      const posterWidth = Math.min(rightColumnWidth - 20, posterHeight * 0.7); // Mantener proporción
      const posterY = bottomMargin + 30;
      
      try {
        page.drawImage(posterImage, {
          x: rightX,
          y: posterY,
          width: posterWidth,
          height: posterHeight,
        });
      } catch (posterError) {
        console.warn('⚠️ [PDF] Error dibujando poster:', posterError);
      }
    }
    
  } catch (error) {
    console.error(`❌ [PDF-PAGE] Error en drawSeatPage:`, error);
    console.error(`❌ [PDF-PAGE] Stack:`, error.stack);
    throw error;
  }
}

/**
 * Función auxiliar para envolver texto en múltiples líneas
 */
function wrapText(text, maxLength) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  
  return lines;
}

/**
 * Función auxiliar para generar código alfanumérico único
 */
function generateAlphanumericCode(seatId, paymentId) {
  // Usar los últimos caracteres del seatId y paymentId para generar un código
  const seatPart = String(seatId).slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const paymentPart = String(paymentId).slice(-6).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (seatPart + paymentPart).slice(0, 16) || 'TICKET' + Date.now().toString(36).toUpperCase().slice(-10);
}

/**
 * Carga las imágenes del evento en el PDF document
 */
async function loadEventImages(pdfDoc, eventData, supabaseAdmin) {
  const eventImages = {};
  let venueData = null;

  try {
    console.log('🖼️ [PDF] loadEventImages llamado con eventData');
    
    if (eventData && eventData.imagenes) {
      let images;
      try {
        images = typeof eventData.imagenes === 'string'
          ? JSON.parse(eventData.imagenes)
          : eventData.imagenes;
      } catch (parseError) {
        console.error('❌ [PDF] Error parseando imágenes:', parseError.message);
        images = {};
      }

      const imageTypes = ['logoHorizontal', 'portada', 'banner', 'logoVertical'];
      for (const imageType of imageTypes) {
        if (images && images[imageType]) {
          try {
            const imageObj = images[imageType];
            let imageUrl = null;
            
            if (typeof imageObj === 'string') {
              imageUrl = imageObj;
            } else if (imageObj?.publicUrl) {
              imageUrl = imageObj.publicUrl;
            } else if (imageObj?.url) {
              imageUrl = imageObj.url;
            } else if (imageObj?.path) {
              const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
              if (supabaseUrl && supabaseAdmin) {
                try {
                  const { data } = await supabaseAdmin.storage.from('eventos').getPublicUrl(imageObj.path);
                  imageUrl = data?.publicUrl || null;
                } catch (storageError) {
                  console.warn(`⚠️ [PDF] Error obteniendo URL pública de Storage para ${imageType}:`, storageError.message);
                }
              }
            }
            
            if (imageUrl) {
              console.log(`🖼️ [PDF] Cargando ${imageType} desde:`, imageUrl);
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              
              try {
                const response = await fetch(imageUrl, {
                  signal: controller.signal,
                  headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                  const imageBuffer = await response.arrayBuffer();
                  
                  try {
                    eventImages[imageType] = await pdfDoc.embedPng(imageBuffer);
                    console.log(`✅ [PDF] ${imageType} embedido como PNG`);
                  } catch (pngError) {
                    try {
                      eventImages[imageType] = await pdfDoc.embedJpg(imageBuffer);
                      console.log(`✅ [PDF] ${imageType} embedido como JPEG`);
                    } catch (jpgError) {
                      console.warn(`⚠️ [PDF] ${imageType} no es PNG ni JPEG:`, jpgError.message);
                    }
                  }
                }
              } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name !== 'AbortError') {
                  console.warn(`⚠️ [PDF] Error fetch al cargar ${imageType}:`, fetchError.message);
                }
              }
            }
          } catch (imgError) {
            console.warn(`⚠️ [PDF] Error procesando ${imageType}:`, imgError.message);
          }
        }
      }
    }

    // Cargar información del recinto
    const recintoIdFromEvent = eventData?.recinto_id || eventData?.recinto;
    if (recintoIdFromEvent && supabaseAdmin) {
      const { data: rec, error: recErr } = await supabaseAdmin
        .from('recintos')
        .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad, latitud, longitud')
        .eq('id', recintoIdFromEvent)
        .maybeSingle();
      if (!recErr && rec) {
        venueData = rec;
        console.log('✅ [PDF] Recinto obtenido:', rec.nombre);
      }
    }
  } catch (imgError) {
    console.warn('⚠️ [PDF] Error procesando imágenes del evento:', imgError.message);
  }

  return { eventImages, venueData };
}

export { drawSeatPage, loadEventImages };
