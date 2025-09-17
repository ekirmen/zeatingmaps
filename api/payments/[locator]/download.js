import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { getConfig, validateConfig } from './config';

// Obtener configuración
const config = getConfig();
const supabaseUrl = config.supabaseUrl;
const supabaseServiceKey = config.supabaseServiceKey;

// Crear cliente Supabase solo si las variables están disponibles
let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ [DOWNLOAD] Cliente Supabase creado correctamente');
} else {
  console.error('❌ [DOWNLOAD] No se puede crear cliente Supabase - variables faltantes');
}

export default async function handler(req, res) {
  console.log('🚀 [DOWNLOAD] Endpoint llamado con método:', req.method);
  console.log('🔍 [DOWNLOAD] Query params:', req.query);
  console.log('🔍 [DOWNLOAD] Headers:', req.headers);
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator, mode = 'full' } = req.query;
  if (!locator) {
    console.error('❌ [DOWNLOAD] Missing locator in query params');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing locator' });
  }

  // Si es modo simple, generar PDF básico sin autenticación
  if (mode === 'simple') {
    return await generateSimplePDF(req, res, locator);
  }

  // Para modo completo, validar configuración y autenticación
  if (!validateConfig()) {
    console.error('❌ [DOWNLOAD] Configuración inválida, redirigiendo a error 500');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'Missing Supabase environment variables',
      config: {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
        nodeEnv: config.nodeEnv,
        vercelEnv: config.vercelEnv
      }
    });
  }
  
  console.log('✅ [DOWNLOAD] Configuración validada correctamente');
  
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    console.error('❌ [DOWNLOAD] Missing auth token in headers');
    res.setHeader('Content-Type', 'application/json');
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    console.log('🔐 [DOWNLOAD] Verificando token de autenticación...');
    
    // Verify the user token using the access token (tolerante a mocks)
    const userResp = await supabaseAdmin?.auth?.getUser?.(token);
    const user = userResp?.data?.user || null;
    const userError = userResp?.error || null;
    
    console.log('🔐 [DOWNLOAD] Resultado de autenticación:', {
      user: user ? 'presente' : 'ausente',
      error: userError ? userError.message : 'ninguno'
    });
    
    if (userError || !user) {
      console.error('❌ [DOWNLOAD] Auth error:', userError);
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    console.log('✅ [DOWNLOAD] Usuario autenticado correctamente:', user.id);

    // Get payment data - SIMPLIFIED QUERY to avoid join issues
    console.log('🔍 [DOWNLOAD] Buscando pago con localizador:', locator);
    const { data: payment, error } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('locator', locator)
      .single();

    if (error || !payment) {
      console.error('❌ [DOWNLOAD] Error buscando pago:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Payment not found' });
    }

    console.log('✅ [DOWNLOAD] Pago encontrado:', payment.id);

    // Get seats for this function if available
    let seats = [];
    if (payment.funcion_id) {
      console.log('🔍 [DOWNLOAD] Buscando asientos para función:', payment.funcion_id);
      const { data: seatsData, error: seatsError } = await supabaseAdmin
        .from('seats')
        .select('*')
        .eq('funcion_id', payment.funcion_id);
      
      if (seatsError) {
        console.warn('⚠️ [DOWNLOAD] Error obteniendo asientos:', seatsError);
      } else {
        seats = seatsData || [];
        console.log('✅ [DOWNLOAD] Asientos encontrados:', seats.length);
      }
    }

    // Add seats to payment object for PDF generation
    payment.seats = seats;

    // Generate full PDF with payment data
    return await generateFullPDF(req, res, payment, locator);
    
  } catch (err) {
    console.error('❌ [DOWNLOAD] Error generando ticket:', err);
    console.error('❌ [DOWNLOAD] Stack trace:', err.stack);
    
    // Asegurar que se envíe JSON y no HTML
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// Función para generar PDF simple (sin autenticación)
async function generateSimplePDF(req, res, locator) {
  try {
    console.log('📄 [DOWNLOAD-SIMPLE] Creando documento PDF simple...');
    
    // Crear PDF simple sin dependencias externas
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Título
    page.drawText('TICKET DE PRUEBA', {
      x: 50,
      y: height - 50,
      size: 22,
      color: rgb(0.1, 0.1, 0.1),
      font: helveticaBold,
    });

    // Datos básicos
    let y = height - 90;
    page.drawText(`Localizador: ${locator}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 25;
    page.drawText(`Estado: PAGADO`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 30;

    // Información de prueba
    page.drawText('Este es un ticket de prueba', { x: 50, y, size: 14, color: rgb(0,0,0), font: helveticaBold });
    y -= 25;
    page.drawText('Generado para verificar la funcionalidad', { x: 50, y, size: 12, color: rgb(0.2,0.2,0.2), font: helveticaFont });
    y -= 20;
    page.drawText('de descarga de PDFs', { x: 50, y, size: 12, color: rgb(0.2,0.2,0.2), font: helveticaFont });

    // Fecha
    const fechaCreacion = new Date().toLocaleString('es-ES');
    page.drawText(`Fecha de generación: ${fechaCreacion}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });

    // Mensaje de prueba
    page.drawText('Si puedes ver este PDF, la generación está funcionando correctamente', { 
      x: 50, 
      y: 50, 
      size: 10, 
      color: rgb(0.3,0.3,0.3), 
      font: helveticaFont 
    });

    console.log('💾 [DOWNLOAD-SIMPLE] Guardando PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('✅ [DOWNLOAD-SIMPLE] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');

    // Headers para PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-prueba-${locator}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📤 [DOWNLOAD-SIMPLE] Enviando PDF al cliente...');
    return res.status(200).send(Buffer.from(pdfBytes));
    
  } catch (err) {
    console.error('❌ [DOWNLOAD-SIMPLE] Error generando PDF de prueba:', err);
    console.error('❌ [DOWNLOAD-SIMPLE] Stack trace:', err.stack);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Error generando PDF de prueba', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// Función para generar PDF completo con datos del pago
async function generateFullPDF(req, res, payment, locator) {
  try {
    console.log('📄 [DOWNLOAD] Generando PDF completo para pago:', payment.id);
    
    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Generar QR code
    console.log('🖼️ [DOWNLOAD] Generando código QR...');
    const qrData = JSON.stringify({
      locator: payment.locator,
      paymentId: payment.id,
      timestamp: new Date().toISOString()
    });
    
    const qrImageBytes = await QRCode.toBuffer(qrData, {
      type: 'image/png',
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // --- CARGAR IMÁGENES DEL EVENTO ---
    console.log('🖼️ [DOWNLOAD] Cargando imágenes del evento...');
    let eventImages = {};
    let venueData = null;
    
    try {
      // Obtener datos del evento desde el pago
      const eventData = payment.event || payment.funcion?.event;
      if (eventData && eventData.imagenes) {
        const images = typeof eventData.imagenes === 'string' 
          ? JSON.parse(eventData.imagenes) 
          : eventData.imagenes;
        
        // Cargar las 3 imágenes principales
        const imageTypes = ['logoHorizontal', 'portada', 'banner'];
        for (const imageType of imageTypes) {
          if (images[imageType]) {
            try {
              const imageUrl = images[imageType].publicUrl || images[imageType].url;
              if (imageUrl) {
                console.log(`🖼️ [DOWNLOAD] Cargando ${imageType}:`, imageUrl);
                const response = await fetch(imageUrl);
                if (response.ok) {
                  const imageBuffer = await response.arrayBuffer();
                  eventImages[imageType] = await pdfDoc.embedPng(imageBuffer);
                  console.log(`✅ [DOWNLOAD] ${imageType} cargado exitosamente`);
                }
              }
            } catch (imgError) {
              console.warn(`⚠️ [DOWNLOAD] Error cargando ${imageType}:`, imgError.message);
            }
          }
        }
      }

      // Cargar información del recinto si está disponible en el evento
      try {
        const recintoId = eventData?.recinto_id || eventData?.recinto || payment.funcion?.recinto_id || null;
        if (recintoId) {
          const { data: rec, error: recErr } = await supabaseAdmin
            .from('recintos')
            .select('id, nombre, direccion, ciudad, pais')
            .eq('id', recintoId)
            .maybeSingle();
          if (!recErr) venueData = rec;
        }
      } catch (recError) {
        console.warn('⚠️ [DOWNLOAD] Error cargando recinto:', recError.message);
      }
    } catch (imgError) {
      console.warn('⚠️ [DOWNLOAD] Error procesando imágenes del evento:', imgError.message);
    }

    // --- LAYOUT DEL TICKET ---
    
    // 1. IMAGEN SUPERIOR (logoHorizontal) o placeholder [1]
    {
      const topImageWidth = 140;
      const topImageHeight = 42; // proporción aprox 3.33:1
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
        // Placeholder con número 1
        page.drawRectangle({ x: topX, y: topY, width: topImageWidth, height: topImageHeight, color: rgb(0.95,0.95,0.95), borderColor: rgb(0.8,0.8,0.8), borderWidth: 1 });
        page.drawText('1', { x: topX + topImageWidth/2 - 6, y: topY + topImageHeight/2 - 8, size: 16, color: rgb(0.6,0.6,0.6), font: helveticaBold });
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

    // 3. DATOS PRINCIPALES (lado izquierdo)
    let y = height - 120;
    page.drawText(`Localizador: ${payment.locator}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 25;
    
    page.drawText(`Estado: ${payment.status}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 25;
    
    if (payment.monto) {
      page.drawText(`Monto: $${payment.monto}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
      y -= 25;
    }

    // 3.1 RECINTO (si disponible)
    if (venueData?.nombre) {
      page.drawText(`Recinto: ${venueData.nombre}`, { x: 50, y, size: 12, color: rgb(0.1,0.1,0.1), font: helveticaBold });
      y -= 18;
      const direccion = [venueData.direccion, venueData.ciudad, venueData.pais].filter(Boolean).join(', ');
      if (direccion) {
        page.drawText(direccion, { x: 50, y, size: 11, color: rgb(0.3,0.3,0.3), font: helveticaFont });
        y -= 20;
      }
    } else {
      page.drawText('Recinto: no existe', { x: 50, y, size: 12, color: rgb(0.85,0.1,0.1), font: helveticaBold });
      y -= 20;
    }

    // 4. QR CODE Y INFORMACIÓN IMPORTANTE (centro-derecho)
    console.log('🖼️ [DOWNLOAD] Insertando código QR en centro-derecho...');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    const qrSize = 120;
    const qrX = width - qrSize - 50;
    const qrY = height - 200;
    
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });
    
    // Información importante junto al QR
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

    // 5. ASIENTOS (lado izquierdo) con mesa/fila/asiento
    if (payment.seats && payment.seats.length > 0) {
      page.drawText('Asientos:', { x: 50, y, size: 14, color: rgb(0,0,0), font: helveticaBold });
      y -= 20;
      let seatY = y;
      payment.seats.forEach((seat) => {
        const zonaTxt = seat.zonaNombre || seat.zona || null;
        const mesaTxt = seat.mesaNombre || seat.mesa || null;
        const filaTxt = seat.fila || seat.row || null;
        const asientoId = seat.name || seat.nombre || seat.numero || seat.id || seat._id || null;

        page.drawText(`Zona: ${zonaTxt || 'no existe'}`, { x: 70, y: seatY, size: 11, color: zonaTxt ? rgb(0.2,0.2,0.2) : rgb(0.85,0.1,0.1), font: helveticaFont });
        seatY -= 16;
        page.drawText(`Mesa: ${mesaTxt || 'no existe'}`, { x: 70, y: seatY, size: 11, color: mesaTxt ? rgb(0.2,0.2,0.2) : rgb(0.85,0.1,0.1), font: helveticaFont });
        seatY -= 16;
        page.drawText(`Fila: ${filaTxt || 'no existe'}`, { x: 70, y: seatY, size: 11, color: filaTxt ? rgb(0.2,0.2,0.2) : rgb(0.85,0.1,0.1), font: helveticaFont });
        seatY -= 16;
        page.drawText(`Asiento: ${asientoId || 'no existe'}`, { x: 70, y: seatY, size: 11, color: asientoId ? rgb(0.2,0.2,0.2) : rgb(0.85,0.1,0.1), font: helveticaFont });
        seatY -= 22; // espacio entre asientos
      });
      y = seatY - 10;
    }

    // 6. IMAGEN MEDIA (portada) en centro del lado izquierdo o placeholder [2]
    {
      const midSize = 110;
      const midX = 60; // lado izquierdo
      const midY = y - midSize - 20;
      if (eventImages.portada) {
        page.drawImage(eventImages.portada, { x: midX, y: midY, width: midSize, height: midSize });
      } else {
        page.drawRectangle({ x: midX, y: midY, width: midSize, height: midSize, color: rgb(0.95,0.95,0.95), borderColor: rgb(0.8,0.8,0.8), borderWidth: 1 });
        page.drawText('2', { x: midX + midSize/2 - 8, y: midY + midSize/2 - 10, size: 20, color: rgb(0.6,0.6,0.6), font: helveticaBold });
      }
      y -= midSize + 30;
    }

    // 7. FECHA DE COMPRA
    const fechaCreacion = new Date(payment.created_at).toLocaleString('es-ES');
    page.drawText(`Fecha de compra: ${fechaCreacion}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });

    // 8. IMAGEN INFERIOR (banner) - abajo del ticket o placeholder [3]
    {
      const bottomImageWidth = 260;
      const bottomImageHeight = 90;
      const bx = width / 2 - bottomImageWidth / 2;
      const by = 150;
      if (eventImages.banner) {
        page.drawImage(eventImages.banner, { x: bx, y: by, width: bottomImageWidth, height: bottomImageHeight });
      } else {
        page.drawRectangle({ x: bx, y: by, width: bottomImageWidth, height: bottomImageHeight, color: rgb(0.95,0.95,0.95), borderColor: rgb(0.8,0.8,0.8), borderWidth: 1 });
        page.drawText('3', { x: bx + bottomImageWidth/2 - 8, y: by + bottomImageHeight/2 - 10, size: 20, color: rgb(0.6,0.6,0.6), font: helveticaBold });
      }
    }

    // 8.1 CÓDIGO TEXTO DEL QR (debajo del QR)
    try {
      const qrText = payment.locator || 'QR-SIN-CODIGO';
      page.drawText(qrText, {
        x: qrX,
        y: qrY - 52,
        size: 10,
        color: rgb(0.15,0.15,0.15),
        font: helveticaFont
      });
    } catch {}

    // 9. CONDICIONES (abajo)
    page.drawText('Condiciones:', { x: 50, y: 100, size: 10, color: rgb(0.2,0.2,0.2), font: helveticaBold });
    page.drawText('• Presenta este ticket en la entrada del evento.', { x: 60, y: 85, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });
    page.drawText('• El QR es único y será validado electrónicamente.', { x: 60, y: 73, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });
    page.drawText('• No compartas tu ticket. Solo el primer escaneo será válido.', { x: 60, y: 61, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });

    console.log('💾 [DOWNLOAD] Guardando PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('✅ [DOWNLOAD] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');

    // Asegurar que se envíen los headers correctos
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${locator}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📤 [DOWNLOAD] Enviando PDF al cliente...');
    return res.status(200).send(Buffer.from(pdfBytes));
    
  } catch (err) {
    console.error('❌ [DOWNLOAD] Error generando PDF completo:', err);
    console.error('❌ [DOWNLOAD] Stack trace:', err.stack);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Error generando PDF completo', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// Función para generar PDF con todos los tickets (modo bulk)
async function generateBulkPDF(req, res, locator) {
  try {
    console.log('📄 [DOWNLOAD-BULK] Generando PDF con todos los tickets para localizador:', locator);
    
    // Buscar el pago por localizador
    const { data: payment, error } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('locator', locator)
      .single();

    if (error || !payment) {
      console.error('❌ [DOWNLOAD-BULK] Error buscando pago:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Payment not found' });
    }

    console.log('✅ [DOWNLOAD-BULK] Pago encontrado:', payment.id);

    // Parsear los asientos del pago
    let seats = [];
    if (Array.isArray(payment.seats)) {
      seats = payment.seats;
    } else if (typeof payment.seats === 'string') {
      try {
        seats = JSON.parse(payment.seats);
      } catch {
        try {
          seats = JSON.parse(JSON.parse(payment.seats));
        } catch {
          seats = [];
        }
      }
    }

    if (seats.length === 0) {
      console.error('❌ [DOWNLOAD-BULK] No hay asientos en el pago');
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ error: 'No seats found in payment' });
    }

    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generar una página por cada asiento
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      console.log(`📄 [DOWNLOAD-BULK] Generando página ${i + 1}/${seats.length} para asiento:`, seat.id || seat._id);
      
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();

      // Generar QR code para este asiento específico
      const qrData = JSON.stringify({
        locator: payment.locator,
        paymentId: payment.id,
        seatId: seat.id || seat._id,
        timestamp: new Date().toISOString()
      });
      
      const qrImageBytes = await QRCode.toBuffer(qrData, {
        type: 'image/png',
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Título del ticket
      page.drawText('TICKET DE ENTRADA', {
        x: 50,
        y: height - 50,
        size: 22,
        color: rgb(0.1, 0.1, 0.1),
        font: helveticaBold,
      });

      // Datos principales
      let y = height - 90;
      page.drawText(`Localizador: ${payment.locator}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
      y -= 25;
      
      // Información del asiento
      page.drawText(`Asiento: ${seat.name || seat.nombre || seat.id || seat._id}`, { x: 50, y, size: 14, color: rgb(0,0,0), font: helveticaBold });
      y -= 25;
      
      if (seat.zona) {
        page.drawText(`Zona: ${seat.zona}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
        y -= 25;
      }
      
      // Información básica del pago
      page.drawText(`Estado: ${payment.status}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
      y -= 25;
      
      if (payment.monto) {
        page.drawText(`Monto: $${payment.monto}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
        y -= 25;
      }

      // Fecha de compra
      const fechaCreacion = new Date(payment.created_at).toLocaleString('es-ES');
      page.drawText(`Fecha de compra: ${fechaCreacion}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });

      // --- Insertar QR ---
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      const qrSize = 120;
      page.drawImage(qrImage, {
        x: width - qrSize - 50,
        y: height - qrSize - 60,
        width: qrSize,
        height: qrSize,
      });
      page.drawText('Escanea para validar', {
        x: width - qrSize - 40,
        y: height - qrSize - 75,
        size: 10,
        color: rgb(0.3,0.3,0.3),
        font: helveticaFont
      });

      // --- Condiciones ---
      page.drawText('Condiciones:', { x: 50, y: 80, size: 10, color: rgb(0.2,0.2,0.2), font: helveticaBold });
      page.drawText('• Presenta este ticket en la entrada del evento.', { x: 60, y: 65, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });
      page.drawText('• El QR es único y será validado electrónicamente.', { x: 60, y: 53, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });
      page.drawText('• No compartas tu ticket. Solo el primer escaneo será válido.', { x: 60, y: 41, size: 9, color: rgb(0.2,0.2,0.2), font: helveticaFont });

      // Número de página
      page.drawText(`Página ${i + 1} de ${seats.length}`, { 
        x: 50, 
        y: 30, 
        size: 10, 
        color: rgb(0.4,0.4,0.4), 
        font: helveticaFont 
      });
    }

    console.log('💾 [DOWNLOAD-BULK] Guardando PDF con múltiples tickets...');
    const pdfBytes = await pdfDoc.save();
    console.log('✅ [DOWNLOAD-BULK] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');

    // Asegurar que se envíen los headers correctos
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="tickets-${locator}-completos.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('📤 [DOWNLOAD-BULK] Enviando PDF al cliente...');
    return res.status(200).send(Buffer.from(pdfBytes));
    
  } catch (err) {
    console.error('❌ [DOWNLOAD-BULK] Error generando PDF con múltiples tickets:', err);
    console.error('❌ [DOWNLOAD-BULK] Stack trace:', err.stack);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Error generando PDF con múltiples tickets', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
