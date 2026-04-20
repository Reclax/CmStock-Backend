import { UsuarioRepository } from "../repositories/usuario.repository.js";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class UsuarioService {
  constructor() {
    this.repository = new UsuarioRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getById(id) {
    const usuario = await this.repository.findById(id);
    if (!usuario) {
      throw new HttpError(404, "Usuario no encontrado");
    }
    return usuario;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    payload.email = this.normalizeEmail(payload.email);
    await this.ensureEmailAvailable(payload.email);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const usuario = await this.repository.findById(id);
    if (!usuario) {
      throw new HttpError(404, "Usuario no encontrado");
    }

    if (payload.email !== undefined) {
      payload.email = this.normalizeEmail(payload.email);
      await this.ensureEmailAvailable(payload.email, id);
    }

    return this.repository.update(usuario, payload);
  }

  async remove(id) {
    const usuario = await this.repository.findById(id);
    if (!usuario) {
      throw new HttpError(404, "Usuario no encontrado");
    }

    await this.repository.delete(usuario);
  }

  validateRequiredFields(payload) {
    if (!payload.nombre) {
      throw new HttpError(400, "nombre es obligatorio");
    }

    if (!payload.email) {
      throw new HttpError(400, "email es obligatorio");
    }

    if (!payload.rol) {
      throw new HttpError(400, "rol es obligatorio");
    }

    if (payload.activo === undefined || payload.activo === null) {
      throw new HttpError(400, "activo es obligatorio");
    }
  }

  normalizeEmail(email) {
    return typeof email === "string" ? email.trim().toLowerCase() : "";
  }

  async ensureEmailAvailable(email, currentId = null) {
    const usuario = await this.repository.findByEmail(email);
    if (usuario && usuario.id !== currentId) {
      throw new HttpError(409, "El email ya existe en la base de datos");
    }
  }
}

export { HttpError };
