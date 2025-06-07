import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ruta base donde se guardarán los archivos
const destination = 'public/uploads/eventos/espectaculo';

// Crear el directorio si no existe
if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination, { recursive: true });
}

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, destination);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtro opcional de tipos de archivo (solo imágenes)
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Solo se permiten imágenes'), false);
  }
  cb(null, true);
};

// Instancia de multer
const quillUpload = multer({ storage, fileFilter });

export { quillUpload };
