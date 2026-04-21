import { HttpError, MuestraService } from "../services/muestra.service.js";

const service = new MuestraService();

const handleError = (res, error) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }

  return res.status(500).json({ message: "Error interno del servidor" });
};

export const getMuestras = async (req, res) => {
  try {
    const filters = {
      referencia: req.query.referencia,
      modelo: req.query.modelo,
      segmento: req.query.segmento,
      estado: req.query.estado,
      dima: req.query.dima,
      clienteid: req.query.clienteid,
      ubicacionid: req.query.ubicacionid,
      tipomodelo: req.query.tipomodelo,
      region: req.query.region,
      fechadesde: req.query.fechadesde,
      fechahasta: req.query.fechahasta,
      page: req.query.page,
      limit: req.query.limit,
    };

    if (req.query.licenciado !== undefined) {
      filters.licenciado = req.query.licenciado === "true";
    }
    if (req.query.presentada !== undefined) {
      filters.presentada = req.query.presentada === "true";
    }
    if (req.query.producida !== undefined) {
      filters.producida = req.query.producida === "true";
    }

    const data = await service.getAll(filters);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMuestraById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createMuestra = async (req, res) => {
  try {
    const data = await service.create(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const importMuestrasExcel = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      throw new HttpError(400, "Archivo Excel requerido");
    }

    const data = await service.createFromExcel(req.file.buffer);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateMuestra = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteMuestra = async (req, res) => {
  try {
    await service.remove(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
};

export const darDeBajaMuestra = async (req, res) => {
  try {
    const data = await service.darDeBaja(req.params.id, req.body?.motivo);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMuestrasResumen = async (req, res) => {
  try {
    const data = await service.getStrategicSummary();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMuestrasPorCliente = async (req, res) => {
  try {
    const data = await service.getMuestrasPorCliente();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getHistorialVentasPorCliente = async (req, res) => {
  try {
    const data = await service.getHistorialVentasPorCliente(req.query.clienteid);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getModelosPorSegmentoRegion = async (req, res) => {
  try {
    const data = await service.getModelosPorSegmentoRegion();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const generarCodigosMuestra = async (req, res) => {
  try {
    const data = await service.generarCodigos(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMuestraByCode = async (req, res) => {
  try {
    const data = await service.getByCode(req.params.codigo);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getQrImage = async (req, res) => {
  try {
    const imageBuffer = await service.getQrImage(req.params.id);
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(imageBuffer);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getBarcodeImage = async (req, res) => {
  try {
    const imageBuffer = await service.getBarcodeImage(req.params.id);
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(imageBuffer);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateEstadoByCode = async (req, res) => {
  try {
    const data = await service.updateEstadoByCode(req.params.codigo, req.body?.estado);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const registerMovimientoByCode = async (req, res) => {
  try {
    const data = await service.registerMovimientoByCode(req.params.codigo, req.body, req.user.id);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
