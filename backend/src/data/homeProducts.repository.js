import {pool} from '../config/db.js'; // ajustá la ruta si tu pool está en otro lado

const getActiveHomeProducts = async () => {
  const { rows } = await pool.query(`
    SELECT
      hp.id           AS home_product_id,
      hp.orden,
      p.*
    FROM home_products hp
    JOIN products p ON p.id = hp.product_id
    WHERE hp.activo = true
    ORDER BY hp.orden ASC, hp.id ASC
  `);
  
  // Obtener imágenes para cada producto
  const productsWithImages = await Promise.all(
    rows.map(async (product) => {
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
  
  return productsWithImages;
};

export const getHomeProductsAdmin = async () => {
    const result = await pool.query(`
        SELECT
        hp.id           AS home_product_id,
        hp.orden,
        hp.activo,
        hp.product_id,

        p.nombre,
        p.precio,
        p.imagen_url
        FROM home_products hp
        JOIN products p ON p.id = hp.product_id
        ORDER BY hp.orden
    `);
    return result.rows;
};

// Crear producto destacado en home
const createHomeProduct = async ({ product_id, orden }) => {
    const { rows } = await pool.query(
        `
    INSERT INTO home_products (product_id, orden)
    VALUES ($1, $2)
    RETURNING *
    `,
        [product_id, orden || 0]
    );
    return rows[0];
}

// Actualizar producto destacado en home
const updateHomeProduct = async (id, { product_id, orden, activo }) => {
    const { rows } = await pool.query(
        `
    UPDATE home_products
    SET
        product_id = COALESCE($1, product_id),
        orden      = COALESCE($2, orden),
        activo     = COALESCE($3, activo)
    WHERE id = $4
    RETURNING *
    `,
        [product_id, orden, activo, id]
    );
    return rows[0];
}

// Eliminar producto destacado en home
const deleteHomeProduct = async (id) => {
    await pool.query(`DELETE FROM home_products WHERE id = $1`, [id]);
    return true;
}

// Acticar o desactivar producto destacado en home
const toggleHomeProduct = async (id, activo) => {
    const { rows } = await pool.query(
        `
    UPDATE home_products
    SET activo = $1
    WHERE id = $2
    RETURNING * 
    `,
        [activo, id]
    );
    return rows[0];
}
export {
  getActiveHomeProducts,
  createHomeProduct,
    updateHomeProduct,
    deleteHomeProduct,
    toggleHomeProduct,
};