import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb, sequelize } from "./config/database.js";
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
import variacionRoutes from "./routes/variacion.routes.js";
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

const staticAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3001",
  "https://rasheeda-nonexplorative-thickly.ngrok-free.dev",
  "https://09nk4wg0-5173.use2.devtunnels.ms",
];

const devtunnelOriginRegex = /^https:\/\/[a-z0-9-]+-(3000|5173)\.use2\.devtunnels\.ms$/i;

const isAllowedOrigin = (origin) =>
  !origin || staticAllowedOrigins.includes(origin) || devtunnelOriginRegex.test(origin);

// Configuración de CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origen no permitido por CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const swaggerDocument = buildOpenApiDocument({
  serverUrl: process.env.SWAGGER_SERVER_URL || `http://localhost:${PORT}`,
});

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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
app.use("/api/variaciones", authenticate, variacionRoutes);
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

// ── Manejador global de errores (debe ir DESPUÉS de todas las rutas) ───────────
// Propósito: cuando multer, auth u otro middleware lanza un error (ej: 413 por
// archivo demasiado grande), Express devuelve la respuesta de error SIN pasar
// por el middleware `cors()`, por lo que el navegador lo interpreta como un
// error de CORS. Este handler adjunta los headers CORS manualmente.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Adjuntar header CORS al origen de la petición
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Errores de multer por tamaño de archivo
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: `El archivo excede el tamaño máximo permitido (50 MB).`,
    });
  }

  // Errores de multer por tipo de archivo
  if (err.message && err.message.includes("Solo se permiten archivos Excel")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Error genérico
  const status = err.status || err.statusCode || 500;
  console.error(`[Error ${status}]`, err.message || err);
  return res.status(status).json({
    success: false,
    message: err.message || "Error interno del servidor",
  });
});

export const startServer = async () => {
  try {
    await connectDb();

    const queryInterface = sequelize.getQueryInterface();
    const fotosTableExists = await queryInterface.tableExists("fotos");
    const presentacionesTableExists = await queryInterface.tableExists("presentaciones");

    // Eliminar FK constraints ANTES de sincronizar, para que Sequelize no las recree
    if (fotosTableExists) {
      try {
        await sequelize.query(
          `ALTER TABLE fotos DROP CONSTRAINT IF EXISTS fotos_muestraid_fkey;`
        );
        console.log("FK constraint removida de fotos.muestraid (preemptive)");
      } catch (fkError) {
        console.warn("No se pudo remover FK constraint de fotos:", fkError.message);
      }
    }

    // presentaciones.muestraid puede apuntar a muestras O variaciones → sin FK en BD
    if (presentacionesTableExists) {
      try {
        await sequelize.query(
          `ALTER TABLE presentaciones DROP CONSTRAINT IF EXISTS "presentaciones_muestraid_fkey";`
        );
        console.log("FK constraint removida de presentaciones.muestraid (preemptive)");
      } catch (fkError) {
        console.warn("No se pudo remover FK constraint de presentaciones:", fkError.message);
      }
    }

    await syncModels({ seedUsers: true });

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
