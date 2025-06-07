import express from 'express';
import {
  createEvento,
  getEventos,
  getEventoById,
  updateEvento,
  deleteEvento,
  uploadEventImage
} from '../controllers/eventoController.js';

import { protect as authMiddleware } from '../middleware/authMiddleware.js';

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio de subida de imágenes
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'eventos', 'espectaculo');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'espectaculo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB límite
});

const router = express.Router();

// 📤 Subida de imagen para evento
router.post('/upload/:id', upload.single('file'), uploadEventImage);

// 🔐 Rutas de CRUD
router.post('/', authMiddleware, createEvento);
router.get('/', getEventos);
router.get('/:id', getEventoById);
router.put('/:id', authMiddleware, updateEvento);
router.delete('/:id', authMiddleware, deleteEvento);

export default router;
