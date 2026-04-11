import { DataTypes } from "sequelize";

export const defineMovimientoInventarioModel = (sequelize) => {
  return sequelize.define(
    "MovimientoInventario",
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
      tipo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      motivo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      usuarioid: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: "movimientos_inventario",
      timestamps: true,
      createdAt: "createdat",
      updatedAt: "updatedat",
    }
  );
};
