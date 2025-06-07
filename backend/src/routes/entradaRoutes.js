// archivo: entradaRoutes.js

import express from 'express';
import {
  crearEntrada,
  obtenerEntradas,
  obtenerEntradaPorId,
  actualizarEntrada,
  eliminarEntrada,
  obtenerEntradasPorRecinto, // Asegúrate de que este controlador esté definido
} from '../controllers/entradaController.js';

const router = express.Router();

router.post('/entradas', crearEntrada);
router.get('/entradas', obtenerEntradas);
router.get('/entradas/:id', obtenerEntradaPorId);
router.put('/entradas/:id', actualizarEntrada);
router.delete('/entradas/:id', eliminarEntrada);

// Nueva ruta para obtener entradas por recinto
router.get('/entradas/recinto/:recintoId', obtenerEntradasPorRecinto);

export default router;