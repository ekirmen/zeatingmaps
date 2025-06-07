import Mapa from '../models/Mapa.js';

// Crear una nueva mesa en un mapa
export const createMesa = async (req, res) => {
  try {
    const { salaId, mesa } = req.body;
    const mapa = await Mapa.findOne({ sala: salaId });

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
    const mapa = await Mapa.findOne({ sala: salaId });

    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado' });
    }

    res.json(mapa.contenido);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las mesas', error: error.message });
  }
};