import { DataTypes } from "sequelize";

export const defineDisenadorModel = (sequelize) => {
  return sequelize.define(
    "Disenador",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "disenadores",
      timestamps: false,
    }
  );
};
