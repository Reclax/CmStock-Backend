import { Muestra } from "../models/index.js";

export class MuestraRepository {
  async findAll() {
    return Muestra.findAll();
  }

  async findById(id) {
    return Muestra.findByPk(id);
  }

  async create(payload) {
    return Muestra.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
