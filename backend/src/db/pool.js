import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

export const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

let isInitialized = false;

export async function initDbConnection() {
  if (isInitialized) return;
  
  console.log('📡 Connecting to Neon DB (PostgreSQL Serverless)...');
  try {
    const client = await pgPool.connect();
    console.log('✅ Connected successfully to Neon DB cloud instance!');
    client.release();
    await initPostgresSchema();
    isInitialized = true;
  } catch (err) {
    console.error('⚠️ Neon DB connection notice:', err.message);
  }
}

export async function query(sqlText, params = []) {
  try {
    return await pgPool.query(sqlText, params);
  } catch (err) {
    // If table doesn't exist, try initializing once
    if (err.code === '42P01' && !isInitialized) {
      await initDbConnection();
      return await pgPool.query(sqlText, params);
    }
    throw err;
  }
}

export const pool = {
  query,
  connect: () => pgPool.connect(),
  on: (event, cb) => pgPool.on(event, cb)
};

async function initPostgresSchema() {
  if (!pgPool) return;
  console.log('🔄 Initializing / Verifying tables on Neon DB...');
  
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Kasir')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(20) NOT NULL CHECK (category IN ('Makanan', 'Minuman')),
      subcategory VARCHAR(50) DEFAULT '',
      price NUMERIC(12, 2) NOT NULL,
      image_url TEXT,
      is_new BOOLEAN DEFAULT FALSE,
      is_popular BOOLEAN DEFAULT TRUE,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      cashier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      cashier_name VARCHAR(100) NOT NULL,
      customer_name VARCHAR(100) DEFAULT 'Pelanggan Walk-in',
      subtotal NUMERIC(12, 2) NOT NULL,
      tax_rate NUMERIC(5, 2) DEFAULT 5.00,
      tax_amount NUMERIC(12, 2) NOT NULL,
      total_amount NUMERIC(12, 2) NOT NULL,
      cash_paid NUMERIC(12, 2) NOT NULL,
      change_amount NUMERIC(12, 2) NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'Cash',
      status VARCHAR(20) DEFAULT 'Completed',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_details (
      id SERIAL PRIMARY KEY,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name VARCHAR(100) NOT NULL,
      price NUMERIC(12, 2) NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      subtotal NUMERIC(12, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default users if empty
  const userCheck = await pgPool.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCheck.rows[0].count, 10) === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const kasirHash = await bcrypt.hash('kasir123', 10);
    await pgPool.query(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES 
       ($1, $2, $3, $4),
       ($5, $6, $7, $8)`,
      [
        'admin', adminHash, 'Administrator CashierIno', 'Admin',
        'kasir', kasirHash, 'Fino (Kasir Shift 1)', 'Kasir'
      ]
    );
    console.log('✅ Default users created on Neon DB (admin/admin123, kasir/kasir123)');
  }

  // Check products
  const prodCheck = await pgPool.query('SELECT price FROM products LIMIT 1');
  const needsRupiahSeed = prodCheck.rows.length === 0 || (prodCheck.rows[0] && Number(prodCheck.rows[0].price) < 500);

  if (needsRupiahSeed) {
    console.log('🌱 Seeding products in Indonesian Rupiah on Neon DB...');
    await pgPool.query('DELETE FROM transaction_details');
    await pgPool.query('DELETE FROM transactions');
    await pgPool.query('DELETE FROM products');

    const defaultRupiahProducts = [
      { name: 'Triple Burger Supreme', category: 'Makanan', price: 38000, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Double Cheese Burger', category: 'Makanan', price: 32000, image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Classic Cheese Burger', category: 'Makanan', price: 28000, image_url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Origin Beef Burger', category: 'Makanan', price: 29000, image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80', is_new: true, is_popular: true },
      { name: 'Chicken Pop Spicy', category: 'Makanan', price: 25000, image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80', is_new: true, is_popular: true },
      { name: 'Happy Breakfast Set', category: 'Makanan', price: 35000, image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Kebab Beef Katsu', category: 'Makanan', price: 27000, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Golden Chicken Nugget (6pcs)', category: 'Makanan', price: 20000, image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Italian Meat Pizza Slice', category: 'Makanan', price: 45000, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Kentang Goreng Crispy', category: 'Makanan', price: 18000, image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Coffee Latte Creamy', category: 'Minuman', price: 22000, image_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Iced Americano Fresh', category: 'Minuman', price: 18000, image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Matcha Green Tea Latte', category: 'Minuman', price: 24000, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80', is_new: true, is_popular: true },
      { name: 'Coca-Cola Dingin', category: 'Minuman', price: 10000, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Vanilla Soft Ice Cream Cone', category: 'Minuman', price: 12000, image_url: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true },
      { name: 'Choco Sundae Delight', category: 'Minuman', price: 16000, image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop&q=80', is_new: false, is_popular: true }
    ];

    for (const p of defaultRupiahProducts) {
      await pgPool.query(
        `INSERT INTO products (name, category, price, image_url, is_new, is_popular)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [p.name, p.category, p.price, p.image_url, p.is_new, p.is_popular]
      );
    }
    console.log(`✅ Seeded ${defaultRupiahProducts.length} products with Rupiah pricing on Neon DB.`);
  }
}

