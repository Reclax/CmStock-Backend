import { Op, where as seqWhere, fn, col } from "sequelize";
import { sequelize } from "../config/database.js";
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
      where.referencia = { [Op.iLike]: `%${filters.modelo}%` };
    }

    if (filters.segmento) {
      where.segmento = { [Op.iLike]: `%${filters.segmento}%` };
    }

    if (filters.estado) {
      // Filtro explícito: muestra exactamente el estado pedido
      where.estado = { [Op.iLike]: filters.estado };
    }
    // Sin filtro de estado: mostrar TODOS los estados (incluyendo dada de baja)

    if (filters.licenciado !== undefined) {
      where.licenciado = filters.licenciado;
    }

    if (filters.dima) {
      where.dima = { [Op.iLike]: `%${filters.dima}%` };
    }

    if (filters.clienteid) {
      where.clienteid = filters.clienteid;
    }

    if (filters.molderia) {
      const molderias = await Molderia.findAll({
        where: { nombre: { [Op.iLike]: `%${filters.molderia}%` } },
        attributes: ["id"],
        raw: true,
      });
      const ids = molderias.map((m) => m.id);
      // Si no hay molderías que coincidan, forzar 0 resultados
      where.molderiaid = ids.length > 0 ? { [Op.in]: ids } : { [Op.in]: ["__none__"] };
    }

    if (filters.ubicacionid) {
      where.ubicacionid = filters.ubicacionid;
    }

    if (filters.disenadorid) {
      where.disenadorid = filters.disenadorid;
    }

    where[Op.or] = [
      { variacion: false },
      { variacion: null },
    ];

    if (filters.fechadesde || filters.fechahasta) {
      where.fechaelaboracion = {};
      if (filters.fechadesde) {
        where.fechaelaboracion[Op.gte] = filters.fechadesde;
      }
      if (filters.fechahasta) {
        // Incluir todo el día final
        where.fechaelaboracion[Op.lte] = filters.fechahasta + "T23:59:59";
      }
    }

    if (filters.mes) {
      // Filtra por número de mes (1-12) sin importar el año
      where[Op.and] = [
        ...(where[Op.and] || []),
        seqWhere(fn("EXTRACT", sequelize.literal(`MONTH FROM "fechaelaboracion"`)), filters.mes),
      ];
    }

    if (filters.tipomodelo) {
      include[1].where = {
        ...include[1].where,
        tipohorma: { [Op.iLike]: `%${filters.tipomodelo}%` },
      };
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
      order: [
        ["fechaelaboracion", "DESC"],
        ["id", "ASC"],
      ],
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
      Muestra.count({ where: { estado: "dada de baja" } }),
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
          attributes: ["id", "referencia", "segmento"],
        },
      ],
      order: [["fechaproduccion", "DESC"]],
    });
  }

  async getModelosPorSegmentoRegion() {
    return Muestra.findAll({
      attributes: ["segmento", "referencia"],
      include: [
        {
          model: Cliente,
          as: "cliente",
          attributes: ["region"],
          required: false,
        },
      ],
      order: [["segmento", "ASC"], ["referencia", "ASC"]],
    });
  }
}
