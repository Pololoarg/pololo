// src/pages/admin/AdminEditarProducto.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getProductById, updateProduct, deleteProductImage } from "../../services/productsService";
import { apiClient } from "../../services/apiClient";
import { getImageUrl } from "../../utils/imageUrl";
import { useToast } from "../../context/ToastContext.jsx";
import { compressImageToMaxSize } from "../../utils/compressImage";

function AdminEditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    category: "",
    subcategory: "",
    description: "",
    price: "",
    image: "",      // URL actual (principal)
    active: true,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Estados para talles
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [marroquineriaSubcategories, setMarroquineriaSubcategories] = useState([]);
  const [marroquineriaStock, setMarroquineriaStock] = useState(0);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [mainSelection, setMainSelection] = useState({ type: 'existing', id: null, index: null });
  const ORDER_ROPA = ["XS", "S", "M", "L", "XL"];


  useEffect(() => {
    (async () => {
      try {
        const data = await getProductById(id);
        setForm({
          name: data.name || "",
          category: data.category || "marroquineria",
          subcategory: data.subcategory || "",
          description: data.description || "",
          price: data.price ?? "",
          image: data.image || "",
          active: data.active ?? true,
        });

        const apiImages = Array.isArray(data.images) ? data.images : [];
        setExistingImages(apiImages);

        const mainExisting = apiImages.find((img) => img.is_main) || apiImages[0];
        if (mainExisting) {
          setMainSelection({ type: 'existing', id: mainExisting.id, index: null });
        }

        // Cargar talles actuales del producto
        if (data.sizes && data.sizes.items) {
          // Convertir formato de respuesta a formato del formulario
          const sizesData = data.sizes.items.map((item) => ({
            size_id: item.id || item.size_id,
            stock: item.stock || 0
          }));
          setSelectedSizes(sizesData);

          // Si es marroquinería, extraer el stock del talle "Único"
          if (data.category === 'marroquineria') {
            const unicoSize = sizesData.find(s => s.size_id);
            if (unicoSize) {
              setMarroquineriaStock(unicoSize.stock);
            }
          }
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
        setMarroquineriaSubcategories([
          { id: 1, nombre: 'bolso' },
          { id: 2, nombre: 'mochila' },
          { id: 3, nombre: 'neceser' },
          { id: 4, nombre: 'riñonera' },
          { id: 5, nombre: 'billetera' }
        ]);
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
          let sizes = response.data;
          
          // Filtrar talles de pantalones a solo los permitidos
          if (sizeType === 'pantalon') {
            const allowedPantalonesSizes = ['34', '36', '38', '40', '42', '44', '46', '48'];
            sizes = sizes.filter(s => allowedPantalonesSizes.includes(s.size));
          }
          
          setAvailableSizes(sizes);
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

  // 👉 nuevas imágenes (múltiples)
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const minSize = 10 * 1024;
    const maxSize = 30 * 1024 * 1024;
    const targetSize = 500 * 1024;

    const file = files[0]; // Solo procesar la primera imagen seleccionada

    if (file.size < minSize) {
      setError("La imagen es muy pequeña. Mínimo 10KB");
      e.target.value = ''; // Limpiar el input
      return;
    }
    if (file.size > maxSize) {
      setError("La imagen no puede superar los 30MB");
      e.target.value = ''; // Limpiar el input
      return;
    }
    if (!validTypes.includes(file.type)) {
      setError("Formato no permitido. Solo JPG, PNG o WEBP");
      e.target.value = ''; // Limpiar el input
      return;
    }

    let finalFile = file;

    if (file.size > targetSize) {
      try {
        finalFile = await compressImageToMaxSize(file, {
          maxSizeBytes: targetSize,
          maxWidth: 1600,
          maxHeight: 1600,
          initialQuality: 0.8
        });
      } catch (err) {
        console.error("Error comprimiendo imagen:", err);
        setError("No se pudo comprimir la imagen. Probá con otra foto.");
        e.target.value = '';
        return;
      }
    }

    setError(null);
    // Agregar la nueva imagen a las existentes
    setNewImageFiles((prev) => [...prev, finalFile]);
    setNewImagePreviews((prev) => [...prev, URL.createObjectURL(finalFile)]);
    e.target.value = ''; // Limpiar el input para poder agregar más

    // Si no hay selección principal actual, seleccionar la primera nueva
    if (!mainSelection.id && mainSelection.type !== 'new') {
      setMainSelection({ type: 'new', id: null, index: 0 });
    }
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));

    setMainSelection((prev) => {
      if (prev.type !== 'new') return prev;
      if (prev.index === index) {
        return { type: 'existing', id: prev.id, index: null };
      }
      if (prev.index !== null && prev.index > index) {
        return { ...prev, index: prev.index - 1 };
      }
      return prev;
    });
  };

  const deleteExistingImage = async (imageId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }

    try {
      await deleteProductImage(id, imageId);
      
      // Actualizar el estado local
      const remainingImages = existingImages.filter(img => img.id !== imageId);
      setExistingImages(remainingImages);

      // Si eliminamos la imagen seleccionada como main, ajustar la selección
      if (mainSelection.type === 'existing' && mainSelection.id === imageId) {
        if (remainingImages.length > 0) {
          // Buscar la nueva imagen principal o seleccionar la primera
          const newMain = remainingImages.find(img => img.is_main) || remainingImages[0];
          setMainSelection({ type: 'existing', id: newMain.id, index: null });
        } else if (newImageFiles.length > 0) {
          // Si no quedan imágenes existentes pero hay nuevas, seleccionar la primera nueva
          setMainSelection({ type: 'new', id: null, index: 0 });
        } else {
          setMainSelection({ type: null, id: null, index: null });
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar la imagen', 'error');
    }
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
      // Para marroquinería, usar el stock actualizado
      let sizes = selectedSizes.filter((s) => s.stock > 0);
      
      if (form.category === 'marroquineria') {
        sizes = [{ size_type: 'marroquineria', size_value: 'Único', stock: marroquineriaStock }];
      }

      await updateProduct(id, {
        ...form,
        price: parseFloat(form.price),
        sizes: sizes,
        imageFiles: newImageFiles,
        mainImageId: mainSelection.type === 'existing' ? mainSelection.id : null,
        mainImageIndex: mainSelection.type === 'new' ? mainSelection.index : null,
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

        {/* IMÁGENES ACTUALES */}
        {existingImages.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Imágenes actuales</label>
            <div className="d-flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="border rounded p-2" style={{ width: "160px", position: "relative" }}>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      padding: "2px 6px",
                      fontSize: "12px",
                      borderRadius: "50%",
                      zIndex: 1
                    }}
                    onClick={() => deleteExistingImage(img.id)}
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                  <img
                    src={getImageUrl(img.url)}
                    alt={form.name}
                    className="img-fluid rounded"
                    style={{ width: "100%", height: "120px", objectFit: "cover" }}
                  />
                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="mainImage"
                      checked={mainSelection.type === 'existing' && mainSelection.id === img.id}
                      onChange={() => setMainSelection({ type: 'existing', id: img.id, index: null })}
                    />
                    <label className="form-check-label">Principal</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NUEVAS IMÁGENES */}
        <div className="mb-3">
          <label className="form-label">Agregar nuevas imágenes</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleFileChange}
          />
          <div className="form-text">
            • Selecciona una imagen a la vez y haz clic en "Seleccionar archivo" para agregar más<br />
            • Formatos: JPG, PNG o WEBP | Máx: 30MB cada una<br />
            • Si supera 500KB se comprime automaticamente antes de subir
          </div>
        </div>

        {newImagePreviews.length > 0 && (
          <div className="mb-3">
            <p className="mb-2">Nuevas imágenes (elige la principal si corresponde)</p>
            <div className="d-flex flex-wrap gap-3">
              {newImagePreviews.map((preview, idx) => (
                <div key={idx} className="border rounded p-2" style={{ width: "160px" }}>
                  <img
                    src={preview}
                    alt={`Nueva ${idx + 1}`}
                    className="img-fluid rounded"
                    style={{ width: "100%", height: "120px", objectFit: "cover" }}
                  />
                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="mainImage"
                      checked={mainSelection.type === 'new' && mainSelection.index === idx}
                      onChange={() => setMainSelection({ type: 'new', id: null, index: idx })}
                    />
                    <label className="form-check-label">Principal</label>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm w-100 mt-2"
                    onClick={() => removeNewImage(idx)}
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
