import express from 'express';
const router = express.Router();

import { verifyToken } from '../middlewares/auth.middleware.js';
import { authAdmin } from '../middlewares/authAdmin.js';
// Cambiamos el middleware viejo por el de Cloudinary
import { cloudUpload } from "../config/cloudinary.js"; 

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

// Carousel: Usamos cloudUpload para que la foto vaya directo a la nube
router.get('/carousel', verifyToken, authAdmin, getCarouselAdmin);

router.post('/carousel', verifyToken, authAdmin, cloudUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'image_mobile', maxCount: 1 }
]), addCarouselImage);

router.put('/carousel/:id', verifyToken, authAdmin, editCarouselImage);
router.delete('/carousel/:id', verifyToken, authAdmin, removeCarouselImage);
router.patch("/carousel/:id/toggle", verifyToken, authAdmin, toggleCarouselImageActive);

// Featured products
router.get('/products', verifyToken, authAdmin, getAdminHomeProducts);
router.post('/products', verifyToken, authAdmin, addHomeProduct);
router.put('/products/:id', verifyToken, authAdmin, editHomeProduct);
router.delete('/products/:id', verifyToken, authAdmin, removeHomeProduct);

export default router;
