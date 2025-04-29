import express from 'express';
import Sala from '../models/Sala.js';
import Recinto from '../models/Recintos.js';  // Update this import path

const router = express.Router();

// Update sala within a recinto
router.put('/recinto/:recintoId/sala/:salaId', async (req, res) => {
    try {
        const { recintoId, salaId } = req.params;
        
        // Verify recinto exists
        const recinto = await Recinto.findById(recintoId);
        if (!recinto) {
            return res.status(404).json({ message: 'Recinto no encontrado' });
        }

        const updatedSala = await Sala.findByIdAndUpdate(
            salaId,
            { ...req.body, recinto: recintoId },
            { new: true }
        );
        
        if (!updatedSala) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }
        
        res.json(updatedSala);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete sala from a recinto
router.delete('/recinto/:recintoId/sala/:salaId', async (req, res) => {
    try {
        const { recintoId, salaId } = req.params;

        // Verify recinto exists
        const recinto = await Recinto.findById(recintoId);
        if (!recinto) {
            return res.status(404).json({ message: 'Recinto no encontrado' });
        }

        const sala = await Sala.findOneAndDelete({ 
            _id: salaId,
            recinto: recintoId 
        });
        
        if (!sala) {
            return res.status(404).json({ message: 'Sala no encontrada' });
        }

        res.json({ message: 'Sala eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Define the route to handle GET requests to /api/salas
router.get('/', (req, res) => {
  // Logic to fetch and return all salas
  res.json({ message: 'Ruta encontrada: /api/salas' });
});

export default router;