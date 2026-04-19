import { DataTypes } from "sequelize";

export const defineModeladorModel = (sequelize) => {
  return sequelize.define(
    "Modelador",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
    },
    {
      tableName: "modeladores",
      timestamps: false,
    }
  );
};
