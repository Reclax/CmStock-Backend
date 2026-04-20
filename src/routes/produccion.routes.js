import { Router } from "express";
import {
  createProduccion,
  deleteProduccion,
  getProduccionById,
  getProducciones,
  updateProduccion,
} from "../controllers/produccion.controller.js";

const router = Router();

router.get("/", getProducciones);
router.get("/:id", getProduccionById);
router.post("/", createProduccion);
router.put("/:id", updateProduccion);
router.delete("/:id", deleteProduccion);

export default router;
