import { FotoService, HttpError } from "../services/foto.service.js";

const service = new FotoService();

const handleError = (res, error) => {
  console.error("Foto controller error:", error);
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }

  return res.status(500).json({ message: "Error interno del servidor" });
};

export const getFotos = async (req, res) => {
  try {
    const where = {};
    if (req.query.muestraid) {
      where.muestraid = req.query.muestraid;
    }
    const data = await service.getAll(where);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getFotoById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createFoto = async (req, res) => {
  try {
    const data = await service.create(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const uploadFotoArchivo = async (req, res) => {
  try {
    if (!req.file) {
      throw new HttpError(400, "Archivo de imagen requerido");
    }

    const payload = {
      muestraid: req.body?.muestraid,
      origen: req.body?.origen || "archivo",
      urlarchivo: `/uploads/${req.file.filename}`,
      fechacarga: req.body?.fechacarga,
      usuarioid: req.user.id,
    };

    const data = await service.create(payload);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const uploadFotosEnMasa = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      throw new HttpError(400, "Debes enviar al menos un archivo de imagen");
    }

    const result = await service.createBulkFromFiles(files, req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateFoto = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteFoto = async (req, res) => {
  try {
    await service.remove(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
};
