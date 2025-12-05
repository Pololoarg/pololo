// src/config/upload.js
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Para poder usar __dirname en ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta donde se van a guardar las imágenes
const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname); // extensión original (.jpg, .png, etc.)
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + ext); // ej: 1701701701-123456789.png
  },
});

export const upload = multer({ storage });
