import { useEffect, useState } from "react";
import { getProducts } from "../../services/productsService";
import { Link, useSearchParams } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUrl";
import FiltersBlock from "../../components/filters/FiltersBlock";

function Catalogo() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const size = searchParams.get("size") || "";
  const priceOrder = searchParams.get("price") || "";

  useEffect(() => {
    setLoading(true);

    getProducts({
      category,
      size,
      search
    })
      .then(data => {
        setProducts(data);
        setFiltered(data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError("No se pudieron cargar los productos");
      })
      .finally(() => setLoading(false));
  }, [category, size, search]);

  // 🔹 búsqueda + orden por precio
  useEffect(() => {
    let result = [...products];

    if (search) {
      const text = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(text) ||
          p.description.toLowerCase().includes(text)
      );
    }

    if (priceOrder === "asc") {
      result.sort((a, b) => a.price - b.price);
    }

    if (priceOrder === "desc") {
      result.sort((a, b) => b.price - a.price);
    }

    setFiltered(result);
  }, [search, priceOrder, products]);

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-3">Catálogo</h1>

      {/* ✅ FILTROS SIEMPRE VISIBLES */}
      <FiltersBlock filters={["category", "size", "price"]} />

      {search && (
        <p className="text-muted">
          Resultados para: <strong>{search}</strong>
        </p>
      )}

      {/* ✅ MENSAJE SIN CORTAR EL RENDER */}
      {filtered.length === 0 ? (
        <p>No se encontraron productos.</p>
      ) : (
        <div className="row">
          {filtered.map((p) => (
            <div key={p.id} className="col-md-4 mb-4">
              <Link
                to={`/producto/${p.id}`}
                className="text-decoration-none text-dark"
              >
                <div className="card h-100">
                  {p.image && (
                    <img
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      className="card-img-top"
                    />
                  )}

                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-text flex-grow-1">
                      {p.description}
                    </p>
                    <p className="fw-bold mb-1">${p.price}</p>
                    <small className="text-muted">
                      Categoría: {p.category}
                    </small>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Catalogo;
