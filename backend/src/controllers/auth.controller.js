import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../config/db.js";
import { envs } from "../config/env.js"; // Importamos envs para ser consistentes

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscamos al usuario (usamos LOWER para evitar problemas de mayúsculas)
    const { rows } = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
      [email.trim()] // Quitamos espacios accidentales
    );

    const user = rows[0];

    // LOG DE DEPURACIÓN: Esto solo lo ves vos en la consola del servidor
    if (!user) {
      console.log(`❌ Intento de login fallido: El email ${email} no existe.`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (user.role !== "admin") {
      console.log(`❌ Intento de login fallido: El usuario ${email} no tiene rol 'admin'. Tiene: '${user.role}'`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 2. Verificamos la contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      console.log(`❌ Intento de login fallido: Password incorrecta para ${email}`);
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