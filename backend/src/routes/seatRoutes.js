import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Mapa from '../models/Mapa.js';

const router = express.Router();

router.post('/reserve', protect, async (req, res) => {
  try {
    const { seatId, eventId } = req.body;
    
    // Busca el mapa que contiene la silla
    const mapa = await Mapa.findOne({
      'contenido.sillas._id': seatId
    });

    if (!mapa) {
      return res.status(404).json({ message: 'Asiento no encontrado' });
    }

    // Recorre el contenido del mapa buscando la silla específica
    let seatFound = false;
    mapa.contenido = mapa.contenido.map(item => {
      if (item.sillas) {
        item.sillas = item.sillas.map(seat => {
          // Cuando encuentra la silla correcta
          if (seat._id.toString() === seatId) {
            seatFound = true;
            // Verifica si ya está reservada
            if (seat.isReserved) {
              throw new Error('El asiento ya está reservado');
            }
            // Actualiza el estado de la silla
            return {
              ...seat,
              isReserved: true,
              reservedBy: req.user._id,
              reservedAt: new Date(),
              eventId
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
    const { seats } = req.body;
    
    // Encuentra el mapa que contiene las sillas a liberar
    const mapa = await Mapa.findOne({
      'contenido.sillas._id': { $in: seats }
    });

    // Actualiza cada silla, verificando que el usuario sea el propietario
    let releasedCount = 0;
    mapa.contenido = mapa.contenido.map(item => {
      if (item.sillas) {
        item.sillas = item.sillas.map(seat => {
          if (seats.includes(seat._id.toString()) && 
              seat.reservedBy?.toString() === req.user._id.toString()) {
            releasedCount++;
            // Resetea el estado de la silla
            return {
              ...seat,
              isReserved: false,
              reservedBy: null,
              reservedAt: null,
              eventId: null
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
    const { seatIds, bloqueado } = req.body;

    if (!Array.isArray(seatIds) || typeof bloqueado !== 'boolean') {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const mapa = await Mapa.findOne({
      'contenido.sillas._id': { $in: seatIds }
    });

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