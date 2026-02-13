import { testDBConnection } from "../config/db.js";

export const healthCheck = async (req, res) => {
  try {
    // 1. Intentamos una pequeña consulta a la base de datos
    await testDBConnection(); 

    // 2. Si la DB responde, enviamos el OK
    res.json({
      status: 'ok',
      database: 'connected', // Esto te confirma que la DB también despertó
      message: 'API y Supabase funcionando 🚀',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 3. Si la DB falla (está caída o muy dormida), avisamos el error
    console.error("Health Check Error:", error);
    res.status(500).json({
      status: 'error',
      message: 'API activa pero la base de datos no responde',
      error: error.message
    });
  }
};