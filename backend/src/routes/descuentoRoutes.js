import express from 'express';
import Descuento from '../models/Descuento.js';

const router = express.Router();

// Obtener todos los descuentos
router.get('/', async (req, res) => {
  try {
    const descuentos = await Descuento.find().populate('evento zonas');
    res.json(descuentos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un descuento por ID
router.get('/:id', async (req, res) => {
  try {
    const descuento = await Descuento.findById(req.params.id).populate('evento zonas');
    if (!descuento) return res.status(404).json({ message: 'Descuento no encontrado' });
    res.json(descuento);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un nuevo descuento
router.post('/', async (req, res) => {
  try {
    const descuento = new Descuento(req.body);
    const saved = await descuento.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar descuento
router.put('/:id', async (req, res) => {
  try {
    const updated = await Descuento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Descuento no encontrado' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar descuento
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Descuento.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Descuento no encontrado' });
    res.json({ message: 'Descuento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
