import { DataTypes } from "sequelize";

export const defineTrazabilidadModel = (sequelize) => {
  return sequelize.define(
    "Trazabilidad",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      muestraid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      disenadorid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      modeladorid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      fecharequerimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fechadiseno: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fechamolderia: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecharegistro: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      tiempos: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "trazabilidades",
      timestamps: true,
      createdAt: "createdat",
      updatedAt: "updatedat",
    }
  );
};
