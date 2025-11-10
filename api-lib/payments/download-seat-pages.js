import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { getSupabaseAdmin } from './config.js';

/**
 * Función auxiliar para dibujar una página de ticket para un asiento específico
 */
async function drawSeatPage(pdfDoc, page, payment, seat, eventImages, venueData, pdfExtras, helveticaFont, helveticaBold, locator) {
  const { width, height } = page.getSize();
  
  // Obtener información del asiento
  const seatId = seat.id || seat._id || seat.seatId || seat.seat_id || 'unknown';
  const zonaTxt = seat.zonaNombre || seat.nombreZona || (seat.zona?.nombre) || (typeof seat.zona === 'string' ? seat.zona : null) || seat.zonaId || null;
  const mesaTxt = seat.mesa || seat.table || seat.mesaNombre || (seat.mesa?.nombre) || (typeof seat.mesa === 'string' ? seat.mesa : null) || null;
  const filaTxt = seat.fila || seat.row || seat.filaNombre || (seat.fila?.nombre) || (typeof seat.fila === 'string' ? seat.fila : null) || null;
  const asientoTxt = seat.asiento || seat.seat || seat.asientoNombre || seat.nombre || seat.name || null;
  const precioTxt = seat.price || seat.precio || null;

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
    const title = pdfExtras.eventData?.nombre || payment.event?.nombre || payment.evento?.nombre || null;
    if (title) {
      eventTitle = title;
      page.drawText(title, {
        x: 200,
        y: height - 100,
        size: 12,
        color: rgb(0.15, 0.15, 0.15),
        font: helveticaFont,
      });
    }
  } catch (titleError) {
    console.warn('⚠️ [PDF] Error dibujando título del evento:', titleError.message);
  }

  // 3. DATOS PRINCIPALES (lado izquierdo)
  let y = height - 140;
  page.drawText(`Localizador: ${payment.locator || locator}`, { 
    x: 50, 
    y, 
    size: 13, 
    color: rgb(0,0,0), 
    font: helveticaFont 
  });
  y -= 25;

  page.drawText(`Estado: ${payment.status}`, { 
    x: 50, 
    y, 
    size: 13, 
    color: rgb(0,0,0), 
    font: helveticaFont 
  });
  y -= 25;

  const montoNum = Number(payment.monto || payment.amount || 0);
  if (montoNum > 0) {
    page.drawText(`Monto: $${montoNum.toFixed(2)}`, { 
      x: 50, 
      y, 
      size: 13, 
      color: rgb(0,0,0), 
      font: helveticaFont 
    });
    y -= 25;
  }

  // Método de pago
  try {
    const pm = payment.payment_method || (Array.isArray(payment.payments) && payment.payments[0]?.method) || null;
    if (pm) {
      page.drawText(`Método de pago: ${pm}`, { 
        x: 50, 
        y, 
        size: 12, 
        color: rgb(0.1,0.1,0.1), 
        font: helveticaFont 
      });
      y -= 20;
    }
  } catch {}

  // RECINTO
  if (venueData?.nombre) {
    page.drawText(`Recinto: ${venueData.nombre}`, { 
      x: 50, 
      y, 
      size: 12, 
      color: rgb(0.1,0.1,0.1), 
      font: helveticaBold 
    });
    y -= 18;
    const direccion = [venueData.direccion, venueData.ciudad, venueData.pais].filter(Boolean).join(', ');
    if (direccion) {
      page.drawText(direccion, { 
        x: 50, 
        y, 
        size: 11, 
        color: rgb(0.3,0.3,0.3), 
        font: helveticaFont 
      });
      y -= 20;
    }
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

  // 5. INFORMACIÓN DEL ASIENTO (lado izquierdo)
  page.drawText('Asiento:', { 
    x: 50, 
    y, 
    size: 14, 
    color: rgb(0,0,0), 
    font: helveticaBold 
  });
  y -= 25;

  let seatInfo = [];
  if (zonaTxt) seatInfo.push(`Zona: ${zonaTxt}`);
  if (mesaTxt) seatInfo.push(`Mesa: ${mesaTxt}`);
  if (filaTxt) seatInfo.push(`Fila: ${filaTxt}`);
  if (asientoTxt) seatInfo.push(`Asiento: ${asientoTxt}`);
  if (precioTxt) seatInfo.push(`Precio: $${Number(precioTxt).toFixed(2)}`);

  if (seatInfo.length === 0) {
    seatInfo.push(`ID: ${seatId}`);
  }

  seatInfo.forEach((info) => {
    page.drawText(info, { 
      x: 60, 
      y, 
      size: 12, 
      color: rgb(0.2,0.2,0.2), 
      font: helveticaFont 
    });
    y -= 20;
  });

  // 6. DETALLES DE LA FUNCIÓN
  try {
    const funcion = pdfExtras.funcionData || payment.funcion || null;
    if (funcion?.fecha_celebracion) {
      y -= 10;
      const fechaCelebracion = new Date(funcion.fecha_celebracion);
      const fecha = fechaCelebracion.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const hora = fechaCelebracion.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      page.drawText('Detalles del evento:', { 
        x: 50, 
        y, 
        size: 14, 
        color: rgb(0,0,0), 
        font: helveticaBold 
      });
      y -= 20;
      page.drawText(`Fecha: ${fecha}`, { 
        x: 60, 
        y, 
        size: 11, 
        color: rgb(0.2,0.2,0.2), 
        font: helveticaFont 
      });
      y -= 18;
      page.drawText(`Hora: ${hora}`, { 
        x: 60, 
        y, 
        size: 11, 
        color: rgb(0.2,0.2,0.2), 
        font: helveticaFont 
      });
      y -= 18;
    }
  } catch {}

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
        page.drawText(`Nombre: ${customerName}`, { 
          x: 60, 
          y, 
          size: 11, 
          color: rgb(0.2,0.2,0.2), 
          font: helveticaFont 
        });
        y -= 18;
      }
      if (customerEmail) {
        page.drawText(`Email: ${customerEmail}`, { 
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

  // 8. IMAGEN INFERIOR (banner)
  {
    const bottomImageWidth = width - 100;
    const bottomImageHeight = 100;
    const bx = 50;
    const by = 150;
    if (eventImages.banner) {
      page.drawImage(eventImages.banner, { 
        x: bx, 
        y: by, 
        width: bottomImageWidth, 
        height: bottomImageHeight 
      });
    } else {
      page.drawRectangle({ 
        x: bx, 
        y: by, 
        width: bottomImageWidth, 
        height: bottomImageHeight, 
        color: rgb(0.95,0.95,0.95), 
        borderColor: rgb(0.8,0.8,0.8), 
        borderWidth: 1 
      });
      page.drawText('3', { 
        x: bx + bottomImageWidth/2 - 8, 
        y: by + bottomImageHeight/2 - 10, 
        size: 20, 
        color: rgb(0.6,0.6,0.6), 
        font: helveticaBold 
      });
    }
  }

  // 9. CONDICIONES
  page.drawText('Condiciones:', { 
    x: 50, 
    y: 100, 
    size: 10, 
    color: rgb(0.2,0.2,0.2), 
    font: helveticaBold 
  });
  page.drawText('• Presenta este ticket en la entrada del evento.', { 
    x: 60, 
    y: 85, 
    size: 9, 
    color: rgb(0.2,0.2,0.2), 
    font: helveticaFont 
  });
  page.drawText('• El QR es único y será validado electrónicamente.', { 
    x: 60, 
    y: 73, 
    size: 9, 
    color: rgb(0.2,0.2,0.2), 
    font: helveticaFont 
  });
  page.drawText('• No compartas tu ticket. Solo el primer escaneo será válido.', { 
    x: 60, 
    y: 61, 
    size: 9, 
    color: rgb(0.2,0.2,0.2), 
    font: helveticaFont 
  });
}

/**
 * Carga las imágenes del evento en el PDF document
 */
async function loadEventImages(pdfDoc, eventData, supabaseAdmin) {
  const eventImages = {};
  let venueData = null;

  try {
    if (eventData && eventData.imagenes) {
      const images = typeof eventData.imagenes === 'string'
        ? JSON.parse(eventData.imagenes)
        : eventData.imagenes;

      const imageTypes = ['logoHorizontal', 'portada', 'banner'];
      for (const imageType of imageTypes) {
        if (images[imageType]) {
          try {
            const imageUrl = images[imageType].publicUrl || images[imageType].url;
            if (imageUrl) {
              console.log(`🖼️ [PDF] Cargando ${imageType}:`, imageUrl);
              const response = await fetch(imageUrl);
              if (response.ok) {
                const imageBuffer = await response.arrayBuffer();
                try {
                  eventImages[imageType] = await pdfDoc.embedPng(imageBuffer);
                  console.log(`✅ [PDF] ${imageType} cargado como PNG`);
                } catch (pngError) {
                  try {
                    eventImages[imageType] = await pdfDoc.embedJpg(imageBuffer);
                    console.log(`✅ [PDF] ${imageType} cargado como JPEG`);
                  } catch (jpgError) {
                    console.warn(`⚠️ [PDF] ${imageType} no es PNG ni JPEG`);
                  }
                }
              }
            }
          } catch (imgError) {
            console.warn(`⚠️ [PDF] Error cargando ${imageType}:`, imgError.message);
          }
        }
      }
    }

    // Cargar información del recinto
    if (eventData?.recinto_id && supabaseAdmin) {
      const { data: rec, error: recErr } = await supabaseAdmin
        .from('recintos')
        .select('id, nombre, direccion, ciudad, pais')
        .eq('id', eventData.recinto_id)
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

