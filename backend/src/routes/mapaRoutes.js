import express from 'express';
import {
  createOrUpdateMapa,
  getMapaBySala,
  updateMapa,
  deleteMapa,
  addElementoToMapa,
} from '../controllers/mapaController.js';

const router = express.Router();

// Crear o actualizar un mapa
router.post('/mapa/createOrUpdate', createOrUpdateMapa); // Ruta corregida

// Obtener un mapa por sala
router.get('/mapa/:salaId', getMapaBySala);

// Actualizar un mapa
router.put('/mapa/:mapaId', updateMapa);

// Eliminar un mapa
router.delete('/mapa/:mapaId', deleteMapa);

// Agregar un elemento al contenido del mapa
router.post('/mapa/:mapaId/elemento', addElementoToMapa);

export default router;