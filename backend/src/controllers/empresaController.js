import connectToCompanyDB from '../utils/dynamicDatabase.js';
import Empresa from '../models/Empresa.js';  // Suponiendo que tienes un modelo Empresa
// Conectar a la base de datos de la empresa
const usarEmpresa = async (empresaId) => {
  const empresa = await Empresa.findById(empresaId); // Buscar la empresa en la base de datos global
  if (!empresa) {
    throw new Error('Empresa no encontrada');
  }

  const dbConnection = await connectToCompanyDB(empresa.baseDatos); // Conectar a la base de datos de la empresa
  return dbConnection;
};

// Obtener todas las compañías
export const obtenerCompanias = async (req, res) => {
  try {
    const companias = await Empresa.find();  // Obtener todas las empresas
    res.json(companias);
  } catch (error) {
    console.error('Error al obtener compañías:', error);
    res.status(500).json({ message: 'Error al obtener compañías' });
  }
};

// Ver eventos de una compañía específica
export const obtenerEventosDeCompania = async (req, res) => {
  const { empresaId } = req.params;  // Obtener el ID de la empresa desde los parámetros

  try {
    // Usar la conexión a la base de datos de la empresa
    const dbConnection = await usarEmpresa(empresaId);  // Usar la base de datos específica
    const eventos = await Evento.find({ empresaId });  // Obtener los eventos de esa empresa

    res.json(eventos);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ message: 'Error al obtener eventos' });
  }
};

// Crear una nueva compañía
export const crearCompania = async (req, res) => {
  const { nombre, baseDatos } = req.body;

  try {
    // Comprobar si la compañía ya existe
    const empresaExistente = await Empresa.findOne({ nombre });
    if (empresaExistente) {
      return res.status(400).json({ message: 'La compañía ya existe' });
    }

    // Crear la nueva empresa
    const nuevaEmpresa = new Empresa({ nombre, baseDatos });
    await nuevaEmpresa.save();

    res.status(201).json({ message: 'Compañía creada con éxito', empresa: nuevaEmpresa });
  } catch (error) {
    console.error('Error al crear la compañía:', error);
    res.status(500).json({ message: 'Error al crear la compañía' });
  }
};

// Crear un evento para una compañía específica
export const crearEvento = async (req, res) => {
  const { empresaId } = req.params;
  const { nombre, descripcion, fecha } = req.body;

  try {
    // Verificar si la empresa existe
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
      return res.status(404).json({ message: 'Compañía no encontrada' });
    }

    // Crear el evento. Si no se proporciona una fecha, se utilizará la de creación
    const eventoData = {
      nombre,
      descripcion,
      empresaId,
    };
    if (fecha) {
      eventoData.fecha = fecha;
    }

    const nuevoEvento = new Evento(eventoData);

    await nuevoEvento.save();

    res.status(201).json({ message: 'Evento creado con éxito', evento: nuevoEvento });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ message: 'Error al crear evento' });
  }
};
