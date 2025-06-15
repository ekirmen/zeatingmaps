import express from 'express';
import Funcion from '../models/Funcion.js';
import Mapa from '../models/Mapa.js';

const router = express.Router();

// Get all functions
router.get('/', async (req, res) => {
  try {
    const { evento } = req.query;
    const query = evento ? { evento } : {};
    
    const funciones = await Funcion.find(query)
      .populate('evento')
      .populate('sala')
      .populate('plantilla')
      .populate('mapa');
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
      .populate('plantilla')
      .populate('mapa');
    res.json(funciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single function by ID
router.get('/:id', async (req, res) => {
  try {
    const funcion = await Funcion.findById(req.params.id)
      .populate('evento')
      .populate('sala')
      .populate('plantilla')
      .populate('mapa');

    if (!funcion) {
      return res.status(404).json({ message: 'Función no encontrada' });
    }

    res.json(funcion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create function
router.post('/', async (req, res) => {
  const funcion = new Funcion(req.body);
  try {
    const nuevaFuncion = await funcion.save();

    // Clone base sala map for this function
    const baseMapa = await Mapa.findOne({
      salaId: nuevaFuncion.sala,
      funcionId: null
    });

    if (!baseMapa) {
      // Rollback function if no base map exists
      await Funcion.findByIdAndDelete(nuevaFuncion._id);
      return res.status(400).json({
        message: 'Mapa base no encontrado para la sala seleccionada'
      });
    }

    const nuevoMapa = await Mapa.create({
      salaId: baseMapa.salaId,
      funcionId: nuevaFuncion._id,
      contenido: baseMapa.contenido,
    });
    nuevaFuncion.mapa = nuevoMapa._id;
    await nuevaFuncion.save();

    const funcionPopulada = await Funcion.findById(nuevaFuncion._id)
      .populate('evento')
      .populate('sala')
      .populate('plantilla')
      .populate('mapa');
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
    .populate('plantilla')
    .populate('mapa');
    
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

// Get mapa for a specific function
router.get('/:id/mapa', async (req, res) => {
  try {
    const mapa = await Mapa.findOne({ funcionId: req.params.id });
    if (!mapa) {
      // Return null when no map is found so the client can
      // gracefully fall back to the sala's default map
      return res.status(200).json(null);
    }
    res.json(mapa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

