import {pool} from '../config/db.js'; // ajustá la ruta si tu pool está en otro lado

// Obtener carrusel activo ordenado (para el frontend público)
const getActiveCarousel = async () => {
  const { rows } = await pool.query(`
    SELECT id, imagen_url, imagen_mobile_url, titulo, orden
    FROM home_carousel
    WHERE activo = true
    ORDER BY orden ASC, id ASC
  `);
  return rows;
};

// Obtener todo el carrusel para el admin (activos e inactivos)
const getAllCarousel = async () => {
  const { rows } = await pool.query(`
    SELECT id, imagen_url, imagen_mobile_url, titulo, orden, activo
    FROM home_carousel
    ORDER BY orden ASC, id ASC
  `);
  return rows;
};

// Crear imagen de carrusel
const createCarouselImage = async ({ imagen_url, imagen_mobile_url, titulo, orden }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO home_carousel (imagen_url, imagen_mobile_url, titulo, orden)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [imagen_url, imagen_mobile_url || null, titulo || null, orden || 0]
  );
  return rows[0];
};

const toggleCarousel = async (id, activo) => {
  const { rows } = await pool.query(
    `
    UPDATE home_carousel
    SET activo = $1
    WHERE id = $2
    RETURNING *
    `,
    [activo, id]
  );

  return rows[0];
};

// Actualizar imagen de carrusel
const updateCarouselImage = async (id, { imagen_url, imagen_mobile_url, titulo, orden, activo }) => {
  const { rows } = await pool.query(
    `
    UPDATE home_carousel
    SET
      imagen_url = COALESCE($1, imagen_url),
      imagen_mobile_url = COALESCE($2, imagen_mobile_url),
      titulo     = COALESCE($3, titulo),
      orden      = COALESCE($4, orden),
      activo     = COALESCE($5, activo)
    WHERE id = $6
    RETURNING *
    `,
    [imagen_url, imagen_mobile_url, titulo, orden, activo, id]
  );
  return rows[0];
};

// Eliminar imagen de carrusel
const deleteCarouselImage = async (id) => {
  await pool.query(`DELETE FROM home_carousel WHERE id = $1`, [id]);
  return true;
};

// Obtener imagen por id
const getCarouselById = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM home_carousel WHERE id = $1`, [id]);
  return rows[0];
};

// Limpiar un campo de imagen (imagen_url o imagen_mobile_url) sin eliminar la fila
const clearCarouselField = async (id, field) => {
  if (!['imagen_url', 'imagen_mobile_url'].includes(field)) {
    throw new Error('Campo inválido');
  }

  const query = `UPDATE home_carousel SET ${field} = NULL WHERE id = $1 RETURNING *`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

export {
  getActiveCarousel,
  getAllCarousel,
  createCarouselImage,
  updateCarouselImage,
  deleteCarouselImage,
  toggleCarousel,
  getCarouselById,
  clearCarouselField
};
*** End Patch
