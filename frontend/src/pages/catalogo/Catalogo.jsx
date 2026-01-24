import { useEffect, useState } from "react";
import { getProducts } from "../../services/productsService";
import { Link, useSearchParams } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUrl";
import { formatPrice } from "../../utils/formatPrice";
import FiltersSidebar from "../../components/filters/FiltersSidebar";
import "./CatalogCards.css";
import "./CatalogLayout.css";

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
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getProducts({ category, size, search });
        setProducts(data);
        setFiltered(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los productos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, size, search]);

  // 🔹 búsqueda + orden por precio
  useEffect(() => {
    let result = [...products];

    if (search) {
      const text = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(text) ||
          (p.description || "").toLowerCase().includes(text)
      );
    }

    if (priceOrder === "asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (priceOrder === "desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    setFiltered(result);
  }, [search, products]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" />
        <p className="mt-3">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="container mt-4">
        <h1 className="mb-3">Catálogo</h1>

        {search && (
          <p className="text-muted">
            Resultados para: <strong>{search}</strong>
          </p>
        )}

        <p>No se encontraron productos.</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-3">Catálogo</h1>

      {search && (
        <p className="text-muted">
          Resultados para: <strong>{search}</strong>
        </p>
      )}

      <div className="row">
        {filtered.map((p) => (
          <div key={p.id} className="col-md-4 mb-4">
            <Link
              to={`/producto/${p.id}`}
              className="text-decoration-none text-dark"
            >
              <div className="card h-100">

                {(() => {
                  const mainImg = p.images?.find((img) => img.is_main)?.image_url ?? p.image;
                  return (
                    mainImg && (
                      <img
                        src={getImageUrl(mainImg)}
                        alt={p.name}
                        className="card-img-top"
                      />
                    )
                  );
                })()}

                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{p.name}</h5>
                  <p className="card-text flex-grow-1">
                    {p.description}
                  </p>
                  <p className="fw-bold mb-1">{formatPrice(p.price)}</p>
                  <small className="text-muted">
                    Categoría: {p.category}
                  </small>
                </div>

              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Catalogo;
