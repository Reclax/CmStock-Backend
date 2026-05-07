import dotenv from "dotenv";

import { connectDb, sequelize } from "../src/config/database.js";
import {
  Cliente,
  Disenador,
  Foto,
  Modelador,
  Molderia,
  MovimientoInventario,
  Muestra,
  Presentacion,
  Produccion,
  Trazabilidad,
  Ubicacion,
  Usuario,
  syncModels,
} from "../src/models/index.js";

dotenv.config();

const formatDateOnly = (date) => date.toISOString().slice(0, 10);

const dateOffset = (days) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return formatDateOnly(value);
};

const ensureBaseData = async () => {
  if ((await Cliente.count()) === 0) {
    await Cliente.bulkCreate([
      { nombre: "Calzado Andino", region: "Antioquia" },
      { nombre: "Urban Steps", region: "Cundinamarca" },
      { nombre: "Nova Leather", region: "Valle" },
    ]);
  }

  if ((await Disenador.count()) === 0) {
    await Disenador.bulkCreate([
      { nombre: "Laura Rios" },
      { nombre: "Camilo Perez" },
      { nombre: "Marta Salcedo" },
    ]);
  }

  if ((await Modelador.count()) === 0) {
    await Modelador.bulkCreate([{}, {}, {}]);
  }

  if ((await Molderia.count()) === 0) {
    await Molderia.bulkCreate([
      {
        nombre: "Molderia Runner 01",
        tipohorma: "deportivo",
        talon: "alto",
        punta: "redonda",
        esnueva: true,
        marca: "CM",
      },
      {
        nombre: "Molderia Casual 02",
        tipohorma: "casual",
        talon: "medio",
        punta: "semi redonda",
        esnueva: false,
        marca: "CM",
      },
      {
        nombre: "Molderia Formal 03",
        tipohorma: "formal",
        talon: "bajo",
        punta: "fina",
        esnueva: true,
        marca: "CM",
      },
    ]);
  }

  if ((await Ubicacion.count()) === 0) {
    await Ubicacion.bulkCreate([
      { nombre: "Bodega Principal", tipo: "bodega", descripcion: "Rack A" },
      { nombre: "Muestreo", tipo: "estanteria", descripcion: "Zona de muestras" },
      { nombre: "Produccion", tipo: "linea", descripcion: "Area de salida" },
    ]);
  }
};

const seedMuestras = async () => {
  if ((await Muestra.count()) > 0) {
    return;
  }

  const clientes = await Cliente.findAll({ order: [["nombre", "ASC"]] });
  const disenadores = await Disenador.findAll({ order: [["nombre", "ASC"]] });
  const molderias = await Molderia.findAll({ order: [["nombre", "ASC"]] });
  const ubicaciones = await Ubicacion.findAll({ order: [["nombre", "ASC"]] });

  const referencias = [
    "MS-2026-001",
    "MS-2026-002",
    "MS-2026-003",
    "MS-2026-004",
    "MS-2026-005",
    "MS-2026-006",
    "MS-2026-007",
    "MS-2026-008",
  ];

  const estados = [
    "en diseño",
    "en molderia",
    "presentada",
    "aprobada",
    "en bodega",
    "en revisión",
    "presentada",
    "en proceso",
  ];

  const modelos = [
    "Runner Alpha",
    "Urban Wave",
    "Formal Core",
    "Street Neo",
    "Flex Pro",
    "Lite Move",
    "Classic 21",
    "Impact X",
  ];

  const muestras = referencias.map((referencia, index) => ({
    referencia,
    modelo: modelos[index],
    segmento: index % 2 === 0 ? "hombre" : "mujer",
    licenciado: index % 3 === 0,
    dima: `DIMA-${index + 1}`,
    talla: 35 + (index % 7),
    pareselaborados: 2 + (index % 4),
    fechaelaboracion: dateOffset(-(index + 2) * 8),
    estado: estados[index],
    proceso: "desarrollo",
    observaciones: "Dato de prueba generado por seed-full",
    codigoqr: `QR-MS-2026-${String(index + 1).padStart(3, "0")}`,
    codigobarras: `7700000000${String(index + 1).padStart(3, "0")}`,
    clienteid: clientes[index % clientes.length].id,
    disenadorid: disenadores[index % disenadores.length].id,
    molderiaid: molderias[index % molderias.length].id,
    ubicacionid: ubicaciones[index % ubicaciones.length].id,
  }));

  await Muestra.bulkCreate(muestras);
};

const seedPresentaciones = async () => {
  if ((await Presentacion.count()) > 0) {
    return;
  }

  const muestras = await Muestra.findAll({ order: [["referencia", "ASC"]] });

  const presentaciones = muestras.slice(0, 5).map((muestra, index) => {
    const aprobada = index % 3 !== 1;
    const paresAprobados = aprobada ? 1 + (index % 2) : 0;
    const paresRechazados = aprobada ? 0 : 1;

    return {
      muestraid: muestra.id,
      clienteid: muestra.clienteid,
      fecha: dateOffset(-(index + 1) * 5),
      resultado: aprobada ? "aprobada" : "rechazada",
      paresaprobados: paresAprobados,
      paresrechazados: paresRechazados,
      derivoproduccion: aprobada,
      observaciones: "Presentacion de prueba",
    };
  });

  await Presentacion.bulkCreate(presentaciones);
};

