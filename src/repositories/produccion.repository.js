import { Cliente, Muestra, Produccion, Variacion } from "../models/index.js";

export class ProduccionRepository {
  async findAll() {
    return Produccion.findAll({
      include: [
        {
          model: Cliente,
          as: "cliente",
          attributes: ["id", "nombre", "region"],
          required: false,
        },
        {
          model: Muestra,
          as: "muestra",
          attributes: ["id", "referencia", "segmento"],
          required: false,
        },
        {
          model: Variacion,
          as: "variacion",
          attributes: ["id", "referencia", "segmento", "estado"],
          required: false,
        },
      ],
      order: [["fechaproduccion", "DESC"], ["createdat", "DESC"]],
    });
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
