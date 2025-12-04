// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import HomePage from "./pages/HomePage";
import Contacto from "./pages/Contacto";
import Nosotros from "./pages/Nosotros";

import Catalogo from "./pages/catalogo/Catalogo";
import Marroquineria from "./pages/catalogo/Marroquineria";
import Remeras from "./pages/catalogo/Remeras";
import Pantalones from "./pages/catalogo/Pantalones";
import Buzos from "./pages/catalogo/Buzos";

import DetalleProducto from "./pages/producto/DetalleProducto";
import Carrito from "./pages/carrito/Carrito";


// Admin
import LoginAdmin from "./pages/LoginAdmin";
import AdminPanel from "./pages/AdminPanel";
import { RequireAuth } from "./components/RequireAuth";

function App() {
  return (
    <Router>
      {/* --- Layout general sólo para el sitio público --- */}
      <Routes>
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <main style={{ minHeight: "80vh", padding: "1rem" }}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalogo" element={<Catalogo />} />
                  <Route path="/catalogo/marroquineria" element={<Marroquineria />} />
                  <Route path="/catalogo/remeras" element={<Remeras />} />
                  <Route path="/catalogo/pantalones" element={<Pantalones />} />
                  <Route path="/catalogo/buzos" element={<Buzos />} />
                  <Route path="/contacto" element={<Contacto />} />
                  <Route path="/nosotros" element={<Nosotros />} />
                  <Route path="/producto/:id" element={<DetalleProducto />} />
                  <Route path="/carrito" element={<Carrito />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />

        {/* --- Login Admin (página separada, sin navbar/footer) --- */}
        <Route path="/admin/login" element={<LoginAdmin />} />

        {/* --- Panel Admin protegido --- */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPanel />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

