import { UbicacionRepository } from "../repositories/ubicacion.repository.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class UbicacionService {
  constructor() {
    this.repository = new UbicacionRepository();
  }

  async getAll(query = {}) {
    const page = Math.max(parseInt(query.page || "1", 10), 1);
    const limit = Math.max(parseInt(query.limit || "10", 10), 1);
    const offset = (page - 1) * limit;
    const result = await this.repository.findAndCountAll(limit, offset);

    return {
      data: result.rows,
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit),
    };
  }

  async getById(id) {
    const ubicacion = await this.repository.findById(id);
    if (!ubicacion) {
      throw new HttpError(404, "Ubicacion no encontrada");
    }
    return ubicacion;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const ubicacion = await this.repository.findById(id);
    if (!ubicacion) {
      throw new HttpError(404, "Ubicacion no encontrada");
    }

    return this.repository.update(ubicacion, payload);
  }

  async remove(id) {
    const ubicacion = await this.repository.findById(id);
    if (!ubicacion) {
      throw new HttpError(404, "Ubicacion no encontrada");
    }

    await this.repository.delete(ubicacion);
  }

  validateRequiredFields(payload) {
    if (!payload.nombre) {
      throw new HttpError(400, "nombre es obligatorio");
    }

    if (!payload.tipo) {
      throw new HttpError(400, "tipo es obligatorio");
    }
  }
}

export { HttpError };
