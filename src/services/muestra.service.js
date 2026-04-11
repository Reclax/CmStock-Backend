import {
  Cliente,
  Disenador,
  Molderia,
  Ubicacion,
} from "../models/index.js";
import { MuestraRepository } from "../repositories/muestra.repository.js";

const ESTADOS_VALIDOS = new Set([
  "nueva",
  "presentada",
  "aprobada",
  "rechazada",
  "reutilizable",
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class MuestraService {
  constructor() {
    this.repository = new MuestraRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const muestra = await this.repository.findById(id);
    if (!muestra) {
      throw new HttpError(404, "Muestra no encontrada");
    }
    return muestra;
  }

  async create(payload) {
    payload.estado = this.validateEstado(payload.estado);
    await this.validateForeignKeys(payload);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const muestra = await this.repository.findById(id);
    if (!muestra) {
      throw new HttpError(404, "Muestra no encontrada");
    }

    if (payload.estado !== undefined) {
      payload.estado = this.validateEstado(payload.estado);
    }

    await this.validateForeignKeys(payload, true);
    return this.repository.update(muestra, payload);
  }

  async remove(id) {
    const muestra = await this.repository.findById(id);
    if (!muestra) {
      throw new HttpError(404, "Muestra no encontrada");
    }

    await this.repository.delete(muestra);
  }

  validateEstado(estado) {
    const estadoNormalizado = typeof estado === "string" ? estado.trim() : "";

    if (!ESTADOS_VALIDOS.has(estadoNormalizado)) {
      throw new HttpError(
        400,
        "Estado invalido. Valores permitidos: nueva, presentada, aprobada, rechazada, reutilizable"
      );
    }

    return estadoNormalizado;
  }

  async validateForeignKeys(payload, isPartialUpdate = false) {
    const keys = [
      { field: "clienteid", model: Cliente, label: "Cliente" },
      { field: "disenadorid", model: Disenador, label: "Disenador" },
      { field: "molderiaid", model: Molderia, label: "Molderia" },
      { field: "ubicacionid", model: Ubicacion, label: "Ubicacion" },
    ];

    for (const key of keys) {
      const value = payload[key.field];

      if (!isPartialUpdate && !value) {
        throw new HttpError(400, `${key.field} es obligatorio`);
      }

      if (value === undefined || value === null) {
        continue;
      }

      const exists = await key.model.findByPk(value);
      if (!exists) {
        throw new HttpError(404, `${key.label} con id ${value} no existe`);
      }
    }
  }
}

export { HttpError };
