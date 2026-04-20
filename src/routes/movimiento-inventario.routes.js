import { Router } from "express";
import {
  createMovimientoInventario,
  deleteMovimientoInventario,
  getMovimientoInventarioById,
  getMovimientosInventario,
  updateMovimientoInventario,
} from "../controllers/movimiento-inventario.controller.js";

const router = Router();

router.get("/", getMovimientosInventario);
router.get("/:id", getMovimientoInventarioById);
router.post("/", createMovimientoInventario);
router.put("/:id", updateMovimientoInventario);
router.delete("/:id", deleteMovimientoInventario);

export default router;
