// src/pages/admin/AdminProductos.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllProductsAdmin, deleteProduct } from "../../services/productsService";
import { getImageUrl } from "../../utils/imageUrl";
import { useToast } from "../../context/ToastContext.jsx";
import "./AdminProductos.css";


function AdminProductos() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [displayedCount, setDisplayedCount] = useState(10); // Mostrar 10 productos inicialmente


  useEffect(() => {
    (async () => {
      try {
        const data = await getAllProductsAdmin(); // trae todos
        setProducts(data);
        setDisplayedCount(10); // Reset cuando cargan los productos
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los productos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    const confirmar = window.confirm("¿Seguro que querés eliminar este producto?");
    if (!confirmar) return;

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Producto eliminado", "success");
    } catch (err) {
      console.error(err);
      showToast("Hubo un error al eliminar el producto", "error");
    }
  };

  if (loading) {
    return (
      <div className="admin-empty">
        <h3>Cargando productos...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-empty">
        <h3>{error}</h3>
      </div>
    );
  }

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory =
      !categoryFilter || p.category === categoryFilter;

    const matchActive =
      activeFilter === "all" ||
      (activeFilter === "active" && p.active) ||
      (activeFilter === "inactive" && !p.active);

    return matchSearch && matchCategory && matchActive;
  });

  const displayedProducts = filteredProducts.slice(0, displayedCount);
  const hasMoreProducts = displayedCount < filteredProducts.length;

  const handleLoadMore = () => {
    setDisplayedCount(prev => prev + 10);
  };


  return (
    <div className="admin-productos-container">
      <div className="admin-header">
        <h1 className="admin-titulo">ADMINISTRAR PRODUCTOS</h1>
        <div className="admin-header-actions">
          <div className="admin-btn-group">
            <Link to="/admin/home" className="admin-btn-nav">
              Home
            </Link>
            <Link to="/admin/productos" className="admin-btn-nav active">
              Productos
            </Link>
          </div>
          <Link to="/admin/productos/nuevo" className="admin-btn-nuevo">
            + Nuevo producto
          </Link>
        </div>
      </div>

      <div className="admin-filters-card">
        <div className="admin-filters-header">
          <h3 className="admin-filters-title">Filtros de Búsqueda</h3>
          <button 
            className="admin-btn-clear-filters"
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setActiveFilter('all');
            }}
          >
            Limpiar filtros
          </button>
        </div>
        <div className="admin-filters-row">
          <div className="admin-filter-group">
            <label className="admin-filter-label">Buscar por nombre</label>
            <div className="admin-input-wrapper">
              <input
                type="text"
                className="admin-form-input"
                placeholder="Escribe el nombre del producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  className="admin-input-clear"
                  onClick={() => setSearch('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Categoría</label>
            <div className="admin-select-wrapper">
              <select
                className="admin-form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                <option value="remeras">Remeras</option>
                <option value="pantalones">Pantalones</option>
                <option value="buzos">Buzos</option>
                <option value="marroquineria">Marroquinería</option>
              </select>
            </div>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label">Estado</label>
            <div className="admin-select-wrapper">
              <select
                className="admin-form-select"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Solo activos</option>
                <option value="inactive">Solo inactivos</option>
              </select>
            </div>
          </div>
        </div>
        <div className="admin-filters-summary">
          Mostrando <strong>{displayedProducts.length}</strong> de <strong>{filteredProducts.length}</strong> productos
          {filteredProducts.length !== products.length && (
            <span className="filters-active-badge">Filtros activos</span>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty">
          <h3>No hay productos cargados</h3>
          <p>Comienza creando uno nuevo</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th style={{ width: "160px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image ? (
                      <img
                        src={getImageUrl(p.image)}
                        alt={p.name}
                        className="producto-imagen"
                      />
                    ) : (
                      <span className="text-muted">Sin imagen</span>
                    )}
                  </td>
                  <td>
                    <div className="producto-nombre">{p.name}</div>
                  </td>
                  <td>
                    <span className="producto-categoria">{p.category}</span>
                  </td>
                  <td>
                    <span className="producto-precio">${p.price}</span>
                  </td>
                  <td>
                    <span className={`producto-estado ${p.active ? 'activo' : 'inactivo'}`}>
                      {p.active ? '● Activo' : '● Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="producto-acciones">
                      <Link
                        to={`/admin/productos/${p.id}/editar`}
                        className="producto-btn producto-btn-editar"
                      >
                        <span className="btn-icon">✎</span> Editar
                      </Link>
                      <button
                        className="producto-btn producto-btn-eliminar"
                        onClick={() => handleDelete(p.id)}
                      >
                        <span className="btn-icon">✕</span> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMoreProducts && (
            <div className="admin-load-more-container">
              <button
                className="admin-load-more-btn"
                onClick={handleLoadMore}
              >
                Cargar más productos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminProductos;
