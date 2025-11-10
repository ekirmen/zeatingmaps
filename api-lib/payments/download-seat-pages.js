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
  // WinAnsi soporta caracteres 0x00-0xFF, pero algunos caracteres especiales pueden causar problemas
  // Eliminar todos los caracteres que no estén en el rango ASCII extendido (0x00-0xFF)
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
 * Función auxiliar para dibujar una página de ticket para un asiento específico
 */
async function drawSeatPage(pdfDoc, page, payment, seat, eventImages, venueData, pdfExtras, helveticaFont, helveticaBold, locator, currentPage = 1, totalPages = 1) {
  try {
    const { width, height } = page.getSize();
    const downloadSource = pdfExtras?.downloadSource || 'web'; // 'email' or 'web'
    
    // Log de datos recibidos para debugging
    console.log(`📄 [PDF-PAGE] Dibujando página ${currentPage}/${totalPages} con datos:`, {
      hasEventData: !!pdfExtras?.eventData,
      hasFuncionData: !!pdfExtras?.funcionData,
      hasVenueData: !!venueData,
      eventImagesCount: eventImages ? Object.keys(eventImages).length : 0,
      paymentId: payment?.id,
      locator: locator,
      eventNombre: pdfExtras?.eventData?.nombre || 'N/A',
      venueNombre: venueData?.nombre || 'N/A',
      funcionFecha: pdfExtras?.funcionData?.fecha_celebracion || 'N/A',
      pdfExtrasKeys: Object.keys(pdfExtras || {}),
      eventImagesKeys: Object.keys(eventImages || {})
    });
    
    // Asegurar que eventImages es un objeto
    if (!eventImages || typeof eventImages !== 'object') {
      eventImages = {};
    }
    
    // Obtener información del asiento con validaciones
    const seatId = seat?.id || seat?._id || seat?.seatId || seat?.seat_id || 'unknown';
    const zonaTxt = seat?.zonaNombre || seat?.nombreZona || (seat?.zona?.nombre) || (typeof seat?.zona === 'string' ? seat.zona : null) || seat?.zonaId || null;
    const mesaTxt = seat?.mesa || seat?.table || seat?.mesaNombre || (seat?.mesa?.nombre) || (typeof seat?.mesa === 'string' ? seat.mesa : null) || null;
    const filaTxt = seat?.fila || seat?.row || seat?.filaNombre || (seat?.fila?.nombre) || (typeof seat?.fila === 'string' ? seat.fila : null) || null;
    const asientoTxt = seat?.asiento || seat?.seat || seat?.asientoNombre || seat?.nombre || seat?.name || null;
    const precioTxt = seat?.price || seat?.precio || null;

    // Generar QR code único para este asiento
    console.log(`🖼️ [PDF] Generando código QR para asiento: ${seatId}`);
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
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      console.log(`✅ [PDF] Código QR generado para asiento: ${seatId}`);
    } catch (qrError) {
      console.error(`❌ [PDF] Error generando código QR para asiento ${seatId}:`, qrError);
      qrImageBytes = null;
    }

    // 1. NOMBRE DEL EVENTO (arriba, más espacio para texto largo)
    let eventTitle = null;
    try {
      const title = pdfExtras?.eventData?.nombre || payment?.event?.nombre || payment?.evento?.nombre || null;
      if (title) {
        eventTitle = title;
        // No truncar, permitir texto largo - usar múltiples líneas si es necesario
        const titleLines = [];
        const maxLineLength = 60;
        let currentLine = '';
        const words = cleanTextForPDF(title).split(' ');
        
        words.forEach(word => {
          if ((currentLine + ' ' + word).length <= maxLineLength) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
          } else {
            if (currentLine) titleLines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) titleLines.push(currentLine);
        
        // Dibujar el título comenzando desde arriba
        let titleY = height - 50;
        titleLines.forEach((line, index) => {
          if (index < 3) { // Máximo 3 líneas
            page.drawText(line, {
              x: 50,
              y: titleY - (index * 15),
              size: 14,
              color: rgb(0.1, 0.1, 0.1),
              font: helveticaBold,
            });
          }
        });
      } else {
        console.warn('⚠️ [PDF-PAGE] No hay título de evento disponible');
      }
    } catch (titleError) {
      console.warn('⚠️ [PDF] Error dibujando título del evento:', titleError.message);
    }

    // 2. IMAGEN SUPERIOR (logoHorizontal) o placeholder - Movida más abajo
    {
      const topImageWidth = 140;
      const topImageHeight = 42;
      const topX = 50;
      const topY = height - 120; // Más abajo para dar espacio al título
      if (eventImages.logoHorizontal) {
        page.drawImage(eventImages.logoHorizontal, {
          x: topX,
          y: topY,
          width: topImageWidth,
          height: topImageHeight,
        });
      } else {
        page.drawRectangle({ 
          x: topX, 
          y: topY, 
          width: topImageWidth, 
          height: topImageHeight, 
          color: rgb(0.95,0.95,0.95), 
          borderColor: rgb(0.8,0.8,0.8), 
          borderWidth: 1 
        });
        page.drawText('1', { 
          x: topX + topImageWidth/2 - 6, 
          y: topY + topImageHeight/2 - 8, 
          size: 16, 
          color: rgb(0.6,0.6,0.6), 
          font: helveticaBold 
        });
      }
    }

    // 3. TÍTULO DEL TICKET
    page.drawText('TICKET DE ENTRADA', {
      x: 200,
      y: height - 110,
      size: 22,
      color: rgb(0.1, 0.1, 0.1),
      font: helveticaBold,
    });

    // 2.2 Numeración de páginas (esquina superior derecha) - Formato: "1-3", "2-3", "3-3"
    const pageNumberText = `${currentPage}-${totalPages}`;
    const pageNumberWidth = helveticaFont.widthOfTextAtSize(pageNumberText, 11);
    page.drawText(pageNumberText, {
      x: width - pageNumberWidth - 50,
      y: height - 50,
      size: 11,
      color: rgb(0.4, 0.4, 0.4),
      font: helveticaBold,
    });

    // 3. DATOS PRINCIPALES (lado izquierdo) - Rediseñado con mejor organización
    let y = height - 160;
    
    // Caja de información principal con fondo
    const infoBoxY = y + 15;
    const infoBoxHeight = 80;
    page.drawRectangle({
      x: 45,
      y: infoBoxY - infoBoxHeight,
      width: 250,
      height: infoBoxHeight,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1.5,
      color: rgb(0.98, 0.98, 0.98),
    });
    
    // Localizador (dentro de la caja)
    page.drawText(`Localizador: ${cleanTextForPDF(payment.locator || locator || '')}`, { 
      x: 50, 
      y: infoBoxY - 25, 
      size: 12, 
      color: rgb(0,0,0), 
      font: helveticaBold 
    });

    // Monto (dentro de la caja)
    const montoNum = Number(payment.monto || payment.amount || 0);
    if (montoNum > 0) {
      page.drawText(`Monto Total: $${montoNum.toFixed(2)}`, { 
        x: 50, 
        y: infoBoxY - 50, 
        size: 11, 
        color: rgb(0.2,0.2,0.2), 
        font: helveticaFont 
      });
    }
    
    y = infoBoxY - infoBoxHeight - 20; // Continuar después de la caja

    // RECINTO - Información detallada (será movida al lado del QR de ubicación más abajo)
    // Por ahora solo guardamos la información para usarla más adelante
    let venueInfoText = '';
    if (venueData?.nombre) {
      console.log('📍 [PDF-PAGE] Mostrando información del recinto:', venueData.nombre);
      
      const direccionParts = [];
      if (venueData.nombre) direccionParts.push(`Nombre: ${venueData.nombre}`);
      if (venueData.direccion) direccionParts.push(`Direccion: ${venueData.direccion}`);
      if (venueData.ciudad) direccionParts.push(`Ciudad: ${venueData.ciudad}`);
      if (venueData.estado) direccionParts.push(`Estado: ${venueData.estado}`);
      if (venueData.codigopostal) direccionParts.push(`Codigo Postal: ${venueData.codigopostal}`);
      if (venueData.pais) direccionParts.push(`Pais: ${venueData.pais}`);
      
      venueInfoText = direccionParts.join('\n');
    } else {
      console.warn('⚠️ [PDF-PAGE] No hay datos de recinto disponibles');
    }

    // 4. QR CODE DEL ASIENTO (centro-derecho)
    const qrSize = 120;
    const qrX = width - qrSize - 50;
    const qrY = height - 220;
    
    if (qrImageBytes) {
      try {
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        page.drawImage(qrImage, {
          x: qrX,
          y: qrY,
          width: qrSize,
          height: qrSize,
        });

        page.drawText('CÓDIGO DE VALIDACIÓN', {
          x: qrX,
          y: qrY - 20,
          size: 12,
          color: rgb(0.1, 0.1, 0.1),
          font: helveticaBold
        });

        page.drawText('Escanea para validar entrada', {
          x: qrX,
          y: qrY - 35,
          size: 10,
          color: rgb(0.3,0.3,0.3),
          font: helveticaFont
        });
        
        // ID del asiento en texto debajo del QR (mismo contenido del QR)
        const qrDataText = JSON.stringify({
          seatId: seatId,
          paymentId: payment.id,
          locator: payment.locator || locator,
          timestamp: new Date().toISOString()
        });
        const seatIdText = cleanTextForPDF(qrDataText);
        // Dividir el texto en líneas si es muy largo
        const maxLineLength = 40;
        const lines = [];
        let currentLine = '';
        const words = seatIdText.split(' ');
        words.forEach(word => {
          if ((currentLine + ' ' + word).length <= maxLineLength) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) lines.push(currentLine);
        
        // Mostrar el texto debajo del QR
        let textY = qrY - qrSize - 20;
        lines.forEach((line, index) => {
          if (index < 4) { // Máximo 4 líneas
            page.drawText(line, {
              x: qrX - 10,
              y: textY - (index * 12),
              size: 8,
              color: rgb(0.2, 0.2, 0.2),
              font: helveticaFont
            });
          }
        });
      } catch (qrEmbedError) {
        console.error('❌ [PDF] Error embediendo QR en PDF:', qrEmbedError);
        page.drawRectangle({ 
          x: qrX, 
          y: qrY, 
          width: qrSize, 
          height: qrSize, 
          color: rgb(0.95,0.95,0.95), 
          borderColor: rgb(0.8,0.8,0.8), 
          borderWidth: 1 
        });
        page.drawText('QR', { 
          x: qrX + qrSize/2 - 10, 
          y: qrY + qrSize/2 - 8, 
          size: 16, 
          color: rgb(0.6,0.6,0.6), 
          font: helveticaBold 
        });
        // ID del asiento incluso si falla el QR (mismo contenido del QR)
        const qrDataText = JSON.stringify({
          seatId: seatId,
          paymentId: payment.id,
          locator: payment.locator || locator,
          timestamp: new Date().toISOString()
        });
        const seatIdText = cleanTextForPDF(qrDataText);
        const maxLineLength = 40;
        const lines = [];
        let currentLine = '';
        const words = seatIdText.split(' ');
        words.forEach(word => {
          if ((currentLine + ' ' + word).length <= maxLineLength) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        });
        if (currentLine) lines.push(currentLine);
        
        let textY = qrY - qrSize - 20;
        lines.forEach((line, index) => {
          if (index < 4) {
            page.drawText(line, {
              x: qrX - 10,
              y: textY - (index * 12),
              size: 8,
              color: rgb(0.2, 0.2, 0.2),
              font: helveticaFont
            });
          }
        });
      }
    }

    // 5. INFORMACIÓN DEL ASIENTO - Ya no se muestra aquí, se muestra al lado del QR de ubicación más abajo

    // 6. DETALLES DE LA FUNCIÓN - Información completa
    try {
      const funcion = pdfExtras?.funcionData || payment?.funcion || null;
      console.log(`📅 [PDF-PAGE] Datos de función:`, {
        hasFuncion: !!funcion,
        fecha_celebracion: funcion?.fecha_celebracion,
        apertura_puertas: funcion?.apertura_puertas,
        activo: funcion?.activo,
        recinto_id: funcion?.recinto_id
      });
      
      if (funcion?.fecha_celebracion) {
        y -= 10;
        try {
          const fechaCelebracion = new Date(funcion.fecha_celebracion);
          if (isNaN(fechaCelebracion.getTime())) {
            console.warn('⚠️ [PDF-PAGE] Fecha de celebración inválida:', funcion.fecha_celebracion);
            throw new Error('Fecha inválida');
          }
          
          const fecha = fechaCelebracion.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'UTC'
          });
          const hora = fechaCelebracion.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'UTC'
          });

          // Caja de información del evento
          const eventBoxStartY = y;
          const eventInfoCount = 2 + (funcion.apertura_puertas ? 1 : 0);
          const eventBoxHeight = 60 + (eventInfoCount * 20);
          
          page.drawRectangle({
            x: 45,
            y: y - eventBoxHeight,
            width: 350,
            height: eventBoxHeight,
            borderColor: rgb(0.4, 0.4, 0.4),
            borderWidth: 1.5,
            color: rgb(0.98, 0.98, 1.0),
          });
          
          // Línea decorativa
          page.drawLine({
            start: { x: 50, y: y - 5 },
            end: { x: 385, y: y - 5 },
            thickness: 2,
            color: rgb(0.25, 0.25, 0.25),
          });
          
          page.drawText('Informacion del Evento', { 
            x: 50, 
            y: y - 20, 
            size: 14, 
            color: rgb(0,0,0), 
            font: helveticaBold 
          });
          y -= 40;
          
          // Fecha
          page.drawText(`Fecha:`, { 
            x: 60, 
            y, 
            size: 11, 
            color: rgb(0.3,0.3,0.3), 
            font: helveticaBold 
          });
          page.drawText(cleanTextForPDF(fecha), { 
            x: 120, 
            y, 
            size: 11, 
            color: rgb(0.1,0.1,0.1), 
            font: helveticaFont 
          });
          y -= 20;
          
          // Hora de inicio (extraída de fecha_celebracion)
          page.drawText(`Hora de la funcion:`, { 
            x: 60, 
            y, 
            size: 11, 
            color: rgb(0.3,0.3,0.3), 
            font: helveticaBold 
          });
          page.drawText(cleanTextForPDF(hora), { 
            x: 180, 
            y, 
            size: 11, 
            color: rgb(0.1,0.1,0.1), 
            font: helveticaFont 
          });
          y -= 20;
        } catch (dateError) {
          console.error('❌ [PDF-PAGE] Error procesando fecha de celebración:', dateError.message);
          // Mostrar fecha sin formatear si falla el formateo
          page.drawText(`Fecha: ${cleanTextForPDF(String(funcion.fecha_celebracion || ''))}`, { 
            x: 60, 
            y, 
            size: 11, 
            color: rgb(0.2,0.2,0.2), 
            font: helveticaFont 
          });
          y -= 18;
        }
        
      // Hora de apertura si está disponible (apertura_puertas es timestamp)
      if (funcion.apertura_puertas) {
        try {
          const aperturaPuertas = new Date(funcion.apertura_puertas);
          if (!isNaN(aperturaPuertas.getTime())) {
            const horaApertura = aperturaPuertas.toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'UTC'
            });
            page.drawText(`Apertura de puertas:`, { 
              x: 60, 
              y, 
              size: 11, 
              color: rgb(0.3,0.3,0.3), 
              font: helveticaBold 
            });
            page.drawText(cleanTextForPDF(horaApertura), { 
              x: 180, 
              y, 
              size: 11, 
              color: rgb(0.1,0.1,0.1), 
              font: helveticaFont 
            });
            y -= 20;
          }
        } catch (err) {
          console.warn('⚠️ [PDF-PAGE] Error procesando apertura_puertas:', err.message);
        }
      }
      
      y = eventBoxStartY - eventBoxHeight - 15; // Continuar después de la caja
      } else {
        console.warn('⚠️ [PDF-PAGE] No hay datos de función disponibles para mostrar fecha/hora');
      }
    } catch (funcionError) {
      console.error('❌ [PDF-PAGE] Error procesando datos de función:', funcionError.message);
      console.error('❌ [PDF-PAGE] Stack:', funcionError.stack);
    }

    // 7. INFORMACIÓN DEL CLIENTE
    try {
      const customerName = payment.customer_name || payment.nombre_cliente || payment.user_name || null;
      const customerEmail = payment.customer_email || payment.email_cliente || payment.user_email || null;
      if (customerName || customerEmail) {
        y -= 10;
        page.drawText('Información del comprador:', { 
          x: 50, 
          y, 
          size: 14, 
          color: rgb(0,0,0), 
          font: helveticaBold 
        });
        y -= 20;
        if (customerName) {
          page.drawText(`Nombre: ${cleanTextForPDF(customerName)}`, { 
            x: 60, 
            y, 
            size: 11, 
            color: rgb(0.2,0.2,0.2), 
            font: helveticaFont 
          });
          y -= 18;
        }
        if (customerEmail) {
          page.drawText(`Email: ${cleanTextForPDF(customerEmail)}`, { 
            x: 60, 
            y, 
            size: 11, 
            color: rgb(0.2,0.2,0.2), 
            font: helveticaFont 
          });
          y -= 18;
        }
      }
    } catch {}

    // 8. QR DE UBICACIÓN (abajo a la izquierda) con información al lado
    if (venueData) {
      try {
        // Generar URL para el QR de ubicación
        let locationUrl = null;
        if (venueData.latitud && venueData.longitud) {
          // Si hay coordenadas, usar Google Maps con coordenadas
          locationUrl = `https://www.google.com/maps?q=${venueData.latitud},${venueData.longitud}`;
        } else {
          // Si no hay coordenadas, construir URL con dirección
          const direccionParts = [];
          if (venueData.direccion) direccionParts.push(venueData.direccion);
          if (venueData.ciudad) direccionParts.push(venueData.ciudad);
          if (venueData.estado) direccionParts.push(venueData.estado);
          if (venueData.pais) direccionParts.push(venueData.pais);
          
          if (direccionParts.length > 0) {
            locationUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionParts.join(', '))}`;
          }
        }
        
        if (locationUrl) {
          console.log('📍 [PDF-PAGE] Generando QR de ubicación:', locationUrl);
          const locationQrBytes = await QRCode.toBuffer(locationUrl, {
            type: 'image/png',
            width: 80,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          const locationQrImage = await pdfDoc.embedPng(locationQrBytes);
          const locationQrSize = 80;
          const locationQrX = 50;
          
          // Calcular altura necesaria para la información de ubicación
          let venueInfoLinesCount = 0;
          if (venueInfoText) {
            venueInfoLinesCount = Math.min(venueInfoText.split('\n').length, 6);
          }
          const venueInfoHeight = venueInfoLinesCount > 0 ? (venueInfoLinesCount * 11) + 5 : 0;
          
          // Calcular altura necesaria para la información de la entrada
          let seatInfoCount = 0;
          if (zonaTxt) seatInfoCount++;
          if (mesaTxt) seatInfoCount++;
          if (filaTxt) seatInfoCount++;
          if (asientoTxt) seatInfoCount++;
          if (precioTxt) seatInfoCount++;
          if (seatInfoCount === 0) seatInfoCount = 1;
          const seatInfoHeight = 25 + (seatInfoCount * 14);
          
          // La altura total de la caja de ubicación: texto arriba (20) + QR (80) + info abajo (venueInfoHeight)
          const ubicacionBoxHeight = 20 + locationQrSize + venueInfoHeight + 10;
          // La altura total será la mayor entre las dos cajas
          const totalBoxHeight = Math.max(ubicacionBoxHeight, seatInfoHeight);
          
          // Posición Y base para las cajas (desde abajo)
          const baseY = 80; // Posición base desde abajo de la página
          const locationBoxTopY = baseY + totalBoxHeight;
          const locationQrY = locationBoxTopY - locationQrSize - venueInfoHeight - 10;
          
          // Texto "Ubicacion" ARRIBA del QR (dentro de la caja, arriba)
          page.drawText('Ubicacion', {
            x: locationQrX + 5,
            y: locationBoxTopY - 15,
            size: 11,
            color: rgb(0.2, 0.2, 0.2),
            font: helveticaBold
          });
          
          // Caja para el QR de ubicación
          page.drawRectangle({
            x: 45,
            y: baseY,
            width: locationQrSize + 10,
            height: totalBoxHeight,
            borderColor: rgb(0.6, 0.6, 0.6),
            borderWidth: 1,
            color: rgb(1.0, 1.0, 1.0),
          });
          
          // Dibujar el QR (debajo del texto "Ubicacion")
          page.drawImage(locationQrImage, {
            x: locationQrX,
            y: locationQrY,
            width: locationQrSize,
            height: locationQrSize,
          });
          
          // Información de ubicación detallada DEBAJO del QR (dentro de la caja)
          if (venueInfoText) {
            const venueInfoLines = venueInfoText.split('\n');
            let venueInfoYPos = locationQrY - 10;
            venueInfoLines.forEach((line, index) => {
              if (index < 6) {
                page.drawText(cleanTextForPDF(line), {
                  x: locationQrX + 5,
                  y: venueInfoYPos,
                  size: 8,
                  color: rgb(0.3, 0.3, 0.3),
                  font: helveticaFont
                });
                venueInfoYPos -= 11;
              }
            });
          }
          
          // Información de la entrada al lado del QR de ubicación
          const infoX = locationQrX + locationQrSize + 30;
          const infoStartY = locationBoxTopY - 15;
          
          // Caja para información de la entrada
          const infoBoxWidth = width - infoX - 50;
          page.drawRectangle({
            x: infoX - 5,
            y: baseY,
            width: infoBoxWidth,
            height: totalBoxHeight,
            borderColor: rgb(0.5, 0.5, 0.5),
            borderWidth: 1,
            color: rgb(0.99, 0.99, 0.99),
          });
          
          page.drawText('Informacion de la Entrada', {
            x: infoX,
            y: infoStartY,
            size: 11,
            color: rgb(0.1, 0.1, 0.1),
            font: helveticaBold
          });
          
          // Mostrar información del asiento
          let infoYPos = infoStartY - 18;
          if (zonaTxt) {
            page.drawText(`Zona: ${cleanTextForPDF(zonaTxt)}`, {
              x: infoX,
              y: infoYPos,
              size: 9,
              color: rgb(0.2, 0.2, 0.2),
              font: helveticaFont
            });
            infoYPos -= 14;
          }
          if (mesaTxt) {
            page.drawText(`Mesa: ${cleanTextForPDF(mesaTxt)}`, {
              x: infoX,
              y: infoYPos,
              size: 9,
              color: rgb(0.2, 0.2, 0.2),
              font: helveticaFont
            });
            infoYPos -= 14;
          }
          if (filaTxt) {
            page.drawText(`Fila: ${cleanTextForPDF(filaTxt)}`, {
              x: infoX,
              y: infoYPos,
              size: 9,
              color: rgb(0.2, 0.2, 0.2),
              font: helveticaFont
            });
            infoYPos -= 14;
          }
          if (asientoTxt) {
            page.drawText(`Asiento: ${cleanTextForPDF(asientoTxt)}`, {
              x: infoX,
              y: infoYPos,
              size: 9,
              color: rgb(0.2, 0.2, 0.2),
              font: helveticaFont
            });
            infoYPos -= 14;
          }
          if (precioTxt) {
            page.drawText(`Precio: $${cleanTextForPDF(String(Number(precioTxt).toFixed(2)))}`, {
              x: infoX,
              y: infoYPos,
              size: 9,
              color: rgb(0.2, 0.2, 0.2),
              font: helveticaFont
            });
            infoYPos -= 14;
          }
          if (seatInfoCount === 0 || (!zonaTxt && !mesaTxt && !filaTxt && !asientoTxt && !precioTxt)) {
            page.drawText(`ID: ${cleanTextForPDF(String(seatId))}`, {
              x: infoX,
              y: infoYPos,
              size: 9,
              color: rgb(0.2, 0.2, 0.2),
              font: helveticaFont
            });
          }
        }
      } catch (locationQrError) {
        console.warn('⚠️ [PDF-PAGE] Error generando QR de ubicación:', locationQrError);
      }
    }

    // 9. IMAGEN INFERIOR (banner) - Bajada más para no solapar con QR e información
    {
      const bottomImageWidth = width - 200;
      const bottomImageHeight = 60; // Más pequeña
      const bx = 150;
      const by = 15; // Bajada más aún
      if (eventImages.banner) {
        page.drawImage(eventImages.banner, { 
          x: bx, 
          y: by, 
          width: bottomImageWidth, 
          height: bottomImageHeight 
        });
      } else if (eventImages.portada) {
        page.drawImage(eventImages.portada, { 
          x: bx, 
          y: by, 
          width: bottomImageWidth, 
          height: bottomImageHeight 
        });
      }
    }

    // 10. CONDICIONES - Mensaje personalizado según el origen (ajustado)
    const conditionsY = 60;
    page.drawRectangle({
      x: 45,
      y: conditionsY - 5,
      width: width - 90,
      height: 50,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
      color: rgb(0.98, 0.98, 0.98),
    });
    
    page.drawText('Condiciones:', { 
      x: 50, 
      y: conditionsY + 35, 
      size: 10, 
      color: rgb(0.2,0.2,0.2), 
      font: helveticaBold 
    });
    page.drawText('• Presenta este ticket en la entrada del evento.', { 
      x: 60, 
      y: conditionsY + 20, 
      size: 9, 
      color: rgb(0.2,0.2,0.2), 
      font: helveticaFont 
    });
    page.drawText('• El QR es único y será validado electrónicamente.', { 
      x: 60, 
      y: conditionsY + 8, 
      size: 9, 
      color: rgb(0.2,0.2,0.2), 
      font: helveticaFont 
    });
    
    // Mensaje adicional si viene de correo
    if (downloadSource === 'email') {
      page.drawText('• Este enlace fue enviado directamente a tu correo personal.', { 
        x: 60, 
        y: conditionsY - 4, 
        size: 8, 
        color: rgb(0.7,0.1,0.1), // Rojo para destacar
        font: helveticaBold 
      });
    } else {
      page.drawText('• No compartas tu ticket. Solo el primer escaneo será válido.', { 
        x: 60, 
        y: conditionsY - 4, 
        size: 8, 
        color: rgb(0.2,0.2,0.2), 
        font: helveticaFont 
      });
    }
  } catch (error) {
    console.error(`❌ [PDF-PAGE] Error en drawSeatPage para asiento ${seat?._id || 'unknown'}:`, error);
    console.error(`❌ [PDF-PAGE] Stack:`, error.stack);
    throw error; // Re-lanzar el error para que sea capturado por el manejador superior
  }
}

/**
 * Carga las imágenes del evento en el PDF document
 */
async function loadEventImages(pdfDoc, eventData, supabaseAdmin) {
  const eventImages = {};
  let venueData = null;

  try {
    console.log('🖼️ [PDF] loadEventImages llamado con eventData:', {
      hasEventData: !!eventData,
      hasImagenes: !!eventData?.imagenes,
      imagenesType: typeof eventData?.imagenes
    });
    
    if (eventData && eventData.imagenes) {
      let images;
      try {
        images = typeof eventData.imagenes === 'string'
          ? JSON.parse(eventData.imagenes)
          : eventData.imagenes;
        console.log('🖼️ [PDF] Imágenes parseadas:', Object.keys(images || {}));
      } catch (parseError) {
        console.error('❌ [PDF] Error parseando imágenes:', parseError.message);
        images = {};
      }

      const imageTypes = ['logoHorizontal', 'portada', 'banner'];
      for (const imageType of imageTypes) {
        if (images && images[imageType]) {
          try {
            // Intentar múltiples formas de obtener la URL
            const imageObj = images[imageType];
            let imageUrl = null;
            
            if (typeof imageObj === 'string') {
              // Si es una cadena, usar directamente
              imageUrl = imageObj;
            } else if (imageObj?.publicUrl) {
              imageUrl = imageObj.publicUrl;
            } else if (imageObj?.url) {
              imageUrl = imageObj.url;
            } else if (imageObj?.path) {
              // Si es un path de Supabase Storage, construir la URL pública
              // Esto asume que las imágenes están en un bucket público
              const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
              if (supabaseUrl && supabaseAdmin) {
                // Intentar obtener la URL pública desde Supabase Storage
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
              
              // Hacer la petición con timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
              
              try {
                const response = await fetch(imageUrl, {
                  signal: controller.signal,
                  headers: {
                    'User-Agent': 'Mozilla/5.0'
                  }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                  const imageBuffer = await response.arrayBuffer();
                  console.log(`✅ [PDF] ${imageType} descargado, tamaño:`, imageBuffer.byteLength, 'bytes');
                  
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
                } else {
                  console.warn(`⚠️ [PDF] Error HTTP al cargar ${imageType}:`, response.status, response.statusText);
                }
              } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                  console.warn(`⚠️ [PDF] Timeout al cargar ${imageType}`);
                } else {
                  console.warn(`⚠️ [PDF] Error fetch al cargar ${imageType}:`, fetchError.message);
                }
              }
            } else {
              console.warn(`⚠️ [PDF] No se pudo obtener URL para ${imageType}`);
            }
          } catch (imgError) {
            console.warn(`⚠️ [PDF] Error procesando ${imageType}:`, imgError.message);
            console.warn(`⚠️ [PDF] Stack:`, imgError.stack);
          }
        } else {
          console.log(`ℹ️ [PDF] No hay imagen ${imageType} disponible`);
        }
      }
    } else {
      console.warn('⚠️ [PDF] No hay imágenes en eventData');
    }

    // Cargar información del recinto con más datos
    // eventos tiene dos campos: recinto (integer) y recinto_id (integer, nullable)
    const recintoIdFromEvent = eventData?.recinto_id || eventData?.recinto;
    if (recintoIdFromEvent && supabaseAdmin) {
      const { data: rec, error: recErr } = await supabaseAdmin
        .from('recintos')
        .select('id, nombre, direccion, ciudad, estado, pais, codigopostal, capacidad')
        .eq('id', recintoIdFromEvent)
        .maybeSingle();
      if (!recErr && rec) {
        venueData = rec;
        console.log('✅ [PDF] Recinto obtenido:', rec.nombre);
      } else if (recErr) {
        console.error('❌ [PDF] Error obteniendo recinto:', recErr);
      }
    }
  } catch (imgError) {
    console.warn('⚠️ [PDF] Error procesando imágenes del evento:', imgError.message);
  }

  return { eventImages, venueData };
}

export { drawSeatPage, loadEventImages };

