import { Router } from "express";
import {
  createFoto,
  deleteFoto,
  getFotoById,
  getFotos,
  reorderFotos,
  uploadFotoArchivo,
  uploadFotosEnMasa,
  updateFoto,
} from "../controllers/foto.controller.js";
import { uploadImage } from "../middleware/upload.middleware.js";

const router = Router();

const uploadSingleImage = (req, res, next) => {
  uploadImage.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    return next();
  });
};

router.get("/", getFotos);
router.get("/:id", getFotoById);
router.post("/upload", uploadSingleImage, uploadFotoArchivo);
router.post("/upload-bulk", uploadImage.array("files", 100), uploadFotosEnMasa);
router.post("/", createFoto);
router.put("/:id", updateFoto);
router.patch("/reordenar", reorderFotos);
router.patch("/:id", updateFoto);
router.delete("/:id", deleteFoto);

export default router;
