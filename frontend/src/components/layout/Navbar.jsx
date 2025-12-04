// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";

function Navbar() {
  const { totalItems } = useCart();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-3">

      {/* LOGO / HOME */}
      <Link className="navbar-brand fw-bold" to="/">
        Mi Tienda
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

        {/* CARRITO + ADMIN */}
        <div className="d-flex align-items-center gap-3">

          {/* BOTÓN CARRITO */}
          <Link to="/carrito" className="btn btn-outline-primary position-relative">
            🛒 Carrito
            {totalItems > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              >
                {totalItems}
              </span>
            )}
          </Link>

          {/* ADMIN */}
          <Link to="/admin/login" className="nav-link text-secondary">
            Admin
          </Link>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
