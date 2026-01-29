import express from "express";
import cors from "cors";
import { envs } from "./config/env.js";
import router from "./routes/index.routes.js";
import { testDBConnection } from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";

// Rutas específicas
import homeRoutes from "./routes/home.routes.js";
import adminHomeRoutes from "./routes/adminHome.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- CONFIGURACIÓN DE CORS ---
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use("/api/home", homeRoutes);
app.use("/api/admin/home", adminHomeRoutes);
app.use("/api", router);

// Servir imágenes estáticas (Solo para desarrollo, en prod usás Cloudinary)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Root (Health Check)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Pololo API is running",
    timestamp: new Date()
  });
});

// --- MANEJO DE ERRORES GLOBAL ---
app.use((err, req, res, next) => {
  console.error("💥 Error no controlado:", err.stack);
  res.status(500).json({ 
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // 1. Intentamos conectar a la DB
    await testDBConnection();
    
    // 2. Escuchar en el puerto
    const PORT = envs.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Backend escuchando en el puerto ${PORT}`);
      console.log(`🚀 Modo: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ No se pudo iniciar el servidor:", error);
    process.exit(1); // Cerramos el proceso si no hay DB
  }
};

startServer();