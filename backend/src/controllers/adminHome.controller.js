import {
    getActiveCarousel,
    getAllCarousel,
    createCarouselImage,
    updateCarouselImage,
    deleteCarouselImage,
    getCarouselById,
    clearCarouselField,
    toggleCarousel
} from '../data/homeCarousel.repository.js';

import { pool } from '../config/db.js';

import {
    getHomeProductsAdmin,
    createHomeProduct,
    updateHomeProduct,
    deleteHomeProduct,
    toggleHomeProduct,
} from '../data/homeProducts.repository.js';

// ==========================================
// CARRUSEL DE IMÁGENES
// ==========================================

// GET /api/admin/home/carousel
const getCarouselAdmin = async (req, res) => {
    try {
        console.log('🔍 Obteniendo carrusel admin...');
        const images = await getAllCarousel();
        return res.status(200).json(images);
    } catch (error) {
        console.error('❌ Error al obtener carrusel admin:', error.message);
        return res.status(500).json({
            message: 'Error al obtener carrusel',
            error: error.message
        });
    }
};

// POST /api/admin/home/carousel
const addCarouselImage = async (req, res) => {
  try {
    const files = req.files || {};

    if ((!files.image || files.image.length === 0) && (!files.image_mobile || files.image_mobile.length === 0)) {
      return res.status(400).json({ message: "No se envió ninguna imagen" });
    }

    const { titulo, orden } = req.body;

    const imageFile = files.image && files.image[0];
    const mobileFile = files.image_mobile && files.image_mobile[0];

    // USAMOS .path PORQUE CLOUDINARY DEVUELVE LA URL COMPLETA AHÍ
    const imagePath = imageFile ? imageFile.path : null;
    const mobilePath = mobileFile ? mobileFile.path : null;

    const newImage = await createCarouselImage({
      imagen_url: imagePath, // URL de Cloudinary
      imagen_mobile_url: mobilePath, // URL de Cloudinary
      titulo,
      orden,
    });

    return res.status(201).json(newImage);
  } catch (error) {
    console.error("Error creando imagen carrusel:", error);
    return res.status(500).json({ message: "Error creando imagen carrusel" });
  }
};

// PUT /api/admin/home/carousel/:id
const editCarouselImage = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await updateCarouselImage(id, req.body);
        return res.status(200).json(image);
    } catch (error) {
        console.error('Error al actualizar imagen del carrusel:', error);
        return res.status(500).json({ message: 'Error al actualizar imagen del carrusel' });
    } 
};

// DELETE /api/admin/home/carousel/:id
const removeCarouselImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { field } = req.query; // opcional: imagen_url | imagen_mobile_url

        if (field) {
          // Validar campo
          if (!['imagen_url','imagen_mobile_url'].includes(field)) {
            return res.status(400).json({ message: 'Campo inválido' });
          }

          // Simplemente limpiamos el campo en la DB. 
          // Ya no intentamos borrar el archivo físico porque está en Cloudinary.
          const updated = await clearCarouselField(id, field);
          return res.status(200).json(updated);
        }

        // Eliminar fila completa de la DB
        await deleteCarouselImage(id);
        return res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar imagen del carrusel:', error);
        return res.status(500).json({ message: 'Error al eliminar imagen del carrusel' });
    } 
};

// PATCH /api/admin/home/carousel/:id/toggle
const toggleCarouselImageActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const image = await toggleCarousel(id, activo);
    return res.status(200).json(image);

  } catch (error) {
    console.error("Error toggle carrusel:", error);
    return res.status(500).json({ message: "Error toggle carrusel" });
  }
};

// ==========================================
// PRODUCTOS DESTACADOS
// ==========================================

// GET /api/admin/home/products
const getAdminHomeProducts = async (req, res) => {
    try {
        const products = await getHomeProductsAdmin();
        return res.status(200).json(products);
    } catch (error) {
        console.error('Error al obtener productos destacados admin:', error);
        return res.status(500).json({
            message: 'Error al obtener productos destacados',
        });
    }
};

// POST /api/admin/home/products
const addHomeProduct = async (req, res) => {
  try {
    const { product_id, orden } = req.body || {};

    if (!product_id) {
      return res.status(400).json({ message: "product_id es obligatorio" });
    }

    const product = await createHomeProduct({ product_id, orden });
    return res.status(201).json(product);

  } catch (error) {
    console.error('Error al agregar producto destacado:', error);
    return res.status(500).json({ message: 'Error al agregar producto destacado' });
  }
};

// PUT /api/admin/home/products/:id
const editHomeProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.body || Object.keys(req.body).length === 0) {
         return res.status(400).json({ message: "No hay datos para actualizar" });}

        const product = await updateHomeProduct(id, req.body);
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error al actualizar producto destacado:', error);
        return res.status(500).json({ message: 'Error al actualizar producto destacado' });
    }
};

// DELETE /api/admin/home/products/:id
const removeHomeProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteHomeProduct(id);
        return res.status(204).send();
    }  catch (error) {
        console.error('Error al eliminar producto destacado:', error);
        return res.status(500).json({ message: 'Error al eliminar producto destacado' });
    }
};

// PATCH /api/admin/home/products/:id/toggle
const toggleHomeProductActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body || {};

    if (typeof activo !== "boolean") {
      return res.status(400).json({ message: "activo debe ser booleano" });
    }

    const product = await toggleHomeProduct(id, activo);
    return res.status(200).json(product);

  } catch (error) {
    console.error('Error al activar/desactivar producto destacado:', error);
    return res.status(500).json({ message: 'Error al activar/desactivar producto destacado' });
  }
};

export {
    getCarouselAdmin,
    addCarouselImage,
    editCarouselImage,
    removeCarouselImage,
    toggleCarouselImageActive,
    getAdminHomeProducts,
    addHomeProduct,
    editHomeProduct,
    removeHomeProduct,
    toggleHomeProductActive,
};