import Funcion from '../models/Funcion.js';
import { body, validationResult } from 'express-validator';

// Validaciones para crear y actualizar funciones
const validarFuncion = [
  body('fechaCelebracion').notEmpty().withMessage('La fecha de celebración es obligatoria'),
  body('evento').notEmpty().withMessage('El evento es obligatorio'),
  body('sala').notEmpty().withMessage('La sala es obligatoria'),
  body('plantilla').notEmpty().withMessage('La plantilla es obligatoria'),
  body('inicioVenta').notEmpty().withMessage('La fecha de inicio de venta es obligatoria'),
  body('finVenta').notEmpty().withMessage('La fecha de fin de venta es obligatoria'),
];

// Crear una nueva función
export const crearFuncion = [
  ...validarFuncion, // Aplicar validaciones
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fechaCelebracion, evento, sala, plantilla, inicioVenta, finVenta } = req.body;

    try {
      const nuevaFuncion = new Funcion({
        fechaCelebracion,
        evento,
        sala,
        plantilla,
        inicioVenta,
        finVenta,
      });

      const funcionGuardada = await nuevaFuncion.save();
      res.status(201).json(funcionGuardada);
    } catch (error) {
      console.error('Error al guardar la función:', error);
      res.status(500).json({ message: 'Error al guardar la función', error: error.message });
    }
  },
];

// Obtener todas las funciones
export const obtenerFunciones = async (req, res) => {
  try {
    const funciones = await Funcion.find()
      .populate('evento') // Cargar el evento relacionado
      .populate('sala') // Cargar la sala relacionada
      .populate('plantilla'); // Cargar la plantilla relacionada
    res.status(200).json(funciones);
  } catch (error) {
    console.error('Error al obtener las funciones:', error);
    res.status(500).json({ message: 'Error al obtener las funciones', error: error.message });
  }
};

// Obtener una función por ID
export const obtenerFuncionPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const funcion = await Funcion.findById(id)
      .populate('evento') // Cargar el evento relacionado
      .populate('sala') // Cargar la sala relacionada
      .populate('plantilla'); // Cargar la plantilla relacionada

    if (!funcion) {
      return res.status(404).json({ message: 'Función no encontrada' });
    }

    res.status(200).json(funcion);
  } catch (error) {
    console.error('Error al obtener la función:', error);
    res.status(500).json({ message: 'Error al obtener la función', error: error.message });
  }
};

// Actualizar una función
export const actualizarFuncion = [
  ...validarFuncion, // Aplicar validaciones
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { fechaCelebracion, evento, sala, plantilla, inicioVenta, finVenta } = req.body;

    try {
      const funcionActualizada = await Funcion.findByIdAndUpdate(
        id,
        {
          fechaCelebracion,
          evento,
          sala,
          plantilla,
          inicioVenta,
          finVenta,
        },
        { new: true }
      )
        .populate('evento') // Cargar el evento relacionado
        .populate('sala') // Cargar la sala relacionada
        .populate('plantilla'); // Cargar la plantilla relacionada

      if (!funcionActualizada) {
        return res.status(404).json({ message: 'Función no encontrada' });
      }

      res.status(200).json(funcionActualizada);
    } catch (error) {
      console.error('Error al actualizar la función:', error);
      res.status(500).json({ message: 'Error al actualizar la función', error: error.message });
    }
  },
];

// Eliminar una función
export const eliminarFuncion = async (req, res) => {
  const { id } = req.params;

  try {
    const funcionEliminada = await Funcion.findByIdAndDelete(id);

    if (!funcionEliminada) {
      return res.status(404).json({ message: 'Función no encontrada' });
    }

    res.status(200).json({ message: 'Función eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la función:', error);
    res.status(500).json({ message: 'Error al eliminar la función', error: error.message });
  }
};