import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect } from "chai";
import XLSX from "xlsx";

process.env.NODE_ENV = "test";
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret";

let sequelize;
let Cliente;
let Disenador;
let Molderia;
let Muestra;
let Presentacion;
let Variacion;
let importarBaseDis;
let importarAprobaciones;
let importarTodos;

const tempDirs = [];

const crearArchivoExcel = (filePath, hojas) => {
  const workbook = XLSX.utils.book_new();

  for (const [nombreHoja, filas] of Object.entries(hojas)) {
    const sheet = XLSX.utils.aoa_to_sheet(filas);
    XLSX.utils.book_append_sheet(workbook, sheet, nombreHoja);
  }

  XLSX.writeFile(workbook, filePath);
};

const crearTempDir = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cmstock-import-"));
  tempDirs.push(dir);
  return dir;
};

describe("Importacion service", () => {
  before(async () => {
    ({ sequelize } = await import("../config/database.js"));
    const models = await import("../models/index.js");
    ({ Cliente, Disenador, Molderia, Muestra, Presentacion, Variacion } = models);
    ({ importarBaseDis, importarAprobaciones, importarTodos } = await import("../services/importacion.service.js"));
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(() => {
    while (tempDirs.length > 0) {
      fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
    }
  });

  it("BASE DIS usa S/N diseñador cuando la fila viene vacía y enumera variaciones como V1/V2", async () => {
    const dir = crearTempDir();
    const filePath = path.join(dir, "base-dis.xlsx");

    crearArchivoExcel(filePath, {
      BASES: [
        ["ORDEN N", "REF", "CLIENTE", "DISEÑADOR", "MOLDERIA", "SEGMENTO", "LICENCIA", "DIMA", "TALLA", "PARES", "CREACIÓN", "PROCESO", "OBSERVACIONES"],
        ["1001", "LLI-0987", "Cliente Uno", "", "", "SEG-1", "", "", "40", "10", "2026-01-05", "", ""],
        ["A1", "LLI-0987", "Cliente Uno", "", "", "SEG-1", "", "", "40", "2", "2026-01-06", "", "Primera variacion"],
        ["B1", "LLI-0987", "Cliente Uno", "", "", "SEG-1", "", "", "40", "3", "2026-01-07", "", "Segunda variacion"],
      ],
    });

    const resultado = await importarBaseDis(filePath);

    expect(resultado.errores).to.deep.equal([]);
    expect(resultado.creados).to.equal(0);
    expect(resultado.variacionesCreadas).to.equal(2);

    const muestra = await Muestra.findOne({ where: { referencia: "LLI-0987" } });
    expect(muestra).to.exist;
    expect(muestra.estado).to.equal("pendiente");

    const disenador = await Disenador.findOne({ where: { nombre: "S/N diseñador" } });
    expect(disenador).to.exist;
    expect(muestra.disenadorid).to.equal(disenador.id);

    const molderia = await Molderia.findOne({ where: { nombre: "corregir campo" } });
    expect(molderia).to.exist;
    expect(muestra.molderiaid).to.equal(molderia.id);

    const variaciones = await Variacion.findAll({
      where: { muestraOriginalId: muestra.id },
      order: [["createdat", "ASC"]],
    });

    expect(variaciones).to.have.length(2);
    expect(variaciones[0].referencia).to.equal("LLI-0987 V1");
    expect(variaciones[1].referencia).to.equal("LLI-0987 V2");
  });

  it("Aprobaciones procesa INDIC_DIS1..5 y aplica presentada, aprobada y pendiente segun las nuevas reglas", async () => {
    const baseDir = crearTempDir();
    const baseFilePath = path.join(baseDir, "base-dis.xlsx");
    crearArchivoExcel(baseFilePath, {
      BASES: [
        ["ORDEN N", "REF", "CLIENTE", "DISEÑADOR", "MOLDERIA", "SEGMENTO", "LICENCIA", "DIMA", "TALLA", "PARES", "CREACIÓN", "PROCESO", "OBSERVACIONES"],
        ["2001", "ABC-100", "Cliente Base", "", "Molderia Base", "SEG-2", "", "", "41", "5", "2026-01-08", "", ""],
      ],
    });

    await importarBaseDis(baseFilePath);

    const aprobacionesDir = crearTempDir();
    const aprobacionesFilePath = path.join(aprobacionesDir, "aprobaciones.xlsx");
    crearArchivoExcel(aprobacionesFilePath, {
      "INDIC_DIS1": [
        ["REF", "DISEÑADOR", "MODELO", "CLIENTE", "CLIENTE 1", "CLIENTE 2", "CLIENTE 3", "OK", "APROBADAS", "OBSERV"],
        ["ABC-100", "", "Molderia Base", "", "Cliente Base", "", "", "", "", ""],
        ["ABC-200", "", "Modelo Nuevo", "Cliente Nuevo", "", "", "", "OK", "7", ""],
        ["ABC-300", "", "Modelo Nuevo", "Cliente Nuevo", "", "", "", "", "", ""],
      ],
      "INDIC_DIS5": [
        ["REF", "DISEÑADOR", "MODELO", "CLIENTE", "CLIENTE 1", "CLIENTE 2", "CLIENTE 3", "OK", "APROBADAS", "OBSERV"],
        ["ABC-400", "", "Modelo Extra", "Cliente Extra", "", "", "", "OK", "4", ""],
        ["ABC-500", "", "Modelo Extra", "Cliente Extra", "", "", "", "", "", "reutilizable"],
        ["ABC-600", "", "Modelo Extra", "Cliente Extra", "", "", "", "", "", "rechazada por calidad"],
      ],
    });

    const resultado = await importarAprobaciones(aprobacionesFilePath);

    expect(resultado.errores).to.deep.equal([]);

    const muestraPresentada = await Muestra.findOne({ where: { referencia: "ABC-100" } });
    expect(muestraPresentada.estado).to.equal("presentada");

    const presentacionPresentada = await Presentacion.findOne({ where: { muestraid: muestraPresentada.id } });
    expect(presentacionPresentada.resultado).to.equal("presentada");
    expect(presentacionPresentada.derivoproduccion).to.equal(false);

    const muestraAprobada = await Muestra.findOne({ where: { referencia: "ABC-200" } });
    expect(muestraAprobada.estado).to.equal("aprobada");

    const presentacionAprobada = await Presentacion.findOne({ where: { muestraid: muestraAprobada.id } });
    expect(presentacionAprobada.resultado).to.equal("aprobada");
    expect(presentacionAprobada.derivoproduccion).to.equal(true);

    const muestraSinCruce = await Muestra.findOne({ where: { referencia: "ABC-300" } });
    expect(muestraSinCruce.estado).to.equal("pendiente");

    const muestraHoja5 = await Muestra.findOne({ where: { referencia: "ABC-400" } });
    expect(muestraHoja5.estado).to.equal("aprobada");

    const muestraReutilizable = await Muestra.findOne({ where: { referencia: "ABC-500" } });
    expect(muestraReutilizable.estado).to.equal("reutilizable");

    const muestraRechazada = await Muestra.findOne({ where: { referencia: "ABC-600" } });
    expect(muestraRechazada.estado).to.equal("rechazada");
  });

  it("Importacion masiva marca no presentado en refs de BASE DIS ausentes en Aprobaciones", async () => {
    const dir = crearTempDir();
    const baseFilePath = path.join(dir, "base-dis-masiva.xlsx");
    const aprobacionesFilePath = path.join(dir, "aprobaciones-masiva.xlsx");

    crearArchivoExcel(baseFilePath, {
      BASES: [
        ["ORDEN N", "REF", "CLIENTE", "DISEÑADOR", "MOLDERIA", "SEGMENTO", "LICENCIA", "DIMA", "TALLA", "PARES", "CREACIÓN", "PROCESO", "OBSERVACIONES"],
        ["3001", "MAS-001", "Cliente Masivo", "", "Molderia Masiva", "SEG-3", "", "", "40", "10", "2026-01-09", "", ""],
        ["3002", "MAS-002", "Cliente Masivo", "", "Molderia Masiva", "SEG-3", "", "", "40", "8", "2026-01-10", "", ""],
      ],
    });

    crearArchivoExcel(aprobacionesFilePath, {
      "INDIC-DIS2": [
        ["REF", "DISEÑADOR", "MODELO", "CLIENTE", "OK", "APROBADAS", "OBSERV"],
        ["MAS-001", "", "Molderia Masiva", "Cliente Masivo", "OK", "", ""],
      ],
    });

    await importarTodos(baseFilePath, aprobacionesFilePath);

    const muestraEnAprobaciones = await Muestra.findOne({ where: { referencia: "MAS-001" } });
    const muestraFueraDeAprobaciones = await Muestra.findOne({ where: { referencia: "MAS-002" } });

    expect(muestraEnAprobaciones).to.exist;
    expect(muestraFueraDeAprobaciones).to.exist;
    expect(muestraEnAprobaciones.estado).to.equal("presentada");
    expect(muestraFueraDeAprobaciones.estado).to.equal("no presentado");
  });
});