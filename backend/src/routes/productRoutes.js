import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Public / POS view
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected routes (Kasir & Admin dapat kelola inventaris)
router.post('/', authenticateToken, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

export default router;
