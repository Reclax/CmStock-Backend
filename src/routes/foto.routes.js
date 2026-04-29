import { Router } from "express";
import {
  getFotos,
  reorderFotos,
  uploadFotoArchivo,
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
router.post("/upload", uploadSingleImage, uploadFotoArchivo);
router.patch("/reordenar", reorderFotos);

export default router;
