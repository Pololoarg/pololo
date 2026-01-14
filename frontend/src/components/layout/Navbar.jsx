// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";


function Navbar() {
  const { totalItems } = useCart();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // 🚀 NUEVA FUNCIÓN PARA SALIR Y REDIRIGIR
  const handleLogout = () => {
    logout(); // Llama al logout del contexto (limpia estado y localStorage)
   
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim() !== "") {
      navigate(`/catalogo?search=${encodeURIComponent(search)}`);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg site-navbar px-3">

      {/* LOGO / HOME */}
      <Link className="navbar-brand fw-bold text-white" to="/">
        POLOLO
      </Link>

      {/* BOTÓN MENU MÓVIL */}
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">

        {/* LINKS PRINCIPALES */}
        <ul className="navbar-nav me-auto">

          <li className="nav-item">
            <Link className="nav-link" to="/catalogo">
              Catálogo
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/catalogo/marroquineria">
              Marroquinería
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/catalogo/remeras">
              Remeras
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/catalogo/pantalones">
              Pantalones
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/catalogo/buzos">
              Buzos
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/nosotros">
              Nosotros
            </Link>
          </li>

          <li className="nav-item">
            <Link className="nav-link" to="/contacto">
              Contacto
            </Link>
          </li>

        </ul>

        {/* 🔍 BUSCADOR */}
        <form className="d-flex me-3 search-form" onSubmit={handleSearch}>
          <input
            className="form-control search-input bg-transparent text-white border-light"
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

          {/* CARRITO + ADMIN */}
      <div className="d-flex align-items-center gap-3">

        <Link to="/carrito" className="btn btn-outline-light position-relative">
          🛒 Carrito
          {totalItems > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {totalItems}
            </span>
          )}
        </Link>

        {!user && (
          <Link to="/admin/login" className="btn btn-outline-light">
            Admin
          </Link>
        )}

        {user && (
          <>
            <Link to="/admin/productos" className="btn btn-outline-light">
              Panel
            </Link>

            <button
              className="btn btn-outline-light"
              onClick={handleLogout}
            >
              Salir
            </button>
          </>
        )}
      </div>
      </div>
    </nav>
  );
}

export default Navbar;
