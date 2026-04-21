import { ReporteService } from "../services/reporte.service.js";
import XLSX from "xlsx";

const service = new ReporteService();

const sendAsJsonOrCsv = (req, res, data, fileName) => {
  const format = (req.query.format || "json").toLowerCase();

  if (format === "csv") {
    const csv = service.toCsv(data);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
    return res.status(200).send(csv);
  }

  if (format === "xlsx") {
    const sheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Reporte");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const xlsxFile = fileName.replace(/\.csv$/i, ".xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=\"${xlsxFile}\"`);
    return res.status(200).send(buffer);
  }

  return res.status(200).json(data);
};

const handleError = (res, error) => {
  return res.status(500).json({ message: "Error interno del servidor", detail: error.message });
};

export const getReporteMuestras = async (req, res) => {
  try {
    const data = await service.getReporteMuestras({
      fechadesde: req.query.fechadesde,
      fechahasta: req.query.fechahasta,
    });

    return sendAsJsonOrCsv(req, res, data, "reporte_muestras.csv");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getReporteProduccion = async (req, res) => {
  try {
    const data = await service.getReporteProduccion({
      clienteid: req.query.clienteid,
      fechadesde: req.query.fechadesde,
      fechahasta: req.query.fechahasta,
    });

    return sendAsJsonOrCsv(req, res, data, "reporte_produccion.csv");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getReporteClientes = async (req, res) => {
  try {
    const data = await service.getReporteClientes();
    return sendAsJsonOrCsv(req, res, data, "reporte_clientes.csv");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getReporteInventario = async (req, res) => {
  try {
    const data = await service.getReporteInventario();
    return sendAsJsonOrCsv(req, res, data, "reporte_inventario.csv");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStockPorMuestra = async (req, res) => {
  try {
    const data = await service.getStockPorMuestra();
    return sendAsJsonOrCsv(req, res, data, "stock_por_muestra.csv");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStockPorUbicacion = async (req, res) => {
  try {
    const data = await service.getStockPorUbicacion();
    return sendAsJsonOrCsv(req, res, data, "stock_por_ubicacion.csv");
  } catch (error) {
    return handleError(res, error);
  }
};

export const getEstadisticasGenerales = async (req, res) => {
  try {
    const data = await service.getEstadisticasGenerales();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
