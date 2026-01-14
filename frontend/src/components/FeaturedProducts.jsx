import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import { getHomeProducts } from "../services/home.service";
import { useCart } from "../context/CartContext";
import { getImageUrl } from "../utils/imageUrl";

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    getHomeProducts().then((data) => {
      console.log('Productos destacados:', data);
      setProducts(data);
    });
  }, []);

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      alert("❌ Producto sin stock disponible");
      return;
    }
    
    const success = addToCart({
      id: product.id,
      name: product.nombre,
      price: product.precio,
      image: product.imagen_url,
      stock: product.stock,
      category: product.categoria || '',
      quantity: 1
    });
    
    if (success) {
      alert("✅ Producto agregado al carrito");
    }
  };

  const handleViewProduct = (productId) => {
    navigate(`/producto/${productId}`);
  };

  if (products.length === 0) return null;

  return (
    <section className="container my-5 featured-products">
      <h3 className="mb-4">Productos destacados</h3>

      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={20}
        slidesPerView={1}
        breakpoints={{
          576: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          992: { slidesPerView: 4 },
        }}
      >
        {products.map((product) => (
          <SwiperSlide key={product.home_product_id}>
            <div className="card h-100">
              {product.imagen_url && (
                <img
                  src={getImageUrl(product.imagen_url)}
                  alt={product.nombre}
                  className="card-img-top product-image"
                  onClick={() => handleViewProduct(product.id)}
                />
              )}

              <div className="card-body text-center">
                <h6 
                  className="card-title" 
                  style={{ cursor: "pointer" }}
                  onClick={() => handleViewProduct(product.id)}
                >
                  {product.nombre}
                </h6>
                <p className="text-muted mb-3">${product.precio}</p>

                <button 
                  className="btn btn-success btn-sm featured-add-btn"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <i className="bi bi-cart-plus me-1"></i>
                  {product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default FeaturedProducts;

