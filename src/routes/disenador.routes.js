import { Router } from "express";
import {
  createDisenador,
  deleteDisenador,
  getDisenadorById,
  getDisenadores,
  updateDisenador,
} from "../controllers/disenador.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getDisenadores);
router.get("/:id", getDisenadorById);
router.post("/", createDisenador);
router.put("/:id", updateDisenador);
router.delete("/:id", deleteDisenador);

export default router;
