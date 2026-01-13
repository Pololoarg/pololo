import { useSearchParams } from "react-router-dom";

export default function FiltersBlock({ filters }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get("category");
  const activeSize = searchParams.get("size");
  const activePrice = searchParams.get("price");

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);

    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="filters-block mb-4">

      {/* CATEGORÍAS */}
      {filters.includes("category") && (
        <div className="mb-3">
          <h5>Categoría</h5>

          {["remeras", "buzos", "pantalones", "marroquineria"].map((cat) => (
            <button
              key={cat}
              className={`btn me-2 mb-2 ${
                activeCategory === cat
                  ? "btn-dark"
                  : "btn-outline-dark"
              }`}
              onClick={() => handleFilterChange("category", cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* TALLES */}
      {filters.includes("size") && (
        <div className="mb-3">
          <h5>Talle</h5>

          {["XS", "S", "M", "L", "XL"].map((size) => (
            <button
              key={size}
              className={`btn me-2 mb-2 ${
                activeSize === size
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => handleFilterChange("size", size)}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      {/* ORDEN POR PRECIO */}
      {filters.includes("price") && (
        <div className="mb-3">
          <h5>Precio</h5>

          <button
            className={`btn me-2 mb-2 ${
              activePrice === "asc"
                ? "btn-success"
                : "btn-outline-success"
            }`}
            onClick={() => handleFilterChange("price", "asc")}
          >
            Menor a mayor
          </button>

          <button
            className={`btn me-2 mb-2 ${
              activePrice === "desc"
                ? "btn-success"
                : "btn-outline-success"
            }`}
            onClick={() => handleFilterChange("price", "desc")}
          >
            Mayor a menor
          </button>
        </div>
      )}

      {/* LIMPIAR */}
      {(activeCategory || activeSize || activePrice) && (
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={clearFilters}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
