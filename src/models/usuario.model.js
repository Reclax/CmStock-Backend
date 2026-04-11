import { DataTypes } from "sequelize";

export const defineUsuarioModel = (sequelize) => {
  return sequelize.define(
    "Usuario",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
    },
    {
      tableName: "usuarios",
      timestamps: false,
    }
  );
};
