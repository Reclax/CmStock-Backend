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
    },
    {
      tableName: "molderias",
      timestamps: false,
    }
  );
};
