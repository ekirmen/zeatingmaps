import mongoose from 'mongoose';
import Mapa from '../models/Mapa.js';

// Obtener el mapa por salaId
export const obtenerMapaPorSala = async (req, res) => {
  try {
    const salaId = new mongoose.Types.ObjectId(req.params.id);

    const mapa = await Mapa.findOne({ salaId });

    if (!mapa) {
      return res.status(200).json(null);
    }

    res.json(mapa);
  } catch (err) {
    console.error('Error al obtener el mapa:', err);
    res.status(500).json({ mensaje: 'Error al obtener el mapa' });
  }
};

// Crear o actualizar un mapa
export const guardarMapaPorSala = async (req, res) => {
  try {
    const salaIdRaw = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(salaIdRaw)) {
      return res.status(400).json({ mensaje: 'ID de sala inválido' });
    }

    const salaId = new mongoose.Types.ObjectId(salaIdRaw);
    const { contenido } = req.body;

    if (!contenido) {
      return res.status(400).json({ mensaje: 'Contenido del mapa es requerido' });
    }

    const mapaExistente = await Mapa.findOne({ salaId });

    if (mapaExistente) {
      mapaExistente.contenido = contenido;
      await mapaExistente.save();
      return res.status(200).json({ mensaje: 'Mapa actualizado correctamente' });
    } else {
      await Mapa.create({ salaId, contenido });
      return res.status(201).json({ mensaje: 'Mapa creado correctamente' });
    }
  } catch (err) {
    console.error('Error al guardar el mapa:', err);
    res.status(500).json({ mensaje: 'Error al guardar el mapa', error: err.message });
  }
};