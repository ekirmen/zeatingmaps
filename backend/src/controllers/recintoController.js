// src/controllers/recintoController.js

import Recinto from '../models/Recintos.js';
import Sala from '../models/Sala.js';

// Obtener todos los recintos con sus salas
export const getRecintos = async (req, res) => {
  try {
    const recintos = await Recinto.find().populate('salas');
    res.json(recintos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los recintos' });
  }
};

// Crear un nuevo recinto y una sala por defecto
export const createRecinto = async (req, res) => {
  const { nombre, direccion, capacidad } = req.body;

  if (!nombre || !direccion || !capacidad) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    const nuevoRecinto = new Recinto({ nombre, direccion, capacidad });
    await nuevoRecinto.save();

    // Crear una sala principal automáticamente al crear el recinto
    const nuevaSala = new Sala({ nombre: 'Sala Principal', recinto: nuevoRecinto._id });
    await nuevaSala.save();

    nuevoRecinto.salas.push(nuevaSala._id);
    await nuevoRecinto.save();

    res.status(201).json({ recinto: nuevoRecinto, sala: nuevaSala });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el recinto' });
  }
};

// Obtener todas las salas de un recinto
export const getSalas = async (req, res) => {
  const { recintoId } = req.params;

  try {
    const salas = await Sala.find({ recinto: recintoId }).populate('recinto');
    res.json(salas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las salas' });
  }
};

// Crear una nueva sala en un recinto específico
export const createSala = async (req, res) => {
  const { recintoId } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'El nombre de la sala es requerido' });
  }

  try {
    const nuevaSala = new Sala({ nombre, recinto: recintoId });
    await nuevaSala.save();

    // Asociar la nueva sala al recinto
    await Recinto.findByIdAndUpdate(
      recintoId,
      { $push: { salas: nuevaSala._id } },
      { new: true }
    );

    res.status(201).json(nuevaSala);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la sala' });
  }
};

// Actualizar el nombre de una sala
export const updateSala = async (req, res) => {
  const { salaId } = req.params;
  const { nombre } = req.body;

  try {
    const salaActualizada = await Sala.findByIdAndUpdate(salaId, { nombre }, { new: true });
    if (!salaActualizada) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }
    res.json(salaActualizada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la sala' });
  }
};

// Eliminar una sala
export const deleteSala = async (req, res) => {
  const { salaId } = req.params;

  try {
    const salaEliminada = await Sala.findByIdAndDelete(salaId);
    if (!salaEliminada) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }

    // Eliminar la sala del array de salas del recinto
    await Recinto.findByIdAndUpdate(salaEliminada.recinto, { $pull: { salas: salaId } });

    res.status(200).json({ message: 'Sala eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la sala' });
  }
};

// Add this function to your controller
export const updateRecinto = async (req, res) => {
  try {
    const { recintoId } = req.params;
    const { nombre, direccion, capacidad } = req.body;

    const updatedRecinto = await Recinto.findByIdAndUpdate(
      recintoId,
      { nombre, direccion, capacidad },
      { new: true }
    ).populate('salas');

    if (!updatedRecinto) {
      return res.status(404).json({ message: 'Recinto no encontrado' });
    }

    res.json(updatedRecinto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
