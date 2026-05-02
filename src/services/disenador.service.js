import { DisenadorRepository } from "../repositories/disenador.repository.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class DisenadorService {
  constructor() {
    this.repository = new DisenadorRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const disenador = await this.repository.findById(id);
    if (!disenador) {
      throw new HttpError(404, "Diseñador no encontrado");
    }
    return disenador;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const disenador = await this.repository.findById(id);
    if (!disenador) {
      throw new HttpError(404, "Diseñador no encontrado");
    }

    return this.repository.update(disenador, payload);
  }

  async remove(id) {
    const disenador = await this.repository.findById(id);
    if (!disenador) {
      throw new HttpError(404, "Diseñador no encontrado");
    }

    await this.repository.delete(disenador);
  }

  validateRequiredFields(payload) {
    if (!payload.nombre) {
      throw new HttpError(400, "nombre es obligatorio");
    }
  }
}

export { HttpError };
