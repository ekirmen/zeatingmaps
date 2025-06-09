import express from 'express';
import MetodoPago from '../models/MetodoPago.js';

const router = express.Router();

// Obtener todos los métodos de pago
router.get('/', async (req, res) => {
  try {
    const metodos = await MetodoPago.find();
    res.json(metodos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un método de pago
router.post('/', async (req, res) => {
  try {
    const metodo = new MetodoPago(req.body);
    const saved = await metodo.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar un método de pago
router.put('/:id', async (req, res) => {
  try {
    const updated = await MetodoPago.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Método de pago no encontrado' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Eliminar un método de pago
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await MetodoPago.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Método de pago no encontrado' });
    res.json({ message: 'Método de pago eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
