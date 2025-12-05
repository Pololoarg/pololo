// src/pages/admin/AdminNuevoProducto.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createProduct } from "../../services/productsService";

function AdminNuevoProducto() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "marroquineria",
    description: "",
    price: "",
    stock: 0,
    active: true,
    imageFile: null, // archivo real
  });

  const [error, setError] = useState(null);

  // 👉 cambios en inputs de texto / número / checkbox
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

  // 👉 cambios en input file (imagen)
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
      await createProduct({
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock || 0, 10),
      });

      navigate("/admin/productos");
    } catch (err) {
      console.error(err);
      setError("Hubo un error al crear el producto");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Nuevo producto</h2>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

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

        {/* IMAGEN */}
        <div className="mb-3">
          <label className="form-label">Imagen del producto</label>
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
          Guardar
        </button>
        <Link to="/admin/productos" className="btn btn-secondary">
          Cancelar
        </Link>
      </form>
    </div>
  );
}

export default AdminNuevoProducto;
