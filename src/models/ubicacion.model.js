import { DataTypes } from "sequelize";

export const defineUbicacionModel = (sequelize) => {
  return sequelize.define(
    "Ubicacion",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
    },
    {
      tableName: "ubicaciones",
      timestamps: false,
    }
  );
};
