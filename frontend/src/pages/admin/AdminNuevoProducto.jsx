// src/pages/admin/AdminNuevoProducto.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createProduct } from "../../services/productsService";
import { apiClient } from "../../services/apiClient";
import "./AdminNuevoProducto.css";

function AdminNuevoProducto() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "marroquineria",
    subcategory: "",
    description: "",
    price: "",
    active: true,
    imageFiles: [], // archivos reales (multiple)
    mainImageIndex: 0,
  });

  const [error, setError] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Estados para talles
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [marroquineriaSubcategories, setMarroquineriaSubcategories] = useState([]);
  const [marroquineriaStock, setMarroquineriaStock] = useState(0);

  // Cargar talles cuando cambia la categoría
  useEffect(() => {
    const loadSizes = async () => {
      const category = form.category;
      
      // Marroquinería no tiene talles pero tiene subcategorías
      if (category === 'marroquineria') {
        setAvailableSizes([]);
        setSelectedSizes([]);
        setMarroquineriaSubcategories([
          { id: 1, nombre: 'bolso' },
          { id: 2, nombre: 'mochila' },
          { id: 3, nombre: 'neceser' },
          { id: 4, nombre: 'riñonera' },
          { id: 5, nombre: 'billetera' }
        ]);
        return;
      }

      // Determinar el tipo de talle según categoría
      let sizeType = '';
      if (category === 'remeras' || category === 'buzos') {
        sizeType = 'ropa';
      } else if (category === 'pantalones') {
        sizeType = 'pantalon';
      }

      if (sizeType) {
        try {
          const response = await apiClient.get(`/products/sizes/type/${sizeType}`);
          setAvailableSizes(response.data);
          setSelectedSizes([]);
        } catch (err) {
          console.error('Error cargando talles:', err);
          setAvailableSizes([]);
        }
      }
    };

    loadSizes();
  }, [form.category]);

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
          : value,
    }));
  };

  // 👉 manejo de talles
  const handleSizeStockChange = (sizeId, stock) => {
    setSelectedSizes((prev) => {
      const existing = prev.find((s) => s.size_id === sizeId);
      
      if (existing) {
        // Actualizar stock
        return prev.map((s) =>
          s.size_id === sizeId ? { ...s, stock: parseInt(stock) || 0 } : s
        );
      } else {
        // Agregar nuevo talle
        return [...prev, { size_id: sizeId, stock: parseInt(stock) || 0 }];
      }
    });
  };

  // 👉 cambios en input file (agregar una imagen a la vez)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const minSize = 10 * 1024; // 10KB
    const maxSize = 2 * 1024 * 1024; // 2MB

    const file = files[0]; // Solo procesar la primera imagen seleccionada

    if (file.size < minSize) {
      setError("La imagen es muy pequeña. Mínimo 10KB");
      e.target.value = ''; // Limpiar el input
      return;
    }
    if (file.size > maxSize) {
      setError("La imagen no puede superar los 2MB");
      e.target.value = ''; // Limpiar el input
      return;
    }
    if (!validTypes.includes(file.type)) {
      setError("Formato no permitido. Solo JPG, PNG o WEBP");
      e.target.value = ''; // Limpiar el input
      return;
    }

    setError(null);
    // Agregar la nueva imagen a las existentes
    setForm((prev) => ({
      ...prev,
      imageFiles: [...prev.imageFiles, file],
    }));
    setImagePreviews((prev) => [...prev, URL.createObjectURL(file)]);
    e.target.value = ''; // Limpiar el input para poder agregar más
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const nextFiles = prev.imageFiles.filter((_, i) => i !== index);
      let nextMain = prev.mainImageIndex;
      if (nextMain === index) {
        nextMain = 0;
      } else if (nextMain > index) {
        nextMain = nextMain - 1;
      }

      return {
        ...prev,
        imageFiles: nextFiles,
        mainImageIndex: nextFiles.length === 0 ? 0 : Math.min(nextMain, nextFiles.length - 1),
      };
    });

    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validar que marroquinería tenga subcategoría
    if (form.category === 'marroquineria' && !form.subcategory) {
      setError("Debes seleccionar una subcategoría para marroquinería");
      return;
    }

    // Validar stock de marroquinería
    if (form.category === 'marroquineria' && marroquineriaStock <= 0) {
      setError("El stock de marroquinería debe ser mayor a 0");
      return;
    }

    try {
      // Para marroquinería, crear array de sizes con el talle "Único"
      let sizes = selectedSizes.filter((s) => s.stock > 0);
      
      if (form.category === 'marroquineria') {
        // El backend espera un array de { size_id, stock }
        // Para marroquinería usamos size_id: "marroquineria_unico" como placeholder
        // Luego en el backend buscaremos el size_id real del talle "Único"
        sizes = [{ size_type: 'marroquineria', size_value: 'Único', stock: marroquineriaStock }];
      }

      await createProduct({
        ...form,
        price: parseFloat(form.price),
        sizes: sizes,
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

        {/* SUBCATEGORÍA PARA MARROQUINERÍA */}
        {form.category === 'marroquineria' && (
          <div className="mb-3">
            <label className="form-label">Subcategoría</label>
            <select
              className="form-select"
              name="subcategory"
              value={form.subcategory}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona una subcategoría</option>
              {marroquineriaSubcategories.map((sub) => (
                <option key={sub.id} value={sub.nombre}>
                  {sub.nombre.charAt(0).toUpperCase() + sub.nombre.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

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

        {/* IMÁGENES */}
        <div className="mb-3">
          <label className="form-label">Imágenes del producto</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleFileChange}
          />
          <div className="form-text">
            • Selecciona una imagen a la vez y haz clic en "Seleccionar archivo" para agregar más<br />
            • Mínimo: 10 KB | Máximo: 2 MB (por imagen)<br />
            • Formatos: JPG, PNG o WEBP<br />
            • Puedes agregar varias y elegir cuál es la principal
          </div>
        </div>

        {imagePreviews.length > 0 && (
          <div className="mb-3">
            <p className="mb-2">Selecciona la imagen principal</p>
            <div className="d-flex flex-wrap gap-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="border rounded p-2" style={{ width: "160px" }}>
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="img-fluid rounded"
                    style={{ width: "100%", height: "120px", objectFit: "cover" }}
                  />
                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="mainImage"
                      checked={form.mainImageIndex === idx}
                      onChange={() => setForm((prev) => ({ ...prev, mainImageIndex: idx }))}
                    />
                    <label className="form-check-label">Principal</label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm w-100 mt-2"
                    onClick={() => removeImage(idx)}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STOCK PARA MARROQUINERÍA */}
        {form.category === 'marroquineria' && (
          <div className="mb-3">
            <label className="form-label">Stock</label>
            <input
              type="number"
              className="form-control"
              value={marroquineriaStock}
              onChange={(e) => setMarroquineriaStock(parseInt(e.target.value) || 0)}
              required
              min="0"
              placeholder="Ingresa la cantidad en stock"
            />
          </div>
        )}

        {/* TALLES (solo si no es marroquinería) */}
{form.category !== 'marroquineria' && availableSizes.length > 0 && (
  <div className="mb-3">
    <label className="form-label">Talles y Stock</label>
    <div className="border rounded p-3">
      {[...availableSizes]
        .sort((a, b) => {
          // 🟦 Pantalones → orden numérico
          if (form.category === 'pantalones') {
            return Number(a.size) - Number(b.size);
          }

          // 🟩 Remeras / Buzos → orden correcto de ropa
          const ORDER_ROPA = ["XS", "S", "M", "L", "XL"];
          return ORDER_ROPA.indexOf(a.size) - ORDER_ROPA.indexOf(b.size);
        })
        .map((size) => {
          const currentStock =
            selectedSizes.find((s) => s.size_id === size.id)?.stock || 0;

          return (
            <div key={size.id} className="row mb-2 align-items-center">
              <div className="col-3">
                <strong>{size.size}</strong>
              </div>
              <div className="col-5">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Stock"
                  min="0"
                  value={currentStock}
                  onChange={(e) =>
                    handleSizeStockChange(size.id, e.target.value)
                  }
                />
              </div>
            </div>
          );
        })}
    </div>
  </div>
)}


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
