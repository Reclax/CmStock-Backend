import { Disenador, Modelador, Muestra } from "../models/index.js";
import { TrazabilidadRepository } from "../repositories/trazabilidad.repository.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class TrazabilidadService {
  constructor() {
    this.repository = new TrazabilidadRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const trazabilidad = await this.repository.findById(id);
    if (!trazabilidad) {
      throw new HttpError(404, "Trazabilidad no encontrada");
    }
    return trazabilidad;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    await this.validateMuestraExists(payload.muestraid);
    await this.validateDisenadorExists(payload.disenadorid);
    await this.validateModeladorExists(payload.modeladorid);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const trazabilidad = await this.repository.findById(id);
    if (!trazabilidad) {
      throw new HttpError(404, "Trazabilidad no encontrada");
    }

    if (payload.muestraid !== undefined) {
      await this.validateMuestraExists(payload.muestraid);
    }

    if (payload.disenadorid !== undefined) {
      await this.validateDisenadorExists(payload.disenadorid);
    }

    if (payload.modeladorid !== undefined) {
      await this.validateModeladorExists(payload.modeladorid);
    }

    return this.repository.update(trazabilidad, payload);
  }

  async remove(id) {
    const trazabilidad = await this.repository.findById(id);
    if (!trazabilidad) {
      throw new HttpError(404, "Trazabilidad no encontrada");
    }

    await this.repository.delete(trazabilidad);
  }

  validateRequiredFields(payload) {
    if (!payload.muestraid) {
      throw new HttpError(400, "muestraid es obligatorio");
    }

    if (!payload.disenadorid) {
      throw new HttpError(400, "disenadorid es obligatorio");
    }

    if (!payload.modeladorid) {
      throw new HttpError(400, "modeladorid es obligatorio");
    }

    if (!payload.fecharequerimiento) {
      throw new HttpError(400, "fecharequerimiento es obligatoria");
    }

    if (!payload.fechadiseno) {
      throw new HttpError(400, "fechadiseno es obligatoria");
    }

    if (!payload.fechamolderia) {
      throw new HttpError(400, "fechamolderia es obligatoria");
    }

    if (!payload.fecharegistro) {
      throw new HttpError(400, "fecharegistro es obligatoria");
    }
  }

  async validateMuestraExists(muestraid) {
    const muestra = await Muestra.findByPk(muestraid);
    if (!muestra) {
      throw new HttpError(404, `Muestra con id ${muestraid} no existe`);
    }
    return muestra;
  }

  async validateDisenadorExists(disenadorid) {
    const disenador = await Disenador.findByPk(disenadorid);
    if (!disenador) {
      throw new HttpError(404, `Disenador con id ${disenadorid} no existe`);
    }
    return disenador;
  }

  async validateModeladorExists(modeladorid) {
    const modelador = await Modelador.findByPk(modeladorid);
    if (!modelador) {
      throw new HttpError(404, `Modelador con id ${modeladorid} no existe`);
    }
    return modelador;
  }
}

export { HttpError };
