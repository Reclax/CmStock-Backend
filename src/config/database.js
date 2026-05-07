import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";

const DB_DIALECT = process.env.DB_DIALECT || (isTest ? "sqlite" : "postgres");

const DB_NAME = process.env.DB_NAME || "cmstock";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "postgres";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 5432);

export const sequelize =
  DB_DIALECT === "sqlite"
    ? new Sequelize({
        dialect: "sqlite",
        storage: process.env.SQLITE_STORAGE || ":memory:",
        logging: false,
      })
    : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        host: DB_HOST,
        port: DB_PORT,
        dialect: "postgres",
        logging: false,
      });

export const connectDb = async () => {
  await sequelize.authenticate();
};
