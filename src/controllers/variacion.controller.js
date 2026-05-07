import { HttpError, VariacionService } from "../services/variacion.service.js";

const service = new VariacionService();

const handleError = (res, error) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }

  return res.status(500).json({ message: "Error interno del servidor" });
};

export const getVariaciones = async (req, res) => {
  try {
    const filters = {
      referencia: req.query.referencia,
      segmento: req.query.segmento,
      estado: req.query.estado,
      clienteid: req.query.clienteid,
      disenadorid: req.query.disenadorid,
      muestraOriginalId: req.query.muestraOriginalId,
      fechadesde: req.query.fechadesde,
      fechahasta: req.query.fechahasta,
      page: req.query.page,
      limit: req.query.limit,
    };

    if (req.query.licenciado !== undefined) {
      filters.licenciado = req.query.licenciado === "true";
    }

    const data = await service.getAll(filters);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getVariacionById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};