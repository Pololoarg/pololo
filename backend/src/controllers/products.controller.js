// src/controllers/products.controller.js
import { pool } from '../config/db.js';

// (duplicate simple getProducts removed; the more complete getProducts implementation remains below)

// OBTENER PRODUCTOS (GET /api/products)
export const getProducts = async (req, res) => {
  const { category, includeInactive, search, size, subcategory } = req.query;

try {
  let query = `
    SELECT DISTINCT
      p.id,
      p.nombre       AS name,
      p.categoria    AS category,
      p.subcategoria AS subcategory,
      p.descripcion  AS description,
      p.precio       AS price,
      COALESCE(main_img.image_url, p.imagen_url) AS image,
      p.activo       AS active
    FROM products p
    LEFT JOIN LATERAL (
      SELECT image_url
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY CASE WHEN pi.is_main THEN 0 ELSE 1 END, pi.id
      LIMIT 1
    ) AS main_img ON true
  `;

  const params = [];
  const conditions = [];

  if (size) {
    query += `
      JOIN product_sizes ps ON ps.product_id = p.id
      JOIN sizes s ON s.id = ps.size_id
    `;
  }

  if (includeInactive !== 'true') {
    conditions.push('p.activo = true');
  }

  if (category) {
    conditions.push(`LOWER(p.categoria) = LOWER($${params.length + 1})`);
    params.push(category);
  }

  if (subcategory) {
    conditions.push(`LOWER(p.subcategoria) = LOWER($${params.length + 1})`);
    params.push(subcategory);
  }

  if (search) {
    conditions.push(`
      (LOWER(p.nombre) LIKE LOWER($${params.length + 1})
       OR LOWER(p.descripcion) LIKE LOWER($${params.length + 1}))
    `);
    params.push(`%${search}%`);
  }

  if (size) {
    conditions.push(`
      s.valor = $${params.length + 1}
      AND ps.stock > 0
    `);
    params.push(size);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY p.id';

  const result = await pool.query(query, params);
  
  // Obtener todas las imágenes para cada producto
  const productsWithImages = await Promise.all(
    result.rows.map(async (product) => {
      const imagesResult = await pool.query(
        `SELECT id, image_url as url, is_main 
         FROM product_images 
         WHERE product_id = $1 
         ORDER BY CASE WHEN is_main THEN 0 ELSE 1 END, id`,
        [product.id]
      );
      return {
        ...product,
        images: imagesResult.rows
      };
    })
  );
  
  res.json(productsWithImages);
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
        p.nombre       AS name,
        p.categoria    AS category,
        p.subcategoria AS subcategory,
        p.descripcion  AS description,
        p.precio       AS price,
        COALESCE(main_img.image_url, p.imagen_url) AS image,
        p.activo       AS active,
        COALESCE(stock.total_stock, 0) AS stock_total,
        COALESCE(imgs.images, '[]')    AS images
      FROM products p
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY CASE WHEN pi.is_main THEN 0 ELSE 1 END, pi.id
        LIMIT 1
      ) AS main_img ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', pi.id,
            'url', pi.image_url,
            'is_main', pi.is_main
          ) ORDER BY pi.is_main DESC, pi.id
        ) AS images
        FROM product_images pi
        WHERE pi.product_id = p.id
      ) AS imgs ON true
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(ps.stock), 0) AS total_stock
        FROM product_sizes ps
        WHERE ps.product_id = p.id
      ) AS stock ON true
      WHERE p.id = $1
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
      images: product.images || [],
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
    let { name, category, subcategory, description, price, image, active, sizes, mainImageIndex } = req.body;

    // Archivos subidos (múltiples imágenes)
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    const uploadedImages = uploadedFiles.map(file => ({ path: `/uploads/${file.filename}` }));
    const parsedMainIndex = Number.parseInt(mainImageIndex, 10);
    const mainIndex = Number.isInteger(parsedMainIndex) && parsedMainIndex >= 0 && parsedMainIndex < uploadedImages.length
      ? parsedMainIndex
      : 0;

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
      client.release();
      return res
        .status(400)
        .json({ message: 'Nombre, categoría y precio son obligatorios' });
    }

    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      client.release();
      return res
        .status(400)
        .json({ message: 'El precio debe ser un número mayor a 0' });
    }

    const allowedCategories = ['marroquineria', 'remeras', 'pantalones', 'buzos'];
    const normalizedCategory = String(category).toLowerCase();

    if (!allowedCategories.includes(normalizedCategory)) {
      client.release();
      return res.status(400).json({ message: 'Categoría inválida' });
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // --- VALIDACIONES DE TALLES SEGÚN CATEGORÍA ---
    if (normalizedCategory === 'marroquineria') {
      if (sizes && sizes.length > 0) {
        // Aceptamos solo el talle "Único" asociado a marroquinería
        for (const s of sizes) {
          const type = (s.size_type || '').toLowerCase();
          const value = s.size_value || s.size;
          if (type !== 'marroquineria' || value !== 'Único') {
            await client.query('ROLLBACK');
            client.release();
            return res
              .status(400)
              .json({ message: 'La marroquinería solo usa talle Único' });
          }
        }
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
            client.release();
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
            client.release();
            return res
              .status(400)
              .json({ message: 'Talles inválidos para pantalones' });
          }
        }
      }
    }

    const mainImagePath = uploadedImages.length > 0
      ? uploadedImages[mainIndex]?.path || uploadedImages[0].path
      : (image || '');

    const productResult = await client.query(
      `
      INSERT INTO products (nombre, categoria, subcategoria, descripcion, precio, imagen_url, activo)
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true))
      RETURNING id
      `,
      [name, normalizedCategory, subcategory || null, description || '', priceNumber, mainImagePath, active]
    );

    const productId = productResult.rows[0].id;

    if (uploadedImages.length > 0) {
      for (let i = 0; i < uploadedImages.length; i++) {
        const img = uploadedImages[i];
        await client.query(
          `INSERT INTO product_images (product_id, image_url, is_main)
           VALUES ($1, $2, $3)`,
          [productId, img.path, i === mainIndex]
        );
      }

      // Asegurar que exista exactamente una imagen principal
      await client.query(
        `UPDATE product_images
         SET is_main = (product_images.id = sub.id)
         FROM (
           SELECT id
           FROM product_images
           WHERE product_id = $1
           ORDER BY is_main DESC, id
           LIMIT 1
         ) AS sub
         WHERE product_images.product_id = $1`,
        [productId]
      );

      await client.query(
        `UPDATE products
         SET imagen_url = (
           SELECT image_url FROM product_images
           WHERE product_id = $1 AND is_main = true
           ORDER BY id LIMIT 1
         )
         WHERE id = $1`,
        [productId]
      );
    }

    if (Array.isArray(sizes) && sizes.length > 0) {
      for (const s of sizes) {
        let sizeId = s.size_id;

        // Si es marroquinería, buscar el size_id del talle "Único"
        if (normalizedCategory === 'marroquineria' && (s.size_type || '').toLowerCase() === 'marroquineria') {
          // Garantizar que exista el size_type "marroquineria"
          let sizeTypeId;
          const typeResult = await client.query(
            `SELECT id FROM size_types WHERE LOWER(nombre) = 'marroquineria'`
          );
          if (typeResult.rows.length === 0) {
            const insertedType = await client.query(
              `INSERT INTO size_types (nombre) VALUES ('marroquineria') RETURNING id`
            );
            sizeTypeId = insertedType.rows[0].id;
          } else {
            sizeTypeId = typeResult.rows[0].id;
          }

          // Garantizar que exista el talle "Único" para marroquinería
          const sizeResult = await client.query(
            `SELECT id FROM sizes WHERE size_type_id = $1 AND valor = 'Único'`,
            [sizeTypeId]
          );
          if (sizeResult.rows.length === 0) {
            const insertedSize = await client.query(
              `INSERT INTO sizes (size_type_id, valor) VALUES ($1, 'Único') RETURNING id`,
              [sizeTypeId]
            );
            sizeId = insertedSize.rows[0].id;
          } else {
            sizeId = sizeResult.rows[0].id;
          }
        }

        // Si no se pudo resolver el talle, rechazar para evitar FK nula
        if (!sizeId) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({ message: 'No se encontró el talle Único para marroquinería' });
        }

        await client.query(
          `
          INSERT INTO product_sizes (product_id, size_id, stock)
          VALUES ($1, $2, $3)
          `,
          [productId, sizeId, s.stock ?? 0]
        );
      }
    }

    await client.query('COMMIT');
    client.release();
    res.status(201).json({ id: productId });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};


