import express from 'express';
import { createEvento, getEventos, updateEvento, getEventoById, deleteEvento } from '../controllers/eventoController.js';

const router = express.Router();

// Definir las rutas
router.post('/', createEvento); // Crear un evento
router.get('/', getEventos); // Obtener todos los eventos
router.get('/:id', getEventoById); // Obtener un evento por su ID
router.put('/:id', updateEvento); // Actualizar un evento por su ID
router.delete('/:id', deleteEvento); // Eliminar un evento por su ID

export default router;