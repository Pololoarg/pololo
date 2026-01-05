import express from 'express';
const router = express.Router();

import { getHome, getHomeProducts } from '../controllers/home.controller.js';

// GET /api/home  (mounted as '/home' in index.routes)
router.get('/', getHome);

// GET /api/home/products (productos destacados públicos)
router.get('/products', getHomeProducts);

export default router;
