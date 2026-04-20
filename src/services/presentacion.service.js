import { Cliente, Muestra } from "../models/index.js";
import { PresentacionRepository } from "../repositories/presentacion.repository.js";

const RESULTADOS_VALIDOS = new Set(["aprobada", "rechazada"]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class PresentacionService {
  constructor() {
    this.repository = new PresentacionRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const presentacion = await this.repository.findById(id);
    if (!presentacion) {
      throw new HttpError(404, "Presentacion no encontrada");
    }
    return presentacion;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    payload.resultado = this.validateResultado(payload.resultado);
    await this.validateMuestraExists(payload.muestraid);
    await this.validateClienteExists(payload.clienteid);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const presentacion = await this.repository.findById(id);
    if (!presentacion) {
      throw new HttpError(404, "Presentacion no encontrada");
    }

    if (payload.resultado !== undefined) {
      payload.resultado = this.validateResultado(payload.resultado);
    }

    if (payload.muestraid !== undefined) {
      await this.validateMuestraExists(payload.muestraid);
    }

    if (payload.clienteid !== undefined) {
      await this.validateClienteExists(payload.clienteid);
    }

    return this.repository.update(presentacion, payload);
  }

  async remove(id) {
    const presentacion = await this.repository.findById(id);
    if (!presentacion) {
      throw new HttpError(404, "Presentacion no encontrada");
    }

    await this.repository.delete(presentacion);
  }

  validateRequiredFields(payload) {
    if (!payload.muestraid) {
      throw new HttpError(400, "muestraid es obligatorio");
    }

    if (!payload.clienteid) {
      throw new HttpError(400, "clienteid es obligatorio");
    }

    if (!payload.fecha) {
      throw new HttpError(400, "fecha es obligatoria");
    }

    if (!payload.resultado) {
      throw new HttpError(400, "resultado es obligatorio");
    }

    if (payload.derivoproduccion === undefined || payload.derivoproduccion === null) {
      throw new HttpError(400, "derivoproduccion es obligatorio");
    }
  }

  validateResultado(resultado) {
    const resultadoNormalizado =
      typeof resultado === "string" ? resultado.trim() : "";

    if (!RESULTADOS_VALIDOS.has(resultadoNormalizado)) {
      throw new HttpError(
        400,
        "resultado invalido. Valores permitidos: aprobada, rechazada"
      );
    }

    return resultadoNormalizado;
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
}

export { HttpError };
