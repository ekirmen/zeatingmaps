import express from 'express';
import {
  createEvento,
  getEventos,
  getEventoById,
  updateEvento,
  deleteEvento
} from '../controllers/eventoController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuración de multer para manejar archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join('public', 'uploads', 'eventos', 'temp');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage }).fields([
  { name: 'banner', maxCount: 1 },
  { name: 'obraImagen', maxCount: 1 },
  { name: 'portada', maxCount: 1 },
  { name: 'espectaculo', maxCount: 10 },
  // Add new ticket format image fields
  { name: 'logoHorizontal', maxCount: 1 },
  { name: 'logoVertical', maxCount: 1 },
  { name: 'bannerPublicidad', maxCount: 1 },
  { name: 'logoCuadrado', maxCount: 1 },
  { name: 'logoPassbook', maxCount: 1 },
  { name: 'passBookBanner', maxCount: 1 },
  { name: 'icono', maxCount: 1 }
]);

router.post('/', upload, createEvento);
router.get('/', getEventos);
router.get('/:id', getEventoById);
router.put('/:id', upload, updateEvento);  // Added upload middleware here
router.delete('/:id', deleteEvento);

export default router;
