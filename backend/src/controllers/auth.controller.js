import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import { envs } from "../config/env.js"; 

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscamos al usuario
    const { rows } = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email.trim()]
    );

    const user = rows[0];

    // Verificación de existencia y rol
    if (!user || user.role !== "admin") {
      console.log(`❌ Intento de login fallido para: ${email}`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 2. Verificación de contraseña (SEGURIDAD REAL)
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      console.log(`❌ Password incorrecta para: ${email}`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 3. Verificamos el secreto de JWT
    if (!envs.JWT_SECRET) {
      console.error("💥 ERROR CRÍTICO: Falta la variable JWT_SECRET en el servidor.");
      return res.status(500).json({ message: "Error en configuración del servidor" });
    }

    // 4. Generamos el token
    const token = jwt.sign(
      { role: "admin", email: user.email, userId: user.id },
      envs.JWT_SECRET,
      { expiresIn: "2h" }
    );

    console.log(`✅ Login exitoso: Admin ${email} ha ingresado.`);
    return res.json({ token });

  } catch (error) {
    console.error("💥 Error en el controlador de login:", error);
    return res.status(500).json({ message: "Error al iniciar sesión" });
  }
};