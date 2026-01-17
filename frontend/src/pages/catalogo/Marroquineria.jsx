import { useEffect, useState, useMemo } from "react";
import { getProducts } from "../../services/productsService";
import { Link, useSearchParams } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUrl";
import { formatPrice } from "../../utils/formatPrice";
import FiltersSidebar from "../../components/filters/FiltersSidebar";
import "./CatalogCards.css";
import "./CatalogLayout.css";

function Marroquineria() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [searchParams] = useSearchParams();
  const priceOrder = searchParams.get("price") || "desc"; // 🔹 default desc
  const subcategoryParam = searchParams.get("subcategory") || "";
  
  const activeSubcategories = useMemo(() => {
    return subcategoryParam 
      ? subcategoryParam.split(",").map(s => s.toLowerCase())
      : [];
  }, [subcategoryParam]);

  const subcategories = ["bolso", "mochila", "neceser", "riñonera", "billetera"];

  useEffect(() => {
    setLoading(true);

    getProducts({ category: "marroquineria" })
      .then(data => {
        setProducts(data);
        setFiltered(data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError("No se pudieron cargar los productos de marroquinería");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...products];

    // Filtrar por subcategorías si hay seleccionadas
    if (activeSubcategories.length > 0) {
      result = result.filter(p => activeSubcategories.includes((p.subcategory || '').toLowerCase()));
    }

    // Ordenar por precio
    if (priceOrder === "asc") {
      result.sort((a, b) => a.price - b.price);
    } else {
      result.sort((a, b) => b.price - a.price);
    }

    setFiltered(result);
  }, [priceOrder, products, activeSubcategories]);

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
      <h1 className="mb-4" style={{ fontSize: '2.5rem' }}>MARROQUINERIA</h1>

      <div className="catalog-layout">
        <FiltersSidebar filters={["subcategory", "price"]} subcategories={subcategories} />

        <div>
          {filtered.length === 0 && (
            <div className="no-products">
              <p>No hay productos en esta categoría.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="products-grid">
              {filtered.map((p) => (
                <Link
                  key={p.id}
                  to={`/producto/${p.id}`}
                  className="text-decoration-none"
                >
                  <div className="product-card">
                    {p.image && (
                      <img
                        src={getImageUrl(p.image)}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Marroquineria;
