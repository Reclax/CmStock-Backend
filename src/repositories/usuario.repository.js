import { Usuario } from "../models/index.js";

export class UsuarioRepository {
  async findAll() {
    return Usuario.findAll();
  }

  async findById(id) {
    return Usuario.findByPk(id);
  }

  async findByEmail(email) {
    return Usuario.findOne({ where: { email } });
  }

  async create(payload) {
    return Usuario.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
