import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUrl";

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
  const WHATSAPP_NUMBER = "5493516178552";

  const handleSendWhatsApp = () => {
    if (cart.length === 0) return;

    let message = "Hola! Quiero hacer el siguiente pedido:%0A%0A";

    cart.forEach((item) => {
      const talle = item.selectedSize ? ` - Talle ${item.selectedSize}` : '';
      message += `- ${item.quantity}x ${item.name}${talle} ($${item.price})%0A`;
    });

    message += `%0ATotal: $${totalPrice}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank");
  };

  if (cart.length === 0) {
    return (
      <div className="container mt-4">
        <h2>Tu carrito está vacío</h2>
        <Link to="/catalogo" className="btn btn-primary mt-3">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Tu carrito</h2>

      {/* LISTA DE PRODUCTOS */}
      {cart.map((item) => (
        <div key={`${item.id}-${item.selectedSize || 'sin-talle'}`} className="card mb-3">
          <div className="row g-0">
            
            {/* IMAGEN */}
            <div className="col-md-3">
              <img
                src={getImageUrl(item.image)}
                className="img-fluid rounded-start"
                alt={item.name}
              />
            </div>

            {/* DETALLES */}
            <div className="col-md-9">
              <div className="card-body">
                <h5 className="card-title">
                  {item.name}
                  {item.selectedSize && (
                    <span className="badge bg-info ms-2">Talle: {item.selectedSize}</span>
                  )}
                </h5>
                <p className="card-text text-muted">{item.category}</p>
                <p className="fw-bold">${item.price}</p>

                {/* CONTROLES DE CANTIDAD */}
                <div className="d-flex align-items-center gap-3 mt-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => decreaseQuantity(item.id, item.selectedSize)}
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    className="btn btn-outline-secondary"
                    disabled={item.quantity >= item.stock}
                    onClick={() => increaseQuantity(item.id, item.selectedSize)}
                  >
                    +
                  </button>
                </div>

                {/* MENSAJE DE STOCK */}
                {item.quantity >= item.stock && (
                  <small className="text-danger d-block mt-1">
                    Stock máximo alcanzado
                  </small>
                )}

                {/* BOTÓN ELIMINAR */}
                <button
                  className="btn btn-danger mt-3"
                  onClick={() => removeFromCart(item.id, item.selectedSize)}
                >
                  Eliminar
                </button>
              </div>
            </div>

          </div>
        </div>
      ))}

      {/* TOTAL Y ACCIONES */}
      <div className="mt-4">
        <h4>
          Total: <strong>${totalPrice}</strong>
        </h4>

        <button className="btn btn-outline-danger me-3" onClick={clearCart}>
          Vaciar carrito
        </button>

        <button className="btn btn-success" onClick={handleSendWhatsApp}>
          Enviar pedido por WhatsApp
        </button>
      </div>
    </div>
  );
}

export default Carrito;
