import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb } from 'pdf-lib';
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
  
  // Validar configuración
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
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator } = req.query;
  if (!locator) {
    console.error('❌ [DOWNLOAD] Missing locator in query params');
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({ error: 'Missing locator' });
  }

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

    // Get payment data
    console.log('🔍 [DOWNLOAD] Buscando pago con localizador:', locator);
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select(`
        locator, 
        seats, 
        status,
        created_at,
        funcion
      `)
      .eq('locator', locator)
      .single();

    if (error) {
      console.error('❌ [DOWNLOAD] Database error:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    
    if (!payment) {
      console.error('❌ [DOWNLOAD] Payment not found for locator:', locator);
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    console.log('✅ [DOWNLOAD] Pago encontrado:', payment);

    // --- GENERAR QR ---
    console.log('🎯 [DOWNLOAD] Generando código QR...');
    const qrText = `https://tusitio.com/validar-ticket/${payment.locator}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 200 });
    const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], 'base64');
    console.log('✅ [DOWNLOAD] Código QR generado');

    // --- CREAR PDF ---
    console.log('📄 [DOWNLOAD] Creando documento PDF...');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Título
    page.drawText('TICKET DE ENTRADA', {
      x: 50,
      y: height - 50,
      size: 22,
      color: rgb(0.1, 0.1, 0.1),
      font: undefined,
    });

    // Datos principales
    let y = height - 90;
    page.drawText(`Localizador: ${payment.locator}`, { x: 50, y, size: 13, color: rgb(0,0,0) });
    y -= 25;
    if (payment.funcion) {
      page.drawText(`Función ID: ${payment.funcion}`, { x: 50, y, size: 13, color: rgb(0,0,0) });
      y -= 25;
    }
    page.drawText(`Estado: ${payment.status}`, { x: 50, y, size: 13, color: rgb(0,0,0) });
    y -= 30;

    // Asientos
    if (payment.seats && payment.seats.length > 0) {
      page.drawText('Asientos:', { x: 50, y, size: 14, color: rgb(0,0,0) });
      y -= 20;
      payment.seats.forEach((seat, index) => {
        const seatText = `${seat.name || seat.nombre} - ${seat.zona?.nombre || 'General'} - $${seat.price || 0}`;
        page.drawText(seatText, { x: 70, y: y - (index * 18), size: 11, color: rgb(0.2,0.2,0.2) });
      });
      y -= payment.seats.length * 18 + 10;
    }

    // Fecha de compra
    const fechaCreacion = new Date(payment.created_at).toLocaleString('es-ES');
    page.drawText(`Fecha de compra: ${fechaCreacion}`, { x: 50, y, size: 11, color: rgb(0.4,0.4,0.4) });

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
      color: rgb(0.3,0.3,0.3)
    });

    // --- Condiciones ---
    page.drawText('Condiciones:', { x: 50, y: 80, size: 10, color: rgb(0.2,0.2,0.2) });
    page.drawText('• Presenta este ticket en la entrada del evento.', { x: 60, y: 65, size: 9, color: rgb(0.2,0.2,0.2) });
    page.drawText('• El QR es único y será validado electrónicamente.', { x: 60, y: 53, size: 9, color: rgb(0.2,0.2,0.2) });
    page.drawText('• No compartas tu ticket. Solo el primer escaneo será válido.', { x: 60, y: 41, size: 9, color: rgb(0.2,0.2,0.2) });

    console.log('💾 [DOWNLOAD] Guardando PDF...');
    const pdfBytes = await pdfDoc.save();
    console.log('✅ [DOWNLOAD] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');

    // Asegurar que se envíen los headers correctos
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${locator}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    
    console.log('📤 [DOWNLOAD] Enviando PDF al cliente...');
    return res.status(200).send(Buffer.from(pdfBytes));
    
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
