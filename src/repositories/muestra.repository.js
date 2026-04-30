import { Op } from "sequelize";
import {
  Cliente,
  Molderia,
  Muestra,
  Presentacion,
  Produccion,
  Ubicacion,
} from "../models/index.js";

export class MuestraRepository {
  async findAll(filters = {}) {
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 20);
    const offset = (page - 1) * limit;

    const where = {};
    const include = [
      {
        model: Cliente,
        as: "cliente",
        attributes: ["id", "nombre", "region"],
        required: false,
      },
      {
        model: Molderia,
        as: "molderia",
        attributes: ["id", "nombre", "tipohorma"],
        required: false,
      },
      {
        model: Ubicacion,
        as: "ubicacion",
        attributes: ["id", "nombre", "tipo"],
        required: false,
      },
    ];

    if (filters.referencia) {
      where.referencia = { [Op.iLike]: `%${filters.referencia}%` };
    }

    if (filters.modelo) {
      where.modelo = { [Op.iLike]: `%${filters.modelo}%` };
    }

    if (filters.segmento) {
      where.segmento = { [Op.iLike]: `%${filters.segmento}%` };
    }

    if (filters.estado) {
      where.estado = { [Op.iLike]: filters.estado };
    }

    if (filters.licenciado !== undefined) {
      where.licenciado = filters.licenciado;
    }

    if (filters.dima) {
      where.dima = { [Op.iLike]: `%${filters.dima}%` };
    }

    if (filters.clienteid) {
      where.clienteid = filters.clienteid;
    }

    if (filters.ubicacionid) {
      where.ubicacionid = filters.ubicacionid;
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

    if (filters.tipomodelo) {
      include[1].where = { tipohorma: { [Op.iLike]: `%${filters.tipomodelo}%` } };
      include[1].required = true;
    }

    if (filters.region) {
      include[0].where = { region: { [Op.iLike]: `%${filters.region}%` } };
      include[0].required = true;
    }

    if (filters.presentada !== undefined) {
      include.push({
        model: Presentacion,
        as: "presentaciones",
        attributes: [],
        required: filters.presentada,
      });

      if (!filters.presentada) {
        where["$presentaciones.id$"] = null;
      }
    }

    if (filters.producida !== undefined) {
      include.push({
        model: Produccion,
        as: "producciones",
        attributes: [],
        required: filters.producida,
      });

      if (!filters.producida) {
        where["$producciones.id$"] = null;
      }
    }

    const result = await Muestra.findAndCountAll({
      where,
      include,
      distinct: true,
      limit,
      offset,
      order: [["fechaelaboracion", "DESC"]],
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
    return Muestra.findByPk(id);
  }

  async create(payload) {
    return Muestra.create(payload);
  }

  async createMany(payloads) {
    return Muestra.bulkCreate(payloads);
  }

  async update(instance, payload) {
    await instance.update(payload);
    return instance;
  }

  async delete(instance) {
    await instance.destroy();
  }

  async findByAnyCode(codigo) {
    return Muestra.findOne({
      where: {
        [Op.or]: [{ codigoqr: codigo }, { codigobarras: codigo }],
      },
    });
  }

  async getStrategicSummary() {
    const [
      total,
      presentadas,
      producidas,
      reutilizables,
      noUtilizadas,
      dadasDeBaja,
    ] = await Promise.all([
      Muestra.count(),
      Muestra.count({ where: { estado: "presentada" } }),
      Muestra.count({
        include: [{ model: Produccion, as: "producciones", required: true }],
        distinct: true,
      }),
      Muestra.count({ where: { estado: "reutilizable" } }),
      Muestra.count({
        include: [{ model: Produccion, as: "producciones", required: false, attributes: [] }],
        where: { "$producciones.id$": null },
        distinct: true,
      }),
      Muestra.count({ where: { estado: "dada_de_baja" } }),
    ]);

    return {
      total,
      presentadas,
      producidas,
      reutilizables,
      noUtilizadas,
      dadasDeBaja,
    };
  }

  async getMuestrasPorCliente() {
    const clientes = await Cliente.findAll({
      attributes: ["id", "nombre", "region"],
      include: [
        {
          model: Muestra,
          as: "muestras",
          attributes: ["id", "referencia", "estado", "segmento"],
          required: false,
        },
      ],
      order: [["nombre", "ASC"]],
    });

    return clientes.map((cliente) => ({
      id: cliente.id,
      nombre: cliente.nombre,
      region: cliente.region,
      cantidadMuestras: cliente.muestras.length,
      muestras: cliente.muestras,
    }));
  }

  async getHistorialVentasPorCliente(clienteid) {
    const whereCliente = clienteid ? { clienteid } : undefined;

    return Produccion.findAll({
      where: whereCliente,
      include: [
        {
          model: Cliente,
          as: "cliente",
          attributes: ["id", "nombre", "region"],
        },
        {
          model: Muestra,
          as: "muestra",
          attributes: ["id", "referencia", "modelo", "segmento"],
        },
      ],
      order: [["fechaproduccion", "DESC"]],
    });
  }

  async getModelosPorSegmentoRegion() {
    return Muestra.findAll({
      attributes: ["segmento", "modelo"],
      include: [
        {
          model: Cliente,
          as: "cliente",
          attributes: ["region"],
          required: false,
        },
      ],
      order: [["segmento", "ASC"], ["modelo", "ASC"]],
    });
  }
}
