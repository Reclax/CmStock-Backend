import { DataTypes } from "sequelize";

export const defineFotoModel = (sequelize) => {
  return sequelize.define(
    "Foto",
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
      urlarchivo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      origen: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fechacarga: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      usuarioid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      orden: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "fotos",
      timestamps: true,
      createdAt: "createdat",
      updatedAt: "updatedat",
    }
  );
};
