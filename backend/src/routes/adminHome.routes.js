import express from 'express';
const router = express.Router();

import { verifyToken } from '../middlewares/auth.middleware.js';
import { authAdmin } from '../middlewares/authAdmin.js';
import { uploadCarousel } from "../middlewares/uploadCarousel.js";

import {
  getCarouselAdmin,
  addCarouselImage,
  editCarouselImage,
  removeCarouselImage,
  toggleCarouselImageActive,
  getAdminHomeProducts,
  addHomeProduct,
  editHomeProduct,
  removeHomeProduct,
} from '../controllers/adminHome.controller.js';

// carrousel images
router.get('/carousel', verifyToken, authAdmin, getCarouselAdmin);
// aceptar dos archivos: 'image' (desktop) y 'image_mobile' (mobile)
router.post('/carousel', verifyToken, authAdmin, uploadCarousel.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image_mobile', maxCount: 1 }
]), addCarouselImage);
router.put('/carousel/:id', verifyToken, authAdmin, editCarouselImage);
router.delete('/carousel/:id', verifyToken, authAdmin, removeCarouselImage);
router.patch("/carousel/:id/toggle",verifyToken,authAdmin,toggleCarouselImageActive);


// featured products
router.get('/products', verifyToken, authAdmin, getAdminHomeProducts);
router.post('/products', verifyToken, authAdmin, addHomeProduct);
router.put('/products/:id', verifyToken, authAdmin, editHomeProduct);
router.delete('/products/:id', verifyToken, authAdmin, removeHomeProduct);

export default router;
