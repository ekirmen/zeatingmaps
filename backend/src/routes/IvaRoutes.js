import express from 'express';
import Iva from '../models/Iva.js';

const router = express.Router();

// Get all IVAs
router.get('/', async (req, res) => {
  try {
    const ivas = await Iva.find();
    res.json(ivas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new IVA
router.post('/', async (req, res) => {
  try {
    const iva = new Iva(req.body);
    const savedIva = await iva.save();
    res.status(201).json(savedIva);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update IVA
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating IVA with ID:', req.params.id);
    console.log('Update data:', req.body);

    const updatedIva = await Iva.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedIva) {
      console.log('IVA not found with ID:', req.params.id);
      return res.status(404).json({ message: 'IVA no encontrado' });
    }

    console.log('IVA updated successfully:', updatedIva);
    res.json(updatedIva);
  } catch (error) {
    console.error('Error updating IVA:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete IVA
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting IVA with ID:', req.params.id);

    const deletedIva = await Iva.findByIdAndDelete(req.params.id);
    
    if (!deletedIva) {
      console.log('IVA not found with ID:', req.params.id);
      return res.status(404).json({ message: 'IVA no encontrado' });
    }

    console.log('IVA deleted successfully:', deletedIva);
    res.json({ message: 'IVA eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting IVA:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
