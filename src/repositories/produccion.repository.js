import { Produccion } from "../models/index.js";

export class ProduccionRepository {
  async findAll() {
    return Produccion.findAll();
  }

  async findById(id) {
    return Produccion.findByPk(id);
  }

  async create(payload) {
    return Produccion.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
