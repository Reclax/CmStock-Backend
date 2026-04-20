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
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tipo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "ubicaciones",
      timestamps: false,
    }
  );
};
