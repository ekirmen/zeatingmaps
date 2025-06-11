import express from 'express';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { generateTicketPDF } from '../utils/pdfGenerator.js';
import QRCode from 'qrcode';
import Evento from '../models/Evento.js'; 
import mongoose from 'mongoose'; // Add this import for error handling

const router = express.Router();

// Middleware para manejar errores de población
const handlePopulationErrors = (res, error) => {
  console.error('Population error:', error);
  if (error instanceof mongoose.Error.MissingSchemaError) {
    return res.status(500).json({ 
      message: 'Database configuration error',
      error: 'Model schema not registered'
    });
  }
  return res.status(500).json({ 
    message: 'Database error',
    error: error.message
  });
};

// Búsqueda de pagos por email o teléfono
router.get('/search', async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) {
      return res.status(400).json({ message: 'Search term is required' });
    }

    // Buscar usuarios
    const users = await User.find({
      $or: [
        { email: { $regex: term, $options: 'i' } },
        { telefono: { $regex: term, $options: 'i' } }
      ]
    }).select('_id');

    if (!users.length) {
      return res.json([]);
    }

    // Buscar pagos con población segura
    const payments = await Payment.find({ user: { $in: users.map(u => u._id) } })
      .populate({
        path: 'user',
        select: 'login email telefono',
        model: 'User'
      })
      .populate({
        path: 'event',
        select: 'nombre fecha recinto',
        model: 'Evento'  // Changed from 'Event' to 'Evento'
      })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    handlePopulationErrors(res, error);
  }
});
// Helper function for error responses
const errorResponse = (res, status, message, error = null) => {
  console.error(message, error);
  return res.status(status).json({ 
    message,
    error: error?.message,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
  });
};

// Fetch all payments with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const payments = await Payment.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate('user', 'login email telefono')
      .populate('event', 'nombre fecha recinto');  // Added recinto field

    const count = await Payment.countDocuments();
    
    res.json({
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    errorResponse(res, 500, 'Error fetching payments', error);
  }
});

// Create a new payment
router.post('/', async (req, res) => {
  try {
    const { user, seats, status, event } = req.body;

    // Validate required fields
    if (!user) return res.status(400).json({ message: 'User is required', field: 'user' });
    if (!event) return res.status(400).json({ message: 'Event is required', field: 'event' });
    if (!seats?.length) return res.status(400).json({ message: 'At least one seat is required', field: 'seats' });

    const locator = Math.random().toString(36).substring(2, 10).toUpperCase();
    const payment = new Payment({ user, event, seats, locator, status: status || 'pending' });

    const savedPayment = await payment.save();
    res.status(201).json(savedPayment);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid payment data', error: error.message });
    }
    errorResponse(res, 500, 'Error processing payment', error);
  }
});

// Payment by locator
router.get('/locator/:locator', async (req, res) => {
  try {
    const payment = await Payment.findOne({ locator: req.params.locator })
      .populate('user', 'login email telefono empresa')
      .populate({
        path: 'event',
        select: 'nombre fecha recinto',
        model: 'Evento' // Cambiado de 'Event' a 'Evento'
      })
      .populate('seats.zona', 'nombre color precio');

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Pago no encontrado',
        code: 'PAYMENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error searching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar el pago',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Download ticket by locator or ID
router.get('/:id/download', async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { locator: req.params.id };

    const payment = await Payment.findOne(query)
      .populate('user')
      .populate({
        path: 'event',
        populate: { path: 'recinto', model: 'Recintos' }
      })
      .populate('seats.zona')
      .populate('seats.mesa');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const pdfDoc = await generateTicketPDF(payment);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket_${payment.locator}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (error) {
    errorResponse(res, 500, 'Error generating PDF', error);
  }
});

// Ticket scanning endpoint
router.post('/scan', async (req, res) => {
  try {
    const { seatId } = req.body;
    const payment = await Payment.findOne({ 'seats.id': seatId });

    if (!payment) return res.status(404).json({ message: 'Ticket no encontrado' });

    const seat = payment.seats.find(s => s.id === seatId);
    if (!seat) return res.status(404).json({ message: 'Asiento no encontrado' });

    if (seat.acceso === 1) {
      return res.status(400).json({ 
        message: 'Este ticket ya fue escaneado',
        seat
      });
    }

    seat.acceso = 1;
    payment.markModified('seats');
    await payment.save();

    res.json({ message: 'Escaneo exitoso', seat });
  } catch (error) {
    errorResponse(res, 500, 'Error scanning ticket', error);
  }
});

// Nueva ruta para buscar pagos por email
router.get('/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // 1. Buscar el usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // 2. Buscar todos los pagos de ese usuario
    const payments = await Payment.find({ user: user._id })
      .select('locator createdAt status seats') // Solo los campos necesarios
      .sort({ createdAt: -1 }); // Ordenar por fecha descendente

    // 3. Formatear la respuesta
    const response = payments.map(payment => ({
      locator: payment.locator,
      date: payment.createdAt,
      status: payment.status,
      seatCount: payment.seats.length,
      totalAmount: payment.seats.reduce((sum, seat) => sum + (seat.price || 0), 0)
    }));

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error searching payments by email:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar los pagos',
      error: error.message
    });
  }
});

export default router;