import { Cliente } from "../models/index.js";

export class ClienteRepository {
  async findAll() {
    return Cliente.findAll();
  }

  async findById(id) {
    return Cliente.findByPk(id);
  }

  async create(payload) {
    return Cliente.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
