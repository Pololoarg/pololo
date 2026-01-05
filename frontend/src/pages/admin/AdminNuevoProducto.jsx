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
  const [imagePreview, setImagePreview] = useState(null);

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
    
    if (!file) {
      setForm((prev) => ({ ...prev, imageFile: null }));
      setImagePreview(null);
      return;
    }

    // Validar tamaño mínimo: 10KB
    if (file.size < 10 * 1024) {
      setError("La imagen es muy pequeña. Mínimo 10KB");
      return;
    }

    // Validar tamaño máximo: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar los 2MB");
      return;
    }

    // Validar formato
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Formato no permitido. Solo JPG, PNG o WEBP");
      return;
    }

    // Validar dimensiones
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(imageUrl);

      if (img.width < 600 || img.height < 600) {
        setError(`Imagen muy pequeña. Mínimo 600x600px. Tu imagen: ${img.width}x${img.height}px`);
        return;
      }

      if (img.width > 2000 || img.height > 2000) {
        setError(`Imagen muy grande. Máximo 2000x2000px. Tu imagen: ${img.width}x${img.height}px`);
        return;
      }

      // Validaciones pasadas
      setError(null);
      setForm((prev) => ({ ...prev, imageFile: file }));
      setImagePreview(URL.createObjectURL(file));
    };

    img.onerror = () => {
      setError("No se pudo procesar la imagen. Verifica que sea una imagen válida");
      URL.revokeObjectURL(imageUrl);
    };

    img.src = imageUrl;
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
          <div className="form-text">
            <strong>Dimensiones:</strong><br />
            • Mínimo: 600×600 px | Máximo: 2000×2000 px<br />
            • <span className="text-primary">Recomendado: 1200×1200 px</span>
          </div>
        </div>

        {imagePreview && (
          <div className="mb-3">
            <p className="mb-2">Preview:</p>
            <img
              src={imagePreview}
              alt="Preview producto"
              className="img-fluid rounded border mb-2"
              style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover" }}
            />
            <button
              type="button"
              className="btn btn-danger btn-sm ms-2"
              onClick={() => {
                URL.revokeObjectURL(imagePreview);
                setImagePreview(null);
                setForm((prev) => ({ ...prev, imageFile: null }));
              }}
            >
              Quitar imagen
            </button>
          </div>
        )}

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
