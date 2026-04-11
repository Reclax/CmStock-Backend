import { sequelize } from "../config/database.js";
import { defineClienteModel } from "./cliente.model.js";
import { defineDisenadorModel } from "./disenador.model.js";
import { defineMolderiaModel } from "./molderia.model.js";
import { defineMovimientoInventarioModel } from "./movimiento-inventario.model.js";
import { defineMuestraModel } from "./muestra.model.js";
import { defineProduccionModel } from "./produccion.model.js";
import { defineUsuarioModel } from "./usuario.model.js";
import { defineUbicacionModel } from "./ubicacion.model.js";

export const Cliente = defineClienteModel(sequelize);
export const Disenador = defineDisenadorModel(sequelize);
export const Molderia = defineMolderiaModel(sequelize);
export const Ubicacion = defineUbicacionModel(sequelize);
export const Usuario = defineUsuarioModel(sequelize);
export const Muestra = defineMuestraModel(sequelize);
export const Produccion = defineProduccionModel(sequelize);
export const MovimientoInventario = defineMovimientoInventarioModel(sequelize);

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

export const syncModels = async () => {
  await sequelize.sync();
};
