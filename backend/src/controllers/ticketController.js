import Payment from '../models/Payment.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const downloadTicket = async (req, res) => {
  try {
    const { locator } = req.params;
    
    const payment = await Payment.findOne({ locator })
      .populate('event')
      .populate('user')
      .populate('seats.zona')
      .populate('seats.mesa');

    if (!payment) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Create PDF with margins
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${locator}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // --- Logo Horizontal ---
    doc.image('assets/logo-horizontal.png', 50, 40, { width: 200 });

    // --- Logo Vertical ---
    doc.image('assets/logo-vertical.png', 50, 120, { width: 50 });

    // --- Datos del evento ---
    const event = payment.event;
    const firstSeat = payment.seats[0];

    doc.fontSize(14).text(event?.nombre || 'Evento', 120, 120);
    doc.fontSize(10).text(event?.lugar || 'Lugar', 120, 140);
    doc.text(new Date(event?.fecha).toLocaleDateString(), 400, 40);
    doc.text('Tipo: Entrada general', 400, 60);
    doc.text(`Comprador: ${payment.user?.name || 'N/A'}`, 400, 80);

    // --- Tabla zona, fila, asiento ---
    doc.rect(400, 110, 140, 60).stroke();
    doc.text('Zona', 410, 115);
    doc.text(firstSeat?.zona?.nombre || 'Zona', 470, 115);
    doc.text('Fila', 410, 135);
    doc.text('4', 470, 135); // ajustar dinámicamente si tienes fila
    doc.text('Asiento', 410, 155);
    doc.text(firstSeat?.name || '1', 470, 155);

    // --- QR codes for each seat ---
    let qrY = 180;
    for (const seat of payment.seats) {
      const qrBuffer = await QRCode.toBuffer(seat._id || seat.id);
      doc.image(qrBuffer, 400, qrY, { width: 100 });
      doc.text(seat._id || seat.id, 400, qrY + 105);
      qrY += 120;
    }

    // --- Localizador e importe ---
    const totalPrice = payment.seats.reduce((sum, s) => sum + (s.price || 0), 0);
    doc.text(`Localizador: ${locator}`, 120, 180);
    doc.text(`Importe: ${totalPrice.toFixed(2)} €`, 120, 200);
    doc.text(`IVA: ${(totalPrice * 0.21).toFixed(2)} €`, 120, 215);
    doc.text(`Total: ${(totalPrice * 1.21).toFixed(2)} €`, 120, 230);

    // --- Términos legales ---
    doc.moveTo(50, 320).lineTo(550, 320).dash(1, { space: 2 }).stroke();
    doc.undash();
    doc.fontSize(8).text('Términos y condiciones legales...', 50, 330, {
      width: 250,
      height: 200,
    });

    // --- Banner publicidad ---
    doc.rect(320, 330, 200, 200).stroke();
    doc.image('assets/banner-publicidad.jpg', 320, 330, { width: 200, height: 200 });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating ticket:', error);
    res.status(500).json({ message: 'Error generating ticket' });
  }
};

export const getUserTickets = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const tickets = await Payment.find({ user: userId })
      .populate('event', 'nombre fecha')
      .sort('-createdAt');

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};