const seedProducciones = async () => {
  if ((await Produccion.count()) > 0) {
    return;
  }

  const presentaciones = await Presentacion.findAll({ order: [["fecha", "ASC"]] });
  const aprobadas = presentaciones.filter((item) => item.derivoproduccion).slice(0, 3);

  const producciones = aprobadas.map((item, index) => {
    const fecha = dateOffset(-(index + 1) * 3);
    const monthDate = new Date(fecha);

    return {
      muestraid: item.muestraid,
      clienteid: item.clienteid,
      ordennumero: `OP-2026-${String(index + 1).padStart(4, "0")}`,
      paresproducidos: 12 + index * 4,
      fechaproduccion: fecha,
      mes: MONTH_NAMES[monthDate.getMonth()],
    };
  });

  await Produccion.bulkCreate(producciones);
};

const seedMovimientos = async () => {
  if ((await MovimientoInventario.count()) > 0) {
    return;
  }

  const muestras = await Muestra.findAll({ order: [["referencia", "ASC"]] });
  const usuario = await Usuario.findOne({ order: [["createdat", "ASC"]] });

  if (!usuario) {
    throw new Error("No hay usuarios. Ejecuta primero el seed de usuarios.");
  }

  const movimientos = [];

  for (const [index, muestra] of muestras.entries()) {
    movimientos.push({
      muestraid: muestra.id,
      tipo: "entrada",
      cantidad: 4 + (index % 3),
      fecha: dateOffset(-(index + 1) * 2),
      motivo: "Ingreso inicial de prueba",
      usuarioid: usuario.id,
    });

    if (index % 3 === 0) {
      movimientos.push({
        muestraid: muestra.id,
        tipo: "salida",
        cantidad: 1,
        fecha: dateOffset(-(index + 1)),
        motivo: "Muestra enviada a cliente",
        usuarioid: usuario.id,
      });
    }
  }

  await MovimientoInventario.bulkCreate(movimientos);
};

const seedFotos = async () => {
  if ((await Foto.count()) > 0) {
    return;
  }

  const muestras = await Muestra.findAll({ order: [["referencia", "ASC"]] });
  const usuario = await Usuario.findOne({ order: [["createdat", "ASC"]] });

  if (!usuario) {
    throw new Error("No hay usuarios. Ejecuta primero el seed de usuarios.");
  }

  const fotos = muestras.flatMap((muestra, index) => [
    {
      muestraid: muestra.id,
      urlarchivo: "/uploads/common/default_product.jpg",
      origen: "seed-full",
      fechacarga: dateOffset(-(index + 1) * 4),
      usuarioid: usuario.id,
      orden: 1,
    },
    {
      muestraid: muestra.id,
      urlarchivo: "/uploads/common/default_product.jpg",
      origen: "seed-full",
      fechacarga: dateOffset(-(index + 1) * 3),
      usuarioid: usuario.id,
      orden: 2,
    },
  ]);

  await Foto.bulkCreate(fotos);
};

const seedTrazabilidad = async () => {
  if ((await Trazabilidad.count()) > 0) {
    return;
  }

  const muestras = await Muestra.findAll({ order: [["referencia", "ASC"]] });
  const disenadores = await Disenador.findAll({ order: [["nombre", "ASC"]] });
  const modeladores = await Modelador.findAll({ order: [["id", "ASC"]] });

  const trazas = muestras.map((muestra, index) => {
    const baseDays = (index + 1) * 7;
    const requerimiento = dateOffset(-baseDays);
    const diseno = dateOffset(-baseDays + 1);
    const molderia = dateOffset(-baseDays + 2);
    const registro = dateOffset(-baseDays + 3);

    return {
      muestraid: muestra.id,
      disenadorid: disenadores[index % disenadores.length].id,
      modeladorid: modeladores[index % modeladores.length].id,
      fecharequerimiento: requerimiento,
      fechadiseno: diseno,
      fechamolderia: molderia,
      fecharegistro: registro,
      tiempos: "4 dias",
    };
  });

  await Trazabilidad.bulkCreate(trazas);
};

const logSummary = async () => {
  const summary = {
    clientes: await Cliente.count(),
    disenadores: await Disenador.count(),
    modeladores: await Modelador.count(),
    molderias: await Molderia.count(),
    ubicaciones: await Ubicacion.count(),
    usuarios: await Usuario.count(),
    muestras: await Muestra.count(),
    presentaciones: await Presentacion.count(),
    producciones: await Produccion.count(),
    movimientosInventario: await MovimientoInventario.count(),
    fotos: await Foto.count(),
    trazabilidades: await Trazabilidad.count(),
  };

  console.table(summary);
};

const MONTH_NAMES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const run = async () => {
  try {
    await connectDb();
    await syncModels({ alter: true, migrateLegacy: true, seedUsers: false });

    if ((await Usuario.count()) === 0) {
      throw new Error(
        "No existen usuarios en la base. Crea usuarios primero (ejemplo: seedSystemUsers).",
      );
    }

    await ensureBaseData();
    await seedMuestras();
    await seedPresentaciones();
    await seedProducciones();
    await seedMovimientos();
    await seedFotos();
    await seedTrazabilidad();
    await logSummary();

    console.log("Seed completo finalizado.");
    process.exit(0);
  } catch (error) {
    console.error("Error en seed-full:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

run();
