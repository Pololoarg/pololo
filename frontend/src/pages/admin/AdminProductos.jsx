// src/pages/admin/AdminProductos.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllProductsAdmin, deleteProduct } from "../../services/productsService";
import { getImageUrl } from "../../utils/imageUrl";
import { useToast } from "../../context/ToastContext.jsx";


function AdminProductos() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");


  useEffect(() => {
    (async () => {
      try {
        const data = await getAllProductsAdmin(); // trae todos
        setProducts(data);
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


  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Administrar productos</h2>
        <div className="d-flex gap-2">
          <div className="btn-group" role="group">
            <Link to="/admin/home" className="btn btn-outline-primary">
              Home
            </Link>
            <Link to="/admin/productos" className="btn btn-primary">
              Productos
            </Link>
          </div>
          <Link to="/admin/productos/nuevo" className="btn btn-success">
            + Nuevo producto
          </Link>
        </div>
      </div>

              <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">

              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <select
                  className="form-select"
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

              <div className="col-md-4">
                <select
                  className="form-select"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="active">Solo activos</option>
                  <option value="inactive">Solo inactivos</option>
                </select>
              </div>

            </div>
          </div>
        </div>


      {products.length === 0 ? (
        <p>No hay productos cargados.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Activo</th>
                <th style={{ width: "180px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  {/* IMAGEN */}
                  <td>
                    {p.image ? (
                      <img
                        src={getImageUrl(p.image)}
                        alt={p.name}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid #ddd",
                        }}
                      />
                    ) : (
                      <span className="text-muted">Sin imagen</span>
                    )}
                  </td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>${p.price}</td>
                  <td>{p.stock}</td>
                  <td>{p.active ? "Sí" : "No"}</td>
                  <td>
                    <div className="d-flex gap-2">
                      {/* EDITAR: lo hacemos en el siguiente paso */}
                      <Link
                        to={`/admin/productos/${p.id}/editar`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Editar
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(p.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminProductos;
