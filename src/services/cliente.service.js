import { ClienteRepository } from "../repositories/cliente.repository.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class ClienteService {
  constructor() {
    this.repository = new ClienteRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const cliente = await this.repository.findById(id);
    if (!cliente) {
      throw new HttpError(404, "Cliente no encontrado");
    }
    return cliente;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const cliente = await this.repository.findById(id);
    if (!cliente) {
      throw new HttpError(404, "Cliente no encontrado");
    }

    return this.repository.update(cliente, payload);
  }

  async remove(id) {
    const cliente = await this.repository.findById(id);
    if (!cliente) {
      throw new HttpError(404, "Cliente no encontrado");
    }

    await this.repository.delete(cliente);
  }

  validateRequiredFields(payload) {
    if (!payload.nombre) {
      throw new HttpError(400, "nombre es obligatorio");
    }
  }
}

export { HttpError };
