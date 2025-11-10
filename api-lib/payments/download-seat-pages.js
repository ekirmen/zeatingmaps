import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { getSupabaseAdmin } from './config.js';

/**
 * Función auxiliar para dibujar una página de ticket para un asiento específico
 */
async function drawSeatPage(pdfDoc, page, payment, seat, eventImages, venueData, pdfExtras, helveticaFont, helveticaBold, locator, currentPage = 1, totalPages = 1) {
  const { width, height } = page.getSize();
  const downloadSource = pdfExtras.downloadSource || 'web'; // 'email' or 'web'
  
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
      // Truncar título si es muy largo
      const maxTitleLength = 50;
      const displayTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title;
      page.drawText(displayTitle, {
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

  // 3. DATOS PRINCIPALES (lado izquierdo) - Ajustado para no solapar con QR
  let y = height - 160;
  
  // Localizador
  page.drawText(`Localizador: ${payment.locator || locator}`, { 
    x: 50, 
    y, 
    size: 12, 
    color: rgb(0,0,0), 
    font: helveticaBold 
  });
  y -= 20;

  // Estado del pago
  page.drawText(`Estado: ${payment.status}`, { 
    x: 50, 
    y, 
    size: 11, 
    color: rgb(0.2,0.2,0.2), 
    font: helveticaFont 
  });
  y -= 18;

  // Monto
  const montoNum = Number(payment.monto || payment.amount || 0);
  if (montoNum > 0) {
    page.drawText(`Monto Total: $${montoNum.toFixed(2)}`, { 
      x: 50, 
      y, 
      size: 11, 
      color: rgb(0.2,0.2,0.2), 
      font: helveticaFont 
    });
    y -= 18;
  }

  // Método de pago
  try {
    const pm = payment.payment_method || (Array.isArray(payment.payments) && payment.payments[0]?.method) || null;
    if (pm) {
      page.drawText(`Método: ${pm}`, { 
        x: 50, 
        y, 
        size: 10, 
        color: rgb(0.3,0.3,0.3), 
        font: helveticaFont 
      });
      y -= 16;
    }
  } catch {}
  
  y -= 10; // Espacio antes de la ubicación

  // RECINTO - Información completa
  if (venueData?.nombre) {
    page.drawText('Ubicación:', { 
      x: 50, 
      y, 
      size: 14, 
      color: rgb(0,0,0), 
      font: helveticaBold 
    });
    y -= 20;
    
    page.drawText(`Recinto: ${venueData.nombre}`, { 
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
    if (venueData.codigo_postal) direccionParts.push(venueData.codigo_postal);
    if (venueData.pais) direccionParts.push(venueData.pais);
    
    if (direccionParts.length > 0) {
      page.drawText(direccionParts.join(', '), { 
        x: 60, 
        y, 
        size: 11, 
        color: rgb(0.3,0.3,0.3), 
        font: helveticaFont 
      });
      y -= 18;
    }
    
    // Teléfono si está disponible
    if (venueData.telefono) {
      page.drawText(`Teléfono: ${venueData.telefono}`, { 
        x: 60, 
        y, 
        size: 10, 
        color: rgb(0.4,0.4,0.4), 
        font: helveticaFont 
      });
      y -= 16;
    }
    
    // Capacidad si está disponible
    if (venueData.capacidad) {
      page.drawText(`Capacidad: ${venueData.capacidad} personas`, { 
        x: 60, 
        y, 
        size: 10, 
        color: rgb(0.4,0.4,0.4), 
        font: helveticaFont 
      });
      y -= 16;
    }
    
    y -= 5; // Espacio adicional
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

  // 5. INFORMACIÓN DEL ASIENTO (lado izquierdo) - Mejorada
  page.drawText('Información de la Entrada:', { 
    x: 50, 
    y, 
    size: 14, 
    color: rgb(0,0,0), 
    font: helveticaBold 
  });
  y -= 20;

  let seatInfo = [];
  if (zonaTxt) seatInfo.push({ label: 'Zona', value: zonaTxt });
  if (mesaTxt) seatInfo.push({ label: 'Mesa', value: mesaTxt });
  if (filaTxt) seatInfo.push({ label: 'Fila', value: filaTxt });
  if (asientoTxt) seatInfo.push({ label: 'Asiento', value: asientoTxt });
  if (precioTxt) seatInfo.push({ label: 'Precio', value: `$${Number(precioTxt).toFixed(2)}` });

  if (seatInfo.length === 0) {
    seatInfo.push({ label: 'ID', value: seatId });
  }

  seatInfo.forEach((info) => {
    page.drawText(`${info.label}: ${info.value}`, { 
      x: 60, 
      y, 
      size: 12, 
      color: rgb(0.2,0.2,0.2), 
      font: helveticaFont 
    });
    y -= 18;
  });
  
  // Información adicional del evento si está disponible
  try {
    const eventData = pdfExtras.eventData || payment.event || null;
    if (eventData) {
      // Categoría del evento
      if (eventData.categoria) {
        page.drawText(`Categoría: ${eventData.categoria}`, { 
          x: 60, 
          y, 
          size: 10, 
          color: rgb(0.4,0.4,0.4), 
          font: helveticaFont 
        });
        y -= 16;
      }
      
      // Tipo de evento
      if (eventData.tipo) {
        page.drawText(`Tipo: ${eventData.tipo}`, { 
          x: 60, 
          y, 
          size: 10, 
          color: rgb(0.4,0.4,0.4), 
          font: helveticaFont 
        });
        y -= 16;
      }
    }
  } catch {}
  
  y -= 5; // Espacio adicional

  // 6. DETALLES DE LA FUNCIÓN - Información completa
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
        minute: '2-digit',
        timeZoneName: 'short'
      });

      page.drawText('Información del Evento:', { 
        x: 50, 
        y, 
        size: 14, 
        color: rgb(0,0,0), 
        font: helveticaBold 
      });
      y -= 20;
      
      // Fecha
      page.drawText(`Fecha: ${fecha}`, { 
        x: 60, 
        y, 
        size: 11, 
        color: rgb(0.2,0.2,0.2), 
        font: helveticaFont 
      });
      y -= 18;
      
      // Hora de inicio (extraída de fecha_celebracion)
      page.drawText(`Hora: ${hora}`, { 
        x: 60, 
        y, 
        size: 11, 
        color: rgb(0.2,0.2,0.2), 
        font: helveticaFont 
      });
      y -= 18;
      
      // Hora de apertura si está disponible (puede ser un campo separado o parte de fecha_celebracion)
      if (funcion.hora_apertura) {
        try {
          // Si hora_apertura es un string de hora (HH:MM) o una fecha completa
          let horaApertura = funcion.hora_apertura;
          if (typeof horaApertura === 'string' && horaApertura.includes('T')) {
            // Es una fecha completa
            horaApertura = new Date(horaApertura).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }
          page.drawText(`Apertura de puertas: ${horaApertura}`, { 
            x: 60, 
            y, 
            size: 10, 
            color: rgb(0.3,0.3,0.3), 
            font: helveticaFont 
          });
          y -= 16;
        } catch (err) {
          // Si falla, intentar mostrar como string directo
          try {
            page.drawText(`Apertura: ${funcion.hora_apertura}`, { 
              x: 60, 
              y, 
              size: 10, 
              color: rgb(0.3,0.3,0.3), 
              font: helveticaFont 
            });
            y -= 16;
          } catch {}
        }
      }
      
      // Hora de inicio adicional si está disponible y es diferente de fecha_celebracion
      if (funcion.hora_inicio && funcion.hora_inicio !== funcion.fecha_celebracion) {
        try {
          let horaInicio = funcion.hora_inicio;
          if (typeof horaInicio === 'string' && horaInicio.includes('T')) {
            horaInicio = new Date(horaInicio).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }
          page.drawText(`Inicio: ${horaInicio}`, { 
            x: 60, 
            y, 
            size: 10, 
            color: rgb(0.3,0.3,0.3), 
            font: helveticaFont 
          });
          y -= 16;
        } catch {}
      }
      
      // Estado de la función si está disponible
      if (funcion.estado) {
        page.drawText(`Estado: ${funcion.estado}`, { 
          x: 60, 
          y, 
          size: 10, 
          color: rgb(0.3,0.3,0.3), 
          font: helveticaFont 
        });
        y -= 16;
      }
      
      y -= 5; // Espacio adicional
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

  // 9. CONDICIONES - Mensaje personalizado según el origen
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
  
  // Mensaje adicional si viene de correo
  if (downloadSource === 'email') {
    page.drawText('• Este enlace fue enviado directamente a tu correo personal.', { 
      x: 60, 
      y: 61, 
      size: 9, 
      color: rgb(0.7,0.1,0.1), // Rojo para destacar
      font: helveticaBold 
    });
    page.drawText('• No compartas este enlace. Solo el primer escaneo será válido.', { 
      x: 60, 
      y: 49, 
      size: 9, 
      color: rgb(0.2,0.2,0.2), 
      font: helveticaFont 
    });
  } else {
    page.drawText('• No compartas tu ticket. Solo el primer escaneo será válido.', { 
      x: 60, 
      y: 61, 
      size: 9, 
      color: rgb(0.2,0.2,0.2), 
      font: helveticaFont 
    });
  }
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

    // Cargar información del recinto con más datos
    if (eventData?.recinto_id && supabaseAdmin) {
      const { data: rec, error: recErr } = await supabaseAdmin
        .from('recintos')
        .select('id, nombre, direccion, ciudad, estado, pais, codigo_postal, telefono, capacidad')
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

