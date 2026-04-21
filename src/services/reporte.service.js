import { Op } from "sequelize";
import {
  Cliente,
  MovimientoInventario,
  Muestra,
  Presentacion,
  Produccion,
  Ubicacion,
} from "../models/index.js";

const toCsv = (rows) => {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escaped = rows.map((row) =>
    headers
      .map((key) => {
        const value = row[key] ?? "";
        const str = String(value).replaceAll('"', '""');
        return `"${str}"`;
      })
      .join(",")
  );

  return [headers.join(","), ...escaped].join("\n");
};

export class ReporteService {
  async getReporteMuestras(filters = {}) {
    const where = {};

    if (filters.fechadesde || filters.fechahasta) {
      where.fechaelaboracion = {};
      if (filters.fechadesde) {
        where.fechaelaboracion[Op.gte] = filters.fechadesde;
      }
      if (filters.fechahasta) {
        where.fechaelaboracion[Op.lte] = filters.fechahasta;
      }
    }

    const data = await Muestra.findAll({
      where,
      include: [
        { model: Cliente, as: "cliente", attributes: ["nombre", "region"] },
        { model: Ubicacion, as: "ubicacion", attributes: ["nombre", "tipo"] },
      ],
      order: [["fechaelaboracion", "DESC"]],
    });

    return data.map((item) => ({
      id: item.id,
      referencia: item.referencia,
      modelo: item.modelo,
      segmento: item.segmento,
      estado: item.estado,
      licenciado: item.licenciado,
      dima: item.dima,
      pares_elaborados: item.pareselaborados,
      fecha_elaboracion: item.fechaelaboracion,
      cliente: item.cliente?.nombre || "",
      region: item.cliente?.region || "",
      ubicacion: item.ubicacion?.nombre || "",
      tipo_ubicacion: item.ubicacion?.tipo || "",
    }));
  }

  async getReporteProduccion(filters = {}) {
    const where = {};

    if (filters.clienteid) {
      where.clienteid = filters.clienteid;
    }

    if (filters.fechadesde || filters.fechahasta) {
      where.fechaproduccion = {};
      if (filters.fechadesde) {
        where.fechaproduccion[Op.gte] = filters.fechadesde;
      }
      if (filters.fechahasta) {
        where.fechaproduccion[Op.lte] = filters.fechahasta;
      }
    }

    const data = await Produccion.findAll({
      where,
      include: [
        { model: Cliente, as: "cliente", attributes: ["nombre", "region"] },
        { model: Muestra, as: "muestra", attributes: ["referencia", "modelo", "segmento"] },
      ],
      order: [["fechaproduccion", "DESC"]],
    });

    return data.map((item) => ({
      id: item.id,
      orden_numero: item.ordennumero,
      fecha_produccion: item.fechaproduccion,
      mes: item.mes,
      pares_producidos: item.paresproducidos,
      cliente: item.cliente?.nombre || "",
      region: item.cliente?.region || "",
      referencia: item.muestra?.referencia || "",
      modelo: item.muestra?.modelo || "",
      segmento: item.muestra?.segmento || "",
    }));
  }

  async getReporteClientes() {
    const clientes = await Cliente.findAll({
      attributes: ["id", "nombre", "region"],
      include: [
        { model: Muestra, as: "muestras", attributes: ["id"] },
        { model: Produccion, as: "producciones", attributes: ["id", "paresproducidos"] },
        { model: Presentacion, as: "presentaciones", attributes: ["id", "resultado"] },
      ],
      order: [["nombre", "ASC"]],
    });

    return clientes.map((cliente) => ({
      id: cliente.id,
      nombre: cliente.nombre,
      region: cliente.region,
      cantidad_muestras: cliente.muestras.length,
      cantidad_producciones: cliente.producciones.length,
      pares_producidos: cliente.producciones.reduce((acc, p) => acc + (p.paresproducidos || 0), 0),
      cantidad_presentaciones: cliente.presentaciones.length,
      presentaciones_aprobadas: cliente.presentaciones.filter((p) => p.resultado === "aprobada").length,
    }));
  }

  async getReporteInventario() {
    const muestras = await Muestra.findAll({
      attributes: ["id", "referencia", "modelo", "pareselaborados", "estado"],
      include: [
        { model: Ubicacion, as: "ubicacion", attributes: ["id", "nombre", "tipo"] },
        { model: MovimientoInventario, as: "movimientosInventario", attributes: ["tipo", "cantidad"] },
      ],
      order: [["referencia", "ASC"]],
    });

    return muestras.map((muestra) => {
      const entradas = muestra.movimientosInventario
        .filter((m) => m.tipo === "entrada")
        .reduce((acc, m) => acc + (m.cantidad || 0), 0);
      const salidas = muestra.movimientosInventario
        .filter((m) => m.tipo === "salida")
        .reduce((acc, m) => acc + (m.cantidad || 0), 0);
      const stock = (muestra.pareselaborados || 0) + entradas - salidas;

      return {
        id: muestra.id,
        referencia: muestra.referencia,
        modelo: muestra.modelo,
        estado: muestra.estado,
        ubicacion: muestra.ubicacion?.nombre || "",
        tipo_ubicacion: muestra.ubicacion?.tipo || "",
        stock: Math.max(stock, 0),
      };
    });
  }

  async getStockPorMuestra() {
    const inventario = await this.getReporteInventario();
    return inventario.map((item) => ({
      muestraid: item.id,
      referencia: item.referencia,
      modelo: item.modelo,
      stock: item.stock,
    }));
  }

  async getStockPorUbicacion() {
    const inventario = await this.getReporteInventario();
    const grouped = {};

    for (const item of inventario) {
      const key = item.ubicacion || "sin_ubicacion";
      if (!grouped[key]) {
        grouped[key] = {
          ubicacion: key,
          tipo_ubicacion: item.tipo_ubicacion,
          total_stock: 0,
          cantidad_muestras: 0,
        };
      }

      grouped[key].total_stock += item.stock;
      grouped[key].cantidad_muestras += 1;
    }

    return Object.values(grouped);
  }

  async getEstadisticasGenerales() {
    const [
      muestrasElaboradas,
      muestrasPresentadas,
      muestrasProducidas,
      muestrasNoUtilizadas,
      muestrasReutilizables,
      muestrasDadasDeBaja,
    ] = await Promise.all([
      Muestra.count(),
      Muestra.count({ where: { estado: "presentada" } }),
      Muestra.count({
        include: [{ model: Produccion, as: "producciones", required: true }],
        distinct: true,
      }),
      Muestra.count({
        include: [{ model: Produccion, as: "producciones", required: false, attributes: [] }],
        where: { "$producciones.id$": null },
        distinct: true,
      }),
      Muestra.count({ where: { estado: "reutilizable" } }),
      Muestra.count({ where: { estado: "dada_de_baja" } }),
    ]);

    return {
      muestras_elaboradas: muestrasElaboradas,
      muestras_presentadas: muestrasPresentadas,
      muestras_producidas: muestrasProducidas,
      muestras_no_utilizadas: muestrasNoUtilizadas,
      muestras_reutilizables: muestrasReutilizables,
      muestras_dadas_de_baja: muestrasDadasDeBaja,
    };
  }

  toCsv(data) {
    return toCsv(data);
  }
}
