import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./LoginAdmin.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        showToast("Credenciales inválidas", "error");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const userToSave = data.user || { email: email, role: 'admin' };
      login(data.token, userToSave);
      showToast("Bienvenido al panel admin", "success");
      navigate("/admin/productos");
    } catch (err) {
      showToast(err.message || "Error al iniciar sesión", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-admin-container">
      <div className="login-admin-card">
        <div className="login-admin-header">
          <h1>PANEL ADMIN</h1>
          <p>Ingresa tus credenciales</p>
        </div>

        <form onSubmit={handleLogin} className="login-admin-form">
          <div className="form-group">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="login-admin-btn"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginAdmin;