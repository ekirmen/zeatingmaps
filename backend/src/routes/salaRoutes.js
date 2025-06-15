import express from 'express';
import Mapa from '../models/Mapa.js';
import Zona from '../models/Zona.js';
const router = express.Router();

// Get mapa for a specific sala
router.get('/:salaId/mapa', async (req, res) => {
  try {
    const { salaId } = req.params;

    const mapa = await Mapa.findOne({ salaId }).lean();
    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado para esta sala' });
    }

    const zonas = await Zona.find({ sala: salaId }).lean();
    const zonaColorMap = zonas.reduce((acc, z) => {
      acc[z._id.toString()] = z.color;
      return acc;
    }, {});

    const mapaConSillas = {
      ...mapa,
      contenido: mapa.contenido.map(elemento => ({
        ...elemento,
        sillas: (elemento.sillas || []).map(silla => ({
          ...silla,
          x: silla.posicion?.x ?? 0,
          y: silla.posicion?.y ?? 0,
          width: silla.width ?? 30,
          height: silla.height ?? 30,
          color: silla.color || zonaColorMap[silla.zona] || 'lightblue'
        })),
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