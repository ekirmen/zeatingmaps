import express from 'express';
import Mapa from '../models/Mapa.js';
const router = express.Router();

// Get mapa for a specific sala
router.get('/:salaId/mapa', async (req, res) => {
  try {
    const { salaId } = req.params;
    const mapa = await Mapa.findOne({ sala: salaId })
      .populate({
        path: 'contenido.sillas',
        model: 'Seat',
        select: 'number isReserved reservedBy reservedAt eventId status x y width height color zona'
      });

    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado para esta sala' });
    }

    const mapaConSillas = {
      ...mapa.toObject(),
      contenido: mapa.contenido.map(elemento => ({
        ...elemento,
        sillas: elemento.sillas?.map(silla => ({
          ...silla,
          x: silla.x || 0,
          y: silla.y || 0,
          width: silla.width || 30,
          height: silla.height || 30,
          color: silla.color || 'lightblue'
        })) || [],
        type: elemento.type || 'default'
      }))
    };

    res.json(mapaConSillas);
  } catch (error) {
    console.error('Error al obtener el mapa:', error);
    res.status(500).json({ message: 'Error al obtener el mapa', error: error.message });
  }
});

export default router;