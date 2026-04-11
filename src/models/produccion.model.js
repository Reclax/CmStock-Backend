import { DataTypes } from "sequelize";

export const defineProduccionModel = (sequelize) => {
  return sequelize.define(
    "Produccion",
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
      ordennumero: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paresproducidos: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fechaproduccion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      mes: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "producciones",
      timestamps: true,
      createdAt: "createdat",
      updatedAt: "updatedat",
    }
  );
};
