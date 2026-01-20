// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "./ToastContext.jsx";

const CartContext = createContext();

// Hook para usar el carrito
export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { showToast } = useToast();
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem("cart");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error leyendo carrito de localStorage", e);
      return [];
    }
  });

  // Persistir carrito
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  /* ===========================
     AGREGAR PRODUCTO
     (Diferencia por talle/tamaño)
  =========================== */
  function addToCart(product) {
    // Validar stock disponible
    const stockDisponible = product.stock || 0;
    if (stockDisponible <= 0) {
      showToast("Producto sin stock disponible", "error");
      return false;
    }

    // Buscar producto con el MISMO ID Y TALLE (si tiene)
    const existing = cart.find(
      (item) => item.id === product.id && item.selectedSize === product.selectedSize
    );

    // Si ya está en el carrito con el mismo talle
    if (existing) {
      const cantidadTotal = existing.quantity + (product.quantity || 1);
      if (cantidadTotal > stockDisponible) {
        showToast(`No hay suficiente stock disponible.`, "error");
        return false;
      }

      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id && item.selectedSize === product.selectedSize
            ? { ...item, quantity: cantidadTotal }
            : item
        )
      );
      return true;
    }

    // Nuevo producto (o producto con diferente talle)
    setCart((prev) => [...prev, { ...product, quantity: product.quantity || 1 }]);
    return true;
  }

  /* ===========================
     QUITAR PRODUCTO
     (Por ID y talle si tiene)
  =========================== */
  function removeFromCart(id, selectedSize = null) {
    setCart((prev) => 
      prev.filter((item) => !(item.id === id && item.selectedSize === selectedSize))
    );
  }

  /* ===========================
     AUMENTAR CANTIDAD
     (Por ID y talle si tiene)
  =========================== */
  function increaseQuantity(id, selectedSize = null) {
    setCart((prev) => {
      const item = prev.find((item) => item.id === id && item.selectedSize === selectedSize);
      if (!item) return prev;
      
      if (item.quantity >= item.stock) {
        showToast(`Stock máximo alcanzado. Disponible: ${item.stock} unidades`, "error");
        return prev;
      }
      
      return prev.map((cartItem) =>
        cartItem.id === id && cartItem.selectedSize === selectedSize
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    });
  }

  /* ===========================
     DISMINUIR CANTIDAD
     (Por ID y talle si tiene)
  =========================== */
  function decreaseQuantity(id, selectedSize = null) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id && item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  /* ===========================
     VACIAR CARRITO
  =========================== */
  function clearCart() {
    setCart([]);
  }

  /* ===========================
     TOTALES
  =========================== */
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );

  const value = {
    cart,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
