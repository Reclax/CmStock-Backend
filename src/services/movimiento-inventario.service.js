import { Muestra, Usuario } from "../models/index.js";
import { MovimientoInventarioRepository } from "../repositories/movimiento-inventario.repository.js";

const TIPOS_VALIDOS = new Set(["entrada", "salida"]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class MovimientoInventarioService {
  constructor() {
    this.repository = new MovimientoInventarioRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const movimiento = await this.repository.findById(id);
    if (!movimiento) {
      throw new HttpError(404, "MovimientoInventario no encontrado");
    }
    return movimiento;
  }

  async create(payload) {
    this.validateCreateRequiredFields(payload);
    payload.tipo = this.validateTipo(payload.tipo);
    await this.validateMuestraExists(payload.muestraid);
    await this.validateUsuarioExists(payload.usuarioid);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const movimiento = await this.repository.findById(id);
    if (!movimiento) {
      throw new HttpError(404, "MovimientoInventario no encontrado");
    }

    if (payload.tipo !== undefined) {
      payload.tipo = this.validateTipo(payload.tipo);
    }

    if (payload.muestraid !== undefined) {
      await this.validateMuestraExists(payload.muestraid);
    }

    if (payload.usuarioid !== undefined) {
      await this.validateUsuarioExists(payload.usuarioid);
    }

    return this.repository.update(movimiento, payload);
  }

  async remove(id) {
    const movimiento = await this.repository.findById(id);
    if (!movimiento) {
      throw new HttpError(404, "MovimientoInventario no encontrado");
    }

    await this.repository.delete(movimiento);
  }

  validateCreateRequiredFields(payload) {
    if (!payload.tipo) {
      throw new HttpError(400, "tipo es obligatorio");
    }

    if (payload.cantidad === undefined || payload.cantidad === null) {
      throw new HttpError(400, "cantidad es obligatoria");
    }

    if (!payload.fecha) {
      throw new HttpError(400, "fecha es obligatoria");
    }

    if (!payload.usuarioid) {
      throw new HttpError(400, "usuarioid es obligatorio");
    }

    if (!payload.muestraid) {
      throw new HttpError(400, "muestraid es obligatorio");
    }

    if (!payload.motivo) {
      throw new HttpError(400, "motivo es obligatorio");
    }
  }

  validateTipo(tipo) {
    const tipoNormalizado = typeof tipo === "string" ? tipo.trim() : "";

    if (!TIPOS_VALIDOS.has(tipoNormalizado)) {
      throw new HttpError(
        400,
        "tipo invalido. Valores permitidos: entrada, salida"
      );
    }

    return tipoNormalizado;
  }

  async validateMuestraExists(muestraid) {
    const muestra = await Muestra.findByPk(muestraid);
    if (!muestra) {
      throw new HttpError(404, `Muestra con id ${muestraid} no existe`);
    }
    return muestra;
  }

  async validateUsuarioExists(usuarioid) {
    const usuario = await Usuario.findByPk(usuarioid);
    if (!usuario) {
      throw new HttpError(404, `Usuario con id ${usuarioid} no existe`);
    }
    return usuario;
  }
}

export { HttpError };
