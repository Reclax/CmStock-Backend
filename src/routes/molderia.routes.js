import { Router } from "express";
import {
  createMolderia,
  deleteMolderia,
  getMolderiaById,
  getMolderias,
  updateMolderia,
} from "../controllers/molderia.controller.js";

const router = Router();

router.get("/", getMolderias);
router.get("/:id", getMolderiaById);
router.post("/", createMolderia);
router.put("/:id", updateMolderia);
router.patch("/:id", updateMolderia);
router.delete("/:id", deleteMolderia);

export default router;
