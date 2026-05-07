import { Foto } from "../models/index.js";
import { sequelize } from "../config/database.js";

export class FotoRepository {
  async findAll({ muestraid, usuarioid, transaction } = {}) {
    const where = {};
    if (muestraid) where.muestraid = muestraid;
    if (usuarioid) where.usuarioid = usuarioid;

    return Foto.findAll({
      where,
      transaction,
      order: [
        ["orden", "ASC"],
        ["createdat", "ASC"],
      ],
    });
  }

  async findById(id) {
    return Foto.findByPk(id);
  }

  async create(payload) {
    return Foto.create(payload);
  }

  async getNextOrden({ muestraid, usuarioid, transaction } = {}) {
    const maxOrden = await Foto.max("orden", {
      where: { muestraid, usuarioid },
      transaction,
    });

    const base = Number.isFinite(Number(maxOrden)) ? Number(maxOrden) : 0;
    return base + 1;
  }

  async reorderByIds({ muestraid, usuarioid, orderedIds } = {}) {
    return sequelize.transaction(async (t) => {
      const fotos = await this.findAll({ muestraid, usuarioid, transaction: t });
      const existingIds = new Set(fotos.map((f) => f.id));

      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new Error("orderedIds debe ser un arreglo no vacío");
      }

      if (orderedIds.length !== fotos.length) {
        throw new Error("orderedIds no coincide con la cantidad de fotos");
      }

      for (const id of orderedIds) {
        if (!existingIds.has(id)) {
          throw new Error("orderedIds contiene fotos inexistentes para el usuario/muestra");
        }
      }

      await Promise.all(
        orderedIds.map((id, index) =>
          Foto.update(
            { orden: index + 1 },
            { where: { id, muestraid, usuarioid }, transaction: t }
          )
        )
      );

      return this.findAll({ muestraid, usuarioid, transaction: t });
    });
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}
