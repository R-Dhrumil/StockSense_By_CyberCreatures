import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts
} from '../controllers/product.controller.js';

const router = Router();

router.get('/', getProducts);
router.post('/', createProduct);
router.post('/bulk-import', bulkImportProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
