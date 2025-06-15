import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Mapa from '../models/Mapa.js';

const router = express.Router();

router.post('/reserve', protect, async (req, res) => {
  try {
    const { seats, functionId } = req.body;

    if (!Array.isArray(seats) || seats.length === 0 || !functionId) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const mapa = await Mapa.findOne({ funcionId: functionId });

    if (!mapa) {
      return res.status(404).json({ message: 'Asiento no encontrado' });
    }

    mapa.contenido = mapa.contenido.map(item => {
      if (item.sillas) {
        item.sillas = item.sillas.map(seat => {
          if (seats.includes(seat._id.toString())) {
            if (seat.isReserved) {
              throw new Error('El asiento ya está reservado');
            }
            return {
              ...seat,
              isReserved: true,
              reservedBy: req.user._id,
              reservedAt: new Date(),
            };
          }
          return seat;
        });
      }
      return item;
    });

    await mapa.save();
    res.json({ message: 'Asiento reservado exitosamente' });

  } catch (error) {
    console.error('Error al reservar asiento:', error);
    res.status(error.message === 'El asiento ya está reservado' ? 400 : 500)
      .json({ message: error.message || 'Error al reservar asiento' });
  }
});

router.post('/release', protect, async (req, res) => {
  try {
    const { seats, functionId } = req.body;

    if (!Array.isArray(seats) || seats.length === 0 || !functionId) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const mapa = await Mapa.findOne({ funcionId: functionId });

    // Actualiza cada silla, verificando que el usuario sea el propietario
    let releasedCount = 0;
    mapa.contenido = mapa.contenido.map(item => {
      if (item.sillas) {
        item.sillas = item.sillas.map(seat => {
          if (seats.includes(seat._id.toString()) &&
              seat.reservedBy?.toString() === req.user._id.toString()) {
            releasedCount++;
            return {
              ...seat,
              isReserved: false,
              reservedBy: null,
              reservedAt: null,
            };
          }
          return seat;
        });
      }
      return item;
    });

    await mapa.save();
    res.json({ 
      message: 'Asientos liberados exitosamente', 
      count: releasedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al liberar asientos' });
  }
});

// Bloquear o desbloquear asientos
router.post('/block', protect, async (req, res) => {
  try {
    const { seatIds, bloqueado, functionId } = req.body;

    if (!Array.isArray(seatIds) || typeof bloqueado !== 'boolean' || !functionId) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const mapa = await Mapa.findOne({ funcionId: functionId });

    if (!mapa) {
      return res.status(404).json({ message: 'Asientos no encontrados' });
    }

    mapa.contenido = mapa.contenido.map(item => {
      if (item.sillas) {
        item.sillas = item.sillas.map(seat => {
          if (seatIds.includes(seat._id.toString())) {
            seat.bloqueado = bloqueado;
            seat.estado = bloqueado ? 'bloqueado' : 'disponible';
          }
          return seat;
        });
      }
      return item;
    });

    await mapa.save();
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error('Error updating seat status:', error);
    res.status(500).json({ message: 'Error actualizando asientos' });
  }
});

// Añade esta ruta para diagnóstico
router.get('/debug/:seatId', async (req, res) => {
  try {
    const { seatId } = req.params;
    const mapa = await Mapa.findOne({});
    
    res.json({
      mapExists: !!mapa,
      seatId,
      sillasTotal: mapa ? mapa.contenido.reduce((acc, item) => 
        acc + (item.sillas?.length || 0), 0) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en diagnóstico', error: error.message });
  }
});

export default router;