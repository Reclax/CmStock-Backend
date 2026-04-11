import { MovimientoInventario } from "../models/index.js";

export class MovimientoInventarioRepository {
  async findAll() {
    return MovimientoInventario.findAll();
  }

  async findById(id) {
    return MovimientoInventario.findByPk(id);
  }

  async create(payload) {
    return MovimientoInventario.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
