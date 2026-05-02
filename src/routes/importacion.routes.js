import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  importarBaseDisController,
  importarAprobacionesController,
  importarTodosController,
} from '../controllers/importacion.controller.js';

const router = express.Router();

// Configuración de multer para guardar archivos
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads/imports');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Guardar con timestamp para evitar conflictos
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Solo permitir archivos Excel
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }

    cb(null, true);
  },
});

/**
 * POST /api/importacion/base-dis
 * Importar archivo BASE DIS 2025
 */
router.post('/base-dis', upload.single('file'), importarBaseDisController);

/**
 * POST /api/importacion/aprobaciones
 * Importar archivo Aprobaciones
 */
router.post('/aprobaciones', upload.single('file'), importarAprobacionesController);

/**
 * POST /api/importacion/todos
 * Importar múltiples archivos (baseDis, aprobaciones)
 */
router.post('/todos', upload.fields([
  { name: 'baseDis', maxCount: 1 },
  { name: 'aprobaciones', maxCount: 1 },
]), importarTodosController);

export default router;
