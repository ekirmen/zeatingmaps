import express from 'express';
import Zona from '../models/Zona.js';

const router = express.Router();

// Fetch all zones
router.get('/', async (req, res) => {
  try {
    const zonas = await Zona.find();
    res.json(zonas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch zones by room ID
router.get('/sala/:salaId', async (req, res) => {
  const { salaId } = req.params;
  try {
    const zonas = await Zona.find({ sala: salaId });
    if (!zonas.length) {
      return res.status(404).json({ message: 'No se encontraron zonas para esta sala' });
    }
    res.json(zonas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update zona
router.put('/:zonaId', async (req, res) => {
  try {
    const { zonaId } = req.params;
    const updatedZona = await Zona.findByIdAndUpdate(
      zonaId,
      req.body,
      { new: true }
    );
    if (!updatedZona) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }
    res.json(updatedZona);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete zona
router.delete('/:zonaId', async (req, res) => {
  try {
    const { zonaId } = req.params;
    const deletedZona = await Zona.findByIdAndDelete(zonaId);
    if (!deletedZona) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }
    res.json({ message: 'Zona eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create zona (add this route)
router.post('/', async (req, res) => {
  try {
    const zona = new Zona(req.body);
    const savedZona = await zona.save();
    res.status(201).json(savedZona);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
