import { Muestra, Usuario } from "../models/index.js";
import { FotoRepository } from "../repositories/foto.repository.js";

const ORIGENES_VALIDOS = new Set(["camara", "archivo"]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class FotoService {
  constructor() {
    this.repository = new FotoRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const foto = await this.repository.findById(id);
    if (!foto) {
      throw new HttpError(404, "Foto no encontrada");
    }
    return foto;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    payload.origen = this.validateOrigen(payload.origen);
    await this.validateMuestraExists(payload.muestraid);
    await this.validateUsuarioExists(payload.usuarioid);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const foto = await this.repository.findById(id);
    if (!foto) {
      throw new HttpError(404, "Foto no encontrada");
    }

    if (payload.origen !== undefined) {
      payload.origen = this.validateOrigen(payload.origen);
    }

    if (payload.muestraid !== undefined) {
      await this.validateMuestraExists(payload.muestraid);
    }

    if (payload.usuarioid !== undefined) {
      await this.validateUsuarioExists(payload.usuarioid);
    }

    return this.repository.update(foto, payload);
  }

  async remove(id) {
    const foto = await this.repository.findById(id);
    if (!foto) {
      throw new HttpError(404, "Foto no encontrada");
    }

    await this.repository.delete(foto);
  }

  validateRequiredFields(payload) {
    if (!payload.muestraid) {
      throw new HttpError(400, "muestraid es obligatorio");
    }

    if (!payload.urlarchivo) {
      throw new HttpError(400, "urlarchivo es obligatorio");
    }

    if (!payload.origen) {
      throw new HttpError(400, "origen es obligatorio");
    }

    if (!payload.fechacarga) {
      throw new HttpError(400, "fechacarga es obligatoria");
    }

    if (!payload.usuarioid) {
      throw new HttpError(400, "usuarioid es obligatorio");
    }
  }

  validateOrigen(origen) {
    const origenNormalizado = typeof origen === "string" ? origen.trim() : "";

    if (!ORIGENES_VALIDOS.has(origenNormalizado)) {
      throw new HttpError(400, "origen invalido. Valores permitidos: camara, archivo");
    }

    return origenNormalizado;
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
