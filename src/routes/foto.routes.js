import { Router } from "express";
import {
  createFoto,
  deleteFoto,
  getFotoById,
  getFotos,
  uploadFotoArchivo,
  uploadFotosEnMasa,
  updateFoto,
} from "../controllers/foto.controller.js";
import { uploadImage } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/", getFotos);
router.get("/:id", getFotoById);
router.post("/upload", uploadImage.single("file"), uploadFotoArchivo);
router.post("/upload-bulk", uploadImage.array("files", 100), uploadFotosEnMasa);
router.post("/", createFoto);
router.put("/:id", updateFoto);
router.patch("/:id", updateFoto);
router.delete("/:id", deleteFoto);

export default router;
