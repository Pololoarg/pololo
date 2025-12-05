// src/controllers/products.controller.js
import { pool } from '../config/db.js';

// GET /api/products?category=marroquineria
export const getProducts = async (req, res) => {
  const { category } = req.query;

  try {
    let query = `
      SELECT 
        id,
        nombre      AS name,
        categoria   AS category,
        descripcion AS description,
        precio      AS price,
        imagen_url  AS image,
        stock,
        activo      AS active
      FROM products
    `;
    const params = [];

    if (category) {
      query += ' WHERE LOWER(categoria) = LOWER($1)';
      params.push(category);
    }

    query += ' ORDER BY id';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};
// GET /api/products/:id
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        id,
        nombre      AS name,
        categoria   AS category,
        descripcion AS description,
        precio      AS price,
        imagen_url  AS image,
        stock,
        activo      AS active
      FROM products
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener producto por id:', error);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
};

// CREAR PRODUCTO  (POST /api/products)
export const createProduct = async (req, res) => {
  let { name, category, description, price, image, stock, active } = req.body;

  // --- VALIDACIONES BÁSICAS ---
  if (!name || !category || price == null) {
    return res
      .status(400)
      .json({ message: 'Nombre, categoría y precio son obligatorios' });
  }

  const priceNumber = Number(price);
  const stockNumber = stock == null ? 0 : Number(stock);

  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    return res
      .status(400)
      .json({ message: 'El precio debe ser un número mayor a 0' });
  }

  if (Number.isNaN(stockNumber) || stockNumber < 0) {
    return res
      .status(400)
      .json({ message: 'El stock debe ser un número mayor o igual a 0' });
  }

  const allowedCategories = ['marroquineria', 'remeras', 'pantalones', 'buzos'];
  const normalizedCategory = String(category).toLowerCase();

  if (!allowedCategories.includes(normalizedCategory)) {
    return res.status(400).json({ message: 'Categoría inválida' });
  }

  try {
    // 👇 si vino archivo, usamos su ruta; si no, usamos lo que venga en body (o vacío)
    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : (image || '');

    const result = await pool.query(
      `
      INSERT INTO products (nombre, categoria, descripcion, precio, imagen_url, stock, activo)
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true))
      RETURNING 
        id,
        nombre      AS name,
        categoria   AS category,
        descripcion AS description,
        precio      AS price,
        imagen_url  AS image,
        stock,
        activo      AS active
      `,
      [
        name,
        normalizedCategory,
        description || '',
        priceNumber,
        imagePath,
        stockNumber,
        active,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

// ACTUALIZAR PRODUCTO (PUT /api/products/:id)
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  let { name, category, description, price, image, stock, active } = req.body;

  // --- VALIDACIONES BÁSICAS ---
  if (!name || !category || price == null) {
    return res
      .status(400)
      .json({ message: 'Nombre, categoría y precio son obligatorios' });
  }

  const priceNumber = Number(price);
  const stockNumber = stock == null ? 0 : Number(stock);

  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    return res
      .status(400)
      .json({ message: 'El precio debe ser un número mayor a 0' });
  }

  if (Number.isNaN(stockNumber) || stockNumber < 0) {
    return res
      .status(400)
      .json({ message: 'El stock debe ser un número mayor o igual a 0' });
  }

  const allowedCategories = ['marroquineria', 'remeras', 'pantalones', 'buzos'];
  const normalizedCategory = String(category).toLowerCase();

  if (!allowedCategories.includes(normalizedCategory)) {
    return res.status(400).json({ message: 'Categoría inválida' });
  }

  try {
    // Primero obtengo la imagen actual
    const current = await pool.query(
      'SELECT imagen_url FROM products WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const currentImage = current.rows[0].imagen_url;

    // 👇 Prioridad: archivo nuevo > image del body > imagen actual
    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : (image || currentImage || '');

    const result = await pool.query(
      `
      UPDATE products
      SET
        nombre      = $1,
        categoria   = $2,
        descripcion = $3,
        precio      = $4,
        imagen_url  = $5,
        stock       = $6,
        activo      = $7
      WHERE id = $8
      RETURNING 
        id,
        nombre      AS name,
        categoria   AS category,
        descripcion AS description,
        precio      AS price,
        imagen_url  AS image,
        stock,
        activo      AS active
      `,
      [
        name,
        normalizedCategory,
        description || '',
        priceNumber,
        imagePath,
        stockNumber,
        active ?? true,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};


// ELIMINAR PRODUCTO (DELETE /api/products/:id)
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};
