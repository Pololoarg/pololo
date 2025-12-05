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

  useEffect(() => {
    (async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el producto");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
          <p className="text-muted">{product.category}</p>
          <h4 className="fw-bold mt-3">${product.price}</h4>

          <p className="mt-3">{product.description}</p>

          <button
            className="btn btn-primary mt-3"
            onClick={() => addToCart(product)}
        >
             Agregar al carrito
            </button>

        </div>
      </div>
    </div>
  );
}

export default DetalleProducto;
