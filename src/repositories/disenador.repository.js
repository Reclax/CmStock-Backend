import { Disenador } from "../models/index.js";

export class DisenadorRepository {
  async findAll() {
    return Disenador.findAll();
  }

  async findById(id) {
    return Disenador.findByPk(id);
  }

  async create(payload) {
    return Disenador.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
