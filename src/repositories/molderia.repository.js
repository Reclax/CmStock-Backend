import { Molderia } from "../models/index.js";

export class MolderiaRepository {
  async findAndCountAll(limit, offset) {
    return Molderia.findAndCountAll({ limit, offset, order: [["nombre", "ASC"]] });
  }

  async findById(id) {
    return Molderia.findByPk(id);
  }

  async create(payload) {
    return Molderia.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
