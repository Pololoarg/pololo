import { Router } from "express";
import { getProducts, 
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/products.controller.js";
import { upload } from '../config/upload.js';


const router = Router();

// GET /api/products  (mounted as '/products' in index.routes)
// expose root here
router.get("/", getProducts);

router.get("/:id", getProductById);

// público (listado / detalle)
router.get('/', getProducts);
router.get('/:id', getProductById);

// admin (CRUD) con subida de imagen
router.post('/', upload.single('image'), createProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);


export default router;


export { router as productsRoutes };