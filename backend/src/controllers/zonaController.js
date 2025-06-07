import Zona from '../models/Zona.js';

// Crear una nueva zona vinculada a una sala
export const crearZona = async (req, res) => {
  const { nombre, numerada, aforo, orden, color, sala } = req.body;

  try {
    const nuevaZona = new Zona({ nombre, numerada, aforo, orden, color, sala });
    const zonaGuardada = await nuevaZona.save();
    res.status(201).json(zonaGuardada);
  } catch (error) {
    console.error('Error al crear la zona:', error);
    res.status(500).json({ message: 'Error al crear la zona' });
  }
};

// Obtener todas las zonas de una sala
export const obtenerZonasPorSala = async (req, res) => {
  const { salaId } = req.params;

  try {
    const zonas = await Zona.find({ sala: salaId });
    res.status(200).json(zonas);
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({ message: 'Error al obtener zonas' });
  }
};

// Editar una zona
export const editarZona = async (req, res) => {
  const { zonaId } = req.params;
  const datosActualizados = req.body;

  try {
    const zonaActualizada = await Zona.findByIdAndUpdate(zonaId, datosActualizados, { new: true });
    if (!zonaActualizada) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }
    res.status(200).json(zonaActualizada);
  } catch (error) {
    console.error('Error al editar la zona:', error);
    res.status(500).json({ message: 'Error al editar la zona' });
  }
};

// Eliminar una zona
export const eliminarZona = async (req, res) => {
  const { zonaId } = req.params;

  try {
    const zonaEliminada = await Zona.findByIdAndDelete(zonaId);
    if (!zonaEliminada) {
      return res.status(404).json({ message: 'Zona no encontrada' });
    }
    res.status(200).json({ message: 'Zona eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la zona:', error);
    res.status(500).json({ message: 'Error al eliminar la zona' });
  }
};


export const obtenerTodasLasZonas = async (req, res) => {
  try {
    const zonas = await Zona.find();
    res.status(200).json(zonas);
  } catch (error) {
    console.error('Error al obtener las zonas:', error);
    res.status(500).json({ message: 'Error al obtener las zonas', error: error.message });
  }
};