import Payment from '../models/Payment.js';
import PDFDocument from 'pdfkit';

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

    // Create PDF
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${locator}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Ticket de Evento', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Localizador: ${payment.locator}`);
    doc.text(`Evento: ${payment.event.nombre}`);
    doc.text(`Fecha: ${new Date(payment.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    // Add seats information with a nicer layout
    doc.text('Asientos:', { underline: true });
    const seatLines = payment.seats.map(seat => {
      let line = `${seat.name}`;
      if (seat.zona) line += ` - Zona: ${seat.zona.nombre}`;
      if (seat.mesa) line += ` - Mesa: ${seat.mesa.nombre}`;
      line += ` - Precio: $${seat.price.toFixed(2)}`;
      return line;
    });
    doc.list(seatLines, { bulletRadius: 2 });

    // Add QR code or barcode here if needed

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