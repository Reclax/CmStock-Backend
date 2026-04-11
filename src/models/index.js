import { sequelize } from "../config/database.js";
import { defineClienteModel } from "./cliente.model.js";
import { defineDisenadorModel } from "./disenador.model.js";
import { defineMolderiaModel } from "./molderia.model.js";
import { defineMuestraModel } from "./muestra.model.js";
import { defineUbicacionModel } from "./ubicacion.model.js";

export const Cliente = defineClienteModel(sequelize);
export const Disenador = defineDisenadorModel(sequelize);
export const Molderia = defineMolderiaModel(sequelize);
export const Ubicacion = defineUbicacionModel(sequelize);
export const Muestra = defineMuestraModel(sequelize);

Muestra.belongsTo(Cliente, { foreignKey: "clienteid", as: "cliente" });
Muestra.belongsTo(Disenador, { foreignKey: "disenadorid", as: "disenador" });
Muestra.belongsTo(Molderia, { foreignKey: "molderiaid", as: "molderia" });
Muestra.belongsTo(Ubicacion, { foreignKey: "ubicacionid", as: "ubicacion" });

Cliente.hasMany(Muestra, { foreignKey: "clienteid", as: "muestras" });
Disenador.hasMany(Muestra, { foreignKey: "disenadorid", as: "muestras" });
Molderia.hasMany(Muestra, { foreignKey: "molderiaid", as: "muestras" });
Ubicacion.hasMany(Muestra, { foreignKey: "ubicacionid", as: "muestras" });

export const syncModels = async () => {
  await sequelize.sync();
};
