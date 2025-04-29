import Evento from '../models/Evento.js';

// Crear un nuevo evento
export const createEvento = async (req, res) => {
  try {
    const { nombre, activo, oculto, desactivado, sector, recinto, sala } = req.body;

    if (!nombre || !sector || !recinto || !sala) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados.' });
    }

    const evento = new Evento({
      nombre,
      activo: activo || true,
      oculto: oculto || false,
      desactivado: desactivado || false,
      sector,
      recinto,
      sala,
    });

    await evento.save();
    res.status(201).json(evento);
  } catch (error) {
    console.error('Error al guardar el evento:', error);
    res.status(500).json({ message: 'Hubo un error al guardar el evento.', error: error.message });
  }
};

// Obtener todos los eventos
export const getEventos = async (req, res) => {
  try {
    const eventos = await Evento.find();
    res.status(200).json(eventos);
  } catch (error) {
    console.error('Error al obtener los eventos:', error);
    res.status(500).json({ message: 'Hubo un error al obtener los eventos.', error: error.message });
  }
};

// Obtener un evento por su ID
export const getEventoById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID del evento no válido.' });
    }

    const evento = await Evento.findById(id);

    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    res.status(200).json(evento);
  } catch (error) {
    console.error('Error al obtener el evento:', error);
    res.status(500).json({ message: 'Hubo un error al obtener el evento.', error: error.message });
  }
};

// Actualizar un evento por su ID
export const updateEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID del evento no válido.' });
    }

    const updatedEvento = await Evento.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedEvento) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    res.status(200).json(updatedEvento);
  } catch (error) {
    console.error('Error al actualizar el evento:', error);
    res.status(500).json({ message: 'Hubo un error al actualizar el evento.', error: error.message });
  }
};

// Controlador para eliminar un evento por su ID
export const deleteEvento = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID proporcionado sea válido
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'ID del evento no válido.' });
    }

    const evento = await Evento.findByIdAndDelete(id);

    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    res.status(200).json({ message: 'Evento eliminado con éxito.' });
  } catch (error) {
    console.error('Error al eliminar el evento:', error);
    res.status(500).json({ message: 'Hubo un error al eliminar el evento.', error: error.message });
  }
};