import "dotenv/config";

export const envs = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Es mejor dejarlo como undefined si no existe, 
  // así el Pool de la DB nos da un error más claro.
  DATABASE_URL: process.env.DATABASE_URL, 

  JWT_SECRET: process.env.JWT_SECRET || "pololo_secret_2026",

  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};

// Validación rápida para que no te vuelvas loco buscando
if (!envs.DATABASE_URL) {
  console.warn("⚠️  CUIDADO: DATABASE_URL no está definida en el archivo .env");
}