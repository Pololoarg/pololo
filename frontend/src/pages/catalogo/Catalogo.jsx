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
  const [displayedCount, setDisplayedCount] = useState(12); // Mostrar 12 productos inicialmente
  const [hoveredProduct, setHoveredProduct] = useState(null);

  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const size = searchParams.get("size") || "";
  const priceOrder = searchParams.get("price") || "";

  useEffect(() => {
    setLoading(true);
    setDisplayedCount(12); // Reset cuando cambian los filtros

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
    setDisplayedCount(12); // Reset cuando cambia el orden o búsqueda
  }, [search, priceOrder, products]);

  const displayedProducts = filtered.slice(0, displayedCount);
  const hasMoreProducts = displayedCount < filtered.length;

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 12);
  };

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
      <h1 className="mb-4" style={{ fontSize: '2.5rem' }}>CATALOGO</h1>

      <div className="catalog-layout">
        <FiltersSidebar filters={["category", "size", "price"]} />

        <div>
          {filtered.length === 0 ? (
            <div className="no-products">
              <p>No se encontraron productos.</p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {displayedProducts.map((p) => {
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

              {hasMoreProducts && (
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button
                    onClick={handleLoadMore}
                    className="btn btn-primary"
                    style={{
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Cargar más productos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Catalogo;
