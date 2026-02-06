import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUrl";
import { formatPrice } from "../../utils/formatPrice";
import "./Carrito.css";

function Carrito() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    totalPrice,
    clearCart,
  } = useCart();

  // 👉 NÚMERO DE WHATSAPP DEL NEGOCIO
  // Formato: 549 + código de área + número
  const WHATSAPP_NUMBER = "5493584905227";

  const handleSendWhatsApp = () => {
    if (cart.length === 0) return;

    let message = "Hola! Quiero hacer el siguiente pedido:%0A%0A";

    cart.forEach((item) => {
      const talle = item.selectedSize ? ` - Talle ${item.selectedSize}` : '';
      message += `- ${item.quantity}x ${item.name}${talle} ($${formatPrice(item.price)})%0A`;
    });

    message += `%0ATotal: $${formatPrice(totalPrice)}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank");
  };

  if (cart.length === 0) {
    return (
      <div className="container carrito-container">
        <div className="carrito-vacio">
          <h2>Tu carrito está vacío</h2>
          <Link to="/catalogo" className="btn btn-primary mt-3">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container carrito-container">
      <h2 className="carrito-titulo">TU CARRITO</h2>

      {/* LISTA DE PRODUCTOS */}
      {cart.map((item) => (
        <div key={`${item.id}-${item.selectedSize || 'sin-talle'}`} className="carrito-item">
          {/* IMAGEN */}
          <img
            src={getImageUrl(item.image)}
            className="carrito-item-imagen"
            alt={item.name}
          />

          {/* DETALLES */}
          <div className="carrito-item-body">
            <div className="carrito-item-header">
              <h5 className="carrito-item-titulo">
                {item.name}
                {item.selectedSize && (
                  <span style={{ fontSize: '12px', backgroundColor: '#e7f3ff', color: '#0066cc', padding: '4px 8px', borderRadius: '4px' }}>
                    Talle: {item.selectedSize}
                  </span>
                )}
              </h5>
              <p className="carrito-item-categoria">{item.category}</p>
              <p className="carrito-item-precio">${formatPrice(item.price)}</p>
            </div>

            {/* CONTROLES DE CANTIDAD */}
            <div className="carrito-controls">
              <button
                className="carrito-btn-cantidad"
                onClick={() => decreaseQuantity(item.id, item.selectedSize)}
              >
                −
              </button>

              <span className="carrito-cantidad">{item.quantity}</span>

              <button
                className="carrito-btn-cantidad"
                disabled={item.quantity >= item.stock}
                onClick={() => increaseQuantity(item.id, item.selectedSize)}
              >
                +
              </button>
            </div>

            {/* MENSAJE DE STOCK */}
            {item.quantity >= item.stock && (
              <small className="carrito-stock-warning">
                Stock máximo alcanzado
              </small>
            )}

            {/* BOTÓN ELIMINAR */}
            <button
              className="carrito-btn-eliminar"
              onClick={() => removeFromCart(item.id, item.selectedSize)}
            >
              Eliminar del carrito
            </button>
          </div>
        </div>
      ))}

      {/* TOTAL Y ACCIONES */}
      <div className="carrito-resumen">
        <div className="carrito-total">
          <span>Total:</span>
          <strong>${formatPrice(totalPrice)}</strong>
        </div>

        <div className="carrito-acciones">
          <button className="carrito-btn carrito-btn-vaciar" onClick={clearCart}>
            Vaciar carrito
          </button>

          <button className="carrito-btn carrito-btn-whatsapp" onClick={handleSendWhatsApp}>
            Enviar pedido por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );;
}

export default Carrito;
