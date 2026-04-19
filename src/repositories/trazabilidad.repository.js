import { Trazabilidad } from "../models/index.js";

export class TrazabilidadRepository {
  async findAll() {
    return Trazabilidad.findAll({ order: [["createdat", "DESC"]] });
  }

  async findById(id) {
    return Trazabilidad.findByPk(id);
  }

  async create(payload) {
    return Trazabilidad.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
