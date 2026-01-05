import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getAdminCarousel,
  getAdminHomeProducts,
  createCarouselImage,
  createHomeProduct,
  deleteCarouselImage,
  toggleCarouselImage,
  updateCarouselOrder,
  deleteHomeProduct,
  updateHomeProductOrder
} from "../../services/adminHome.service";

import { searchProductsAdmin } from "../../services/productsService";

const API_URL = "http://localhost:4000";

const AdminHome = () => {
  const [carousel, setCarousel] = useState([]);
  const [homeProducts, setHomeProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedProductItem, setDraggedProductItem] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // --------------------
  // FORMS
  // --------------------
  const [carouselForm, setCarouselForm] = useState({
    image: null,
    titulo: "",
    orden: "",
  });

  const [productForm, setProductForm] = useState({
    product_id: null,
    orden: "",
  });

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // --------------------
  // CLEANUP PREVIEW
  // --------------------
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // --------------------
  // LOAD DATA
  // --------------------
  const loadData = async () => {
    try {
      const carouselData = await getAdminCarousel();
      const productsData = await getAdminHomeProducts();
      setCarousel(carouselData);
      setHomeProducts(productsData);
    } catch (error) {
      console.error("Error cargando admin home:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------
  // HANDLERS
  // --------------------
  const handleDeleteCarouselImage = async (id) => {
  const confirm = window.confirm("¿Eliminar esta imagen del carrusel?");
  if (!confirm) return;

  try {
    // Obtener el orden de la imagen a eliminar
    const deletedItem = carousel.find(item => item.id === id);
    const deletedOrder = deletedItem?.orden || 0;

    // Eliminar la imagen
    await deleteCarouselImage(id);

    // Reorganizar órdenes: todas las imágenes con orden mayor al eliminado
    const itemsToUpdate = carousel
      .filter(item => item.id !== id && item.orden > deletedOrder)
      .map(item => ({
        ...item,
        orden: item.orden - 1
      }));

    // Actualizar órdenes en la BD si hay imágenes que reorganizar
    if (itemsToUpdate.length > 0) {
      await updateCarouselOrder(itemsToUpdate);
    }

    loadData();
  } catch (error) {
    console.error("Error eliminando imagen:", error);
  }
};

const handleToggleCarousel = async (item) => {
  try {
    await toggleCarouselImage(item.id, !item.activo);

    setCarousel((prev) =>
      prev.map((c) =>
        c.id === item.id
          ? { ...c, activo: !c.activo }
          : c
      )
    );
  } catch (error) {
    console.error("Error toggle carrusel:", error);
  }
};

// DRAG & DROP HANDLERS
const handleDragStart = (e, item) => {
  setDraggedItem(item);
  e.dataTransfer.effectAllowed = "move";
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
};

const handleDrop = async (e, targetItem) => {
  e.preventDefault();
  
  if (!draggedItem || draggedItem.id === targetItem.id) {
    setDraggedItem(null);
    return;
  }

  try {
    // Intercambiar órdenes
    const newCarousel = carousel.map((item) => {
      if (item.id === draggedItem.id) {
        return { ...item, orden: targetItem.orden };
      }
      if (item.id === targetItem.id) {
        return { ...item, orden: draggedItem.orden };
      }
      return item;
    });

    // Ordenar por orden
    newCarousel.sort((a, b) => a.orden - b.orden);
    setCarousel(newCarousel);

    // Guardar en BD
    await updateCarouselOrder(newCarousel);
  } catch (error) {
    console.error("Error actualizando orden:", error);
    loadData(); // Recargar si hay error
  } finally {
    setDraggedItem(null);
  }
};

  const handleCarouselSubmit = async (e) => {
    e.preventDefault();

    if (!carouselForm.image) {
      alert("Seleccioná una imagen");
      return;
    }

    // Validar tamaño mínimo: 10KB
    if (carouselForm.image.size < 10 * 1024) {
      alert("La imagen es muy pequeña. Mínimo 10KB");
      return;
    }

    // Validar tamaño máximo: 2MB
    if (carouselForm.image.size > 2 * 1024 * 1024) {
      alert("La imagen no puede superar los 2MB");
      return;
    }

    // Validar formato
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(carouselForm.image.type)) {
      alert("Formato no permitido. Solo JPG, PNG o WEBP");
      return;
    }

    // Validar dimensiones de la imagen
    const img = new Image();
    const imageUrl = URL.createObjectURL(carouselForm.image);
    
    img.onload = async () => {
      URL.revokeObjectURL(imageUrl);

      // Dimensiones mínimas: 
      if (img.width < 1600 || img.height < 500) {
        alert(`Imagen muy pequeña. Mínimo 1600x500px. Tu imagen: ${img.width}x${img.height}px`);
        return;
      }

      // Dimensiones máximas: 
      if (img.width > 3000 || img.height > 1200) {
        alert(`Imagen muy grande. Máximo 3000x1200px. Tu imagen: ${img.width}x${img.height}px`);
        return;
      }

      // Si pasa todas las validaciones, enviar
      try {
        // Calcular orden automáticamente si no se especificó
        let orden = Number(carouselForm.orden);
        if (!carouselForm.orden || orden === 0) {
          // Obtener el máximo orden actual
          const maxOrden = carousel.length > 0 
            ? Math.max(...carousel.map(item => item.orden || 0))
            : 0;
          orden = maxOrden + 1;
        }

        const formData = new FormData();
        formData.append("image", carouselForm.image);
        formData.append("titulo", carouselForm.titulo);
        formData.append("orden", orden);

        await createCarouselImage(formData);

        // limpiar estados
        setCarouselForm({
          image: null,
          titulo: "",
          orden: "",
        });

        // limpiar preview
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }

        // limpiar input file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        loadData();
      } catch (error) {
        console.error("Error creando carrusel:", error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      alert("Error al cargar la imagen");
    };

    img.src = imageUrl;
  };

  const handleDeleteProduct = async (home_product_id) => {
    const confirm = window.confirm("¿Eliminar este producto destacado?");
    if (!confirm) return;

    try {
      const deletedItem = homeProducts.find(item => item.home_product_id === home_product_id);
      const deletedOrder = deletedItem?.orden || 0;

      await deleteHomeProduct(home_product_id);

      const itemsToUpdate = homeProducts
        .filter(item => item.id !== home_product_id && item.orden > deletedOrder)
        .map(item => ({
          ...item,
          orden: item.orden - 1
        }));

      if (itemsToUpdate.length > 0) {
        await updateHomeProductOrder(itemsToUpdate);
      }

      loadData();
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  };

  // Drag & Drop para productos
  const handleProductDragStart = (e, item) => {
    setDraggedProductItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleProductDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleProductDrop = async (e, targetItem) => {
    e.preventDefault();
    
    if (!draggedProductItem || draggedProductItem.id === targetItem.id) {
      setDraggedProductItem(null);
      return;
    }

    try {
      const newProducts = homeProducts.map((item) => {
        if (item.id === draggedProductItem.id) {
          return { ...item, orden: targetItem.orden };
        }
        if (item.id === targetItem.id) {
          return { ...item, orden: draggedProductItem.orden };
        }
        return item;
      });

      newProducts.sort((a, b) => a.orden - b.orden);
      setHomeProducts(newProducts);

      await updateHomeProductOrder(newProducts);
    } catch (error) {
      console.error("Error actualizando orden de productos:", error);
      loadData();
    } finally {
      setDraggedProductItem(null);
    }
  };

  const handleSearch = async (value) => {
    setSearch(value);

    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchProductsAdmin(value);
      setSearchResults(results);
    } catch (error) {
      console.error("Error buscando productos:", error);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (!productForm.product_id) {
      alert("Seleccioná un producto");
      return;
    }

    try {
      // Calcular orden automáticamente si no se especificó
      let orden = Number(productForm.orden);
      if (!productForm.orden || orden === 0) {
        const maxOrden = homeProducts.length > 0 
          ? Math.max(...homeProducts.map(item => item.orden || 0))
          : 0;
        orden = maxOrden + 1;
      }

      await createHomeProduct({
        product_id: productForm.product_id,
        orden: orden,
      });

      setProductForm({ product_id: null, orden: "" });
      setSearch("");
      setSearchResults([]);

      loadData();
    } catch (error) {
      console.error("Error creando producto destacado:", error);
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Admin Home</h1>
        <div className="btn-group" role="group">
          <Link to="/admin/home" className="btn btn-primary">
            Home
          </Link>
          <Link to="/admin/productos" className="btn btn-outline-primary">
            Productos
          </Link>
        </div>
      </div>

      {/* ===================== */}
      {/* CARRUSEL */}
      {/* ===================== */}
      <h3 className="mt-4 mb-3">Carrusel</h3>

      <form onSubmit={handleCarouselSubmit}>
        <div className="mb-3">
          <label className="form-label">Imagen del carrusel</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
              }

              setCarouselForm({
                ...carouselForm,
                image: file,
              });

              setImagePreview(URL.createObjectURL(file));
            }}
          />
          <div className="form-text">
            <strong>Dimensiones:</strong><br />
            • Mínimo: 1600×500 px | Máximo: 3000×1200 px<br />
            • <span className="text-primary">Recomendado: 1920×600 px</span>
          </div>
        </div>

        {imagePreview && (
          <div className="mb-3">
            <p className="mb-2">Preview:</p>
            <img
              src={imagePreview}
              alt="Preview carrusel"
              className="img-fluid rounded border mb-2"
              style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "cover" }}
            />
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                URL.revokeObjectURL(imagePreview);
                setImagePreview(null);
                setCarouselForm({
                  ...carouselForm,
                  image: null,
                });

                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Quitar imagen
            </button>
          </div>
        )}

        <div className="mb-3">
          <input
            type="number"
            className="form-control"
            placeholder="Orden (opcional)"
            min="1"
            value={carouselForm.orden}
            onChange={(e) =>
              setCarouselForm({ ...carouselForm, orden: e.target.value })
            }
          />
        </div>

        <button type="submit" className="btn btn-primary">Agregar imagen</button>
      </form>
      <h4 className="mt-4 mb-3">Imágenes actuales</h4>

      <div className="row g-3 mb-4">
        {carousel.map((item) => (
          <div key={item.id} className="col-12 col-sm-6 col-lg-4">
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item)}
              className="card h-100"
              style={{
                cursor: "move",
                opacity: draggedItem?.id === item.id ? 0.7 : 1,
                backgroundColor: draggedItem?.id === item.id ? "#e7f3ff" : "transparent",
                transition: "all 0.2s ease",
                border: draggedItem?.id === item.id ? "2px solid #007bff" : "1px solid #dee2e6",
              }}
            >
              <img
                src={`${API_URL}${item.imagen_url}`}
                alt={item.titulo}
                className="card-img-top"
                style={{
                  height: "150px",
                  objectFit: "cover",
                }}
              />
              <div className="card-body">
                <h6 className="card-title">{item.titulo || "Sin título"}</h6>
                <p className="card-text text-muted small">Orden: {item.orden}</p>
                <div className="d-grid gap-2">
                  <button
                    onClick={() => handleToggleCarousel(item)}
                    className={`btn btn-sm ${item.activo ? "btn-success" : "btn-secondary"}`}
                  >
                    {item.activo ? "✓ Activo" : "○ Inactivo"}
                  </button>
                  <button
                    onClick={() => handleDeleteCarouselImage(item.id)}
                    className="btn btn-sm btn-danger"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* ===================== */}
      {/* PRODUCTOS DESTACADOS */}
      {/* ===================== */}
      <h4 className="mt-5 mb-3">Productos Destacados</h4>

      <div className="card mb-4">
        <div className="card-body">
          <h6 className="card-title mb-3">Agregar producto destacado</h6>
          
          <div className="mb-3">
            <label className="form-label">Buscar producto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mb-3">
              <label className="form-label">Resultados de búsqueda</label>
              <ul className="list-group">
                {searchResults.map((product) => (
                  <li 
                    key={product.id} 
                    className="list-group-item d-flex justify-content-between align-items-center cursor-pointer"
                    onClick={() =>
                      setProductForm({
                        product_id: product.id,
                        orden: "",
                      })
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <strong>{product.nombre}</strong>
                      <span className="text-muted ms-2 small">${product.precio}</span>
                    </div>
                    <span className="badge bg-primary">Seleccionar</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {productForm.product_id && (
            <div className="alert alert-info mb-3" role="alert">
              {(() => {
                const selectedProduct = searchResults.find(p => p.id === productForm.product_id);
                return (
                  <div>
                    <strong>Producto seleccionado:</strong>
                    {selectedProduct && (
                      <div className="mt-2">
                        {selectedProduct.imagen && (
                          <img
                            src={selectedProduct.imagen}
                            alt={selectedProduct.nombre}
                            className="img-fluid rounded mb-2"
                            style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "cover" }}
                          />
                        )}
                        <div className="mt-2">
                          <p className="mb-1"><strong>{selectedProduct.nombre}</strong></p>
                          <p className="text-muted small mb-0">${selectedProduct.precio}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <form onSubmit={handleProductSubmit}>
            <div className="row g-2">
              <div className="col-md-8">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Orden (opcional)"
                  min="1"
                  value={productForm.orden}
                  onChange={(e) =>
                    setProductForm({ ...productForm, orden: e.target.value })
                  }
                />
                <div className="form-text">Dejá vacío para orden automática</div>
              </div>
              <div className="col-md-4">
                <button 
                  type="submit" 
                  className="btn btn-success w-100"
                  disabled={!productForm.product_id}
                >
                  Agregar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {homeProducts.length > 0 && (
  <>
    <h6 className="mb-3">
      Productos cargados ({homeProducts.length})
    </h6>

    <div className="row g-3 mb-4">
      {homeProducts.map((item) => (
        <div key={item.home_product_id} className="col-12 col-sm-6 col-lg-4">
          <div
            draggable
            onDragStart={(e) => handleProductDragStart(e, item)}
            onDragOver={handleProductDragOver}
            onDrop={(e) => handleProductDrop(e, item)}
            className="card h-100"
            style={{
              cursor: "move",
              opacity: draggedProductItem?.home_product_id === item.home_product_id ? 0.7 : 1,
              border:
                draggedProductItem?.home_product_id === item.home_product_id
                  ? "2px solid #007bff"
                  : "1px solid #dee2e6",
            }}
          >
            {item.imagen && (
              <img
                src={`${API_URL}${item.imagen}`}
                alt={item.nombre}
                className="card-img-top"
                style={{
                  height: "180px",
                  objectFit: "cover",
                }}
              />
            )}

            <div className="card-body">
              <h6 className="card-title">{item.nombre}</h6>

              <p className="card-text text-muted small mb-1">
                Precio: <strong>${item.precio}</strong>
              </p>

              <p className="card-text text-muted small mb-2">
                Orden: <strong>{item.orden}</strong>
              </p>

              <div className="d-grid gap-2">
                <button
                  onClick={() => handleDeleteProduct(item.home_product_id)}
                  className="btn btn-sm btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
)}


      {homeProducts.length === 0 && search.length === 0 && (
        <div className="alert alert-info" role="alert">
          No hay productos destacados. Búscalos con el buscador para agregarlos.
        </div>
      )}
    </div>
  );
};

export default AdminHome;

