import path from "path";
import { Op } from "sequelize";
import { Muestra, Usuario } from "../models/index.js";
import { FotoRepository } from "../repositories/foto.repository.js";

const ORIGENES_VALIDOS = new Set(["camara", "archivo"]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class FotoService {
  constructor() {
    this.repository = new FotoRepository();
  }

  async getAll(where = {}) {
    return this.repository.findAll(where);
  }

  async getById(id) {
    const foto = await this.repository.findById(id);
    if (!foto) {
      throw new HttpError(404, "Foto no encontrada");
    }
    return foto;
  }

  async create(payload) {
    if (!payload.fechacarga) {
      payload.fechacarga = new Date().toISOString().slice(0, 10);
    }
    this.validateRequiredFields(payload);
    payload.origen = this.validateOrigen(payload.origen);
    await this.validateMuestraExists(payload.muestraid);
    await this.validateUsuarioExists(payload.usuarioid);
    return this.repository.create(payload);
  }

  async update(id, payload) {
    const foto = await this.repository.findById(id);
    if (!foto) {
      throw new HttpError(404, "Foto no encontrada");
    }

    if (payload.origen !== undefined) {
      payload.origen = this.validateOrigen(payload.origen);
    }

    if (payload.muestraid !== undefined) {
      await this.validateMuestraExists(payload.muestraid);
    }

    if (payload.usuarioid !== undefined) {
      await this.validateUsuarioExists(payload.usuarioid);
    }

    return this.repository.update(foto, payload);
  }

  async remove(id) {
    const foto = await this.repository.findById(id);
    if (!foto) {
      throw new HttpError(404, "Foto no encontrada");
    }

    await this.repository.delete(foto);
  }

  /**
   * Sube múltiples imágenes vinculándolas automáticamente a muestras
   * según la referencia extraída del nombre del archivo.
   *
   * Formato esperado del nombre: "D25-3753 FRONTAL.JPG"
   *   → referencia = "D25-3753" (todo antes del primer espacio)
   *
   * @param {Express.Multer.File[]} files - Archivos subidos por multer
   * @param {string} usuarioid - ID del usuario que realiza la carga
   * @returns {{ vinculadas: number, omitidas: number, resultados: Array }}
   */
  async createBulkFromFiles(files, usuarioid) {
    const fechacarga = new Date().toISOString().slice(0, 10);
    const resultados = [];

    for (const file of files) {
      // Extraer referencia: nombre sin extensión, texto antes del primer espacio
      const nameWithoutExt = path.parse(file.originalname).name;
      const referencia = nameWithoutExt.split(/\s+/)[0].trim().toUpperCase();

      if (!referencia) {
        resultados.push({
          ok: false,
          archivo: file.originalname,
          referencia: null,
          motivo: "No se pudo extraer la referencia del nombre del archivo",
        });
        continue;
      }

      // Buscar muestra por referencia — primero match exacto, luego insensible
      const muestra =
        (await Muestra.findOne({ where: { referencia } })) ??
        (await Muestra.findOne({
          where: { referencia: { [Op.like]: referencia } },
        }));

      if (!muestra) {
        resultados.push({
          ok: false,
          archivo: file.originalname,
          referencia,
          motivo: `No existe ninguna muestra con referencia "${referencia}"`,
        });
        continue;
      }

      try {
        const foto = await this.repository.create({
          muestraid: muestra.id,
          urlarchivo: `/uploads/${file.filename}`,
          origen: "archivo",
          fechacarga,
          usuarioid,
        });

        resultados.push({
          ok: true,
          archivo: file.originalname,
          referencia,
          muestraid: muestra.id,
          fotoid: foto.id,
        });
      } catch (err) {
        resultados.push({
          ok: false,
          archivo: file.originalname,
          referencia,
          motivo: `Error al guardar: ${err.message}`,
        });
      }
    }

    const vinculadas = resultados.filter((r) => r.ok).length;
    const omitidas = resultados.filter((r) => !r.ok).length;

    return { vinculadas, omitidas, resultados };
  }

  validateRequiredFields(payload) {
    if (!payload.muestraid) {
      throw new HttpError(400, "muestraid es obligatorio");
    }

    if (!payload.urlarchivo) {
      throw new HttpError(400, "urlarchivo es obligatorio");
    }

    if (!payload.origen) {
      throw new HttpError(400, "origen es obligatorio");
    }

    if (!payload.fechacarga) {
      throw new HttpError(400, "fechacarga es obligatoria");
    }

    if (!payload.usuarioid) {
      throw new HttpError(400, "usuarioid es obligatorio");
    }
  }

  validateOrigen(origen) {
    const origenNormalizado = typeof origen === "string" ? origen.trim() : "";

    if (!ORIGENES_VALIDOS.has(origenNormalizado)) {
      throw new HttpError(400, "origen invalido. Valores permitidos: camara, archivo");
    }

    return origenNormalizado;
  }

  async validateMuestraExists(muestraid) {
    const muestra = await Muestra.findByPk(muestraid);
    if (!muestra) {
      throw new HttpError(404, `Muestra con id ${muestraid} no existe`);
    }
    return muestra;
  }

  async validateUsuarioExists(usuarioid) {
    const usuario = await Usuario.findByPk(usuarioid);
    if (!usuario) {
      throw new HttpError(404, `Usuario con id ${usuarioid} no existe`);
    }
    return usuario;
  }
}

export { HttpError };
