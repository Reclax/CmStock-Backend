import { Router } from "express";
import { getVariacionById, getVariaciones } from "../controllers/variacion.controller.js";

const router = Router();

router.get("/", getVariaciones);
router.get("/:id", getVariacionById);

export default router;