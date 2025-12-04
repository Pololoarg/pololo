// src/pages/carrito/Carrito.jsx
import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";

function Carrito() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    totalPrice,
    clearCart,
  } = useCart();

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
        <div key={item.id} className="card mb-3">
          <div className="row g-0">

            {/* IMAGEN */}
            <div className="col-md-3">
              <img
                src={item.image}
                className="img-fluid rounded-start"
                alt={item.name}
              />
            </div>

            {/* DETALLES */}
            <div className="col-md-9">
              <div className="card-body">

                <h5 className="card-title">{item.name}</h5>
                <p className="card-text text-muted">{item.category}</p>
                <p className="fw-bold">${item.price}</p>

                {/* BOTONES DE CANTIDAD */}
                <div className="d-flex align-items-center gap-3 mt-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => decreaseQuantity(item.id)}
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => increaseQuantity(item.id)}
                  >
                    +
                  </button>
                </div>

                {/* BOTÓN ELIMINAR */}
                <button
                  className="btn btn-danger mt-3"
                  onClick={() => removeFromCart(item.id)}
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
        <h4>Total: <strong>${totalPrice}</strong></h4>

        <button className="btn btn-outline-danger me-3" onClick={clearCart}>
          Vaciar carrito
        </button>

        <Link to="/checkout" className="btn btn-success">
          Continuar al pedido
        </Link>

      </div>

    </div>
  );
}

export default Carrito;
