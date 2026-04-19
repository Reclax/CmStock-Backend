import { DataTypes } from "sequelize";

export const definePresentacionModel = (sequelize) => {
  return sequelize.define(
    "Presentacion",
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
      clienteid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      resultado: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paresaprobados: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      paresrechazados: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      derivoproduccion: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      observaciones: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "presentaciones",
      timestamps: true,
      createdAt: "createdat",
      updatedAt: "updatedat",
    }
  );
};
