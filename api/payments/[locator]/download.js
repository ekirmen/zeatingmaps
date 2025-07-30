import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

console.log('Supabase URL:', supabaseUrl ? 'defined' : 'undefined');
console.log('Supabase Service Role Key:', supabaseServiceKey ? 'defined' : 'undefined');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables are not defined');
}


export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { locator } = req.query;
  if (!locator) {
    return res.status(400).json({ error: 'Missing locator' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }

  try {
    // Verify the user token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get payment data
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select(`
        locator, 
        seats, 
        status,
        created_at,
        funcion:funciones(
          fecha_celebracion,
          evento:eventos(nombre)
        )
      `)
      .eq('locator', locator)
      .single();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // --- GENERAR QR ---
    // El QR puede ser el locator o una URL de validación
    const qrText = `https://tusitio.com/validar-ticket/${payment.locator}`;
    const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 200 });
    const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], 'base64');

    // --- CREAR PDF ---
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
    if (payment.funcion?.evento?.nombre) {
      page.drawText(`Evento: ${payment.funcion.evento.nombre}`, { x: 50, y, size: 13, color: rgb(0,0,0) });
      y -= 25;
    }
    if (payment.funcion?.fecha_celebracion) {
      const fecha = new Date(payment.funcion.fecha_celebracion).toLocaleString('es-ES');
      page.drawText(`Función: ${fecha}`, { x: 50, y, size: 13, color: rgb(0,0,0) });
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

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${locator}.pdf"`);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generating ticket:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 