import { VariacionRepository } from "../repositories/variacion.repository.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class VariacionService {
  constructor() {
    this.repository = new VariacionRepository();
  }

  async getAll(filters) {
    return this.repository.findAll(filters);
  }

  async getById(id) {
    const variacion = await this.repository.findById(id);
    if (!variacion) {
      throw new HttpError(404, "Variación no encontrada");
    }
    return variacion;
  }

  async create(payload) {
    if (!payload.muestraOriginalId) {
      throw new HttpError(400, "muestraOriginalId es requerido para crear una variación");
    }
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const variacion = await this.repository.findById(id);
    if (!variacion) {
      throw new HttpError(404, "Variación no encontrada");
    }
    return this.repository.update(variacion, payload);
  }

  async remove(id) {
    const variacion = await this.repository.findById(id);
    if (!variacion) {
      throw new HttpError(404, "Variación no encontrada");
    }
    await this.repository.delete(variacion);
  }
}

export { HttpError };