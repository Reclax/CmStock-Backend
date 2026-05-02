import { DisenadorService, HttpError } from "../services/disenador.service.js";

const service = new DisenadorService();

const handleError = (res, error) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }

  return res.status(500).json({ message: "Error interno del servidor" });
};

export const getDisenadores = async (req, res) => {
  try {
    const data = await service.getAll();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getDisenadorById = async (req, res) => {
  try {
    const data = await service.getById(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createDisenador = async (req, res) => {
  try {
    const data = await service.create(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateDisenador = async (req, res) => {
  try {
    const data = await service.update(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteDisenador = async (req, res) => {
  try {
    await service.remove(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
};
