import express from 'express';
import {
  createEvento,
  getEventos,
  getEventoById,
  updateEvento,
  deleteEvento
} from '../controllers/eventoController.js';

const router = express.Router();

// Rutas para eventos
router.post('/', createEvento);
router.get('/', getEventos);
router.get('/:id', getEventoById);
router.put('/:id', updateEvento);
router.delete('/:id', deleteEvento);

export default router;