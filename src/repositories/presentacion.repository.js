import { Presentacion } from "../models/index.js";

export class PresentacionRepository {
  async findAll() {
    return Presentacion.findAll();
  }

  async findById(id) {
    return Presentacion.findByPk(id);
  }

  async create(payload) {
    return Presentacion.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
