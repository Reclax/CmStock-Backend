import { Op } from "sequelize";
import {
  Cliente,
  Disenador,
  Molderia,
  Muestra,
  Ubicacion,
  Variacion,
} from "../models/index.js";

export class VariacionRepository {
  async findAll(filters = {}) {
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 20);
    const offset = (page - 1) * limit;

    const where = {};
    const include = [
      { model: Cliente, as: "cliente", attributes: ["id", "nombre", "region"], required: false },
      { model: Disenador, as: "disenador", attributes: ["id", "nombre"], required: false },
      { model: Molderia, as: "molderia", attributes: ["id", "nombre", "tipohorma"], required: false },
      { model: Ubicacion, as: "ubicacion", attributes: ["id", "nombre", "tipo"], required: false },
      { model: Muestra, as: "muestraOriginal", attributes: ["id", "referencia", "segmento", "estado"], required: false },
    ];

    if (filters.muestraOriginalId) {
      where.muestraOriginalId = filters.muestraOriginalId;
    }
    if (filters.referencia) {
      where.referencia = { [Op.iLike]: `%${filters.referencia}%` };
    }
    if (filters.segmento) {
      where.segmento = { [Op.iLike]: `%${filters.segmento}%` };
    }
    if (filters.estado) {
      where.estado = { [Op.iLike]: filters.estado };
    }
    if (filters.clienteid) {
      where.clienteid = filters.clienteid;
    }
    if (filters.disenadorid) {
      where.disenadorid = filters.disenadorid;
    }
    if (filters.licenciado !== undefined) {
      where.licenciado = filters.licenciado;
    }
    if (filters.fechadesde || filters.fechahasta) {
      where.fechaelaboracion = {};
      if (filters.fechadesde) {
        where.fechaelaboracion[Op.gte] = filters.fechadesde;
      }
      if (filters.fechahasta) {
        where.fechaelaboracion[Op.lte] = filters.fechahasta;
      }
    }

    const result = await Variacion.findAndCountAll({
      where,
      include,
      distinct: true,
      limit,
      offset,
      order: [["fechaelaboracion", "DESC"], ["id", "ASC"]],
    });

    return {
      data: result.rows,
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit) || 1,
    };
  }

  async findById(id) {
    return Variacion.findByPk(id, {
      include: [
        { model: Cliente, as: "cliente", attributes: ["id", "nombre", "region"], required: false },
        { model: Disenador, as: "disenador", attributes: ["id", "nombre"], required: false },
        { model: Molderia, as: "molderia", attributes: ["id", "nombre", "tipohorma"], required: false },
        { model: Ubicacion, as: "ubicacion", attributes: ["id", "nombre", "tipo"], required: false },
        { model: Muestra, as: "muestraOriginal", attributes: ["id", "referencia", "segmento", "estado"], required: false },
      ],
    });
  }

  async create(payload) {
    return Variacion.create(payload);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }
}