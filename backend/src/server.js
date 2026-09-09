import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import { initDbConnection } from './db/pool.js';
import { cleanupOldTransactions } from './controllers/transactionController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);

// Root & Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'CashierIno POS Backend REST API',
    database: 'Neon DB (PostgreSQL)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'CashierIno POS Backend REST API',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server (only in standalone / local mode, not in Vercel serverless)
if (process.env.VERCEL !== '1') {
  async function startServer() {
    try {
      await initDbConnection();
      await cleanupOldTransactions();
      setInterval(cleanupOldTransactions, 24 * 60 * 60 * 1000);

      app.listen(PORT, () => {
        console.log(`🚀 CashierIno Backend Server running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
}

export default app;

