import { Router } from "express";
import {
  createFoto,
  deleteFoto,
  getFotoById,
  getFotos,
  updateFoto,
} from "../controllers/foto.controller.js";

const router = Router();

router.get("/", getFotos);
router.get("/:id", getFotoById);
router.post("/", createFoto);
router.put("/:id", updateFoto);
router.patch("/:id", updateFoto);
router.delete("/:id", deleteFoto);

export default router;
