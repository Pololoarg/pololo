import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById } from "../../services/productsService";
import { useCart } from "../../context/CartContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const BACKEND_BASE_URL = API_URL.replace("/api", "");

const getImageUrl = (image) => {
  if (!image) return ""; // o podés devolver un placeholder

  // Si ya es una URL completa (http...), la usamos así
  if (image.startsWith("http")) return image;

  // Si es algo tipo /uploads/archivo.jpg, la pegamos al backend
  return `${BACKEND_BASE_URL}${image}`;
};


function DetalleProducto() {
  const { id } = useParams(); // lee el id de la URL
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
        
        // Si tiene talles, seleccionar el primero por defecto
        if (data.sizes && data.sizes.items && data.sizes.items.length > 0) {
          setSelectedSize(data.sizes.items[0]);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleAddToCart = () => {
    // Validar si el producto tiene talles
    if (product.sizes && product.sizes.items && product.sizes.items.length > 0) {
      if (!selectedSize) {
        alert("❌ Por favor, selecciona un talle");
        return;
      }
      if (selectedSize.stock < quantity) {
        alert(`❌ Stock insuficiente. Disponible: ${selectedSize.stock} unidades`);
        return;
      }
    } else {
      // Si no tiene talles, validar el stock total
      const stockDisponible = product.stock_total || product.stock || 0;
      if (stockDisponible < quantity) {
        alert(`❌ Stock insuficiente. Disponible: ${stockDisponible} unidades`);
        return;
      }
    }
    
    const success = addToCart({
      ...product,
      stock: selectedSize?.stock || product.stock_total || product.stock,
      selectedSize: selectedSize?.size,
      quantity
    });
    
    if (success) {
      alert("✅ Producto agregado al carrito");
    }
  };

  if (loading) return <div className="container mt-4"><p>Cargando producto...</p></div>;
  if (error)   return <div className="container mt-4"><p>{error}</p></div>;
  if (!product) return <div className="container mt-4"><p>Producto no encontrado.</p></div>;

  return (
    <div className="container mt-4">
      <div className="row">
        
        {/* IMAGEN */}
        <div className="col-md-6 mb-4">
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="img-fluid rounded"
          />
        </div>

        {/* INFORMACIÓN */}
        <div className="col-md-6">
          <h2>{product.name}</h2>
          <p className="text-muted text-capitalize">{product.category}</p>
          <h4 className="fw-bold mt-3">${product.price}</h4>

          <p className="mt-3">{product.description}</p>

          {/* TALLES */}
          {product.sizes && product.sizes.items && product.sizes.items.length > 0 && (
            <div className="mt-4">
              <h5>Talles disponibles:</h5>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {product.sizes.items.map((sizeItem) => (
                  <button
                    key={sizeItem.size}
                    className={`btn ${
                      selectedSize?.size === sizeItem.size
                        ? "btn-primary"
                        : "btn-outline-primary"
                    } ${sizeItem.stock === 0 ? "disabled" : ""}`}
                    onClick={() => setSelectedSize(sizeItem)}
                    disabled={sizeItem.stock === 0}
                  >
                    {sizeItem.size}
                    {sizeItem.stock === 0 && <small className="d-block">(Sin stock)</small>}
                  </button>
                ))}
              </div>
              {selectedSize && (
                <p className="mt-2 text-muted">
                  Stock disponible: <strong>{selectedSize.stock}</strong> unidades
                </p>
              )}
            </div>
          )}

          {/* CANTIDAD */}
          {(!product.sizes || product.sizes.items.length === 0) && (
            <div className="mt-4">
              <label className="form-label">Cantidad:</label>
              <input
                type="number"
                className="form-control"
                style={{ maxWidth: "100px" }}
                min="1"
                max={product.stock_total || 999}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              {product.stock_total > 0 && (
                <small className="text-muted">Stock disponible: {product.stock_total}</small>
              )}
            </div>
          )}

          {product.sizes && product.sizes.items && product.sizes.items.length > 0 && selectedSize && (
            <div className="mt-3">
              <label className="form-label">Cantidad:</label>
              <input
                type="number"
                className="form-control"
                style={{ maxWidth: "100px" }}
                min="1"
                max={selectedSize.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(selectedSize.stock, parseInt(e.target.value) || 1)))}
              />
            </div>
          )}

          <button
            className="btn btn-primary mt-3"
            onClick={handleAddToCart}
            disabled={
              (product.sizes && product.sizes.items && product.sizes.items.length > 0 && !selectedSize) ||
              (selectedSize && selectedSize.stock < quantity)
            }
          >
            Agregar al carrito
          </button>

        </div>
      </div>
    </div>
  );
}

export default DetalleProducto;
