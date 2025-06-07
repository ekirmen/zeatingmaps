import Payment from '../models/Payment.js';
import crypto from 'crypto';

// Función para generar un localizador único de 8 caracteres
const generateLocator = async () => {
  let locator;
  let exists = true;

  while (exists) {
    locator = crypto.randomBytes(4).toString('hex').toUpperCase();
    exists = await Payment.exists({ locator });
  }

  return locator;
};

// Crear un nuevo pago
export const createPayment = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body);
    const { seats, status, payments, reservationDeadline } = req.body;
    const userId = req.body.user; // Changed to use user from request body

    if (!userId || !seats || seats.length === 0) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const locator = await generateLocator();

    const newPayment = new Payment({
      user: userId,
      seats,
      locator,
      status: status || 'reservado', // Default to reservado
      reservationDeadline,
      payments: payments || [],
      history: [{
        action: status === 'pagado' ? 'Pago realizado' : 'Reserva creada',
        timestamp: new Date()
      }],
    });

    await newPayment.save();
    res.status(201).json({
      payment: newPayment,
      message: status === 'pagado' ? 'Pago procesado exitosamente' : 'Reserva creada exitosamente',
      locator: locator
    });
  } catch (error) {
    console.error('❌ Error en createPayment:', error);
    res.status(500).json({ message: 'Error al procesar la operación', error: error.message });
  }
};


// Obtener todos los pagos
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('user', 'email').populate('seats');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los pagos', error: error.message });
  }
};

// Buscar un pago por localizador o email
export const searchPayment = async (req, res) => {
  const { query } = req.params;
  try {
    const payment = await Payment.findOne({
      $or: [{ locator: query }, { user: query }],
    }).populate('user', 'email').populate('seats');

    if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar el pago', error: error.message });
  }
};

// Verificar QR y registrar acceso
export const verifyQR = async (req, res) => {
  const { locator } = req.params;

  try {
    const payment = await Payment.findOne({ locator });

    if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });

    if (payment.status !== 'pagado') {
      return res.status(400).json({ message: 'El ticket no ha sido pagado' });
    }

    if (payment.scanned) {
      return res.status(400).json({ message: 'El ticket ya ha sido escaneado' });
    }

    // Registrar acceso y marcar como escaneado
    payment.scanned = true;
    payment.history.push({ action: 'Acceso concedido', timestamp: new Date() });
    await payment.save();

    res.json({ message: 'Acceso concedido', payment });
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar QR', error: error.message });
  }
};
