import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';

// Modelos
import './models/Mesa.js';
import './models/Evento.js';
import './models/Payment.js';
import './models/Ticket.js';
// Add this with your other model imports
import './models/Seat.js';
import Mapa from './models/Mapa.js';
import User from './models/User.js';

// Middleware autenticación
import { protect as authMiddleware } from './middleware/authMiddleware.js';

// Rutas
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userroutes.js';
import authGlobalRoutes from './routes/authGlobalRoutes.js';
import recintoRoutes from './routes/recintoRoutes.js';
import zonaRoutes from './routes/zonaRoutes.js';
import mapaRoutes from './routes/mapaRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import IvaRoutes from './routes/IvaRoutes.js';
import entradaRoutes from './routes/entradaRoutes.js';
import plantillaRoutes from './routes/plantillaRoutes.js';
import funcionsRoutes from './routes/funcionesRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import salaRoutes from './routes/salaRoutes.js';
import mesaRoutes from './routes/mesaRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import seatRoutes from './routes/seatRoutes.js';
import metodoPagoRoutes from './routes/metodoPagoRoutes.js';
import tagRoutes from './routes/tagRoutes.js';

import { errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------- Configuración global -----------

// Verificar variables de entorno
console.log('Environment check:', {
  mongoUri: process.env.MONGO_URI ? 'Set' : 'Missing',
  jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Missing',
  nodeEnv: process.env.NODE_ENV || 'development'
});

// CORS
app.use(cors({
  origin: 'http://localhost:3000', // Cambiar según entorno si es necesario
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------- Configuración Multer para Quill -----------

const quillStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'uploads', 'eventos', 'espectaculo');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `espectaculo-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const quillUpload = multer({
  storage: quillStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ----------- Carpetas estáticas -----------

const publicUploadsPath = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(publicUploadsPath)) {
  fs.mkdirSync(publicUploadsPath, { recursive: true });
}

app.use('/public/uploads', express.static(publicUploadsPath));

// ----------- Conexión a MongoDB -----------

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// ----------- Middleware para validar ObjectId -----------

const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

// ----------- Rutas -----------

// Ruta upload de imágenes para Quill con autenticación
app.post('/api/events/upload', authMiddleware, quillUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
    }
    const imageUrl = `/public/uploads/eventos/espectaculo/${req.file.filename}`;
    res.json({ url: imageUrl, message: 'Imagen subida correctamente', filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: 'Error al subir imagen', error: error.message });
  }
});

// Ruta búsqueda de usuarios
app.get('/api/user/search', async (req, res) => {
  try {
    const { term } = req.query;
    if (!term) return res.status(400).json({ message: 'Search term is required' });

    const users = await User.find({
      $or: [
        { email: { $regex: term, $options: 'i' } },
        { login: { $regex: term, $options: 'i' } }
      ]
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Uso de middleware validateObjectId para rutas con :id
app.use('/api/users/:id', validateObjectId); // Keep this as it might be used elsewhere

// Rutas agrupadas
app.use('/api', authRoutes);
app.use('/api/user', userRoutes); // <-- Esta es la línea correcta que debe estar aquí
app.use('/api', authGlobalRoutes);
app.use('/api', recintoRoutes);
app.use('/api/zonas', zonaRoutes);
app.use('/api', mapaRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ivas', IvaRoutes);
app.use('/api', entradaRoutes);
app.use('/api/plantillas', plantillaRoutes);
app.use('/api/funcions', funcionsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/metodos_pago', metodoPagoRoutes);
app.use('/api/salas', salaRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/tags', tagRoutes);

// Ruta para validar token (autenticación)
app.get('/api/user/validate', authMiddleware, (req, res) => {
  res.status(200).json({ valid: true });
});

// Ruta perfil usuario
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil de usuario' });
  }
});

// Ruta health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// Ruta para obtener sillas de una sala (mapa)
app.get('/api/salas/:salaId/seats', async (req, res) => {
  const { salaId } = req.params;
  try {
    const mapa = await Mapa.findOne({ sala: salaId });
    if (!mapa) return res.status(404).json({ message: 'Mapa no encontrado' });

    const sillas = mapa.contenido.reduce((acc, item) => {
      if (item.type === 'rect' || item.type === 'circle') {
        acc.push(...(item.sillas || []));
      }
      return acc;
    }, []);

    if (sillas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron sillas en el mapa' });
    }

    res.json(sillas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los asientos', error: error.message });
  }
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware global de manejo de errores
app.use(errorHandler);

// ----------- Arrancar servidor -----------

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
