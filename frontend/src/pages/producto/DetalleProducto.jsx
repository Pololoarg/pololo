import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById } from "../../services/productsService";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../utils/formatPrice";
import "./DetalleProducto.css";

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
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
        
        // Seleccionar imagen principal o la primera disponible
        const images = Array.isArray(data.images) ? data.images : [];
        const mainImage = images.find(img => img.is_main) || images[0];
        setSelectedImage(mainImage?.url || data.image);
        
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
    <div className="container detalle-container">
      {/* GALERÍA DE IMÁGENES */}
      <div className="detalle-imagen">
        {/* Imagen principal */}
        <div className="imagen-principal">
          <img
            src={getImageUrl(selectedImage || product.image)}
            alt={product.name}
          />
        </div>
        
        {/* Miniaturas */}
        {product.images && product.images.length > 1 && (
          <div className="imagenes-thumbnails">
            {product.images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={`thumbnail ${selectedImage === img.url ? 'active' : ''}`}
                onClick={() => setSelectedImage(img.url)}
              >
                <img
                  src={getImageUrl(img.url)}
                  alt={`${product.name} ${idx + 1}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INFORMACIÓN */}
      <div className="detalle-info">
        <h2 className="detalle-titulo">{product.name}</h2>
        <p className="detalle-categoria">{product.category}</p>
        <div className="detalle-precio">${formatPrice(product.price)}</div>

        <p className="detalle-descripcion">{product.description}</p>

        {/* TALLES */}
        {product.sizes && product.sizes.items && product.sizes.items.length > 0 && (
          <div className="detalle-talles">
            <h5>Talles disponibles:</h5>
            <div className="talles-grid">
              {[...product.sizes.items]
                .sort((a, b) => {
                  if (product.category === 'pantalones') {
                    return Number(a.size) - Number(b.size);
                  }
                  const ORDER_ROPA = ["XS", "S", "M", "L", "XL"];
                  return ORDER_ROPA.indexOf(a.size) - ORDER_ROPA.indexOf(b.size);
                })
                .map((sizeItem) => (
                  <button
                    key={sizeItem.size}
                    className={`btn-talle ${selectedSize?.size === sizeItem.size ? 'active' : ''} ${sizeItem.stock === 0 ? 'disabled' : ''}`}
                    onClick={() => setSelectedSize(sizeItem)}
                    disabled={sizeItem.stock === 0}
                  >
                    {sizeItem.size}
                    {sizeItem.stock === 0 && <small className="d-block">(Sin stock)</small>}
                  </button>
                ))}
            </div>

            {selectedSize && (
              <p className="stock-disponible">
                Stock disponible: <strong>{selectedSize.stock}</strong> unidades
              </p>
            )}
          </div>
        )}

        {/* CANTIDAD */}
        <div className="detalle-cantidad">
          <h5>Cantidad:</h5>
          <div className="cantidad-control">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(quantity + 1, selectedSize?.stock || product.stock_total || product.stock))}  
            >
              +
            </button>
          </div>
        </div>

        {/* BOTÓN AGREGAR */}
        <button
          className="btn-agregar-carrito"
          onClick={handleAddToCart}
          disabled={!selectedSize && product.sizes && product.sizes.items && product.sizes.items.length > 0}
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

export default DetalleProducto;
