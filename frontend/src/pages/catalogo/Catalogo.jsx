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
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);

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
        setVisibleCount(10); // reset paginación al cambiar filtros
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
    setVisibleCount(10); // reset paginación cuando cambian filtros locales
  }, [search, products, priceOrder]);

  const showMore = () => setVisibleCount((prev) => prev + 10);
  const visibleProducts = filtered.slice(0, visibleCount);

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

  return (
    <div className="container mt-4">
      <h1 className="mb-4" style={{ fontSize: "2.5rem" }}>CATÁLOGO</h1>

      {search && (
        <p className="text-muted">
          Resultados para: <strong>{search}</strong>
        </p>
      )}

      <div className="catalog-layout">
        <FiltersSidebar filters={["category", "size", "price"]} />

        <div>
          {filtered.length === 0 ? (
            <div className="no-products">
              <p>No hay productos con esos filtros.</p>
            </div>
          ) : (
            <div className="products-grid">
              {visibleProducts.map((p) => {
                const mainImage =
                  p.images?.find((img) => img.is_main)?.image_url ||
                  p.image ||
                  p.images?.[0]?.url ||
                  p.images?.[0]?.image_url;

                const secondImage = p.images?.[1]?.url || p.images?.[1]?.image_url;
                const isHovered = hoveredProduct === p.id;
                const displayImage = isHovered && secondImage ? secondImage : mainImage;

                return (
                  <Link
                    key={p.id}
                    to={`/producto/${p.id}`}
                    className="text-decoration-none"
                    onMouseEnter={() => setHoveredProduct(p.id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <div className="product-card">
                      {displayImage && (
                        <img
                          src={getImageUrl(displayImage)}
                          alt={p.name}
                          className="catalog-product-image"
                        />
                      )}

                      <div className="product-body">
                        <h5 className="product-name">{p.name}</h5>
                        <p className="product-description">{p.description}</p>

                        <div className="product-footer">
                          <span className="product-price">${formatPrice(p.price)}</span>
                          <span className="product-category">{p.category}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {visibleProducts.length < filtered.length && (
                <div className="load-more-wrapper">
                  <button className="load-more-btn" onClick={showMore}>
                    Cargar más
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Catalogo;
