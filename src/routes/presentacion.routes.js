import { Router } from "express";
import {
  createPresentacion,
  deletePresentacion,
  getPresentacionById,
  getPresentaciones,
  updatePresentacion,
} from "../controllers/presentacion.controller.js";

const router = Router();

router.get("/", getPresentaciones);
router.get("/:id", getPresentacionById);
router.post("/", createPresentacion);
router.put("/:id", updatePresentacion);
router.delete("/:id", deletePresentacion);

export default router;
