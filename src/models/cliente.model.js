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
    },
    {
      tableName: "clientes",
      timestamps: false,
    }
  );
};
