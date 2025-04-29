import Mapa from '../models/Mapa.js';

// Crear o actualizar un mapa
export const createOrUpdateMapa = async (req, res) => {
  const { salaId, contenido } = req.body;

  // Validación de datos
  if (!salaId || !contenido) {
    return res.status(400).json({ message: 'Faltan datos necesarios (salaId, contenido)' });
  }

  try {
    // Validar que cada elemento en `contenido` tenga `x` e `y`
    const contenidoValido = contenido.every((el) => el.posicion?.x !== undefined && el.posicion?.y !== undefined);
    if (!contenidoValido) {
      return res.status(400).json({ message: 'Cada elemento en `contenido` debe tener `x` e `y` definidos.' });
    }

    // Buscar un mapa existente para la sala
    const existingMapa = await Mapa.findOne({ sala: salaId });

    if (existingMapa) {
      // Si existe, actualizar su contenido
      existingMapa.contenido = contenido;
      await existingMapa.save();
      return res.status(200).json(existingMapa);
    } else {
      // Si no existe, crear un nuevo mapa
      const newMapa = new Mapa({
        sala: salaId,
        contenido,
      });
      await newMapa.save();
      return res.status(201).json(newMapa);
    }
  } catch (error) {
    console.error('Error al crear o actualizar el mapa:', error);
    return res.status(500).json({ message: 'Error al crear o actualizar el mapa.', error: error.message });
  }
};

// Obtener un mapa por sala
export const getMapaBySala = async (req, res) => {
  const { salaId } = req.params;

  try {
    const mapa = await Mapa.findOne({ sala: salaId }).populate('sala', 'nombre');
    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado' });
    }
    return res.status(200).json(mapa);
  } catch (error) {
    console.error('Error al obtener el mapa:', error);
    return res.status(500).json({ message: 'Error al obtener el mapa.', error: error.message });
  }
};

// Actualizar un mapa
export const updateMapa = async (req, res) => {
  const { mapaId } = req.params;
  const { sala, contenido } = req.body;

  // Validación de datos
  if (!sala || !contenido) {
    return res.status(400).json({ message: 'Faltan datos necesarios (sala, contenido)' });
  }

  try {
    const mapa = await Mapa.findById(mapaId);
    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado.' });
    }

    // Validar que cada elemento en `contenido` tenga `x` e `y`
    const contenidoValido = contenido.every((el) => el.posicion?.x !== undefined && el.posicion?.y !== undefined);
    if (!contenidoValido) {
      return res.status(400).json({ message: 'Cada elemento en `contenido` debe tener `x` e `y` definidos.' });
    }

    // Actualizar los campos del mapa
    mapa.sala = sala;
    mapa.contenido = contenido;

    // Guardar el mapa actualizado
    await mapa.save();
    return res.status(200).json(mapa);
  } catch (error) {
    console.error('Error al actualizar el mapa:', error);
    return res.status(500).json({ message: 'Error al actualizar el mapa.', error: error.message });
  }
};

// Eliminar un mapa
export const deleteMapa = async (req, res) => {
  const { mapaId } = req.params;

  try {
    // Buscar y eliminar el mapa por ID
    const deletedMapa = await Mapa.findByIdAndDelete(mapaId);
    if (!deletedMapa) {
      return res.status(404).json({ message: 'Mapa no encontrado.' });
    }
    return res.status(200).json({ message: 'Mapa eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar el mapa:', error);
    return res.status(500).json({ message: 'Error al eliminar el mapa.', error: error.message });
  }
};

// Agregar un elemento al contenido del mapa
export const addElementoToMapa = async (req, res) => {
  const { mapaId } = req.params;
  const { elemento } = req.body;

  // Validación de datos
  if (!elemento || !elemento.posicion?.x || !elemento.posicion?.y) {
    return res.status(400).json({ message: 'Elemento no proporcionado o falta `x` e `y`.' });
  }

  try {
    // Buscar el mapa por ID
    const mapa = await Mapa.findById(mapaId);
    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado.' });
    }

    // Agregar el nuevo elemento al contenido del mapa
    mapa.contenido.push(elemento);

    // Guardar el mapa actualizado
    await mapa.save();
    return res.status(200).json(mapa);
  } catch (error) {
    console.error('Error al agregar elemento al mapa:', error);
    return res.status(500).json({ message: 'Error al agregar elemento al mapa.', error: error.message });
  }
};