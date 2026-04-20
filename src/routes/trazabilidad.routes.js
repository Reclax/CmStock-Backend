import { Router } from "express";
import {
  createTrazabilidad,
  deleteTrazabilidad,
  getTrazabilidadById,
  getTrazabilidades,
  updateTrazabilidad,
} from "../controllers/trazabilidad.controller.js";

const router = Router();

router.get("/", getTrazabilidades);
router.get("/:id", getTrazabilidadById);
router.post("/", createTrazabilidad);
router.put("/:id", updateTrazabilidad);
router.patch("/:id", updateTrazabilidad);
router.delete("/:id", deleteTrazabilidad);

export default router;
