// src/pages/admin/AdminEditarProducto.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getProductById, updateProduct } from "../../services/productsService";
import { apiClient } from "../../services/apiClient";

function AdminEditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    image: "",      // URL actual (si viene de la BD)
    active: true,
    imageFile: null // archivo nuevo (opcional)
  });

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Estados para talles
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);

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
          active: data.active ?? true,
          imageFile: null,
        });

        // Cargar talles actuales del producto
        if (data.sizes && data.sizes.items) {
          // Convertir formato de respuesta a formato del formulario
          const sizesData = data.sizes.items.map((item) => ({
            size_id: item.id || item.size_id,
            stock: item.stock || 0
          }));
          setSelectedSizes(sizesData);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el producto");
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    })();
  }, [id]);

  // Cargar talles disponibles cuando cambia la categoría
  useEffect(() => {
    const loadSizes = async () => {
      const category = form.category;
      
      if (category === 'marroquineria') {
        setAvailableSizes([]);
        if (!initialLoad) {
          setSelectedSizes([]);
        }
        return;
      }

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
        } catch (err) {
          console.error('Error cargando talles:', err);
          setAvailableSizes([]);
        }
      }
    };

    if (form.category) {
      loadSizes();
    }
  }, [form.category, initialLoad]);

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
        return prev.map((s) =>
          s.size_id === sizeId ? { ...s, stock: parseInt(stock) || 0 } : s
        );
      } else {
        return [...prev, { size_id: sizeId, stock: parseInt(stock) || 0 }];
      }
    });
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
        sizes: selectedSizes.filter((s) => s.stock > 0),
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

        {/* TALLES (solo si no es marroquinería) */}
        {form.category !== 'marroquineria' && availableSizes.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Talles y Stock</label>
            <div className="border rounded p-3">
              {availableSizes.map((size) => {
                const currentStock = selectedSizes.find((s) => s.size_id === size.id)?.stock || 0;
                
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
                        onChange={(e) => handleSizeStockChange(size.id, e.target.value)}
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
