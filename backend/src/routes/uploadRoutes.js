import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const eventosPath = path.join(uploadPath, 'eventos');
    if (!fs.existsSync(eventosPath)) {
      fs.mkdirSync(eventosPath, { recursive: true });
    }
    cb(null, eventosPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueName}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  }
});

// Ruta para subir un archivo individual
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  res.status(200).json({
    message: 'Archivo subido correctamente',
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    // Prefix returned URL with `/public` to match the static path
    url: `/public/uploads/eventos/${req.file.filename}`
  });
});

// Nueva ruta para subir múltiples imágenes del espectáculo
router.post('/espectaculo', protect, upload.array('espectaculo', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No se subieron archivos' });
  }

  const fileUrls = req.files.map(file => ({
    filename: file.filename,
    url: `/public/uploads/eventos/${file.filename}`
  }));

  res.status(200).json({
    message: 'Archivos subidos correctamente',
    files: fileUrls
  });
});

export default router;
