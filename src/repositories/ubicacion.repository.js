import { Ubicacion } from "../models/index.js";

export class UbicacionRepository {
  async findAndCountAll(limit, offset) {
    return Ubicacion.findAndCountAll({ limit, offset, order: [["nombre", "ASC"]] });
  }

  async findById(id) {
    return Ubicacion.findByPk(id);
  }

  async create(payload) {
    return Ubicacion.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
