import { Foto } from "../models/index.js";

export class FotoRepository {
  async findAll() {
    return Foto.findAll({ order: [["createdat", "DESC"]] });
  }

  async findById(id) {
    return Foto.findByPk(id);
  }

  async create(payload) {
    return Foto.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