// ACTUALIZAR PRODUCTO (PUT /api/products/:id)
export const updateProduct = async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;
  let { name, category, subcategory, description, price, image, active, sizes, mainImageId, mainImageIndex } = req.body;

  // Si sizes viene como string JSON, parsearlo
  if (typeof sizes === 'string') {
    try {
      sizes = JSON.parse(sizes);
    } catch (e) {
      sizes = [];
    }
  }

  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  const uploadedImages = uploadedFiles.map(file => ({ path: `/uploads/${file.filename}` }));
  const parsedMainIndex = Number.parseInt(mainImageIndex, 10);
  const newMainIndex = Number.isInteger(parsedMainIndex) && parsedMainIndex >= 0 && parsedMainIndex < uploadedImages.length
    ? parsedMainIndex
    : null;
  const parsedMainId = mainImageId ? Number(mainImageId) : null;

  // --- VALIDACIONES BÁSICAS ---
  if (!name || !category || price == null) {
    client.release();
    return res
      .status(400)
      .json({ message: 'Nombre, categoría y precio son obligatorios' });
  }

  const priceNumber = Number(price);

  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    client.release();
    return res
      .status(400)
      .json({ message: 'El precio debe ser un número mayor a 0' });
  }

  const allowedCategories = ['marroquineria', 'remeras', 'pantalones', 'buzos'];
  const normalizedCategory = String(category).toLowerCase();

  if (!allowedCategories.includes(normalizedCategory)) {
    client.release();
    return res.status(400).json({ message: 'Categoría inválida' });
  }

  try {
    await client.query('BEGIN');

    // Obtener datos actuales
    const current = await client.query(
      'SELECT imagen_url FROM products WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const currentImage = current.rows[0].imagen_url;

    // Si no hay registros en product_images pero existe imagen actual, crear registro base
    const imagesCount = await client.query(
      'SELECT COUNT(*)::int AS count FROM product_images WHERE product_id = $1',
      [id]
    );
    if (imagesCount.rows[0].count === 0 && currentImage) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, is_main)
         VALUES ($1, $2, true)`,
        [id, currentImage]
      );
    }

    // --- VALIDACIONES DE TALLES SEGÚN CATEGORÍA ---
    if (normalizedCategory === 'marroquineria') {
      if (sizes && sizes.length > 0) {
        await client.query('ROLLBACK');
        return res
          .status(400)
          .json({ message: 'La marroquinería no admite talles' });
      }
    } else if (normalizedCategory === 'remeras' || normalizedCategory === 'buzos') {
      if (sizes && sizes.length > 0) {
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

    // Actualizar producto (imagen_url se sincroniza luego según main)
    const result = await client.query(
      `
      UPDATE products
      SET
        nombre       = $1,
        categoria    = $2,
        subcategoria = $3,
        descripcion  = $4,
        precio       = $5,
        imagen_url   = $6,
        activo       = $7
      WHERE id = $8
      RETURNING 
        id,
        nombre      AS name,
        categoria   AS category,
        subcategoria AS subcategory,
        descripcion AS description,
        precio      AS price,
        imagen_url  AS image,
        activo      AS active
      `,
      [
        name,
        normalizedCategory,
        subcategory || null,
        description || '',
        priceNumber,
        image || currentImage || '',
        active ?? true,
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Actualizar talles/stock si viene sizes
    if (Array.isArray(sizes)) {
      await client.query('DELETE FROM product_sizes WHERE product_id = $1', [id]);

      for (const s of sizes) {
        let sizeId = s.size_id;

        if (normalizedCategory === 'marroquineria' && (s.size_type || '').toLowerCase() === 'marroquineria') {
          let sizeTypeId;
          const typeResult = await client.query(
            `SELECT id FROM size_types WHERE LOWER(nombre) = 'marroquineria'`
          );
          if (typeResult.rows.length === 0) {
            const insertedType = await client.query(
              `INSERT INTO size_types (nombre) VALUES ('marroquineria') RETURNING id`
            );
            sizeTypeId = insertedType.rows[0].id;
          } else {
            sizeTypeId = typeResult.rows[0].id;
          }

          const sizeResult = await client.query(
            `SELECT id FROM sizes WHERE size_type_id = $1 AND valor = 'Único'`,
            [sizeTypeId]
          );
          if (sizeResult.rows.length === 0) {
            const insertedSize = await client.query(
              `INSERT INTO sizes (size_type_id, valor) VALUES ($1, 'Único') RETURNING id`,
              [sizeTypeId]
            );
            sizeId = insertedSize.rows[0].id;
          } else {
            sizeId = sizeResult.rows[0].id;
          }
        }

        if (!sizeId) {
          continue;
        }

        await client.query(
          `INSERT INTO product_sizes (product_id, size_id, stock)
           VALUES ($1, $2, $3)`
          , [id, sizeId, s.stock ?? 0]
        );
      }
    }

    // Insertar nuevas imágenes (todas como no-principal inicialmente)
    const insertedImages = [];
    for (const img of uploadedImages) {
      const inserted = await client.query(
        `INSERT INTO product_images (product_id, image_url, is_main)
         VALUES ($1, $2, false)
         RETURNING id, image_url`,
        [id, img.path]
      );
      insertedImages.push(inserted.rows[0]);
    }

    // Determinar cuál debe ser la imagen principal
    let targetMainId = null;
    if (parsedMainId) {
      targetMainId = parsedMainId;
    } else if (newMainIndex !== null && insertedImages[newMainIndex]) {
      targetMainId = insertedImages[newMainIndex].id;
    }

    if (!targetMainId) {
      const existingMain = await client.query(
        `SELECT id FROM product_images WHERE product_id = $1 AND is_main = true ORDER BY id LIMIT 1`,
        [id]
      );
      if (existingMain.rows.length > 0) {
        targetMainId = existingMain.rows[0].id;
      }
    }

    if (!targetMainId) {
      const anyImage = await client.query(
        `SELECT id FROM product_images WHERE product_id = $1 ORDER BY id LIMIT 1`,
        [id]
      );
      targetMainId = anyImage.rows[0]?.id || null;
    }

    if (targetMainId) {
      await client.query(
        `UPDATE product_images
         SET is_main = (id = $2)
         WHERE product_id = $1`,
        [id, targetMainId]
      );

      const mainRow = await client.query(
        `SELECT image_url FROM product_images WHERE id = $1`,
        [targetMainId]
      );

      const mainUrl = mainRow.rows[0]?.image_url || image || currentImage || '';

      await client.query(
        `UPDATE products SET imagen_url = $1 WHERE id = $2`,
        [mainUrl, id]
      );
    }

    const finalProduct = await client.query(
      `SELECT id, nombre AS name, categoria AS category, subcategoria AS subcategory, descripcion AS description, precio AS price, imagen_url AS image, activo AS active
       FROM products WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');
    res.json(finalProduct.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  } finally {
    client.release();
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
      let sizeId = s.size_id;

      // Resolver size Único para marroquinería si viene como size_type/value
      if ((s.size_type || '').toLowerCase() === 'marroquineria') {
        let sizeTypeId;
        const typeResult = await client.query(
          `SELECT id FROM size_types WHERE LOWER(nombre) = 'marroquineria'`
        );
        if (typeResult.rows.length === 0) {
          const insertedType = await client.query(
            `INSERT INTO size_types (nombre) VALUES ('marroquineria') RETURNING id`
          );
          sizeTypeId = insertedType.rows[0].id;
        } else {
          sizeTypeId = typeResult.rows[0].id;
        }

        const sizeResult = await client.query(
          `SELECT id FROM sizes WHERE size_type_id = $1 AND valor = 'Único'`,
          [sizeTypeId]
        );
        if (sizeResult.rows.length === 0) {
          const insertedSize = await client.query(
            `INSERT INTO sizes (size_type_id, valor) VALUES ($1, 'Único') RETURNING id`,
            [sizeTypeId]
          );
          sizeId = insertedSize.rows[0].id;
        } else {
          sizeId = sizeResult.rows[0].id;
        }
      }

      if (!sizeId) {
        continue;
      }

      await client.query(
        `
        INSERT INTO product_sizes (product_id, size_id, stock)
        VALUES ($1, $2, $3)
        `,
        [id, sizeId, s.stock ?? 0]
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


// ELIMINAR IMAGEN DE PRODUCTO (DELETE /api/products/:id/images/:imageId)
export const deleteProductImage = async (req, res) => {
  const { id, imageId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que la imagen pertenece al producto
    const imageCheck = await client.query(
      'SELECT id, is_main FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, id]
    );

    if (imageCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    const wasMain = imageCheck.rows[0].is_main;

    // Eliminar la imagen
    await client.query(
      'DELETE FROM product_images WHERE id = $1',
      [imageId]
    );

    // Si era la imagen principal, asignar otra como principal
    if (wasMain) {
      const newMain = await client.query(
        `SELECT id FROM product_images
         WHERE product_id = $1
         ORDER BY id
         LIMIT 1`,
        [id]
      );

      if (newMain.rows.length > 0) {
        await client.query(
          'UPDATE product_images SET is_main = true WHERE id = $1',
          [newMain.rows[0].id]
        );

        // Actualizar products.imagen_url
        const newMainUrl = await client.query(
          'SELECT image_url FROM product_images WHERE id = $1',
          [newMain.rows[0].id]
        );

        await client.query(
          'UPDATE products SET imagen_url = $1 WHERE id = $2',
          [newMainUrl.rows[0].image_url, id]
        );
      } else {
        // No quedan imágenes, limpiar products.imagen_url
        await client.query(
          'UPDATE products SET imagen_url = NULL WHERE id = $1',
          [id]
        );
      }
    }

    await client.query('COMMIT');
    client.release();
    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ message: 'Error al eliminar imagen' });
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
