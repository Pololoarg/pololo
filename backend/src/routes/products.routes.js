import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  searchProducts,
  getSizesByType,
  getProductSizes,
  updateProductSizes
} from "../controllers/products.controller.js";

import { upload } from "../config/upload.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

/* =========================
   PÚBLICO
========================= */

// listado (puede filtrar por category)
router.get("/", getProducts);

// búsqueda por nombre
router.get("/search", searchProducts);

// talles por tipo (ANTES de /:id para que no lo confunda)
router.get("/sizes/type/:type", getSizesByType);

// detalle
router.get("/:id", getProductById);

// talles de un producto
router.get("/:id/sizes", getProductSizes);

/* =========================
   ADMIN
========================= */

router.post("/", verifyToken, upload.array("images", 5), createProduct);
router.put("/:id", verifyToken, upload.array("images", 5), updateProduct);
router.put("/:id/sizes", verifyToken, updateProductSizes);
router.delete("/:id/images/:imageId", verifyToken, deleteProductImage);
router.delete("/:id", verifyToken, deleteProduct);

export default router;
export { router as productsRoutes };
