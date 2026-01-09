// src/controllers/products.controller.js
import { pool } from '../config/db.js';

// (duplicate simple getProducts removed; the more complete getProducts implementation remains below)

// OBTENER PRODUCTOS (GET /api/products)
export const getProducts = async (req, res) => {
  const { category, includeInactive, search } = req.query;

  try {
    let query = `
      SELECT 
        p.id,
        p.nombre      AS name,
        p.categoria   AS category,
        p.descripcion AS description,
        p.precio      AS price,
        p.imagen_url  AS image,
        p.activo      AS active
      FROM products p
    `;

    const params = [];
    const conditions = [];

    if (includeInactive !== 'true') {
      conditions.push('p.activo = true');
    }

    if (category) {
      conditions.push(`LOWER(p.categoria) = LOWER($${params.length + 1})`);
      params.push(category);
    }

    if (search) {
      conditions.push(`
        (LOWER(p.nombre) LIKE LOWER($${params.length + 1})
         OR LOWER(p.descripcion) LIKE LOWER($${params.length + 1}))
      `);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.id';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};



// buscar un producto por nombre o descripción (GET /api/products/search)
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const result = await pool.query(
      `
      SELECT id, nombre, precio
      FROM products
      WHERE LOWER(nombre) LIKE LOWER($1)
        AND activo = true
      ORDER BY nombre
      LIMIT 10
      `,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error buscando productos:", error);
    res.status(500).json({ message: "Error buscando productos" });
  }
};


// OBTENER UN PRODUCTO POR ID (GET /api/products/:id)
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const productResult = await pool.query(
      `
      SELECT
        p.id,
        p.nombre      AS name,
        p.categoria   AS category,
        p.descripcion AS description,
        p.precio      AS price,
        p.imagen_url  AS image,
        p.activo      AS active,
        COALESCE(SUM(ps.stock), 0) AS stock_total
      FROM products p
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
      `,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const product = productResult.rows[0];

    const sizesResult = await pool.query(
      `
      SELECT
        st.nombre AS size_type,
        s.id      AS size_id,
        s.valor   AS size,
        ps.stock
      FROM product_sizes ps
      JOIN sizes s ON s.id = ps.size_id
      JOIN size_types st ON st.id = s.size_type_id
      WHERE ps.product_id = $1
      ORDER BY s.valor
      `,
      [id]
    );

    const sizes =
      sizesResult.rows.length > 0
        ? {
            type: sizesResult.rows[0].size_type,
            items: sizesResult.rows.map(r => ({
              id: r.size_id,
              size: r.size,
              stock: r.stock
            }))
          }
        : null;

    res.json({
      ...product,
      sizes
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ message: 'Error al obtener producto' });
  }
};

// Obtiene todos los talles disponibles de un tipo. GET /api/products/sizes/type/:type
export const getSizesByType = async (req, res) => {
  const { type } = req.params;

  if (!type) {
    return res.status(400).json({ message: 'type es obligatorio' });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        s.id,
        s.valor AS size
      FROM sizes s
      JOIN size_types st ON st.id = s.size_type_id
      WHERE LOWER(st.nombre) = LOWER($1)
      ORDER BY s.valor
      `,
      [type]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener talles:', error);
    res.status(500).json({ message: 'Error al obtener talles' });
  }
};


//Devuelve solo los talles y stock, sin datos del producto. GET /api/products/:id/sizes
export const getProductSizes = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el producto exista
    const product = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Obtener talles
    const result = await pool.query(
      `
      SELECT
        st.nombre AS size_type,
        s.id,
        s.valor AS size,
        ps.stock
      FROM product_sizes ps
      JOIN sizes s ON s.id = ps.size_id
      JOIN size_types st ON st.id = s.size_type_id
      WHERE ps.product_id = $1
      ORDER BY s.valor
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json({
      type: result.rows[0].size_type,
      sizes: result.rows.map(r => ({
        id: r.id,
        size: r.size,
        stock: r.stock
      }))
    });
  } catch (error) {
    console.error('Error al obtener talles del producto:', error);
    res.status(500).json({ message: 'Error al obtener talles' });
  }
};


// CREAR PRODUCTO  (POST /api/products)
export const createProduct = async (req, res) => {
  const client = await pool.connect();

  try {
    let { name, category, description, price, image, active, sizes } = req.body;

    // Si sizes viene como string JSON, parsearlo
    if (typeof sizes === 'string') {
      try {
        sizes = JSON.parse(sizes);
      } catch (e) {
        console.error('Error parseando sizes:', e);
        sizes = [];
      }
    }

    // --- VALIDACIONES BÁSICAS ---
    if (!name || !category || price == null) {
      return res
        .status(400)
        .json({ message: 'Nombre, categoría y precio son obligatorios' });
    }

    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      return res
        .status(400)
        .json({ message: 'El precio debe ser un número mayor a 0' });
    }

    const allowedCategories = ['marroquineria', 'remeras', 'pantalones', 'buzos'];
    const normalizedCategory = String(category).toLowerCase();

    if (!allowedCategories.includes(normalizedCategory)) {
      return res.status(400).json({ message: 'Categoría inválida' });
    }

    // --- VALIDACIONES DE TALLES SEGÚN CATEGORÍA ---
    if (normalizedCategory === 'marroquineria') {
      if (sizes && sizes.length > 0) {
        return res
          .status(400)
          .json({ message: 'La marroquinería no admite talles' });
      }
    } else if (normalizedCategory === 'remeras' || normalizedCategory === 'buzos') {
      if (sizes && sizes.length > 0) {
        // Validar que los talles pertenezcan al tipo 'ropa'
        for (const s of sizes) {
          const sizeCheck = await client.query(
            `SELECT s.id FROM sizes s
             JOIN size_types st ON st.id = s.size_type_id
             WHERE s.id = $1 AND LOWER(st.nombre) = 'ropa'`,
            [s.size_id]
          );
          if (sizeCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res
              .status(400)
              .json({ message: 'Talles inválidos para remeras/buzos' });
          }
        }
      }
    } else if (normalizedCategory === 'pantalones') {
      if (sizes && sizes.length > 0) {
        // Validar que los talles pertenezcan al tipo 'pantalon'
        for (const s of sizes) {
          const sizeCheck = await client.query(
            `SELECT s.id FROM sizes s
             JOIN size_types st ON st.id = s.size_type_id
             WHERE s.id = $1 AND LOWER(st.nombre) = 'pantalon'`,
            [s.size_id]
          );
          if (sizeCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res
              .status(400)
              .json({ message: 'Talles inválidos para pantalones' });
          }
        }
      }
    }

    await client.query('BEGIN');

    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : (image || '');

    const productResult = await client.query(
      `
      INSERT INTO products (nombre, categoria, descripcion, precio, imagen_url, activo)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
      RETURNING id
      `,
      [name, normalizedCategory, description || '', priceNumber, imagePath, active]
    );

    const productId = productResult.rows[0].id;

    if (Array.isArray(sizes) && sizes.length > 0) {
      for (const s of sizes) {
        await client.query(
          `
          INSERT INTO product_sizes (product_id, size_id, stock)
          VALUES ($1, $2, $3)
          `,
          [productId, s.size_id, s.stock ?? 0]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ id: productId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto' });
  } finally {
    client.release();
  }
};


// ACTUALIZAR PRODUCTO (PUT /api/products/:id)
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  let { name, category, description, price, image, active, sizes } = req.body;

  // --- VALIDACIONES BÁSICAS ---
  if (!name || !category || price == null) {
    return res
      .status(400)
      .json({ message: 'Nombre, categoría y precio son obligatorios' });
  }

  const priceNumber = Number(price);

  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    return res
      .status(400)
      .json({ message: 'El precio debe ser un número mayor a 0' });
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

    // --- VALIDACIONES DE TALLES SEGÚN CATEGORÍA ---
    if (normalizedCategory === 'marroquineria') {
      if (sizes && sizes.length > 0) {
        return res
          .status(400)
          .json({ message: 'La marroquinería no admite talles' });
      }
    } else if (normalizedCategory === 'remeras' || normalizedCategory === 'buzos') {
      if (sizes && sizes.length > 0) {
        // Validar que los talles pertenezcan al tipo 'ropa'
        for (const s of sizes) {
          const sizeCheck = await pool.query(
            `SELECT s.id FROM sizes s
             JOIN size_types st ON st.id = s.size_type_id
             WHERE s.id = $1 AND LOWER(st.nombre) = 'ropa'`,
            [s.size_id]
          );
          if (sizeCheck.rows.length === 0) {
            return res
              .status(400)
              .json({ message: 'Talles inválidos para remeras/buzos' });
          }
        }
      }
    } else if (normalizedCategory === 'pantalones') {
      if (sizes && sizes.length > 0) {
        // Validar que los talles pertenezcan al tipo 'pantalon'
        for (const s of sizes) {
          const sizeCheck = await pool.query(
            `SELECT s.id FROM sizes s
             JOIN size_types st ON st.id = s.size_type_id
             WHERE s.id = $1 AND LOWER(st.nombre) = 'pantalon'`,
            [s.size_id]
          );
          if (sizeCheck.rows.length === 0) {
            return res
              .status(400)
              .json({ message: 'Talles inválidos para pantalones' });
          }
        }
      }
    }

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
        activo      = $6
      WHERE id = $7
      RETURNING 
        id,
        nombre      AS name,
        categoria   AS category,
        descripcion AS description,
        precio      AS price,
        imagen_url  AS image,
        activo      AS active
      `,
      [
        name,
        normalizedCategory,
        description || '',
        priceNumber,
        imagePath,
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

// ACTUALIZAR PRODUCTO SIZE (PUT /api/products/:id/sizes)
export const updateProductSizes = async (req, res) => {
  const { id } = req.params;
  const { sizes } = req.body;

  if (!Array.isArray(sizes)) {
    return res.status(400).json({ message: 'sizes debe ser un array' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar producto
    const productCheck = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );

    if (productCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Borrar talles actuales
    await client.query(
      'DELETE FROM product_sizes WHERE product_id = $1',
      [id]
    );

    // Insertar nuevos talles
    for (const s of sizes) {
      await client.query(
        `
        INSERT INTO product_sizes (product_id, size_id, stock)
        VALUES ($1, $2, $3)
        `,
        [id, s.size_id, s.stock ?? 0]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Talles actualizados correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar talles:', error);
    res.status(500).json({ message: 'Error al actualizar talles' });
  } finally {
    client.release();
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
