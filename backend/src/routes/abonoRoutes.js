import express from 'express';
import Abono from '../models/Abono.js';
import { protect } from '../middleware/authMiddleware.js';
import Funcion from '../models/Funcion.js';
import Payment from '../models/Payment.js';
import Mapa from '../models/Mapa.js';

const router = express.Router();

// Obtener todos los abonos
router.get('/', protect, async (req, res) => {
  try {
    const abonos = await Abono.find().populate('seat user');
    res.json(abonos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener abonos', error: error.message });
  }
});

// Crear un nuevo abono
router.post('/', protect, async (req, res) => {
  try {
    const abono = new Abono(req.body);
    await abono.save();
    res.status(201).json(abono);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear abono', error: error.message });
  }
});

// Obtener abonos de un usuario
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const abonos = await Abono.find({ user: req.params.userId })
      .populate('seat');
    res.json(abonos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener abonos', error: error.message });
  }
});

// Renovar abono (actualizar fechas y status)
router.put('/:id/renew', protect, async (req, res) => {
  try {
    const abono = await Abono.findById(req.params.id);
    if (!abono) return res.status(404).json({ message: 'Abono no encontrado' });
    abono.startDate = req.body.startDate || abono.startDate;
    abono.endDate = req.body.endDate || abono.endDate;
    abono.status = 'activo';
    await abono.save();
    res.json(abono);
  } catch (error) {
    res.status(500).json({ message: 'Error al renovar abono', error: error.message });
  }
});

// Seats available for abono across all functions of an event
router.get('/available/:eventId', protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const funciones = await Funcion.find({ evento: eventId });
    if (!funciones.length) return res.json([]);

    const funcionIds = funciones.map(f => f._id);
    const soldSeatIds = await Payment.find({ funcion: { $in: funcionIds } })
      .distinct('seats.id');

    const salaId = funciones[0].sala;
    const mapa = await Mapa.findOne({ salaId });
    if (!mapa) return res.json([]);

    const allSeatIds = [];
    mapa.contenido.forEach(m => {
      (m.sillas || []).forEach(s => allSeatIds.push(s._id));
    });

    const available = allSeatIds.filter(id => !soldSeatIds.includes(id));
    res.json(available);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available seats', error: error.message });
  }
});

export default router;
