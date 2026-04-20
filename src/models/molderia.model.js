import { DataTypes } from "sequelize";

export const defineMolderiaModel = (sequelize) => {
  return sequelize.define(
    "Molderia",
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
      tipohorma: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      talon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      punta: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      esnueva: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      marca: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "molderias",
      timestamps: false,
    }
  );
};
