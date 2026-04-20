import { Cliente, Muestra } from "../models/index.js";
import { ProduccionRepository } from "../repositories/produccion.repository.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class ProduccionService {
  constructor() {
    this.repository = new ProduccionRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const produccion = await this.repository.findById(id);
    if (!produccion) {
      throw new HttpError(404, "Produccion no encontrada");
    }
    return produccion;
  }

  async create(payload) {
    await this.validateRequiredForeignKeys(payload);
    const muestra = await this.validateMuestraExists(payload.muestraid);
    await this.validateClienteExists(payload.clienteid);
    this.validateMuestraAprobada(muestra);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const produccion = await this.repository.findById(id);
    if (!produccion) {
      throw new HttpError(404, "Produccion no encontrada");
    }

    if (payload.muestraid !== undefined) {
      await this.validateMuestraExists(payload.muestraid);
    }

    if (payload.clienteid !== undefined) {
      await this.validateClienteExists(payload.clienteid);
    }

    return this.repository.update(produccion, payload);
  }

  async remove(id) {
    const produccion = await this.repository.findById(id);
    if (!produccion) {
      throw new HttpError(404, "Produccion no encontrada");
    }

    await this.repository.delete(produccion);
  }

  async validateRequiredForeignKeys(payload) {
    if (!payload.muestraid) {
      throw new HttpError(400, "muestraid es obligatorio");
    }

    if (!payload.clienteid) {
      throw new HttpError(400, "clienteid es obligatorio");
    }
  }

  async validateMuestraExists(muestraid) {
    const muestra = await Muestra.findByPk(muestraid);
    if (!muestra) {
      throw new HttpError(404, `Muestra con id ${muestraid} no existe`);
    }
    return muestra;
  }

  async validateClienteExists(clienteid) {
    const cliente = await Cliente.findByPk(clienteid);
    if (!cliente) {
      throw new HttpError(404, `Cliente con id ${clienteid} no existe`);
    }
    return cliente;
  }

  validateMuestraAprobada(muestra) {
    if (muestra.estado !== "aprobada") {
      throw new HttpError(
        400,
        `No se puede registrar produccion: la muestra ${muestra.id} no esta aprobada`
      );
    }
  }
}

export { HttpError };
