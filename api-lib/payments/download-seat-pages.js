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

    // 1. IMAGEN SUPERIOR (logoHorizontal) o placeholder
    {
      const topImageWidth = 140;
      const topImageHeight = 42;
      const topX = 50;
      const topY = height - 120;
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

    // 2. TÍTULO DEL TICKET
    page.drawText('TICKET DE ENTRADA', {
      x: 200,
      y: height - 80,
      size: 22,
      color: rgb(0.1, 0.1, 0.1),
      font: helveticaBold,
    });

    // 2.1 Nombre del evento
    let eventTitle = null;
    try {
      const title = pdfExtras?.eventData?.nombre || payment?.event?.nombre || payment?.evento?.nombre || null;
      if (title) {
        eventTitle = title;
        // Truncar título si es muy largo
        const maxTitleLength = 50;
        const displayTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title;
        page.drawText(cleanTextForPDF(displayTitle), {
          x: 200,
          y: height - 100,
          size: 12,
          color: rgb(0.15, 0.15, 0.15),
          font: helveticaFont,
        });
      } else {
        console.warn('⚠️ [PDF-PAGE] No hay título de evento disponible');
      }
    } catch (titleError) {
      console.warn('⚠️ [PDF] Error dibujando título del evento:', titleError.message);
    }

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

    // RECINTO - Información completa con caja de diseño
    if (venueData?.nombre) {
      console.log('📍 [PDF-PAGE] Mostrando información del recinto:', venueData.nombre);
      
      // Caja de ubicación con fondo
      const venueBoxStartY = y;
      const venueBoxHeight = 90;
      page.drawRectangle({
        x: 45,
        y: y - venueBoxHeight,
        width: 350,
        height: venueBoxHeight,
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 1.5,
        color: rgb(0.97, 0.97, 0.98),
      });
      
      // Línea decorativa arriba del título
      page.drawLine({
        start: { x: 50, y: y - 5 },
        end: { x: 385, y: y - 5 },
        thickness: 2,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      page.drawText('Ubicacion', { 
        x: 50, 
        y: y - 20, 
        size: 14, 
        color: rgb(0,0,0), 
        font: helveticaBold 
      });
      y -= 35;
      
      page.drawText(cleanTextForPDF(venueData.nombre || ''), { 
        x: 60, 
        y, 
        size: 12, 
        color: rgb(0.1,0.1,0.1), 
        font: helveticaBold 
      });
      y -= 18;
      
      // Dirección completa
      const direccionParts = [];
      if (venueData.direccion) direccionParts.push(venueData.direccion);
      if (venueData.ciudad) direccionParts.push(venueData.ciudad);
      if (venueData.estado) direccionParts.push(venueData.estado);
      // Nota: El campo es codigopostal (sin guión), no codigo_postal
      if (venueData.codigopostal) direccionParts.push(venueData.codigopostal);
      if (venueData.pais) direccionParts.push(venueData.pais);
      
      if (direccionParts.length > 0) {
        page.drawText(cleanTextForPDF(direccionParts.join(', ')), { 
          x: 60, 
          y, 
          size: 11, 
          color: rgb(0.3,0.3,0.3), 
          font: helveticaFont 
        });
        y -= 18;
      }
      
      y = venueBoxStartY - venueBoxHeight - 15; // Continuar después de la caja
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
      }
    }

    // 5. INFORMACIÓN DEL ASIENTO (lado izquierdo) - Mejorada con caja
    const seatBoxStartY = y;
    
    let seatInfo = [];
    if (zonaTxt) seatInfo.push({ label: 'Zona', value: zonaTxt });
    if (mesaTxt) seatInfo.push({ label: 'Mesa', value: mesaTxt });
    if (filaTxt) seatInfo.push({ label: 'Fila', value: filaTxt });
    if (asientoTxt) seatInfo.push({ label: 'Asiento', value: asientoTxt });
    if (precioTxt) seatInfo.push({ label: 'Precio', value: `$${Number(precioTxt).toFixed(2)}` });

    if (seatInfo.length === 0) {
      seatInfo.push({ label: 'ID', value: seatId });
    }
    
    const calculatedSeatBoxHeight = 60 + (seatInfo.length * 20);
    
    // Caja de información del asiento
    page.drawRectangle({
      x: 45,
      y: y - calculatedSeatBoxHeight,
      width: 350,
      height: calculatedSeatBoxHeight,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1.5,
      color: rgb(0.99, 0.99, 0.99),
    });
    
    // Línea decorativa
    page.drawLine({
      start: { x: 50, y: y - 5 },
      end: { x: 385, y: y - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    page.drawText('Informacion de la Entrada', { 
      x: 50, 
      y: y - 20, 
      size: 14, 
      color: rgb(0,0,0), 
      font: helveticaBold 
    });
    y -= 40;

    seatInfo.forEach((info) => {
      page.drawText(`${info.label}:`, { 
        x: 60, 
        y, 
        size: 11, 
        color: rgb(0.3,0.3,0.3), 
        font: helveticaBold 
      });
      page.drawText(cleanTextForPDF(info.value || ''), { 
        x: 130, 
        y, 
        size: 11, 
        color: rgb(0.1,0.1,0.1), 
        font: helveticaFont 
      });
      y -= 20;
    });
    
    y = seatBoxStartY - calculatedSeatBoxHeight - 15;
    
      // Información adicional del evento si está disponible
      try {
        const eventData = pdfExtras?.eventData || payment?.event || null;
        if (eventData) {
          // Tags del evento (si está disponible)
          if (eventData.tags) {
            try {
              const tags = typeof eventData.tags === 'string' ? JSON.parse(eventData.tags) : eventData.tags;
              if (Array.isArray(tags) && tags.length > 0) {
                page.drawText(`Tags: ${cleanTextForPDF(tags.join(', '))}`, { 
                  x: 60, 
                  y, 
                  size: 10, 
                  color: rgb(0.4,0.4,0.4), 
                  font: helveticaFont 
                });
                y -= 16;
              }
            } catch (tagsError) {
              // Si tags es un string simple, mostrarlo directamente
              if (typeof eventData.tags === 'string') {
                page.drawText(`Tags: ${cleanTextForPDF(eventData.tags)}`, { 
                  x: 60, 
                  y, 
                  size: 10, 
                  color: rgb(0.4,0.4,0.4), 
                  font: helveticaFont 
                });
                y -= 16;
              }
            }
          }
        }
      } catch {}
    
    y -= 5; // Espacio adicional

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

    // 8. QR DE UBICACIÓN (abajo a la izquierda)
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
          const locationQrY = 120;
          
          // Caja para el QR de ubicación
          page.drawRectangle({
            x: 45,
            y: locationQrY - 5,
            width: locationQrSize + 10,
            height: locationQrSize + 25,
            borderColor: rgb(0.6, 0.6, 0.6),
            borderWidth: 1,
            color: rgb(1.0, 1.0, 1.0),
          });
          
          page.drawImage(locationQrImage, {
            x: locationQrX,
            y: locationQrY,
            width: locationQrSize,
            height: locationQrSize,
          });
          
          page.drawText('Ubicacion', {
            x: locationQrX + 10,
            y: locationQrY - 15,
            size: 9,
            color: rgb(0.2, 0.2, 0.2),
            font: helveticaBold
          });
        }
      } catch (locationQrError) {
        console.warn('⚠️ [PDF-PAGE] Error generando QR de ubicación:', locationQrError);
      }
    }

    // 9. IMAGEN INFERIOR (banner) - Ajustada para no solapar con QR de ubicación
    {
      const bottomImageWidth = width - 200; // Reducido para dejar espacio al QR
      const bottomImageHeight = 80;
      const bx = 150; // Movido a la derecha
      const by = 140;
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

