import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `foto-${unique}${ext}`);
  },
});

const imageFileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    cb(new Error("Formato no permitido. Solo JPG/PNG/WebP."));
    return;
  }
  cb(null, true);
};

const excelFileFilter = (_req, file, cb) => {
  const allowed = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!allowed.includes(file.mimetype) && ![".xlsx", ".xls"].includes(ext)) {
    cb(new Error("Solo se permiten archivos Excel (.xlsx, .xls)"));
    return;
  }

  cb(null, true);
};

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: excelFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
