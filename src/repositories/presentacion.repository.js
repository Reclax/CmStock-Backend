import { Cliente } from "../models/index.js";
import { Presentacion } from "../models/index.js";

export class PresentacionRepository {
  async findAll() {
    return Presentacion.findAll({
      include: [{ model: Cliente, as: "cliente", attributes: ["id", "nombre", "region"] }],
    });
  }

  async findByMuestraId(muestraid) {
    return Presentacion.findAll({
      where: { muestraid },
      include: [{ model: Cliente, as: "cliente", attributes: ["id", "nombre", "region"] }],
      order: [["fecha", "DESC"]],
    });
  }

  async findById(id) {
    return Presentacion.findByPk(id, {
      include: [{ model: Cliente, as: "cliente", attributes: ["id", "nombre", "region"] }],
    });
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
