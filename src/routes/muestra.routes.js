import { Router } from "express";
import {
  createMuestra,
  deleteMuestra,
  getMuestraById,
  getMuestras,
  updateMuestra,
} from "../controllers/muestra.controller.js";

const router = Router();

router.get("/", getMuestras);
router.get("/:id", getMuestraById);
router.post("/", createMuestra);
router.put("/:id", updateMuestra);
router.delete("/:id", deleteMuestra);

export default router;
