import express from 'express';
import { obtenerCompanias, obtenerEventosDeCompania, crearCompania } from '../controllers/empresaController.js';

const router = express.Router();

// Obtener todas las compañías
router.get('/companias', obtenerCompanias);

// Obtener los eventos de una compañía específica
router.get('/companias/:empresaId/eventos', obtenerEventosDeCompania);

// Crear una nueva compañía
router.post('/companias', crearCompania);

export default router;
