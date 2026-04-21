import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { Op } from "sequelize";
import XLSX from "xlsx";
import {
  Cliente,
  Disenador,
  Molderia,
  MovimientoInventario,
  Ubicacion,
} from "../models/index.js";
import { MuestraRepository } from "../repositories/muestra.repository.js";

const ESTADOS_VALIDOS = new Set([
  "nueva",
  "presentada",
  "aprobada",
  "rechazada",
  "reutilizable",
  "dada_de_baja",
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class MuestraService {
  constructor() {
    this.repository = new MuestraRepository();
  }

  async getAll(filters) {
    return this.repository.findAll(filters);
  }

  async getById(id) {
    const muestra = await this.repository.findById(id);
    if (!muestra) {
      throw new HttpError(404, "Muestra no encontrada");
    }
    return muestra;
  }

  async create(payload) {
    payload.estado = this.validateEstado(payload.estado);
    await this.validateForeignKeys(payload);
    payload.codigoqr = this.buildCode("QR", payload.referencia);
    payload.codigobarras = this.buildCode("BAR", payload.referencia);
    return this.repository.create(payload);
  }

  async createFromExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.SheetNames[0];

    if (!firstSheet) {
      throw new HttpError(400, "El archivo Excel no tiene hojas");
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: null });
    if (!rows.length) {
      throw new HttpError(400, "El archivo Excel no contiene filas");
    }

    const payloads = [];
    const errors = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      try {
        const clienteid = await this.resolveClienteId(row);
        const disenadorid = await this.resolveDisenadorId(row);
        const molderiaid = await this.resolveMolderiaId(row);
        const ubicacionid = await this.resolveUbicacionId(row);

        const payload = {
          referencia: String(row.REF || row.REFERENCIA || row.referencia || "").trim(),
          modelo: String(row.MODELO || row.modelo || "").trim(),
          segmento: String(row.SEGMENTO || row.segmento || "").trim(),
          licenciado: this.parseBoolean(row.LICENCIA ?? row.licenciado),
          dima: row.DIMA ? String(row.DIMA) : null,
          talla: row.TALLA ? Number(row.TALLA) : null,
          pareselaborados: Number(row.PARES || row.pareselaborados || 0),
          fechaelaboracion: this.parseDate(row.FECHAS || row.FECHA || row.fechaelaboracion),
          estado: this.validateEstado(String(row.APROBACION || row.ESTADO || row.estado || "nueva").trim()),
          proceso: row.PROCESO ? String(row.PROCESO) : null,
          observaciones: row.OBSERVACIONES ? String(row.OBSERVACIONES) : null,
          clienteid,
          disenadorid,
          molderiaid,
          ubicacionid,
        };

        this.validateRequiredCreatePayload(payload);
        await this.validateForeignKeys(payload);
        payload.codigoqr = this.buildCode("QR", payload.referencia);
        payload.codigobarras = this.buildCode("BAR", payload.referencia);

        payloads.push(payload);
      } catch (error) {
        errors.push({ fila: index + 2, error: error.message });
      }
    }

    if (!payloads.length) {
      throw new HttpError(400, "No se pudieron importar filas validas");
    }

    const created = await this.repository.createMany(payloads);

    return {
      inserted: created.length,
      failed: errors.length,
      errors,
    };
  }

  async resolveClienteId(row) {
    const existingId = String(row.CLIENTE_ID || row.clienteid || "").trim();
    if (existingId) {
      return existingId;
    }

    const nombre = this.normalizeCatalogText(row.CLIENTE || row.cliente || row.CLIENTE_NOMBRE);
    if (!nombre) {
      return "";
    }

    const existing = await Cliente.findOne({
      where: {
        nombre: {
          [Op.iLike]: nombre,
        },
      },
    });

    if (existing) {
      return existing.id;
    }

    const created = await Cliente.create({
      nombre,
      region: this.normalizeCatalogText(row.REGION || row.region) || null,
    });

    return created.id;
  }

  async resolveDisenadorId(row) {
    const existingId = String(row.DISENADOR_ID || row.disenadorid || "").trim();
    if (existingId) {
      return existingId;
    }

    const nombre = this.normalizeCatalogText(
      row.DISENADOR || row.DISEÑADOR || row.disenador || row.diseñador || row.DISENADOR_NOMBRE
    );
    if (!nombre) {
      return "";
    }

    const existing = await Disenador.findOne({
      where: {
        nombre: {
          [Op.iLike]: nombre,
        },
      },
    });

    if (existing) {
      return existing.id;
    }

    const created = await Disenador.create({ nombre });
    return created.id;
  }

  async resolveMolderiaId(row) {
    const existingId = String(row.MOLDERIA_ID || row.molderiaid || "").trim();
    if (existingId) {
      return existingId;
    }

    const nombre = this.normalizeCatalogText(row.MOLDERIA || row.MOLDERÍA || row.molderia);
    if (!nombre) {
      return "";
    }

    const existing = await Molderia.findOne({
      where: {
        nombre: {
          [Op.iLike]: nombre,
        },
      },
    });

    if (existing) {
      return existing.id;
    }

    const created = await Molderia.create({
      nombre,
      tipohorma: this.normalizeCatalogText(row.TIPOHORMA || row.TIPO_HORMA) || "pendiente",
      talon: this.normalizeCatalogText(row.TALON || row.talon) || "pendiente",
      punta: this.normalizeCatalogText(row.PUNTA || row.punta) || "pendiente",
      esnueva: this.parseBoolean(row.MOLDERIA_NUEVA ?? row.MOLDERÍA_NUEVA ?? row.esnueva),
      marca: this.normalizeCatalogText(row.MARCA || row.marca) || null,
    });

    return created.id;
  }

  async resolveUbicacionId(row) {
    const existingId = String(row.UBICACION_ID || row.ubicacionid || "").trim();
    if (existingId) {
      return existingId;
    }

    const nombre = this.normalizeCatalogText(row.UBICACION || row.UBICACIÓN || row.ubicacion);
    if (!nombre) {
      return "";
    }

    const existing = await Ubicacion.findOne({
      where: {
        nombre: {
          [Op.iLike]: nombre,
        },
      },
    });

    if (existing) {
      return existing.id;
    }

    const created = await Ubicacion.create({
      nombre,
      tipo: this.normalizeCatalogText(row.TIPO_UBICACION || row.tipo_ubicacion) || "bodega",
      descripcion: this.normalizeCatalogText(row.DESCRIPCION_UBICACION || row.descripcion_ubicacion) || null,
    });

    return created.id;
  }

  async update(id, payload) {
    const muestra = await this.repository.findById(id);
    if (!muestra) {
      throw new HttpError(404, "Muestra no encontrada");
    }

    if (payload.estado !== undefined) {
      payload.estado = this.validateEstado(payload.estado);
    }

    await this.validateForeignKeys(payload, true);
    return this.repository.update(muestra, payload);
  }

  async remove(id) {
    const muestra = await this.repository.findById(id);
    if (!muestra) {
      throw new HttpError(404, "Muestra no encontrada");
    }

    await this.repository.delete(muestra);
  }

  async darDeBaja(id, motivo) {
    const muestra = await this.repository.findById(id);
    if (!muestra) {
      throw new HttpError(404, "Muestra no encontrada");
    }

    const observacionesPrevias = muestra.observaciones ? `${muestra.observaciones} | ` : "";
    const detalle = motivo ? `Baja: ${motivo}` : "Baja: sin motivo";

    return this.repository.update(muestra, {
      estado: "dada_de_baja",
      observaciones: `${observacionesPrevias}${detalle}`,
    });
  }

  async generarCodigos(id) {
    const muestra = await this.getById(id);
    const payload = {
      codigoqr: this.buildCode("QR", muestra.referencia),
      codigobarras: this.buildCode("BAR", muestra.referencia),
    };

    return this.repository.update(muestra, payload);
  }

  async getByCode(codigo) {
    const muestra = await this.repository.findByAnyCode(codigo);
    if (!muestra) {
      throw new HttpError(404, "Muestra no encontrada por codigo");
    }
    return muestra;
  }

  async getQrImage(id) {
    const muestra = await this.getById(id);
    const codigo = muestra.codigoqr || this.buildCode("QR", muestra.referencia);
    if (!muestra.codigoqr) {
      await this.repository.update(muestra, { codigoqr: codigo });
    }

    const value = `${process.env.SWAGGER_SERVER_URL || "http://localhost:3001"}/api/muestras/codigo/${encodeURIComponent(codigo)}`;
    return QRCode.toBuffer(value, { type: "png", margin: 1, width: 320 });
  }

  async getBarcodeImage(id) {
    const muestra = await this.getById(id);
    const codigo = muestra.codigobarras || this.buildCode("BAR", muestra.referencia);
    if (!muestra.codigobarras) {
      await this.repository.update(muestra, { codigobarras: codigo });
    }

    return bwipjs.toBuffer({
      bcid: "code128",
      text: codigo,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: "center",
    });
  }

  async updateEstadoByCode(codigo, estado) {
    const muestra = await this.getByCode(codigo);
    const estadoNormalizado = this.validateEstado(estado);
    return this.repository.update(muestra, { estado: estadoNormalizado });
  }

  async registerMovimientoByCode(codigo, payload, usuarioid) {
    const muestra = await this.getByCode(codigo);
    const tipo = String(payload.tipo || "").trim().toLowerCase();
    if (!["entrada", "salida"].includes(tipo)) {
      throw new HttpError(400, "tipo invalido. Valores permitidos: entrada, salida");
    }

    const cantidad = Number(payload.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new HttpError(400, "cantidad debe ser un entero mayor a 0");
    }

    return MovimientoInventario.create({
      muestraid: muestra.id,
      tipo,
      cantidad,
      fecha: payload.fecha || new Date().toISOString().slice(0, 10),
      motivo: payload.motivo || "movimiento por codigo",
      usuarioid,
    });
  }

  async getStrategicSummary() {
    return this.repository.getStrategicSummary();
  }

  async getMuestrasPorCliente() {
    return this.repository.getMuestrasPorCliente();
  }

  async getHistorialVentasPorCliente(clienteid) {
    return this.repository.getHistorialVentasPorCliente(clienteid);
  }

  async getModelosPorSegmentoRegion() {
    const data = await this.repository.getModelosPorSegmentoRegion();
    const grouped = {};

    for (const item of data) {
      const region = item.cliente?.region || "sin_region";
      const segmento = item.segmento || "sin_segmento";
      const key = `${segmento}__${region}`;

      if (!grouped[key]) {
        grouped[key] = {
          segmento,
          region,
          modelos: new Set(),
        };
      }

      grouped[key].modelos.add(item.modelo);
    }

    return Object.values(grouped).map((entry) => ({
      segmento: entry.segmento,
      region: entry.region,
      modelos: Array.from(entry.modelos),
      cantidadModelos: entry.modelos.size,
    }));
  }

  validateEstado(estado) {
    const estadoNormalizado = typeof estado === "string" ? estado.trim() : "";

    if (!ESTADOS_VALIDOS.has(estadoNormalizado)) {
      throw new HttpError(
        400,
        "Estado invalido. Valores permitidos: nueva, presentada, aprobada, rechazada, reutilizable, dada_de_baja"
      );
    }

    return estadoNormalizado;
  }

  async validateForeignKeys(payload, isPartialUpdate = false) {
    const keys = [
      { field: "clienteid", model: Cliente, label: "Cliente" },
      { field: "disenadorid", model: Disenador, label: "Disenador" },
      { field: "molderiaid", model: Molderia, label: "Molderia" },
      { field: "ubicacionid", model: Ubicacion, label: "Ubicacion" },
    ];

    for (const key of keys) {
      const value = payload[key.field];

      if (!isPartialUpdate && !value) {
        throw new HttpError(400, `${key.field} es obligatorio`);
      }

      if (value === undefined || value === null) {
        continue;
      }

      const exists = await key.model.findByPk(value);
      if (!exists) {
        throw new HttpError(404, `${key.label} con id ${value} no existe`);
      }
    }
  }

  validateRequiredCreatePayload(payload) {
    const requiredFields = [
      "referencia",
      "modelo",
      "segmento",
      "pareselaborados",
      "fechaelaboracion",
      "estado",
      "clienteid",
      "disenadorid",
      "molderiaid",
      "ubicacionid",
    ];

    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
        throw new HttpError(400, `${field} es obligatorio`);
      }
    }
  }

  parseBoolean(value) {
    if (typeof value === "boolean") {
      return value;
    }

    const normalized = String(value ?? "").trim().toLowerCase();
    return ["true", "1", "si", "sí", "licenciado", "yes"].includes(normalized);
  }

  parseDate(value) {
    if (!value) {
      return new Date().toISOString().slice(0, 10);
    }

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    if (typeof value === "number") {
      const epoch = new Date(Math.round((value - 25569) * 86400 * 1000));
      return epoch.toISOString().slice(0, 10);
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      throw new HttpError(400, `Fecha invalida: ${value}`);
    }

    return parsed.toISOString().slice(0, 10);
  }

  normalizeCatalogText(value) {
    const normalized = String(value ?? "").trim();
    return normalized || "";
  }

  buildCode(prefix, referencia = "MUESTRA") {
    const normalizedRef = String(referencia || "MUESTRA")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12);
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${normalizedRef}-${timestamp}-${random}`;
  }
}

export { HttpError };
