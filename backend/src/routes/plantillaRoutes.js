
import { Router } from 'express';
import {
  crearPlantilla,
  obtenerPlantillas,
  obtenerPlantillaPorId,
  actualizarPlantilla,
  eliminarPlantilla,
  obtenerPlantillasPorRecintoYSala
} from '../controllers/plantillaPrecioController.js';

const router = Router();

// Generic routes
router.post('/', crearPlantilla);
router.get('/', obtenerPlantillas);

// Specific routes with parameters
router.get('/recinto/:recintoId/sala/:salaId', obtenerPlantillasPorRecintoYSala);

// ID-based routes
router.route('/:id')
  .get(obtenerPlantillaPorId)
  .put(actualizarPlantilla)
  .delete(eliminarPlantilla);

export default router;