import Plantilla from '../models/Plantilla.js';

// Crear una nueva plantilla de precios
export const crearPlantilla = async (req, res) => {
  const { nombre, recinto, sala, detalles } = req.body;

  try {
    const nuevaPlantilla = new Plantilla({
      nombre,
      recinto,
      sala,
      detalles,
    });

    const plantillaGuardada = await nuevaPlantilla.save();
    res.status(201).json(plantillaGuardada);
  } catch (error) {
    console.error('Error al guardar la plantilla:', error);
    res.status(500).json({ message: 'Error al guardar la plantilla', error: error.message });
  }
};

// Obtener todas las plantillas de precios
export const obtenerPlantillas = async (req, res) => {
  try {
    const plantillas = await Plantilla.find();
    res.status(200).json(plantillas);
  } catch (error) {
    console.error('Error al obtener las plantillas:', error);
    res.status(500).json({ message: 'Error al obtener las plantillas', error: error.message });
  }
};

// Obtener una plantilla específica por ID
export const obtenerPlantillaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const plantilla = await Plantilla.findById(id);

    if (!plantilla) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    res.status(200).json(plantilla);
  } catch (error) {
    console.error('Error al obtener la plantilla:', error);
    res.status(500).json({ message: 'Error al obtener la plantilla', error: error.message });
  }
};

// Actualizar una plantilla de precios
export const actualizarPlantilla = async (req, res) => {
  const { id } = req.params;
  const { nombre, recinto, sala, detalles } = req.body;

  try {
    const plantillaActualizada = await Plantilla.findByIdAndUpdate(id, {
      nombre,
      recinto,
      sala,
      detalles,
    }, { new: true });

    if (!plantillaActualizada) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    res.status(200).json(plantillaActualizada);
  } catch (error) {
    console.error('Error al actualizar la plantilla:', error);
    res.status(500).json({ message: 'Error al actualizar la plantilla', error: error.message });
  }
};

// Eliminar una plantilla de precios
export const eliminarPlantilla = async (req, res) => {
  const { id } = req.params;

  try {
    const plantillaEliminada = await Plantilla.findByIdAndDelete(id);

    if (!plantillaEliminada) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }

    res.status(200).json({ message: 'Plantilla eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la plantilla:', error);
    res.status(500).json({ message: 'Error al eliminar la plantilla', error: error.message });
  }
};

// Obtener plantillas por recinto y sala
export const obtenerPlantillasPorRecintoYSala = async (req, res) => {
  const { recintoId, salaId } = req.params;

  try {
    const plantillas = await Plantilla.find({
      recinto: recintoId,
      sala: salaId
    });

    res.status(200).json(plantillas);
  } catch (error) {
    console.error('Error al obtener las plantillas:', error);
    res.status(500).json({ message: 'Error al obtener las plantillas', error: error.message });
  }
};