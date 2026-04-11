import { DataTypes } from "sequelize";

export const defineMuestraModel = (sequelize) => {
  return sequelize.define(
    "Muestra",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      referencia: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      modelo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      segmento: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      licenciado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      dima: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      talla: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pareselaborados: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fechaelaboracion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      estado: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      proceso: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      observaciones: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      clienteid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      disenadorid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      molderiaid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      ubicacionid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "muestras",
      timestamps: true,
      createdAt: "createdat",
      updatedAt: "updatedat",
    }
  );
};
