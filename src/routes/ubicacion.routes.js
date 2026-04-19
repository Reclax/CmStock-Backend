import { Router } from "express";
import {
  createUbicacion,
  deleteUbicacion,
  getUbicacionById,
  getUbicaciones,
  updateUbicacion,
} from "../controllers/ubicacion.controller.js";

const router = Router();

router.get("/", getUbicaciones);
router.get("/:id", getUbicacionById);
router.post("/", createUbicacion);
router.put("/:id", updateUbicacion);
router.patch("/:id", updateUbicacion);
router.delete("/:id", deleteUbicacion);

export default router;
