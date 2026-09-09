import express from 'express';
import { login, getProfile, getUsers } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/users', authenticateToken, getUsers);

export default router;
