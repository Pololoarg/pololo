import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import "./FiltersSidebar.css";

export default function FiltersSidebar({ filters, subcategories = [] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [availableSizes, setAvailableSizes] = useState([]);

  // Estados temporales para filtros (no aplicados hasta hacer clic en "Filtrar")
  const [tempCategory, setTempCategory] = useState(searchParams.get("category") || "");
  const [tempSize, setTempSize] = useState(searchParams.get("size") || "");
  const [tempPrice, setTempPrice] = useState(searchParams.get("price") || "");
  const [tempSubcategories, setTempSubcategories] = useState(
    searchParams.get("subcategory") ? searchParams.get("subcategory").split(",") : []
  );

  const activeCategory = searchParams.get("category");
  const activeSize = searchParams.get("size");
  const activePrice = searchParams.get("price");
  const activeSubcategory = searchParams.get("subcategory");

  // Cargar talles según categoría
  useEffect(() => {
    const loadSizes = async () => {
      const category = tempCategory || activeCategory;
      
      if (!category || category === "marroquineria") {
        setAvailableSizes([]);
        return;
      }

      let sizeType = "";
      if (category === "remeras" || category === "buzos") {
        sizeType = "ropa";
      } else if (category === "pantalones") {
        sizeType = "pantalon";
      }

      if (!sizeType) return;

      try {
        const response = await apiClient.get(`/products/sizes/type/${sizeType}`);
        let sizes = response.data;
        
        // Filtrar talles de pantalones
        if (sizeType === 'pantalon') {
          const allowedPantalonesSizes = ['38', '40', '42', '44', '46', '48'];
          sizes = sizes.filter(s => allowedPantalonesSizes.includes(s.size));
        }
        
        setAvailableSizes(sizes);
      } catch (err) {
        console.error("Error cargando talles", err);
        setAvailableSizes([]);
      }
    };

    loadSizes();
  }, [tempCategory, activeCategory]);

  const toggleSubcategory = (sub) => {
    if (tempSubcategories.includes(sub)) {
      setTempSubcategories(tempSubcategories.filter(s => s !== sub));
    } else {
      setTempSubcategories([...tempSubcategories, sub]);
    }
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams();

    if (tempCategory) newParams.set("category", tempCategory);
    if (tempSize) newParams.set("size", tempSize);
    if (tempPrice) newParams.set("price", tempPrice);
    if (tempSubcategories.length > 0) {
      newParams.set("subcategory", tempSubcategories.join(","));
    }

    setSearchParams(newParams);
    setIsOpen(false); // Cerrar en mobile después de aplicar
  };

  const clearFilters = () => {
    setTempCategory("");
    setTempSize("");
    setTempPrice("");
    setTempSubcategories([]);
    setSearchParams({});
  };

  return (
    <>
      {/* Botón móvil para mostrar filtros */}
      <button
        className="filters-mobile-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="6" x2="20" y2="6"></line>
          <line x1="4" y1="12" x2="20" y2="12"></line>
          <line x1="4" y1="18" x2="20" y2="18"></line>
        </svg>
        Filtros
      </button>

      <div className={`filters-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="filters-header">
        <h5 className="filters-title">FILTROS</h5>
        {(activeCategory || activeSize || activePrice || activeSubcategory) && (
          <button
            className="btn btn-link btn-sm text-muted p-0"
            onClick={clearFilters}
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* SUBCATEGORÍAS (p.ej. Marroquinería) */}
      {filters.includes("subcategory") && subcategories.length > 0 && (
        <div className="filter-section">
          <h6 className="filter-section-title">Subcategoría</h6>
          <div className="filter-options">
            <button
              type="button"
              className={`filter-option ${tempSubcategories.length === 0 ? "active" : ""}`}
              onClick={() => setTempSubcategories([])}
            >
              Todas
            </button>
            {subcategories.map((sub) => (
              <button
                type="button"
                key={sub}
                className={`filter-option ${tempSubcategories.includes(sub) ? "active" : ""}`}
                onClick={() => toggleSubcategory(sub)}
              >
                {sub.charAt(0).toUpperCase() + sub.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORÍAS */}
      {filters.includes("category") && (
        <div className="filter-section">
          <h6 className="filter-section-title">Categoría</h6>
          <div className="filter-options">
            {["remeras", "buzos", "pantalones", "marroquineria"].map((cat) => (
              <button
                type="button"
                key={cat}
                className={`filter-option ${
                  tempCategory === cat ? "active" : ""
                }`}
                onClick={() => setTempCategory(tempCategory === cat ? "" : cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TALLES */}
      {filters.includes("size") && availableSizes.length > 0 && (
        <div className="filter-section">
          <h6 className="filter-section-title">Talle</h6>
          <div className="filter-options size-options">
            {availableSizes.map((sizeObj) => (
              <button
                type="button"
                key={sizeObj.id}
                className={`filter-option size-option ${
                  tempSize === sizeObj.size ? "active" : ""
                }`}
                onClick={() => setTempSize(tempSize === sizeObj.size ? "" : sizeObj.size)}
              >
                {sizeObj.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ORDEN POR PRECIO */}
      {filters.includes("price") && (
        <div className="filter-section">
          <h6 className="filter-section-title">Ordenar por precio</h6>
          <div className="filter-options">
            <button
              type="button"
              className={`filter-option ${
                tempPrice === "asc" ? "active" : ""
              }`}
              onClick={() => setTempPrice(tempPrice === "asc" ? "" : "asc")}
            >
              <span className="filter-icon">↑</span>
              Menor a mayor
            </button>

            <button
              type="button"
              className={`filter-option ${
                tempPrice === "desc" ? "active" : ""
              }`}
              onClick={() => setTempPrice(tempPrice === "desc" ? "" : "desc")}
            >
              <span className="filter-icon">↓</span>
              Mayor a menor
            </button>
          </div>
        </div>
      )}

      {/* BOTÓN FILTRAR */}
      <div className="filter-actions">
        <button
          type="button"
          className="btn-apply-filters"
          onClick={applyFilters}
        >
          Aplicar Filtros
        </button>
      </div>
      </div>

      {/* Overlay para cerrar filtros en mobile */}
      {isOpen && (
        <div
          className="filters-overlay"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
