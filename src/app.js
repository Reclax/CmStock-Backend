import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDb } from "./config/database.js";
import { buildOpenApiDocument } from "./docs/openapi.js";
import { syncModels } from "./models/index.js";
import clienteRoutes from "./routes/cliente.routes.js";
import fotoRoutes from "./routes/foto.routes.js";
import molderiaRoutes from "./routes/molderia.routes.js";
import movimientoInventarioRoutes from "./routes/movimiento-inventario.routes.js";
import muestraRoutes from "./routes/muestra.routes.js";
import presentacionRoutes from "./routes/presentacion.routes.js";
import produccionRoutes from "./routes/produccion.routes.js";
import trazabilidadRoutes from "./routes/trazabilidad.routes.js";
import ubicacionRoutes from "./routes/ubicacion.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const swaggerDocument = buildOpenApiDocument({
  serverUrl: process.env.SWAGGER_SERVER_URL || `http://localhost:${PORT}`,
});

app.use(cors());
app.use(express.json());

app.use("/api/muestras", muestraRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/molderias", molderiaRoutes);
app.use("/api/ubicaciones", ubicacionRoutes);
app.use("/api/fotos", fotoRoutes);
app.use("/api/trazabilidades", trazabilidadRoutes);
app.use("/api/producciones", produccionRoutes);
app.use("/api/movimientos-inventario", movimientoInventarioRoutes);
app.use("/api/presentaciones", presentacionRoutes);

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerDocument);
});

app.get("/api-docs", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CM Stock API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f7f7f7; }
      #swagger-ui { min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/api-docs.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "BaseLayout",
        });
      };
    </script>
  </body>
</html>`);
});

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
