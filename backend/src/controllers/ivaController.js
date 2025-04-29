import Iva from '../models/ivaModel.js';
import mongoose from 'mongoose';

// Obtener todos los IVAs
export const getIvas = async (req, res) => {
  try {
    const ivas = await Iva.find();
    res.status(200).json(ivas);
  } catch (error) {
    console.error('Error al obtener los IVAs:', error);
    res.status(500).json({ message: 'Error al obtener los IVAs', error: error.message });
  }
};

// Crear un nuevo IVA
export const createIva = async (req, res) => {
  const { nombre, porcentaje, base } = req.body;

  // Validar campos obligatorios
  if (!nombre || !porcentaje) {
    return res.status(400).json({ message: 'Nombre y porcentaje son campos obligatorios' });
  }

  try {
    const newIva = new Iva({
      nombre,
      porcentaje,
      base: base || 0
    });

    await newIva.save();
    res.status(201).json(newIva);
  } catch (error) {
    console.error('Error al crear el IVA:', error);
    res.status(500).json({ message: 'Error al crear el IVA', error: error.message });
  }
};

// Actualizar un IVA
export const updateIva = async (req, res) => {
  const { id } = req.params;

  // Validar ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de IVA no válido' });
  }

  try {
    const updatedIva = await Iva.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedIva) {
      return res.status(404).json({ message: 'IVA no encontrado' });
    }

    res.status(200).json(updatedIva);
  } catch (error) {
    console.error('Error al actualizar el IVA:', error);
    res.status(500).json({ message: 'Error al actualizar el IVA', error: error.message });
  }
};

// Eliminar un IVA
export const deleteIva = async (req, res) => {
  const { id } = req.params;

  // Validar ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de IVA no válido' });
  }

  try {
    const deletedIva = await Iva.findByIdAndDelete(id);

    if (!deletedIva) {
      return res.status(404).json({ message: 'IVA no encontrado' });
    }

    res.status(200).json({ message: 'IVA eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el IVA:', error);
    res.status(500).json({ message: 'Error al eliminar el IVA', error: error.message });
  }
};
