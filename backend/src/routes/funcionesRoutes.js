import express from 'express';
import Funcion from '../models/Funcion.js';

const router = express.Router();

// Get all functions
router.get('/', async (req, res) => {
  try {
    const { evento } = req.query;
    const query = evento ? { evento } : {};
    
    const funciones = await Funcion.find(query)
      .populate('evento')
      .populate('sala')
      .populate('plantilla');
    res.json(funciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get functions by event ID
router.get('/evento/:eventoId', async (req, res) => {
  try {
    const funciones = await Funcion.find({ evento: req.params.eventoId })
      .populate('evento')
      .populate('sala')
      .populate('plantilla');
    res.json(funciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create function
router.post('/', async (req, res) => {
  const funcion = new Funcion(req.body);
  try {
    const nuevaFuncion = await funcion.save();
    const funcionPopulada = await Funcion.findById(nuevaFuncion._id)
      .populate('evento')
      .populate('sala')
      .populate('plantilla');
    res.status(201).json(funcionPopulada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update function
router.put('/:id', async (req, res) => {
  try {
    const funcion = await Funcion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('evento')
    .populate('sala')
    .populate('plantilla');
    
    if (!funcion) {
      return res.status(404).json({ message: 'Función no encontrada' });
    }
    res.json(funcion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete function
router.delete('/:id', async (req, res) => {
  try {
    const funcion = await Funcion.findByIdAndDelete(req.params.id);
    if (!funcion) {
      return res.status(404).json({ message: 'Función no encontrada' });
    }
    res.json({ message: 'Función eliminada' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get plantilla for a specific function
router.get('/:id/plantilla', async (req, res) => {
  try {
    const funcion = await Funcion.findById(req.params.id)
      .populate('plantilla');
    
    if (!funcion) {
      return res.status(404).json({ message: 'Function not found' });
    }
    
    if (!funcion.plantilla) {
      return res.status(404).json({ message: 'No template assigned to this function' });
    }

    res.json(funcion.plantilla);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;