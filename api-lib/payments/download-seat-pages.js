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
    const mesaTxt = seat?.mesa || seat?.table || seat?.mesaNombre || seat?.mesaId || (seat?.mesa?.nombre) || (seat?.mesa?.id) || (typeof seat?.mesa === 'string' ? seat.mesa : null) || (typeof seat?.mesa === 'number' ? seat.mesa.toString() : null) || null;
    const filaTxt = seat?.fila || seat?.row || seat?.filaNombre || seat?.filaId || (seat?.fila?.nombre) || (seat?.fila?.id) || (typeof seat?.fila === 'string' ? seat.fila : null) || (typeof seat?.fila === 'number' ? seat.fila.toString() : null) || null;
    const asientoTxt = seat?.asiento || seat?.seat || seat?.asientoNombre || seat?.nombre || seat?.name || null;
    const precioTxt = seat?.price || seat?.precio || null;
    
    // Log para debugging: verificar qué datos de mesa/fila se detectaron
    console.log(`📋 [PDF-PAGE] Datos del asiento ${seatId}:`, {
      zona: zonaTxt,
      mesa: mesaTxt,
      fila: filaTxt,
      asiento: asientoTxt,
      hasMesa: !!mesaTxt,
      hasFila: !!filaTxt,
      seatData: {
        mesa: seat?.mesa,
        table: seat?.table,
        mesaId: seat?.mesaId,
        fila: seat?.fila,
        row: seat?.row,
        filaId: seat?.filaId
      }
    });
    
    // Obtener datos del tenant y comprador
    const tenantData = pdfExtras?.tenantData || null;
    const buyerProfile = pdfExtras?.buyerProfile || null;
    
    // Generar QR code único para este asiento (usando errorCorrectionLevel: 'L' para modelo más simple)
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
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'L' // Nivel de corrección bajo (modelo más simple, más fácil de escanear)
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
    
    // Título del evento (desde izquierda hasta mitad de la hoja, puede bajar si se acaba)
    const eventTitle = pdfExtras?.eventData?.nombre || payment?.event?.nombre || payment?.evento?.nombre || 'Evento';
    const titleMaxWidth = leftColumnWidth; // Hasta la mitad
    const titleLines = wrapText(cleanTextForPDF(eventTitle), Math.floor(titleMaxWidth / 7)); // Aproximadamente 7 puntos por carácter
    titleLines.slice(0, 4).forEach((line, index) => {
      page.drawText(line, {
        x: leftX,
        y: leftY - (index * 18),
        size: 16,
        color: rgb(0, 0, 0),
        font: helveticaBold,
      });
    });
    leftY -= (titleLines.length > 4 ? 4 * 18 : titleLines.length * 18);
    leftY -= 20;
    
    // FECHA, HORA, IMPORTE del lado izquierdo (debajo del título del evento)
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
        
        // FECHA: 04/11/25 (lado izquierdo)
        page.drawText(`FECHA: ${fecha}`, {
          x: leftX,
          y: leftY,
          size: 11,
          color: rgb(0, 0, 0),
          font: helveticaFont,
        });
        leftY -= 18;
        
        // HORA: 16:00 (lado izquierdo)
        page.drawText(`HORA: ${hora}`, {
          x: leftX,
          y: leftY,
          size: 11,
          color: rgb(0, 0, 0),
          font: helveticaFont,
        });
        leftY -= 18;
      } catch (dateError) {
        console.warn('⚠️ [PDF-PAGE] Error procesando fecha:', dateError);
      }
    }
    
    // IMPORTE: $5.00 (lado izquierdo)
    const montoNum = Number(payment.monto || payment.amount || 0);
    page.drawText(`IMPORTE: $${montoNum.toFixed(2)}`, {
      x: leftX,
      y: leftY,
      size: 11,
      color: rgb(0, 0, 0),
      font: helveticaFont,
    });
    leftY -= 25;
    
    // Información del recinto en texto (después de FECHA, HORA, IMPORTE)
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
    
    leftY -= 10;
    
    // Código QR para ubicación del recinto (con borde)
    if (venueData && (venueData.latitud && venueData.longitud || venueData.direccion)) {
      try {
        // Generar URL de Google Maps (direcciones)
        let mapsUrl = '';
        if (venueData.latitud && venueData.longitud) {
          // Usar coordenadas para "directions" (llegar)
          mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${venueData.latitud},${venueData.longitud}`;
        } else if (venueData.direccion) {
          const address = encodeURIComponent(
            `${venueData.direccion}${venueData.ciudad ? ', ' + venueData.ciudad : ''}${venueData.estado ? ', ' + venueData.estado : ''}`
          );
          // Usar dirección para "directions" (llegar)
          mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
        }
        
        if (mapsUrl) {
          // Generar QR code para ubicación
          const locationQrBytes = await QRCode.toBuffer(mapsUrl, {
            type: 'image/png',
            width: 120,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'L' // Modelo más simple
          });
          
          const locationQrImage = await pdfDoc.embedPng(locationQrBytes);
          const locationQrSize = 100;
          const locationQrPadding = 5; // Padding para el borde
          const locationQrTotalSize = locationQrSize + (locationQrPadding * 2);
          const locationQrX = leftX;
          const locationQrY = leftY - locationQrTotalSize - 10;
          
          // Dibujar borde gris alrededor del QR de ubicación
          page.drawRectangle({
            x: locationQrX,
            y: locationQrY,
            width: locationQrTotalSize,
            height: locationQrTotalSize,
            borderColor: rgb(0.6, 0.6, 0.6),
            borderWidth: 1.5,
            color: rgb(1, 1, 1), // Fondo blanco
          });
          
          // Dibujar QR de ubicación dentro del borde
          page.drawImage(locationQrImage, {
            x: locationQrX + locationQrPadding,
            y: locationQrY + locationQrPadding,
            width: locationQrSize,
            height: locationQrSize,
          });
          
          // Texto "¡Escanea para llegar al Evento!"
          page.drawText('¡Escanea para llegar al Evento!', {
            x: locationQrX,
            y: locationQrY - 15,
            size: 9,
            color: rgb(0, 0, 0),
            font: helveticaBold,
          });
          
          leftY = locationQrY - 35;
        }
      } catch (locationQrError) {
        console.warn('⚠️ [PDF] Error generando QR de ubicación:', locationQrError);
      }
    }
    
    leftY -= 20;
    
    // Términos y Condiciones (desde el 5% hasta el 45% del ancho de la página)
    // Calcular posición para términos (subidos, después de la información del recinto)
    const termsStartX = width * 0.05; // 5% desde la izquierda
    const termsEndX = width * 0.45; // 45% del ancho (hasta la mitad)
    const termsMaxWidth = termsEndX - termsStartX; // Ancho disponible para términos
    const termsStartY = leftY; // Continuar desde donde quedó la información del recinto
    
    page.drawText('TERMINOS Y CONDICIONES', {
      x: termsStartX,
      y: termsStartY,
      size: 11,
      color: rgb(0, 0, 0),
      font: helveticaBold,
    });
    
    const terms = [
      '1.- Todas las ventas realizadas a traves de nuestro sistema o plataforma son definitivas.',
      '2.- No se aceptan devoluciones, cambios o reembolsos.',
      '3.- Si la fecha del evento cambiara por alguna circunstancia, este ticket sera valido para la nueva fecha.',
      '4.- Los reembolsos unicamente se realizaran para los eventos suspendidos o reprogramados.',
      '5.- Solo se reembolsa el costo del ticket.',
      '6.- Al adquirir este tickets el cliente acepta nuestros terminos y condiciones.'
    ];
    
    // Calcular el ancho máximo de texto (aproximadamente 5.5 puntos por carácter para tamaño 8)
    const maxCharsPerLine = Math.floor(termsMaxWidth / 5.5);
    
    let termsYPos = termsStartY - 15;
    terms.forEach(term => {
      // Dividir el término en líneas para que quepa dentro del ancho especificado
      const termLines = wrapText(cleanTextForPDF(term), maxCharsPerLine);
      termLines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: termsStartX,
          y: termsYPos,
          size: 8,
          color: rgb(0.2, 0.2, 0.2),
          font: helveticaFont,
        });
        termsYPos -= 11;
      });
      termsYPos -= 2; // Espaciado adicional entre términos
    });
    
    // Actualizar leftY para continuar con el layout
    leftY = termsYPos - 10;
    
    // Información de la empresa (lo más abajo posible)
    const companyInfoY = bottomMargin + 30;
    if (tenantData) {
      if (tenantData.company_name) {
        page.drawText(cleanTextForPDF(tenantData.company_name), {
          x: leftX,
          y: companyInfoY,
          size: 10,
          color: rgb(0, 0, 0),
          font: helveticaBold,
        });
      }
      // Eliminar correo - solo teléfono
      if (tenantData.contact_phone) {
        page.drawText(cleanTextForPDF(tenantData.contact_phone), {
          x: leftX,
          y: companyInfoY - 14,
          size: 9,
          color: rgb(0.3, 0.3, 0.3),
          font: helveticaFont,
        });
      }
    } else {
      // Fallback a KREATICKETS si no hay información del tenant
      page.drawText('KREATICKETS', {
        x: leftX,
        y: companyInfoY,
        size: 10,
        color: rgb(0, 0, 0),
        font: helveticaBold,
      });
    }
    
    // ==========================================
    // COLUMNA DERECHA - STUB/ENTRADA
    // ==========================================
    let rightY = contentStartY;
    const rightX = dividerX + 15;
    
    // "ENTRADA X DE Y" pegado a la derecha
    const entradaText = `ENTRADA ${currentPage} DE ${totalPages}`;
    const entradaTextWidth = helveticaBold.widthOfTextAtSize(entradaText, 12);
    page.drawText(entradaText, {
      x: width - rightMargin - entradaTextWidth,
      y: rightY,
      size: 12,
      color: rgb(0, 0, 0),
      font: helveticaBold,
    });
    rightY -= 25; // Reducido de 30 a 25
    
    // COMPRADOR (nombre y apellido unidos) - Subido
    if (buyerProfile && (buyerProfile.nombre || buyerProfile.apellido)) {
      const buyerFullName = `${cleanTextForPDF(buyerProfile.nombre || '')} ${cleanTextForPDF(buyerProfile.apellido || '')}`.trim();
      if (buyerFullName) {
        page.drawText(`COMPRADOR: ${buyerFullName}`, {
          x: rightX,
          y: rightY,
          size: 11,
          color: rgb(0, 0, 0),
          font: helveticaBold,
        });
        rightY -= 18; // Reducido de 20 a 18
      }
    }
    rightY -= 3; // Reducido de 5 a 3
    
    // Localizador (a la derecha) - Subido
    const locatorText = `Localizador: ${cleanTextForPDF(payment.locator || locator || '')}`;
    page.drawText(locatorText, {
      x: rightX,
      y: rightY,
      size: 11,
      color: rgb(0, 0, 0),
      font: helveticaBold,
    });
    rightY -= 20; // Reducido de 25 a 20
    
    // TIPO: ENTRADA (en la columna derecha) - Subido
    const tipoTicket = precioTxt && Number(precioTxt) === 0 ? 'CORTESIA' : 'ENTRADA';
    page.drawText(`TIPO: ${tipoTicket}`, {
      x: rightX,
      y: rightY,
      size: 11,
      color: rgb(0, 0, 0),
      font: helveticaFont,
    });
    rightY -= 20; // Reducido de 25 a 20
    
    // Tabla de información del asiento (con borde, menos alta, subida)
    // Detectar si el asiento tiene mesa o fila para determinar qué columnas mostrar
    const hasMesa = mesaTxt && mesaTxt !== '-' && mesaTxt.trim() !== '';
    const hasFila = filaTxt && filaTxt !== '-' && filaTxt.trim() !== '';
    
    // Determinar las columnas de la tabla según los datos disponibles
    let tableHeaders = ['Zona', 'Asiento'];
    let tableValues = [
      cleanTextForPDF(zonaTxt || '-'),
      cleanTextForPDF(asientoTxt || '-')
    ];
    
    if (hasMesa) {
      // Si tiene mesa, mostrar: Zona, Mesa, Asiento
      tableHeaders = ['Zona', 'Mesa', 'Asiento'];
      tableValues = [
        cleanTextForPDF(zonaTxt || '-'),
        cleanTextForPDF(mesaTxt || '-'),
        cleanTextForPDF(asientoTxt || '-')
      ];
    } else if (hasFila) {
      // Si tiene fila, mostrar: Zona, Fila, Asiento
      tableHeaders = ['Zona', 'Fila', 'Asiento'];
      tableValues = [
        cleanTextForPDF(zonaTxt || '-'),
        cleanTextForPDF(filaTxt || '-'),
        cleanTextForPDF(asientoTxt || '-')
      ];
    }
    // Si no tiene ni mesa ni fila, solo mostrar Zona y Asiento (ya definido arriba)
    
    const numColumns = tableHeaders.length;
    
    // Dibujar tabla con borde (menos alta)
    const tableStartX = rightX;
    const tableWidth = rightColumnWidth - 10;
    const tableRowHeight = 18; // Reducido de 25 a 18 (menos alta)
    const tableY = rightY + 3; // Subida, reducido de 5 a 3
    
    // Dibujar borde de la tabla (menos alto)
    page.drawRectangle({
      x: tableStartX,
      y: tableY - tableRowHeight - 3, // Reducido de 5 a 3
      width: tableWidth,
      height: tableRowHeight + 12, // Reducido de 20 a 12 (menos alta)
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1.5,
    });
    
    // Dibujar línea horizontal entre encabezados y valores
    page.drawLine({
      start: { x: tableStartX, y: tableY - tableRowHeight },
      end: { x: tableStartX + tableWidth, y: tableY - tableRowHeight },
      thickness: 1,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Dibujar líneas verticales entre columnas (solo si hay más de una columna)
    const colWidth = tableWidth / numColumns;
    for (let i = 1; i < numColumns; i++) {
      page.drawLine({
        start: { x: tableStartX + (colWidth * i), y: tableY - tableRowHeight - 3 }, // Reducido de 5 a 3
        end: { x: tableStartX + (colWidth * i), y: tableY + 10 }, // Reducido de 15 a 10
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    
    // Dibujar encabezados de tabla
    tableHeaders.forEach((header, index) => {
      const headerX = tableStartX + (index * colWidth) + 5;
      page.drawText(header, {
        x: headerX,
        y: tableY - 2, // Ajustado para centrar mejor
        size: 10,
        color: rgb(0, 0, 0),
        font: helveticaBold,
      });
    });
    
    // Dibujar valores de tabla
    tableValues.forEach((value, index) => {
      const valueX = tableStartX + (index * colWidth) + 5;
      page.drawText(value, {
        x: valueX,
        y: tableY - tableRowHeight - 2, // Ajustado para centrar mejor
        size: 10, // Reducido de 11 a 10
        color: rgb(0, 0, 0),
        font: helveticaFont,
      });
    });
    rightY = tableY - tableRowHeight - 20; // Reducido de 30 a 20
    
    // QR Code de validación (más arriba, subido para que no llegue a la mitad de la hoja)
    // Posicionar el QR después de la tabla, pero más arriba
    if (qrImageBytes) {
      try {
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        const qrSize = 140;
        const qrPadding = qrSize * 0.15; // 15% de separación
        const qrTextPadding = qrSize * 0.05; // 5% para el texto
        const qrTotalSize = qrSize + (qrPadding * 2);
        const qrX = rightX + (rightColumnWidth / 2) - (qrTotalSize / 2);
        // Posicionar el QR más arriba, después de la tabla
        const qrY = rightY - qrTotalSize - 8; // Reducido de 10 a 8, más compacto
        
        // Dibujar borde gris
        page.drawRectangle({
          x: qrX,
          y: qrY,
          width: qrTotalSize,
          height: qrTotalSize,
          borderColor: rgb(0.6, 0.6, 0.6),
          borderWidth: 2,
          color: rgb(1, 1, 1), // Fondo blanco
        });
        
        // Dibujar QR code dentro del borde
        page.drawImage(qrImage, {
          x: qrX + qrPadding,
          y: qrY + qrPadding,
          width: qrSize,
          height: qrSize,
        });
        
        // Código alfanumérico debajo del QR (dentro del borde, al 5% desde abajo)
        const codeText = cleanTextForPDF(alphanumericCode);
        const codeWidth = helveticaFont.widthOfTextAtSize(codeText, 9);
        const codeY = qrY + qrTextPadding;
        page.drawText(codeText, {
          x: qrX + (qrTotalSize / 2) - (codeWidth / 2),
          y: codeY,
          size: 9,
          color: rgb(0.2, 0.2, 0.2),
          font: helveticaFont,
        });
        
        // Actualizar rightY para el poster (ya no necesitamos más espacio)
        rightY = qrY - 20; // Reducido de 30 a 20
      } catch (qrError) {
        console.error('❌ [PDF] Error embediendo QR:', qrError);
      }
    }
    
    // Poster del evento en la parte inferior de la columna derecha (estirado hasta el final)
    if (eventImages.portada || eventImages.banner) {
      const posterImage = eventImages.portada || eventImages.banner;
      const posterHeight = Math.min(180, bottomMargin + 200);
      const posterWidth = width - dividerX - rightMargin - 10; // Estirado hasta el final de la columna
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
