// src/components/Footer.jsx
function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        {/* Logo e Instagram juntos */}
        <div className="footer-top">
          <div className="footer-logo">
            <img
              src="/logo-transp.png"
              alt="POLOLO ARG"
            />
          </div>
          
          <div className="footer-social">
            <a
              href="https://www.instagram.com/pololo.arg/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="social-link"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
        
        {/* Envíos */}
        <div className="footer-shipping">
          <svg viewBox="0 0 24 24" fill="currentColor" className="shipping-icon">
            <path d="M18 18.5a1.5 1.5 0 0 1-1 1.5 1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1 1.5zm1.5-9l1.96 2.5H17V9.5m-11 9A1.5 1.5 0 0 1 4.5 17 1.5 1.5 0 0 1 6 15.5 1.5 1.5 0 0 1 7.5 17 1.5 1.5 0 0 1 6 18.5M20 8h-3V4H3c-1.11 0-2 .89-2 2v11h2a3 3 0 0 0 3 3 3 3 0 0 0 3-3h6a3 3 0 0 0 3 3 3 3 0 0 0 3-3h2v-5z"/>
          </svg>
          <span>Envíos a todo el país</span>
        </div>

        {/* Política de Cambios */}
        <div className="footer-policy">
          <h3 className="policy-title">POLÍTICA DE CAMBIOS</h3>
          <ul className="policy-list">
            <li>Los cambios pueden realizarse dentro de los 10 días posteriores a la compra, el plazo se tomará desde el día en el que recibió el pedido.</li>
            <li>El cambio se realiza por correo directamente. Para gestionarlo contactate con nosotros dentro de los 10 días corridos posteriores a la recepción del pedido por mail: <a href="pololoarg.2024@gmail.com">pololoarg.2024@gmail.com</a></li>
            <li>El costo logístico del cambio y devoluciones estará a cargo del cliente y el valor dependerá de la zona en la que resida.</li>
            <li>Es condición fundamental para el cambio, que los productos sean preservados en excelentes condiciones y con etiqueta.</li>
          </ul>
        </div>
        
        {/* Copyright */}
        <div className="footer-copyright">
          <p>© {new Date().getFullYear()} POLOLO ARG – Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
