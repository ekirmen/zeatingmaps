import mongoose from 'mongoose';
import Mapa from '../models/Mapa.js';

// Crear una nueva mesa en un mapa
export const createMesa = async (req, res) => {
  try {
    const { salaId, mesa } = req.body;
    const mapa = await Mapa.findOne({ salaId });

    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado' });
    }

    mapa.contenido.push(mesa);
    const mapaActualizado = await mapa.save();
    res.status(201).json(mapaActualizado);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la mesa', error: error.message });
  }
};

// Obtener mesas de un mapa por salaId
export const getMesasBySala = async (req, res) => {
  try {
    const salaId = req.params.salaId;
    const mapa = await Mapa.findOne({ salaId });

    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado' });
    }

    res.json(mapa.contenido);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las mesas', error: error.message });
  }
};

// Actualizar una mesa existente
export const updateMesa = async (req, res) => {
  try {
    const { salaId, mesaId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(mesaId)) {
      return res.status(400).json({ message: 'ID de mesa inválido' });
    }

    const mapa = await Mapa.findOne({ salaId });

    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado' });
    }

    const index = mapa.contenido.findIndex(m => m._id.toString() === mesaId);
    if (index === -1) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    mapa.contenido[index] = {
      ...mapa.contenido[index].toObject(),
      ...updateData
    };

    await mapa.save();

    res.json(mapa.contenido[index]);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la mesa', error: error.message });
  }
};

// Eliminar una mesa de un mapa
export const deleteMesa = async (req, res) => {
  try {
    const { salaId, mesaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mesaId)) {
      return res.status(400).json({ message: 'ID de mesa inválido' });
    }

    const mapa = await Mapa.findOne({ salaId });

    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado' });
    }

    const originalLength = mapa.contenido.length;
    mapa.contenido = mapa.contenido.filter(m => m._id.toString() !== mesaId);

    if (mapa.contenido.length === originalLength) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    await mapa.save();

    res.json({ message: 'Mesa eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la mesa', error: error.message });
  }
};
