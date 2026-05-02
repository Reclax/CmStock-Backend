import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./config/database.js";
import { buildOpenApiDocument } from "./docs/openapi.js";
import { syncModels } from "./models/index.js";
import { authenticate } from "./middleware/auth.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import fotoRoutes from "./routes/foto.routes.js";
import importacionRoutes from "./routes/importacion.routes.js";
import molderiaRoutes from "./routes/molderia.routes.js";
import movimientoInventarioRoutes from "./routes/movimiento-inventario.routes.js";
import muestraRoutes from "./routes/muestra.routes.js";
import presentacionRoutes from "./routes/presentacion.routes.js";
import produccionRoutes from "./routes/produccion.routes.js";
import reporteRoutes from "./routes/reporte.routes.js";
import trazabilidadRoutes from "./routes/trazabilidad.routes.js";
import ubicacionRoutes from "./routes/ubicacion.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import disenadorRoutes from "./routes/disenador.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsPath = path.resolve(__dirname, "../uploads");

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Configuración de CORS
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3001",
    "https://rasheeda-nonexplorative-thickly.ngrok-free.dev",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const swaggerDocument = buildOpenApiDocument({
  serverUrl: process.env.SWAGGER_SERVER_URL || `http://localhost:${PORT}`,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(uploadsPath));

// Rutas públicas (sin autenticación)
app.use("/api/auth", authRoutes);

// Rutas protegidas (requieren autenticación)
app.use("/api/muestras", authenticate, muestraRoutes);
app.use("/api/clientes", authenticate, clienteRoutes);
app.use("/api/usuarios", authenticate, usuarioRoutes);
app.use("/api/molderias", authenticate, molderiaRoutes);
app.use("/api/ubicaciones", authenticate, ubicacionRoutes);
app.use("/api/fotos", authenticate, fotoRoutes);
app.use("/api/trazabilidades", authenticate, trazabilidadRoutes);
app.use("/api/producciones", authenticate, produccionRoutes);
app.use("/api/movimientos-inventario", authenticate, movimientoInventarioRoutes);
app.use("/api/presentaciones", authenticate, presentacionRoutes);
app.use("/api/reportes", authenticate, reporteRoutes);
app.use("/api/importacion", authenticate, importacionRoutes);
app.use("/api/disenadores", authenticate, disenadorRoutes);

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

export const startServer = async () => {
  try {
    await connectDb();
    await syncModels();

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("No fue posible iniciar la API:", error);
    process.exit(1);
  }
};

export { app };

if (process.env.NODE_ENV !== "test") {
  startServer();
}
