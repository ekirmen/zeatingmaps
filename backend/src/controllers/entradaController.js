import mongoose from 'mongoose';
import Entrada from '../models/entrada.js';

// Crear una nueva entrada
export const crearEntrada = async (req, res) => {
  try {
    const { recinto, producto, min, max, iva, activo, tipoProducto } = req.body;

    const nuevaEntrada = await Entrada.create({
      recinto,
      producto,
      min,
      max,
      iva,
      activo,
      tipoProducto
    });

    res.status(201).json(nuevaEntrada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las entradas o entradas por recinto
export const obtenerEntradas = async (req, res) => {
  try {
    const { recinto } = req.query;

    if (recinto) {
      const entradasPorRecinto = await Entrada.find({ recinto });
      return res.status(200).json(entradasPorRecinto);
    }

    const todasLasEntradas = await Entrada.find();
    res.status(200).json(todasLasEntradas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener entradas' });
  }
};

// Obtener una entrada específica por ID
export const obtenerEntradaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const entrada = await Entrada.findById(id).populate('iva');

    if (!entrada) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.status(200).json(entrada);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar una entrada específica por ID
export const actualizarEntrada = async (req, res) => {
  const { id } = req.params;

  console.log('ID recibido en backend:', id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  
  try {
    const datos = req.body;

    const entradaActualizada = await Entrada.findByIdAndUpdate(
      id, 
      { $set: datos }, 
      { new: true, runValidators: true }
    );

    if (!entradaActualizada) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.status(200).json(entradaActualizada);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una entrada específica por ID
export const eliminarEntrada = async (req, res) => {
  try {
    const { id } = req.params;
    const entradaEliminada = await Entrada.findByIdAndDelete(id);

    if (!entradaEliminada) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.status(200).json({ message: 'Entrada eliminada correctamente' });
  } catch (error) {
    res.status(400).json({ message: 'Error al eliminar la entrada' });
  }
};

// archivo: entradaController.js
export const obtenerEntradasPorRecinto = async (req, res) => {
  const { recintoId } = req.params;
  try {
    const entradas = await Entrada.find({ recinto: recintoId });
    res.status(200).json(entradas);
  } catch (error) {
    console.error('Error al obtener las entradas por recinto:', error);
    res.status(500).json({ message: 'Error al obtener las entradas por recinto', error: error.message });
  }
};