import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  getDashboardStats,
  cleanupOldTransactions,
  exportTransactionsCsv
} from '../controllers/transactionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Export CSV can be accessed directly or with token
router.get('/export', exportTransactionsCsv);

router.use(authenticateToken);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/stats', getDashboardStats);
router.post('/cleanup', cleanupOldTransactions);
router.get('/:id', getTransactionById);

export default router;
