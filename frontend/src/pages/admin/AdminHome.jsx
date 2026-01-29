import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getAdminCarousel,
  getAdminHomeProducts,
  createCarouselImage,
  createHomeProduct,
  deleteCarouselImage,
  deleteCarouselImageField,
  toggleCarouselImage,
  updateCarouselOrder,
  deleteHomeProduct,
  updateHomeProductOrder
} from "../../services/adminHome.service";

import { searchProductsAdmin } from "../../services/productsService";
import { useToast } from "../../context/ToastContext.jsx";
import { getImageUrl } from "../../utils/imageUrl.js";
import "./AdminHome.css";

const API_URL = "http://localhost:4000";

const AdminHome = () => {
  const { showToast } = useToast();
  const [carousel, setCarousel] = useState([]);
  const [homeProducts, setHomeProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedProductItem, setDraggedProductItem] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageMobilePreview, setImageMobilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const fileMobileInputRef = useRef(null);

  // --------------------
  // FORMS
  // --------------------
  const [carouselForm, setCarouselForm] = useState({
    image: null,
    image_mobile: null,
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
  const handleDeleteCarouselImage = async (id, field = null) => {
    const confirm = window.confirm(field ? "¿Eliminar esta variante de imagen?" : "¿Eliminar esta imagen del carrusel?");
    if (!confirm) return;

    try {
      // Obtener el orden de la imagen a eliminar (solo relevante si borraremos la fila completa)
      const deletedItem = carousel.find(item => item.id === id);
      const deletedOrder = deletedItem?.orden || 0;

      // Si se pasa 'field', sólo borramos ese campo (imagen_url o imagen_mobile_url)
      if (field) {
        await deleteCarouselImageField(id, field);
        loadData();
        return;
      }

      // Eliminar la fila completa
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

    // Debe existir al menos una imagen (desktop o mobile)
    if (!carouselForm.image && !carouselForm.image_mobile) {
      showToast("Seleccioná una imagen para el carrusel o una imagen para móvil", "error");
      return;
    }

    // Validaciones por archivo (si existen)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (carouselForm.image) {
      // Validar tamaño mínimo: 10KB
      if (carouselForm.image.size < 10 * 1024) {
        showToast("La imagen es muy pequeña. Mínimo 10KB", "error");
        return;
      }

      // Validar tamaño máximo: 2MB
      if (carouselForm.image.size > 2 * 1024 * 1024) {
        showToast("La imagen no puede superar los 2MB", "error");
        return;
      }

      if (!validTypes.includes(carouselForm.image.type)) {
        showToast("Formato no permitido para la imagen de escritorio. Solo JPG, PNG o WEBP", "error");
        return;
      }
    }

    if (carouselForm.image_mobile) {
      if (carouselForm.image_mobile.size < 5 * 1024) {
        showToast("La imagen móvil es muy pequeña. Mínimo 5KB", "error");
        return;
      }
      if (carouselForm.image_mobile.size > 2 * 1024 * 1024) {
        showToast("La imagen móvil no puede superar los 2MB", "error");
        return;
      }
      if (!validTypes.includes(carouselForm.image_mobile.type)) {
        showToast("Formato no permitido para la imagen móvil. Solo JPG, PNG o WEBP", "error");
        return;
      }
    }

    const validateAndSend = async () => {
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
        if (carouselForm.image) formData.append("image", carouselForm.image);
        if (carouselForm.image_mobile) formData.append("image_mobile", carouselForm.image_mobile);
        formData.append("titulo", carouselForm.titulo);
        formData.append("orden", orden);

        await createCarouselImage(formData);

        // limpiar estados
        setCarouselForm({
          image: null,
          image_mobile: null,
          titulo: "",
          orden: "",
        });

        // limpiar preview
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
        if (imageMobilePreview) {
          URL.revokeObjectURL(imageMobilePreview);
          setImageMobilePreview(null);
        }

        // limpiar input file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (fileMobileInputRef.current) {
          fileMobileInputRef.current.value = "";
        }

        loadData();
      } catch (error) {
        console.error("Error creando carrusel:", error);
      }
    };

    // Primero validar la imagen principal
    const img = new Image();
    const imageUrl = URL.createObjectURL(carouselForm.image);

    img.onload = () => {
      URL.revokeObjectURL(imageUrl);

      if (img.width < 1600 || img.height < 500) {
        showToast(`Imagen muy pequeña. Mínimo 1600x500px. Tu imagen: ${img.width}x${img.height}px`, "error");
        return;
      }

      if (img.width > 3000 || img.height > 1200) {
        showToast(`Imagen muy grande. Máximo 3000x1200px. Tu imagen: ${img.width}x${img.height}px`, "error");
        return;
      }

      // Si hay imagen móvil, validarla también antes de enviar
      if (carouselForm.image_mobile) {
        const imgMobile = new Image();
        const imageMobileUrl = URL.createObjectURL(carouselForm.image_mobile);

        imgMobile.onload = () => {
          URL.revokeObjectURL(imageMobileUrl);

          if (imgMobile.width < 600 || imgMobile.height < 400) {
            showToast(`Imagen móvil demasiado pequeña. Mínimo 600x400px. Tu imagen: ${imgMobile.width}x${imgMobile.height}px`, "error");
            return;
          }

          // todo OK, enviar
          validateAndSend();
        };

        imgMobile.onerror = () => {
          URL.revokeObjectURL(imageMobileUrl);
          showToast("Error al cargar la imagen móvil", "error");
        };

        imgMobile.src = imageMobileUrl;
      } else {
        validateAndSend();
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      showToast("Error al cargar la imagen", "error");
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
    
    if (!draggedProductItem || draggedProductItem.home_product_id === targetItem.home_product_id) {
      setDraggedProductItem(null);
      return;
    }

    try {
      const newProducts = homeProducts.map((item) => {
        if (item.home_product_id === draggedProductItem.home_product_id) {
          return { ...item, orden: targetItem.orden };
        }
        if (item.home_product_id === targetItem.home_product_id) {
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
      showToast("Seleccioná un producto", "error");
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

  if (loading) return <div className="admin-loading"><h3>Cargando...</h3></div>;

  return (
    <div className="admin-home-container">
      <div className="admin-header">
        <h1 className="admin-titulo">ADMINISTRAR HOME</h1>
        <div className="admin-btn-group">
          <Link to="/admin/home" className="admin-btn-nav active">
            Home
          </Link>
          <Link to="/admin/productos" className="admin-btn-nav">
            Productos
          </Link>
        </div>
      </div>

      {/* ===================== */}
      {/* CARRUSEL */}
      {/* ===================== */}
      <div className="admin-section">
        <h2 className="admin-section-title">Carrusel</h2>

        <div className="admin-card admin-form-card">
          <h3 className="admin-form-title">Agregar imagen al carrusel</h3>

          <form onSubmit={handleCarouselSubmit} className="admin-form-grid">
            <div className="admin-form-group">
              <label className="admin-form-label">Imagen del carrusel</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="admin-form-input admin-file-input"
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
              <p className="admin-hint">
                <strong>Dimensiones:</strong> Mínimo 1600×500 px | Máximo 3000×1200 px. Recomendado 1920×600 px.
              </p>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Imagen para celular (opcional)</label>
              <input
                ref={fileMobileInputRef}
                type="file"
                accept="image/*"
                className="admin-form-input admin-file-input"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  if (imageMobilePreview) {
                    URL.revokeObjectURL(imageMobilePreview);
                  }

                  setCarouselForm({
                    ...carouselForm,
                    image_mobile: file,
                  });

                  setImageMobilePreview(URL.createObjectURL(file));
                }}
              />
              <p className="admin-hint">
                <strong>Móvil:</strong> mínimo 600×400 px. Recomendado 800×1000 (vertical) u 800×600 (caja móvil).
              </p>
            </div>

            <div className="admin-preview-stack">
              {imagePreview && (
                <div className="admin-preview-card">
                  <div className="admin-preview-label">Preview escritorio</div>
                  <img
                    src={imagePreview}
                    alt="Preview carrusel"
                    className="admin-preview-img"
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
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

              {imageMobilePreview && (
                <div className="admin-preview-card">
                  <div className="admin-preview-label">Preview móvil</div>
                  <img
                    src={imageMobilePreview}
                    alt="Preview móvil"
                    className="admin-preview-img mobile"
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-danger"
                    onClick={() => {
                      URL.revokeObjectURL(imageMobilePreview);
                      setImageMobilePreview(null);
                      setCarouselForm({
                        ...carouselForm,
                        image_mobile: null,
                      });

                      if (fileMobileInputRef.current) {
                        fileMobileInputRef.current.value = "";
                      }
                    }}
                  >
                    Quitar imagen móvil
                  </button>
                </div>
              )}
            </div>

            <div className="admin-form-row">
              <input
                type="number"
                className="admin-form-input"
                placeholder="Orden (opcional)"
                min="1"
                value={carouselForm.orden}
                onChange={(e) =>
                  setCarouselForm({ ...carouselForm, orden: e.target.value })
                }
              />
              <button type="submit" className="admin-btn admin-btn-primary">Agregar imagen</button>
            </div>
          </form>
        </div>

        <div className="admin-card admin-media-card">
          <div className="admin-card-title">Imágenes actuales</div>

          <div className="admin-subtitle">Apaisadas</div>
          <div className="admin-media-grid">
            {carousel.filter(i => i.imagen_url).length === 0 && (
              <div className="admin-empty-state">No hay imágenes apaisadas.</div>
            )}

            {carousel.filter(i => i.imagen_url).map((item) => (
              <div
                key={`land-${item.id}`}
                className={`admin-carousel-card ${draggedItem?.id === item.id ? "dragging" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item)}
              >
                <img
                  src={getImageUrl(item.imagen_url)}
                  alt={item.titulo}
                  className="admin-carousel-image"
                />

                <div className="admin-card-body">
                  <div className="admin-card-title small">{item.titulo || "Sin título"}</div>
                  <div className="admin-meta">Orden: {item.orden}</div>
                  {item.imagen_mobile_url && <span className="admin-pill">Tiene versión móvil</span>}
                  <div className="admin-card-actions">
                    <button
                      onClick={() => handleToggleCarousel(item)}
                      className={`admin-btn ${item.activo ? "admin-btn-success" : "admin-btn-secondary"}`}
                      type="button"
                    >
                      {item.activo ? "✓ Activo" : "○ Inactivo"}
                    </button>
                    <button
                      onClick={() => handleDeleteCarouselImage(item.id, 'imagen_url')}
                      className="admin-btn admin-btn-danger"
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-subtitle">Móviles</div>
          <div className="admin-media-grid">
            {carousel.filter(i => i.imagen_mobile_url).length === 0 && (
              <div className="admin-empty-state">No hay imágenes móviles.</div>
            )}

            {carousel.filter(i => i.imagen_mobile_url).map((item) => (
              <div
                key={`mob-${item.id}`}
                className={`admin-carousel-card mobile ${draggedItem?.id === item.id ? "dragging" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item)}
              >
                <img
                  src={getImageUrl(item.imagen_mobile_url)}
                  alt={item.titulo}
                  className="admin-carousel-image"
                />

                <div className="admin-card-body">
                  <div className="admin-card-title small">{item.titulo || "Sin título"}</div>
                  <div className="admin-meta">Orden: {item.orden}</div>
                  <div className="admin-card-actions">
                    <button
                      onClick={() => handleToggleCarousel(item)}
                      className={`admin-btn ${item.activo ? "admin-btn-success" : "admin-btn-secondary"}`}
                      type="button"
                    >
                      {item.activo ? "✓ Activo" : "○ Inactivo"}
                    </button>
                    <button
                      onClick={() => handleDeleteCarouselImage(item.id, 'imagen_mobile_url')}
                      className="admin-btn admin-btn-danger"
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* PRODUCTOS DESTACADOS */}
      {/* ===================== */}
      <div className="admin-section">
        <h2 className="admin-section-title">Productos Destacados</h2>

        <div className="admin-card admin-form-card">
          <div className="admin-form-title">Agregar producto destacado</div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">Buscar producto</label>
            <input
              type="text"
              className="admin-form-input"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="admin-form-group">
              <label className="admin-form-label">Resultados de búsqueda</label>
              <ul className="admin-search-results">
                {searchResults.map((product) => (
                  <li 
                    key={product.id}
                    className={`admin-search-result ${productForm.product_id === product.id ? "active" : ""}`}
                    onClick={() =>
                      setProductForm({
                        product_id: product.id,
                        orden: "",
                      })
                    }
                  >
                    <div>
                      <strong className="admin-search-name">{product.nombre}</strong>
                      <span className="admin-search-price">${product.precio}</span>
                    </div>
                    <span className="admin-pill">Seleccionar</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {productForm.product_id && (
            <div className="admin-selected-product">
              {(() => {
                const selectedProduct = searchResults.find(p => p.id === productForm.product_id);
                return (
                  <div>
                    <div className="admin-selected-label">Producto seleccionado</div>
                    {selectedProduct && (
                      <div className="admin-selected-body">
                        {selectedProduct.imagen && (
                          <img
                            src={getImageUrl(selectedProduct.imagen)}
                            alt={selectedProduct.nombre}
                            className="admin-selected-image"
                          />
                        )}
                        <div className="admin-selected-info">
                          <p className="admin-selected-name">{selectedProduct.nombre}</p>
                          <p className="admin-selected-price">${selectedProduct.precio}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <form onSubmit={handleProductSubmit} className="admin-form-row">
            <div className="admin-form-group compact">
              <input
                type="number"
                className="admin-form-input"
                placeholder="Orden (opcional)"
                min="1"
                value={productForm.orden}
                onChange={(e) =>
                  setProductForm({ ...productForm, orden: e.target.value })
                }
              />
              <div className="admin-hint">Dejá vacío para orden automática</div>
            </div>
            <button 
              type="submit" 
              className="admin-btn admin-btn-success"
              disabled={!productForm.product_id}
            >
              Agregar
            </button>
          </form>
        </div>
      
        {homeProducts.length > 0 && (
          <div className="admin-card">
            <div className="admin-card-title">Productos cargados ({homeProducts.length})</div>

            <div className="admin-product-grid">
              {homeProducts.map((item) => (
                <div
                  key={item.home_product_id}
                  className={`admin-home-product-card ${draggedProductItem?.home_product_id === item.home_product_id ? "dragging" : ""}`}
                  draggable
                  onDragStart={(e) => handleProductDragStart(e, item)}
                  onDragOver={handleProductDragOver}
                  onDrop={(e) => handleProductDrop(e, item)}
                >
                  {item.imagen && (
                    <img
                      src={getImageUrl(item.imagen)}
                      alt={item.nombre}
                      className="admin-product-image"
                    />
                  )}

                  <div className="admin-card-body">
                    <div className="admin-card-title small">{item.nombre}</div>

                    <p className="admin-meta">Precio: <strong className="admin-highlight">${item.precio}</strong></p>

                    <p className="admin-meta">Orden: <strong>{item.orden}</strong></p>

                    <button
                      onClick={() => handleDeleteProduct(item.home_product_id)}
                      className="admin-btn admin-btn-danger full"
                      type="button"
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {homeProducts.length === 0 && search.length === 0 && (
          <div className="admin-empty-state">
            No hay productos destacados. Búscalos con el buscador para agregarlos.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHome;

