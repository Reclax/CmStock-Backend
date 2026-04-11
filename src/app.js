import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./config/database.js";
import { syncModels } from "./models/index.js";
import movimientoInventarioRoutes from "./routes/movimiento-inventario.routes.js";
import muestraRoutes from "./routes/muestra.routes.js";
import produccionRoutes from "./routes/produccion.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.use("/api/muestras", muestraRoutes);
app.use("/api/producciones", produccionRoutes);
app.use("/api/movimientos-inventario", movimientoInventarioRoutes);

app.get("/", (req, res) => {
  res.send("API CM Stock funcionando");
});

const startServer = async () => {
  try {
    await connectDb();
    await syncModels();

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("No fue posible iniciar la API:", error.message);
    process.exit(1);
  }
};

startServer();