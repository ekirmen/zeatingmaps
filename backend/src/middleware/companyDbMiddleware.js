// middleware/companyDbMiddleware.js

import connectToCompanyDB from '../utils/dynamicDatabase.js';
import Empresa from '../models/Empresa.js';

const companyDbMiddleware = async (req, res, next) => {
  try {
    const empresa = await Empresa.findById(req.params.empresaId); // Suponiendo que el ID de la empresa está en los parámetros
    if (!empresa) {
      return res.status(404).send({ error: 'Empresa no encontrada' });
    }
    const dbConnection = await connectToCompanyDB(empresa.baseDatos); // Conectar a la base de datos de la empresa
    req.dbConnection = dbConnection; // Pasar la conexión a la siguiente función
    next();
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

export default companyDbMiddleware;
