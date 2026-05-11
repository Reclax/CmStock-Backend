import { Router } from "express";
import {
  createVariacion,
  deleteVariacion,
  getVariacionById,
  getVariaciones,
  updateVariacion,
} from "../controllers/variacion.controller.js";
import { getPresentacionesByMuestra } from "../controllers/presentacion.controller.js";

const router = Router();

router.get("/", getVariaciones);
router.post("/", createVariacion);
router.get("/:id", getVariacionById);
router.get("/:id/presentaciones", getPresentacionesByMuestra);
router.put("/:id", updateVariacion);
router.delete("/:id", deleteVariacion);

export default router;