import { DataTypes } from "sequelize";

export const defineClienteModel = (sequelize) => {
  return sequelize.define(
    "Cliente",
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
      region: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "clientes",
      timestamps: false,
    }
  );
};
