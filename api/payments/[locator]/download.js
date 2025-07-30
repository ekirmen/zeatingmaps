import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
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

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    // Add content to PDF
    const { width, height } = page.getSize();
    
    // Title
    page.drawText('TICKET DE ENTRADA', {
      x: 50,
      y: height - 50,
      size: 20,
      color: { r: 0, g: 0, b: 0 }
    });

    // Locator
    page.drawText(`Localizador: ${payment.locator}`, {
      x: 50,
      y: height - 100,
      size: 12,
      color: { r: 0, g: 0, b: 0 }
    });

    // Event name
    if (payment.funcion?.evento?.nombre) {
      page.drawText(`Evento: ${payment.funcion.evento.nombre}`, {
        x: 50,
        y: height - 130,
        size: 12,
        color: { r: 0, g: 0, b: 0 }
      });
    }

    // Function date
    if (payment.funcion?.fecha_celebracion) {
      const fecha = new Date(payment.funcion.fecha_celebracion).toLocaleString('es-ES');
      page.drawText(`Función: ${fecha}`, {
        x: 50,
        y: height - 160,
        size: 12,
        color: { r: 0, g: 0, b: 0 }
      });
    }

    // Status
    page.drawText(`Estado: ${payment.status}`, {
      x: 50,
      y: height - 190,
      size: 12,
      color: { r: 0, g: 0, b: 0 }
    });

    // Seats
    if (payment.seats && payment.seats.length > 0) {
      page.drawText('Asientos:', {
        x: 50,
        y: height - 220,
        size: 14,
        color: { r: 0, g: 0, b: 0 }
      });

      payment.seats.forEach((seat, index) => {
        const seatText = `${seat.name || seat.nombre} - ${seat.zona?.nombre || 'General'} - $${seat.price || 0}`;
        page.drawText(seatText, {
          x: 70,
          y: height - 250 - (index * 20),
          size: 10,
          color: { r: 0, g: 0, b: 0 }
        });
      });
    }

    // Date
    const fechaCreacion = new Date(payment.created_at).toLocaleString('es-ES');
    page.drawText(`Fecha de compra: ${fechaCreacion}`, {
      x: 50,
      y: 50,
      size: 10,
      color: { r: 0.5, g: 0.5, b: 0.5 }
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${locator}.pdf"`);
    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generating ticket:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 