CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  subcategoria VARCHAR(50),
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT false,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX unique_main_image_per_product
ON product_images (product_id)
WHERE is_main = true;


CREATE TABLE home_products (  
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (product_id)
);

CREATE TABLE home_carousel (
  id SERIAL PRIMARY KEY,
  imagen_url TEXT,
  imagen_mobile_url TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  titulo VARCHAR(50),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla para tipos de talles (ropa, calzado, etc.)
CREATE TABLE size_types (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla para los valores de talles (S, M, L, XL, etc.)
CREATE TABLE sizes (
  id SERIAL PRIMARY KEY,
  size_type_id INT NOT NULL REFERENCES size_types(id) ON DELETE CASCADE,
  valor VARCHAR(20) NOT NULL,
  UNIQUE (size_type_id, valor)
);

-- Tabla para relacionar productos con talles y stock
CREATE TABLE product_sizes (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id INT NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
  stock INT NOT NULL DEFAULT 0,
  UNIQUE (product_id, size_id)
);

-- Datos iniciales para tipos de talles
INSERT INTO size_types (nombre) VALUES ('ropa'), ('pantalon'), ('marroquineria');

-- Datos iniciales para talles de ropa (buzos, remeras)
INSERT INTO sizes (size_type_id, valor) 
SELECT id, 'XS' FROM size_types WHERE nombre = 'ropa'
UNION ALL
SELECT id, 'S' FROM size_types WHERE nombre = 'ropa'
UNION ALL
SELECT id, 'M' FROM size_types WHERE nombre = 'ropa'
UNION ALL
SELECT id, 'L' FROM size_types WHERE nombre = 'ropa'
UNION ALL
SELECT id, 'XL' FROM size_types WHERE nombre = 'ropa';

-- Datos iniciales para talles de pantalón
INSERT INTO sizes (size_type_id, valor)
SELECT id, '38' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '39' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '40' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '41' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '42' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '43' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '44' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '45' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '46' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '47' FROM size_types WHERE nombre = 'pantalon'
UNION ALL
SELECT id, '48' FROM size_types WHERE nombre = 'pantalon';

-- Datos iniciales para marroquinería (único)
INSERT INTO sizes (size_type_id, valor)
SELECT id, 'Único' FROM size_types WHERE nombre = 'marroquineria';

-- Tabla para subcategorías de marroquinería
CREATE TABLE marroquineria_subcategories (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Insertar subcategorías de marroquinería
INSERT INTO marroquineria_subcategories (nombre) VALUES 
('bolso'),
('mochila'),
('neceser'),
('riñonera'),
('billetera');
