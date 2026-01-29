// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProducts } from "../../services/productsService";
import { getImageUrl } from "../../utils/imageUrl";
import { formatPrice } from "../../utils/formatPrice";


function Navbar() {
  const { totalItems } = useCart();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const searchRef = useRef(null);

  // Logo configuration: allow overriding via Vite env vars for flexible variants
  const logoUrl = import.meta.env.VITE_LOGO_URL || "/logo2.png";
  const logoMobileUrl = import.meta.env.VITE_LOGO_MOBILE_URL || "/logo-mobile.png";

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar productos mientras escribes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (search.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const products = await getProducts({ search: search.trim() });
        setSuggestions(products.slice(0, 5)); // Mostrar solo 5 sugerencias
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce de 300ms
    return () => clearTimeout(timeoutId);
  }, [search]);

  // 🚀 NUEVA FUNCIÓN PARA SALIR Y REDIRIGIR
  const handleLogout = () => {
    logout(); // Llama al logout del contexto (limpia estado y localStorage)
   
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim() !== "") {
      setShowSuggestions(false);
      navigate(`/catalogo?search=${encodeURIComponent(search)}`);
    }
  };

  const handleSuggestionClick = (productId) => {
    setSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/producto/${productId}`);
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

      {/* LINKS PRINCIPALES (DESKTOP) */}
      <ul className="navbar-nav me-auto navbar-links-desktop">

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

      </ul>

      {/* COLLAPSE PARA MOBILE */}
      <div className="collapse navbar-collapse" id="navbarNav">

        {/* LINKS PRINCIPALES (MOBILE) */}
        <ul className="navbar-nav me-auto navbar-links-mobile">

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

        </ul>

        {/* LOGIN/ADMIN SOLO MOBILE (DENTRO DEL COLLAPSE) */}
        <div className="d-flex align-items-start gap-2 navbar-auth-mobile">
          {!user && (
            <Link to="/admin/login" className="btn btn-outline-light w-100">
              Login
            </Link>
          )}

          {user && (
            <div className="d-flex flex-column w-100 gap-2">
              <Link to="/admin/productos" className="btn btn-outline-light w-100">
                Panel
              </Link>

              <button
                className="btn btn-outline-light w-100"
                onClick={handleLogout}
              >
                Salir
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 🔍 BUSCADOR */}
      <form className="d-flex search-form" onSubmit={handleSearch}>
        <div className="search-wrapper" ref={searchRef}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            className="form-control search-input bg-transparent text-white border-light"
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search.trim().length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            style={{ '--placeholder-color': '#ffffff' }}
            autoComplete="off"
          />
          
          {/* Dropdown de sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((product) => (
                <div
                  key={product.id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(product.id)}
                >
                  {product.image && (
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="suggestion-image"
                    />
                  )}
                  <div className="suggestion-info">
                    <div className="suggestion-name">{product.name}</div>
                    <div className="suggestion-price">${formatPrice(product.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* CARRITO (VISIBLE) */}
      <Link to="/carrito" className="btn btn-outline-light position-relative navbar-cart">
        🛒 Carrito
        {totalItems > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {totalItems}
          </span>
        )}
      </Link>

      {/* LOGIN + ADMIN (SOLO DESKTOP) */}
      <div className="d-flex align-items-center gap-3 navbar-auth-desktop">

        {!user && (
          <Link to="/admin/login" className="btn btn-outline-light">
            Login
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

    </nav>
  );
}

export default Navbar;
