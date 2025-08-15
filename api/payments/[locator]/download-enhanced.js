import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  console.log('Enhanced Download endpoint called with method:', req.method);
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator } = req.query;
  if (!locator) {
    console.error('Missing locator in query params');
    return res.status(400).json({ error: 'Missing locator' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    console.error('Missing auth token in headers');
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    // Verify the user token
    const userResp = await supabaseAdmin?.auth?.getUser?.(token);
    const user = userResp?.data?.user || null;
    const userError = userResp?.error || null;
    if (userError || !user) {
      console.error('Auth error:', userError);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get comprehensive payment data with images
    console.log('Searching for payment with locator:', locator);
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        funcion:funciones(
          *,
          evento:eventos(
            *,
            recinto:recintos(
              *,
              imagenes:recinto_imagenes(*)
            ),
            imagenes:evento_imagenes(*)
          )
        ),
        seats:zeatingmaps(
          *,
          zona:zonas(
            *
          )
        ),
        usuario:profiles(
          *
        )
      `)
      .eq('locator', locator)
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!payment) {
      console.error('Payment not found for locator:', locator);
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    console.log('Payment found:', payment);

    // --- GENERAR QR ---
    const qrText = `https://tusitio.com/validar-ticket/${payment.locator}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, { 
      margin: 1, 
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");

    // --- CREAR PDF ---
    const pdfDoc = await PDFDocument.create();
    
    // Agregar fuentes estándar
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // --- HEADER CON IMAGEN DEL EVENTO ---
    const headerHeight = 150;
    
    // Fondo del header con gradiente
    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width: width,
      height: headerHeight,
      color: rgb(0.1, 0.1, 0.4)
    });

    // Imagen del evento (si existe)
    let eventImage = null;
    if (payment.funcion?.evento?.imagenes && payment.funcion.evento.imagenes.length > 0) {
      try {
        const imageUrl = payment.funcion.evento.imagenes[0].url;
        if (imageUrl) {
          const imageResponse = await fetch(imageUrl);
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer();
            eventImage = await pdfDoc.embedJpg(imageBuffer);
          }
        }
      } catch (imgError) {
        console.log('Could not load event image:', imgError);
      }
    }

    // Si hay imagen del evento, mostrarla
    if (eventImage) {
      const imgWidth = 200;
      const imgHeight = 120;
      page.drawImage(eventImage, {
        x: 50,
        y: height - headerHeight + 15,
        width: imgWidth,
        height: imgHeight,
      });
    }

    // Título principal
    const titleX = eventImage ? 270 : 50;
    page.drawText('TICKET DE ENTRADA', {
      x: titleX,
      y: height - 50,
      size: 28,
      font: helveticaBold,
      color: rgb(1, 1, 1)
    });

    // Subtítulo
    page.drawText('Evento Especial', {
      x: titleX,
      y: height - 80,
      size: 16,
      font: helveticaFont,
      color: rgb(0.9, 0.9, 0.9)
    });

    // Logo/Imagen del evento (placeholder por ahora)
    page.drawText('🎫', {
      x: width - 80,
      y: height - 60,
      size: 40,
      font: helveticaFont,
      color: rgb(1, 1, 1)
    });

    // --- INFORMACIÓN DEL EVENTO ---
    let y = height - headerHeight - 30;
    
    // Sección del evento
    page.drawRectangle({
      x: 30,
      y: y - 80,
      width: width - 60,
      height: 80,
      color: rgb(0.95, 0.95, 0.95)
    });

    page.drawText('INFORMACIÓN DEL EVENTO', {
      x: 50,
      y: y - 20,
      size: 18,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.3)
    });

    if (payment.funcion?.evento) {
      const evento = payment.funcion.evento;
      page.drawText(`🎭 ${evento.nombre || 'Evento'}`, {
        x: 60,
        y: y - 45,
        size: 14,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2)
      });

      if (payment.funcion.fecha_celebracion) {
        const fecha = new Date(payment.funcion.fecha_celebracion);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        page.drawText(`📅 ${fechaFormateada}`, {
          x: 60,
          y: y - 65,
          size: 12,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3)
        });
      }

      if (payment.funcion.hora_inicio) {
        page.drawText(`🕐 ${payment.funcion.hora_inicio}`, {
          x: 60,
          y: y - 80,
          size: 12,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3)
        });
      }
    }

    y -= 120;

    // --- INFORMACIÓN DEL RECINTO CON IMAGEN ---
    if (payment.funcion?.evento?.recinto) {
      const recinto = payment.funcion.evento.recinto;
      const recintoHeight = 100;
      
      page.drawRectangle({
        x: 30,
        y: y - recintoHeight,
        width: width - 60,
        height: recintoHeight,
        color: rgb(0.9, 0.95, 1)
      });

      // Imagen del recinto (si existe)
      let venueImage = null;
      if (recinto.imagenes && recinto.imagenes.length > 0) {
        try {
          const imageUrl = recinto.imagenes[0].url;
          if (imageUrl) {
            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer();
              venueImage = await pdfDoc.embedJpg(imageBuffer);
            }
          }
        } catch (imgError) {
          console.log('Could not load venue image:', imgError);
        }
      }

      // Si hay imagen del recinto, mostrarla
      if (venueImage) {
        const imgWidth = 120;
        const imgHeight = 80;
        page.drawImage(venueImage, {
          x: 50,
          y: y - recintoHeight + 10,
          width: imgWidth,
          height: imgHeight,
        });
      }

      page.drawText('📍 UBICACIÓN', {
        x: venueImage ? 190 : 50,
        y: y - 20,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.3)
      });

      page.drawText(`🏛️ ${recinto.nombre || 'Recinto'}`, {
        x: venueImage ? 200 : 60,
        y: y - 40,
        size: 12,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2)
      });

      if (recinto.direccion) {
        page.drawText(`📍 ${recinto.direccion}`, {
          x: venueImage ? 200 : 60,
          y: y - 55,
          size: 11,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3)
        });
      }

      if (recinto.telefono) {
        page.drawText(`📞 ${recinto.telefono}`, {
          x: venueImage ? 200 : 60,
          y: y - 70,
          size: 11,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3)
        });
      }

      y -= recintoHeight + 20;
    }

    // --- DETALLES DEL TICKET ---
    page.drawRectangle({
      x: 30,
      y: y - 100,
      width: width - 60,
      height: 100,
      color: rgb(1, 0.95, 0.9)
    });

    page.drawText('🎫 DETALLES DEL TICKET', {
      x: 50,
      y: y - 20,
      size: 16,
      font: helveticaBold,
      color: rgb(0.3, 0.2, 0.1)
    });

    page.drawText(`🔢 Localizador: ${payment.locator}`, {
      x: 60,
      y: y - 40,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.2, 0.1)
    });

    page.drawText(`📊 Estado: ${payment.status === 'pagado' ? '✅ PAGADO' : '⏳ PENDIENTE'}`, {
      x: 60,
      y: y - 55,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.2, 0.1)
    });

    if (payment.amount) {
      page.drawText(`💰 Total: $${payment.amount.toFixed(2)}`, {
        x: 60,
        y: y - 70,
        size: 12,
        font: helveticaFont,
        color: rgb(0.3, 0.2, 0.1)
      });
    }

    const fechaCreacion = new Date(payment.created_at).toLocaleString('es-ES');
    page.drawText(`📅 Comprado: ${fechaCreacion}`, {
      x: 60,
      y: y - 85,
      size: 11,
      font: helveticaFont,
      color: rgb(0.4, 0.3, 0.2)
    });

    y -= 120;

    // --- ASIENTOS ---
    if (payment.seats && payment.seats.length > 0) {
      const seatsHeight = Math.max(80, payment.seats.length * 20 + 40);
      
      page.drawRectangle({
        x: 30,
        y: y - seatsHeight,
        width: width - 60,
        height: seatsHeight,
        color: rgb(0.95, 1, 0.95)
      });

      page.drawText('🪑 ASIENTOS RESERVADOS', {
        x: 50,
        y: y - 20,
        size: 16,
        font: helveticaBold,
        color: rgb(0.1, 0.3, 0.1)
      });

      payment.seats.forEach((seat, index) => {
        const seatY = y - 45 - (index * 20);
        const seatText = `${seat.name || seat.nombre || 'Asiento'} - ${seat.zona?.nombre || 'General'} - $${seat.price || 0}`;
        
        page.drawText(`• ${seatText}`, {
          x: 60,
          y: seatY,
          size: 11,
          font: helveticaFont,
          color: rgb(0.2, 0.3, 0.2)
        });
      });

      y -= seatsHeight + 20;
    }

    // --- INFORMACIÓN DEL COMPRADOR ---
    if (payment.usuario) {
      page.drawRectangle({
        x: 30,
        y: y - 60,
        width: width - 60,
        height: 60,
        color: rgb(1, 0.9, 0.95)
      });

      page.drawText('👤 COMPRADOR', {
        x: 50,
        y: y - 20,
        size: 16,
        font: helveticaBold,
        color: rgb(0.3, 0.1, 0.2)
      });

      page.drawText(`👤 ${payment.usuario.nombre || ''} ${payment.usuario.apellido || ''}`, {
        x: 60,
        y: y - 40,
        size: 12,
        font: helveticaFont,
        color: rgb(0.3, 0.1, 0.2)
      });

      if (payment.usuario.email) {
        page.drawText(`📧 ${payment.usuario.email}`, {
          x: 60,
          y: y - 55,
          size: 11,
          font: helveticaFont,
          color: rgb(0.4, 0.2, 0.3)
        });
      }

      y -= 80;
    }

    // --- QR CODE ---
    const qrSize = 120;
    const qrX = width - qrSize - 50;
    const qrY = y - qrSize - 20;

    // Fondo del QR
    page.drawRectangle({
      x: qrX - 10,
      y: qrY - 10,
      width: qrSize + 20,
      height: qrSize + 40,
      color: rgb(0.95, 0.95, 0.95)
    });

    // Insertar QR
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    // Texto del QR
    page.drawText('📱 ESCANEA PARA VALIDAR', {
      x: qrX - 5,
      y: qrY - 15,
      size: 10,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2)
    });

    // --- INFORMACIÓN ADICIONAL A LA IZQUIERDA DEL QR ---
    const infoX = 50;
    const infoY = y - 60;

    page.drawText('ℹ️ INFORMACIÓN IMPORTANTE', {
      x: infoX,
      y: infoY,
      size: 14,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText('• Presenta este ticket en la entrada del evento', {
      x: infoX + 10,
      y: infoY - 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3)
    });

    page.drawText('• El QR es único y será validado electrónicamente', {
      x: infoX + 10,
      y: infoY - 35,
      size: 10,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3)
    });

    page.drawText('• No compartas tu ticket. Solo el primer escaneo será válido', {
      x: infoX + 10,
      y: infoY - 50,
      size: 10,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3)
    });

    // --- FOOTER ---
    const footerY = 50;
    
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: footerY,
      color: rgb(0.1, 0.1, 0.3)
    });

    page.drawText('🎉 ¡Disfruta del evento!', {
      x: 50,
      y: 30,
      size: 16,
      font: helveticaBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('Para soporte: soporte@tuempresa.com', {
      x: width - 300,
      y: 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0.8, 0.8, 0.8)
    });

    page.drawText(`Ticket generado el: ${new Date().toLocaleString('es-ES')}`, {
      x: width - 300,
      y: 35,
      size: 10,
      font: helveticaFont,
      color: rgb(0.8, 0.8, 0.8)
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${locator}-enhanced.pdf"`);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generating enhanced ticket:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
