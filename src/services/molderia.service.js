import { MolderiaRepository } from "../repositories/molderia.repository.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class MolderiaService {
  constructor() {
    this.repository = new MolderiaRepository();
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
    const molderia = await this.repository.findById(id);
    if (!molderia) {
      throw new HttpError(404, "Molderia no encontrada");
    }
    return molderia;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const molderia = await this.repository.findById(id);
    if (!molderia) {
      throw new HttpError(404, "Molderia no encontrada");
    }

    return this.repository.update(molderia, payload);
  }

  async remove(id) {
    const molderia = await this.repository.findById(id);
    if (!molderia) {
      throw new HttpError(404, "Molderia no encontrada");
    }

    await this.repository.delete(molderia);
  }

  validateRequiredFields(payload) {
    if (!payload.nombre) {
      throw new HttpError(400, "nombre es obligatorio");
    }

    if (!payload.tipohorma) {
      throw new HttpError(400, "tipohorma es obligatorio");
    }

    if (!payload.talon) {
      throw new HttpError(400, "talon es obligatorio");
    }

    if (!payload.punta) {
      throw new HttpError(400, "punta es obligatorio");
    }

    if (payload.esnueva === undefined || payload.esnueva === null) {
      throw new HttpError(400, "esnueva es obligatorio");
    }
  }
}

export { HttpError };
