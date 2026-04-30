import { Router } from "express";
import {
  createMuestra,
  darDeBajaMuestra,
  deleteMuestra,
  generarCodigosMuestra,
  getBarcodeImage,
  getHistorialVentasPorCliente,
  getMuestraByCode,
  getMuestraById,
  getMuestras,
  getMuestrasPorCliente,
  getMuestrasResumen,
  getModelosPorSegmentoRegion,
  getQrImage,
  importMuestrasExcel,
  registerMovimientoByCode,
  updateEstadoByCode,
  updateMuestra,
} from "../controllers/muestra.controller.js";
import { getPresentacionesByMuestra } from "../controllers/presentacion.controller.js";
import { authorize } from "../middleware/auth.middleware.js";
import { uploadExcel } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/", getMuestras);
router.get("/codigo/:codigo", getMuestraByCode);
router.get("/resumen/estadisticas", getMuestrasResumen);
router.get("/consultas/muestras-por-cliente", getMuestrasPorCliente);
router.get("/consultas/historial-ventas", getHistorialVentasPorCliente);
router.get("/consultas/modelos-por-segmento-region", getModelosPorSegmentoRegion);
router.get("/:id/qr", getQrImage);
router.get("/:id/barcode", getBarcodeImage);
router.get("/:id/presentaciones", getPresentacionesByMuestra);
router.get("/:id", getMuestraById);
router.post("/", createMuestra);
router.post("/import/excel", uploadExcel.single("file"), importMuestrasExcel);
router.post("/:id/generar-codigos", generarCodigosMuestra);
router.put("/:id", updateMuestra);
router.patch("/:id/dar-baja", darDeBajaMuestra);
router.patch("/codigo/:codigo/estado", authorize("admin", "gerente"), updateEstadoByCode);
router.post("/codigo/:codigo/movimiento", authorize("admin", "gerente", "usuario"), registerMovimientoByCode);
router.delete("/:id", deleteMuestra);

export default router;
