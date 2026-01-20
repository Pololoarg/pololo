import { useEffect, useState } from "react";
import { getProducts } from "../../services/productsService";
import { Link, useSearchParams } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUrl";
import { formatPrice } from "../../utils/formatPrice";
import FiltersSidebar from "../../components/filters/FiltersSidebar";
import "./CatalogCards.css";
import "./CatalogLayout.css";

function Pantalones() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const [searchParams] = useSearchParams();

  const size = searchParams.get("size") || "";
  const priceOrder = searchParams.get("price") || "";

  useEffect(() => {
    setLoading(true);

    getProducts({ category: "pantalones", size })
      .then(data => {
        setProducts(data);
        setFiltered(data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError("No se pudieron cargar los pantalones");
      })
      .finally(() => setLoading(false));
  }, [size]);

  useEffect(() => {
    let result = [...products];

    if (priceOrder === "asc") {
      result.sort((a, b) => a.price - b.price);
    }

    if (priceOrder === "desc") {
      result.sort((a, b) => b.price - a.price);
    }

    setFiltered(result);
  }, [priceOrder, products]);

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
      <h1 className="mb-4" style={{ fontSize: '2.5rem' }}>PANTALONES</h1>

      <div className="catalog-layout">
        <FiltersSidebar filters={["size", "price"]} />

        <div>
          {filtered.length === 0 ? (
            <div className="no-products">
              <p>No hay pantalones con esos filtros.</p>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map((p) => {
                const secondImage = p.images && p.images.length > 1 ? p.images[1].url : null;
                const isHovered = hoveredProduct === p.id;
                const displayImage = isHovered && secondImage ? secondImage : p.image;
                
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Pantalones;
