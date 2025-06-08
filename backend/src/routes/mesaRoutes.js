import express from 'express';
import { createMesa, getMesasBySala, updateMesa, updateMesaPosition, deleteMesa } from '../controllers/mesaController.js';

const router = express.Router();

// Crear una mesa y agregarla al mapa de una sala
router.post('/sala/:salaId', (req, res) => {
  const { mesa } = req.body;
  req.body = { salaId: req.params.salaId, mesa };
  createMesa(req, res);
});

// Obtener todas las mesas de una sala
router.get('/sala/:salaId', getMesasBySala);

// Actualizar una mesa existente
router.put('/sala/:salaId/:mesaId', updateMesa);

// Actualizar solo la posición de una mesa
router.put('/sala/:salaId/:mesaId/posicion', updateMesaPosition);

// Eliminar una mesa
router.delete('/sala/:salaId/:mesaId', deleteMesa);

export default router;
