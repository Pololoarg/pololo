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
// Usamos origin: true para que acepte cualquier origen en esta etapa de pruebas, 
// es más flexible que el '*' para ciertos navegadores.
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/api/home", homeRoutes);
app.use("/api/admin/home", adminHomeRoutes);
app.use("/api", router);

// Servir imágenes estáticas
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Root (Health Check)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Pololo API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date()
  });
});

// --- MANEJO DE ERRORES GLOBAL ---
// Esto evita que el servidor se caiga si hay un error no controlado
app.use((err, req, res, next) => {
  console.error("💥 Error no controlado:", err.stack);
  res.status(500).json({ 
    message: "Error interno del servidor",
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Primero intentamos conectar a la DB
    await testDBConnection();
    
    const PORT = envs.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Backend escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error("❌ No se pudo iniciar el servidor debido a la base de datos:", error);
    // IMPORTANTE: En Render, no queremos que el proceso muera del todo 
    // para poder entrar a ver los logs.
  }
};

startServer();