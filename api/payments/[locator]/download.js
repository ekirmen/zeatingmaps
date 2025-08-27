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
      .from('payments')
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
    if (payment.funcion) {
      console.log('🔍 [DOWNLOAD] Buscando asientos para función:', payment.funcion);
      const { data: seatsData, error: seatsError } = await supabaseAdmin
        .from('seats')
        .select('*')
        .eq('funcion_id', payment.funcion);
      
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
    
    // Información básica del pago
    page.drawText(`Estado: ${payment.status}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
    y -= 25;
    
    if (payment.monto) {
      page.drawText(`Monto: $${payment.monto}`, { x: 50, y, size: 13, color: rgb(0,0,0), font: helveticaFont });
      y -= 25;
    }

    // Asientos
    if (payment.seats && payment.seats.length > 0) {
      page.drawText('Asientos:', { x: 50, y, size: 14, color: rgb(0,0,0), font: helveticaBold });
      y -= 20;
      payment.seats.forEach((seat, index) => {
        const seatText = `${seat.id || 'Asiento'} - ${seat.zona || 'General'}`;
        page.drawText(seatText, { x: 70, y: y - (index * 18), size: 11, color: rgb(0.2,0.2,0.2), font: helveticaFont });
      });
      y -= payment.seats.length * 18 + 10;
    }

    // Fecha de compra
    const fechaCreacion = new Date(payment.created_at).toLocaleString('es-ES');
    page.drawText(`Fecha de compra: ${fechaCreacion}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4), font: helveticaFont });

    // --- Insertar QR ---
    console.log('🖼️ [DOWNLOAD] Insertando código QR en PDF...');
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
