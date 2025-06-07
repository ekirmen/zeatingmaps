import express from 'express';
import {
  getRecintos,
  createRecinto,
  getSalas,
  createSala,
  updateSala,
  deleteSala,
  updateRecinto,
} from '../controllers/recintoController.js';

const router = express.Router();

// Rutas para recintos
router.get('/recintos', getRecintos);
router.post('/recintos', createRecinto);
router.put('/recintos/:recintoId', updateRecinto);  // Add this line

// Rutas para salas de un recinto específico
router.get('/recintos/:recintoId/salas', getSalas);
router.post('/recintos/:recintoId/salas', createSala);

// Rutas para actualizar o eliminar salas
router.put('/salas/:salaId', updateSala);
router.delete('/salas/:salaId', deleteSala);

export default router;
