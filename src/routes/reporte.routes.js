import { Router } from "express";
import {
  getEstadisticasGenerales,
  getReporteClientes,
  getReporteInventario,
  getReporteMuestras,
  getReporteProduccion,
  getStockPorMuestra,
  getStockPorUbicacion,
} from "../controllers/reporte.controller.js";

const router = Router();

router.get("/estadisticas", getEstadisticasGenerales);
router.get("/muestras", getReporteMuestras);
router.get("/produccion", getReporteProduccion);
router.get("/clientes", getReporteClientes);
router.get("/inventario", getReporteInventario);
router.get("/stock-por-muestra", getStockPorMuestra);
router.get("/stock-por-ubicacion", getStockPorUbicacion);

export default router;
