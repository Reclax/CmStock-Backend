import { Cliente, Muestra, Produccion, Variacion } from "../models/index.js";
import { PresentacionRepository } from "../repositories/presentacion.repository.js";

const RESULTADOS_VALIDOS = new Set([
  "aprobada",
  "rechazada",
  "pendiente",
  "producida",
  "parcial",
  "revisar",
]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class PresentacionService {
  constructor() {
    this.repository = new PresentacionRepository();
  }

  async getAll() {
    return this.repository.findAll();
  }

  async getByMuestraId(muestraid) {
    return this.repository.findByMuestraId(muestraid);
  }

  async getById(id) {
    const presentacion = await this.repository.findById(id);
    if (!presentacion) {
      throw new HttpError(404, "Presentacion no encontrada");
    }
    return presentacion;
  }

  async create(payload) {
    this.validateRequiredFields(payload);
    payload.resultado = this.validateResultado(payload.resultado);
    await this.validateMuestraExists(payload.muestraid);
    await this.validateClienteExists(payload.clienteid);
    const presentacion = await this.repository.create(payload);
    await this.syncProduccion(presentacion, payload);
    return presentacion;
  }

  async update(id, payload) {
    const presentacion = await this.repository.findById(id);
    if (!presentacion) {
      throw new HttpError(404, "Presentacion no encontrada");
    }

    if (payload.resultado !== undefined) {
      payload.resultado = this.validateResultado(payload.resultado);
    }

    if (payload.muestraid !== undefined) {
      await this.validateMuestraExists(payload.muestraid);
    }

    if (payload.clienteid !== undefined) {
      await this.validateClienteExists(payload.clienteid);
    }

    const updated = await this.repository.update(presentacion, payload);
    await this.syncProduccion(updated, payload);
    return updated;
  }

  async remove(id) {
    const presentacion = await this.repository.findById(id);
    if (!presentacion) {
      throw new HttpError(404, "Presentacion no encontrada");
    }

    await this.repository.delete(presentacion);
  }

  validateRequiredFields(payload) {
    if (!payload.muestraid) {
      throw new HttpError(400, "muestraid es obligatorio");
    }

    if (!payload.clienteid) {
      throw new HttpError(400, "clienteid es obligatorio");
    }

    if (!payload.fecha) {
      throw new HttpError(400, "fecha es obligatoria");
    }

    if (!payload.resultado) {
      throw new HttpError(400, "resultado es obligatorio");
    }

    if (payload.derivoproduccion === undefined || payload.derivoproduccion === null) {
      throw new HttpError(400, "derivoproduccion es obligatorio");
    }
  }

  validateResultado(resultado) {
    const resultadoNormalizado =
      typeof resultado === "string" ? resultado.trim() : "";

    if (!RESULTADOS_VALIDOS.has(resultadoNormalizado)) {
      throw new HttpError(
        400,
        "resultado invalido. Valores permitidos: aprobada, rechazada, pendiente, producida, parcial, revisar"
      );
    }

    return resultadoNormalizado;
  }

  async validateMuestraExists(muestraid) {
    // Aceptar tanto muestras como variaciones
    const owner = (await Muestra.findByPk(muestraid)) ?? (await Variacion.findByPk(muestraid));
    if (!owner) {
      throw new HttpError(404, `Muestra o variación con id ${muestraid} no existe`);
    }
    return owner;
  }

  async validateClienteExists(clienteid) {
    const cliente = await Cliente.findByPk(clienteid);
    if (!cliente) {
      throw new HttpError(404, `Cliente con id ${clienteid} no existe`);
    }
    return cliente;
  }

  shouldSyncProduccion(payload) {
    return (
      payload.resultado === "aprobada" &&
      Boolean(payload.derivoproduccion) &&
      Number(payload.paresaprobados) > 0
    );
  }

  buildMesFromFecha(fecha) {
    const fechaDate = new Date(fecha || new Date());
    if (Number.isNaN(fechaDate.getTime())) {
      return new Date().toLocaleString("es-ES", { month: "long" });
    }

    return fechaDate.toLocaleString("es-ES", { month: "long" });
  }

  async syncProduccion(presentacion, payload) {
    const data = {
      ...(typeof presentacion?.toJSON === "function" ? presentacion.toJSON() : presentacion),
      ...payload,
    };

    const debeSincronizar = this.shouldSyncProduccion(data);

    if (!debeSincronizar) {
      const existente = await Produccion.findOne({
        where: {
          muestraid: data.muestraid,
          clienteid: data.clienteid,
        },
      });

      if (existente) {
        await existente.destroy();
      }

      return;
    }

    const owner = (await Muestra.findByPk(data.muestraid)) ?? (await Variacion.findByPk(data.muestraid));
    if (!owner) {
      throw new HttpError(404, `Muestra o variación con id ${data.muestraid} no existe`);
    }

    const isVariation = Boolean(owner.muestraOriginalId);
    const estadoEsperado = isVariation ? "variacion" : "aprobada";
    if (String(owner.estado || "").trim().toLowerCase() !== estadoEsperado) {
      await owner.update({ estado: estadoEsperado });
    }

    const fechaProduccion = data.fecha || new Date();
    const existing = await Produccion.findOne({
      where: {
        muestraid: data.muestraid,
        clienteid: data.clienteid,
      },
    });

    const productionPayload = {
      muestraid: data.muestraid,
      clienteid: data.clienteid,
      ordennumero: owner.referencia || String(data.muestraid),
      paresproducidos: Number(data.paresaprobados) || 0,
      fechaproduccion: fechaProduccion,
      mes: this.buildMesFromFecha(fechaProduccion),
    };

    if (existing) {
      await existing.update(productionPayload);
      return;
    }

    await Produccion.create(productionPayload);
  }
}

export { HttpError };
