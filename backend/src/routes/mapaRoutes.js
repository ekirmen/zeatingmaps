import express from 'express';
import { obtenerMapaPorSala, guardarMapaPorSala } from '../controllers/mapaController.js';

const router = express.Router();

// Ruta para obtener el mapa de una sala
router.get('/salas/:id/mapa', obtenerMapaPorSala);

// Ruta para guardar el mapa de una sala
router.post('/salas/:id/mapa', guardarMapaPorSala);

export default router;
