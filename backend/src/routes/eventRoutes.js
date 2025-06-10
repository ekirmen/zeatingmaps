import express from 'express';
import {
  createEvento,
  getEventos,
  getEvento,
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

// Campos de imágenes permitidos
const uploadFields = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'obraImagen', maxCount: 1 },
  { name: 'portada', maxCount: 1 },
  { name: 'espectaculo', maxCount: 10 },
  { name: 'logoHorizontal', maxCount: 1 },
  { name: 'logoVertical', maxCount: 1 },
  { name: 'bannerPublicidad', maxCount: 1 },
  { name: 'logoCuadrado', maxCount: 1 },
  { name: 'logoPassbook', maxCount: 1 },
  { name: 'passBookBanner', maxCount: 1 },
  { name: 'icono', maxCount: 1 }
]);

// 🔐 Rutas de CRUD
router.post('/', authMiddleware, uploadFields, createEvento);
router.get('/', getEventos);
router.get('/:identifier', getEvento);
router.put('/:id', authMiddleware, uploadFields, updateEvento);
router.delete('/:id', authMiddleware, deleteEvento);

export default router;
