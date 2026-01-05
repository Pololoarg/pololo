import {
  getActiveCarousel,
} from'../data/homeCarousel.repository.js';

import {
  getActiveHomeProducts,
} from '../data/homeProducts.repository.js';

// GET /api/home
const getHome = async (req, res) => {
  try {
    const carousel = await getActiveCarousel();
    const featuredProducts = await getActiveHomeProducts();

    return res.status(200).json({
      carousel,
      featuredProducts,
    });
  } catch (error) {
    console.error('Error al obtener el home:', error);
    return res.status(500).json({
      message: 'Error al obtener información del home',
    });
  }
};

// GET /api/home/products
const getHomeProducts = async (req, res) => {
  try {
    const products = await getActiveHomeProducts();
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error al obtener productos destacados:', error);
    return res.status(500).json({
      message: 'Error al obtener productos destacados',
    });
  }
};

export{
  getHome,
  getHomeProducts,
};
