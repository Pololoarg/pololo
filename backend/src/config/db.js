import pkg from "pg";
import { envs } from "./env.js";

const { Pool } = pkg;

// Esta es la forma más segura: Si estamos en Render (production), usamos SSL.
// Si estamos en tu PC (development), lo apagamos.
const sslConfig = process.env.NODE_ENV === "production" 
  ? { rejectUnauthorized: false } 
  : false;

export const pool = new Pool({
  connectionString: envs.DATABASE_URL,
  ssl: sslConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Aumentamos un poco el tiempo por las dudas
});

export const testDBConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("✅ Conexión exitosa a PostgreSQL");
    return true;
  } catch (err) {
    console.error("❌ Error de conexión a PostgreSQL:");
    console.error("Mensaje:", err.message);
  } finally {
    if (client) client.release();
  }
};