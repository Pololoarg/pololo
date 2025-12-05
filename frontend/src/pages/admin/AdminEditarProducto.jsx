// src/pages/admin/AdminEditarProducto.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getProductById, updateProduct } from "../../services/productsService";

function AdminEditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    image: "",      // URL actual (si viene de la BD)
    stock: 0,
    active: true,
    imageFile: null // archivo nuevo (opcional)
  });

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProductById(id);
        setForm({
          name: data.name || "",
          category: data.category || "marroquineria",
          description: data.description || "",
          price: data.price ?? "",
          image: data.image || "",
          stock: data.stock ?? 0,
          active: data.active ?? true,
          imageFile: null,
        });
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "price"
          ? value
          : name === "stock"
          ? value
          : value,
    }));
  };

  // 👉 archivo de imagen nuevo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({
      ...prev,
      imageFile: file || null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await updateProduct(id, {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock || 0, 10),
      });

      navigate("/admin/productos");
    } catch (err) {
      console.error(err);
      setError("Hubo un error al actualizar el producto");
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (error && !form.name) {
    // error al cargar el producto
    return (
      <div className="container mt-4">
        <p>{error}</p>
        <Link to="/admin/productos" className="btn btn-secondary mt-3">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2>Editar producto #{id}</h2>

      {error && form.name && (
        <div className="alert alert-danger mt-3">{error}</div>
      )}

      <form className="mt-3" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Categoría</label>
          <select
            className="form-select"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="marroquineria">Marroquinería</option>
            <option value="remeras">Remeras</option>
            <option value="pantalones">Pantalones</option>
            <option value="buzos">Buzos</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            name="description"
            rows="3"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Precio</label>
          <input
            type="number"
            className="form-control"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        {/* IMAGEN ACTUAL + CAMBIAR IMAGEN */}
        <div className="mb-3">
          <label className="form-label">Imagen actual</label>
          {form.image ? (
            <div className="mb-2">
              <img
                src={form.image}
                alt={form.name}
                style={{ maxWidth: "150px", borderRadius: "4px" }}
              />
            </div>
          ) : (
            <p className="text-muted">Este producto no tiene imagen.</p>
          )}

          <label className="form-label">Cambiar imagen</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Stock</label>
          <input
            type="number"
            className="form-control"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="activoCheck"
            name="active"
            checked={form.active}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="activoCheck">
            Producto activo
          </label>
        </div>

        <button type="submit" className="btn btn-primary me-2">
          Guardar cambios
        </button>
        <Link to="/admin/productos" className="btn btn-secondary">
          Cancelar
        </Link>
      </form>
    </div>
  );
}

export default AdminEditarProducto;
