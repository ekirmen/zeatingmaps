import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const galleryDir = path.join(__dirname, '..', 'uploads', 'eventos', 'extra');

if (!fs.existsSync(galleryDir)) {
  fs.mkdirSync(galleryDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, galleryDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueName}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

router.get('/', protect, (req, res) => {
  fs.readdir(galleryDir, (err, files) => {
    if (err) return res.status(500).json({ message: 'Error reading images' });
    const images = files.map(name => ({
      name,
      url: `/public/uploads/eventos/extra/${name}`
    }));
    res.json(images);
  });
});

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({
    name: req.file.filename,
    url: `/public/uploads/eventos/extra/${req.file.filename}`
  });
});

router.delete('/:filename', protect, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(galleryDir, filename);
  fs.unlink(filePath, err => {
    if (err) return res.status(404).json({ message: 'Image not found' });
    res.json({ message: 'Image deleted' });
  });
});

export default router;
