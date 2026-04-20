import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { defineClienteModel } from "./cliente.model.js";
import { defineDisenadorModel } from "./disenador.model.js";
import { defineFotoModel } from "./foto.model.js";
import { defineModeladorModel } from "./modelador.model.js";
import { defineMolderiaModel } from "./molderia.model.js";
import { defineMovimientoInventarioModel } from "./movimiento-inventario.model.js";
import { defineMuestraModel } from "./muestra.model.js";
import { definePresentacionModel } from "./presentacion.model.js";
import { defineProduccionModel } from "./produccion.model.js";
import { defineTrazabilidadModel } from "./trazabilidad.model.js";
import { defineUbicacionModel } from "./ubicacion.model.js";
import { defineUsuarioModel } from "./usuario.model.js";

export const Cliente = defineClienteModel(sequelize);
export const Disenador = defineDisenadorModel(sequelize);
export const Molderia = defineMolderiaModel(sequelize);
export const Modelador = defineModeladorModel(sequelize);
export const Ubicacion = defineUbicacionModel(sequelize);
export const Usuario = defineUsuarioModel(sequelize);
export const Muestra = defineMuestraModel(sequelize);
export const Produccion = defineProduccionModel(sequelize);
export const MovimientoInventario = defineMovimientoInventarioModel(sequelize);
export const Presentacion = definePresentacionModel(sequelize);
export const Foto = defineFotoModel(sequelize);
export const Trazabilidad = defineTrazabilidadModel(sequelize);

const ensureColumnExists = async (
  queryInterface,
  tableName,
  columnName,
  definition,
) => {
  const tableDescription = await queryInterface.describeTable(tableName);
  if (!tableDescription[columnName]) {
    await queryInterface.addColumn(tableName, columnName, {
      ...definition,
      allowNull: true,
    });
  }
};

const migrateLegacyCatalogData = async () => {
  const queryInterface = sequelize.getQueryInterface();

  await ensureColumnExists(queryInterface, "clientes", "nombre", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "usuarios", "nombre", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "usuarios", "email", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "usuarios", "rol", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "usuarios", "activo", {
    type: DataTypes.BOOLEAN,
  });
  await ensureColumnExists(queryInterface, "molderias", "nombre", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "molderias", "tipohorma", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "molderias", "talon", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "molderias", "punta", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "molderias", "esnueva", {
    type: DataTypes.BOOLEAN,
  });
  await ensureColumnExists(queryInterface, "ubicaciones", "nombre", {
    type: DataTypes.STRING,
  });
  await ensureColumnExists(queryInterface, "ubicaciones", "tipo", {
    type: DataTypes.STRING,
  });

  await sequelize.query(`
    UPDATE clientes
    SET nombre = COALESCE(nombre, 'Cliente ' || id::text)
    WHERE nombre IS NULL OR nombre = ''
  `);

  await sequelize.query(`
    UPDATE usuarios
    SET
      nombre = COALESCE(nombre, 'Usuario ' || id::text),
      email = COALESCE(email, 'user-' || replace(id::text, '-', '') || '@legacy.local'),
      rol = COALESCE(rol, 'disenador'),
      activo = COALESCE(activo, true)
    WHERE nombre IS NULL OR email IS NULL OR rol IS NULL OR activo IS NULL
  `);

  await sequelize.query(`
    UPDATE molderias
    SET
      nombre = COALESCE(nombre, 'Molderia ' || id::text),
      tipohorma = COALESCE(tipohorma, 'pendiente'),
      talon = COALESCE(talon, 'pendiente'),
      punta = COALESCE(punta, 'pendiente'),
      esnueva = COALESCE(esnueva, false)
    WHERE nombre IS NULL OR tipohorma IS NULL OR talon IS NULL OR punta IS NULL OR esnueva IS NULL
  `);

  await sequelize.query(`
    UPDATE ubicaciones
    SET
      nombre = COALESCE(nombre, 'Ubicacion ' || id::text),
      tipo = COALESCE(tipo, 'bodega')
    WHERE nombre IS NULL OR tipo IS NULL
  `);
};

Muestra.belongsTo(Cliente, { foreignKey: "clienteid", as: "cliente" });
Muestra.belongsTo(Disenador, { foreignKey: "disenadorid", as: "disenador" });
Muestra.belongsTo(Molderia, { foreignKey: "molderiaid", as: "molderia" });
Muestra.belongsTo(Ubicacion, { foreignKey: "ubicacionid", as: "ubicacion" });
Produccion.belongsTo(Muestra, { foreignKey: "muestraid", as: "muestra" });
Produccion.belongsTo(Cliente, { foreignKey: "clienteid", as: "cliente" });
MovimientoInventario.belongsTo(Muestra, {
  foreignKey: "muestraid",
  as: "muestra",
});
MovimientoInventario.belongsTo(Usuario, {
  foreignKey: "usuarioid",
  as: "usuario",
});
Presentacion.belongsTo(Muestra, { foreignKey: "muestraid", as: "muestra" });
Presentacion.belongsTo(Cliente, { foreignKey: "clienteid", as: "cliente" });
Foto.belongsTo(Muestra, { foreignKey: "muestraid", as: "muestra" });
Foto.belongsTo(Usuario, { foreignKey: "usuarioid", as: "usuario" });
Trazabilidad.belongsTo(Muestra, { foreignKey: "muestraid", as: "muestra" });
Trazabilidad.belongsTo(Disenador, {
  foreignKey: "disenadorid",
  as: "disenador",
});
Trazabilidad.belongsTo(Modelador, {
  foreignKey: "modeladorid",
  as: "modelador",
});

Cliente.hasMany(Muestra, { foreignKey: "clienteid", as: "muestras" });
Disenador.hasMany(Muestra, { foreignKey: "disenadorid", as: "muestras" });
Molderia.hasMany(Muestra, { foreignKey: "molderiaid", as: "muestras" });
Ubicacion.hasMany(Muestra, { foreignKey: "ubicacionid", as: "muestras" });
Muestra.hasMany(Produccion, { foreignKey: "muestraid", as: "producciones" });
Cliente.hasMany(Produccion, { foreignKey: "clienteid", as: "producciones" });
Muestra.hasMany(MovimientoInventario, {
  foreignKey: "muestraid",
  as: "movimientosInventario",
});
Usuario.hasMany(MovimientoInventario, {
  foreignKey: "usuarioid",
  as: "movimientosInventario",
});
Muestra.hasMany(Presentacion, {
  foreignKey: "muestraid",
  as: "presentaciones",
});
Cliente.hasMany(Presentacion, {
  foreignKey: "clienteid",
  as: "presentaciones",
});
Muestra.hasMany(Foto, { foreignKey: "muestraid", as: "fotos" });
Usuario.hasMany(Foto, { foreignKey: "usuarioid", as: "fotos" });
Muestra.hasMany(Trazabilidad, {
  foreignKey: "muestraid",
  as: "trazabilidades",
});
Disenador.hasMany(Trazabilidad, {
  foreignKey: "disenadorid",
  as: "trazabilidades",
});
Modelador.hasMany(Trazabilidad, {
  foreignKey: "modeladorid",
  as: "trazabilidades",
});

export const syncModels = async () => {
  await sequelize.sync({ alter: true });
  await migrateLegacyCatalogData();
};
