import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

import authGlobalRoutes from './src/routes/authGlobalRoutes.js';
import usuarioGlobalRoutes from './src/routes/userglobalRoutes.js';

import recintoRoutes from './src/routes/recintoRoutes.js';
import zonaRoutes from './src/routes/zonaRoutes.js';
import mapaRoutes from './src/routes/mapaRoutes.js';
import eventRoutes from './src/routes/eventRoutes.js';
import IvaRoutes from './src/routes/IvaRoutes.js';
import entradaRoutes from './src/routes/entradaRoutes.js';
import plantillaRoutes from './src/routes/plantillaRoutes.js';
import funcionsRoutes from './src/routes/funcionesRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';

// Importar el modelo de Mapa
import Mapa from './src/models/Mapa.js';

// Configuración de dotenv
import dotenv from 'dotenv';
dotenv.config();

// Crear instancia de Express
const app = express();

// Configuración del puerto
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend's origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parsear JSON en las solicitudes

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB conectado'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Registrar las rutas
app.use('/api', authRoutes);
app.use('/api', userRoutes); // Rutas de usuarios
app.use('/api', authGlobalRoutes); // Para usuarios administrativos
app.use('/api', usuarioGlobalRoutes); // Rutas de usuarios globales
app.use('/api', recintoRoutes); // Rutas de recintos
app.use('/api/zonas', zonaRoutes); // Rutas de zonas
app.use('/api', mapaRoutes); // Rutas de mapas
app.use('/api/events', eventRoutes); // Rutas de eventos
app.use('/api/ivas', IvaRoutes); // Rutas de IVA
app.use('/api', entradaRoutes); // Rutas de entradas
app.use('/api/plantillas', plantillaRoutes); // Rutas de plantillas
app.use('/api/funcions', funcionsRoutes); // Rutas de funciones
app.use('/api/payments', paymentRoutes); // Updated path for payment routes

// Ruta de comprobación de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Ruta para obtener los asientos de una sala
app.get('/api/salas/:salaId/seats', async (req, res) => {
  const { salaId } = req.params; // Obtenemos el ID de la sala desde los parámetros de la URL
  try {
    // Buscar el mapa por salaId
    const mapa = await Mapa.findOne({ sala: salaId });

    if (!mapa) {
      return res.status(404).json({ message: 'Mapa no encontrado' });
    }

    // Extraer todas las sillas de los elementos de tipo "mesa"
    const sillas = mapa.contenido.reduce((acc, item) => {
      if (item.type === 'rect' || item.type === 'circle') {
        // Si el tipo es mesa, agregar las sillas de esa mesa al acumulador
        acc.push(...item.sillas);
      }
      return acc;
    }, []);

    // Si no se encontraron sillas, devolver un mensaje
    if (sillas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron sillas en el mapa' });
    }

    res.json(sillas); // Devolver las sillas encontradas
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener los asientos', error: err.message });
  }
});

import salaRoutes from './src/routes/salaRoutes.js';

// Register the route
app.use('/api/salas', salaRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores globales (debe estar después de todas las rutas)
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err.stack);
  res.status(500).json({ message: 'Error en el servidor', error: err.message });
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor en ejecución en http://localhost:${PORT}`);
});
