import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

let activeEngine = 'neon'; // 'neon' | 'sqlite'
let pgPool = null;
let sqliteDb = null;

// Ensure data directory exists for local fallback
const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const sqlitePath = path.join(dataDir, 'pos_database.sqlite');

export async function initDbConnection() {
  console.log('📡 Testing connection to Neon DB (PostgreSQL Serverless)...');
  
  if (process.env.DATABASE_URL) {
    try {
      const testPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      // Probe query
      await testPool.query('SELECT 1');
      console.log('✅ Connected successfully to Neon DB cloud instance!');
      pgPool = testPool;
      activeEngine = 'neon';
      await initPostgresSchema();
      return;
    } catch (err) {
      console.warn('⚠️ Neon DB connection notice:', err.message);
      console.warn('⚡ Using high-performance local SQLite storage (data/pos_database.sqlite) so CashierIno runs 100% reliably out of the box.');
    }
  }

  // Fallback to SQLite
  activeEngine = 'sqlite';
  await new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(sqlitePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  console.log(`💾 Local database ready at: ${sqlitePath}`);
  await initSqliteSchema();
}

function convertPgToSqlite(sql) {
  let converted = sql.replace(/\$\d+/g, '?');
  const returningMatch = converted.match(/\s+RETURNING\s+(\*|id)/i);
  let hasReturning = false;
  if (returningMatch) {
    hasReturning = true;
    converted = converted.replace(/\s+RETURNING\s+(\*|id)/i, '');
  }
  converted = converted.replace(/CURRENT_DATE/gi, "DATE('now')");
  converted = converted.replace(/TIMESTAMP WITH TIME ZONE/gi, "DATETIME");
  converted = converted.replace(/NOW\(\)/gi, "DATETIME('now')");
  return { convertedSql: converted, hasReturning };
}

export async function query(sqlText, params = []) {
  if (activeEngine === 'neon' && pgPool) {
    return pgPool.query(sqlText, params);
  }

  return new Promise((resolve, reject) => {
    const { convertedSql, hasReturning } = convertPgToSqlite(sqlText);
    const trimmed = convertedSql.trim();
    const isSelect = trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA');

    if (isSelect) {
      sqliteDb.all(convertedSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve({ rows: rows || [], rowCount: (rows || []).length });
      });
    } else {
      sqliteDb.run(convertedSql, params, function (err) {
        if (err) return reject(err);
        const lastId = this.lastID;
        const changes = this.changes;

        if (hasReturning && lastId) {
          const tableMatch = convertedSql.match(/INSERT\s+INTO\s+(\w+)/i) || convertedSql.match(/UPDATE\s+(\w+)/i);
          const tableName = tableMatch ? tableMatch[1] : null;
          if (tableName) {
            sqliteDb.get(`SELECT * FROM ${tableName} WHERE id = ?`, [lastId], (err2, row) => {
              if (err2 || !row) {
                resolve({ rows: [{ id: lastId }], rowCount: changes });
              } else {
                resolve({ rows: [row], rowCount: changes });
              }
            });
            return;
          }
        }
        resolve({ rows: lastId ? [{ id: lastId }] : [], rowCount: changes });
      });
    }
  });
}

export const pool = {
  query,
  connect: async () => {
    if (activeEngine === 'neon' && pgPool) {
      return pgPool.connect();
    }
    return {
      query,
      release: () => {}
    };
  },
  on: (event, cb) => {
    if (pgPool) pgPool.on(event, cb);
  }
};

async function initSqliteSchema() {
  const exec = (sql) => new Promise((res, rej) => sqliteDb.exec(sql, (err) => err ? rej(err) : res()));

  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'Kasir')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('Makanan', 'Minuman')),
      subcategory TEXT DEFAULT '',
      price REAL NOT NULL,
      image_url TEXT,
      is_new INTEGER DEFAULT 0,
      is_popular INTEGER DEFAULT 1,
      is_available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      cashier_id INTEGER,
      cashier_name TEXT NOT NULL,
      customer_name TEXT DEFAULT 'Pelanggan Walk-in',
      subtotal REAL NOT NULL,
      tax_rate REAL DEFAULT 5.00,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      cash_paid REAL NOT NULL,
      change_amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'Cash',
      status TEXT DEFAULT 'Completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // Seed default users if needed
  const userCheck = await query('SELECT COUNT(*) as cnt FROM users');
  if (userCheck.rows[0].cnt === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const kasirHash = await bcrypt.hash('kasir123', 10);
    await query(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
      ['admin', adminHash, 'Administrator CashierIno', 'Admin']
    );
    await query(
      `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
      ['kasir', kasirHash, 'Fino (Kasir Shift 1)', 'Kasir']
    );
  }

  // Check if existing products need Rupiah price update
  const sampleProd = await query('SELECT price FROM products LIMIT 1');
  const needsRupiahSeed = sampleProd.rows.length === 0 || (sampleProd.rows[0] && sampleProd.rows[0].price < 500);

  if (needsRupiahSeed) {
    console.log('🌱 Seeding products in standard Indonesian Rupiah (Rp)...');
    await exec('DELETE FROM products');

    const defaultRupiahProducts = [
      // Makanan
      { name: 'Triple Burger Supreme', category: 'Makanan', price: 38000, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Double Cheese Burger', category: 'Makanan', price: 32000, image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Classic Cheese Burger', category: 'Makanan', price: 28000, image_url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Origin Beef Burger', category: 'Makanan', price: 29000, image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80', is_new: 1, is_popular: 1 },
      { name: 'Chicken Pop Spicy', category: 'Makanan', price: 25000, image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80', is_new: 1, is_popular: 1 },
      { name: 'Happy Breakfast Set', category: 'Makanan', price: 35000, image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Kebab Beef Katsu', category: 'Makanan', price: 27000, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Golden Chicken Nugget (6pcs)', category: 'Makanan', price: 20000, image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Italian Meat Pizza Slice', category: 'Makanan', price: 45000, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Kentang Goreng Crispy', category: 'Makanan', price: 18000, image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      
      // Minuman
      { name: 'Coffee Latte Creamy', category: 'Minuman', price: 22000, image_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Iced Americano Fresh', category: 'Minuman', price: 18000, image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Matcha Green Tea Latte', category: 'Minuman', price: 24000, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80', is_new: 1, is_popular: 1 },
      { name: 'Coca-Cola Dingin', category: 'Minuman', price: 10000, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Vanilla Soft Ice Cream Cone', category: 'Minuman', price: 12000, image_url: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 },
      { name: 'Choco Sundae Delight', category: 'Minuman', price: 16000, image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop&q=80', is_new: 0, is_popular: 1 }
    ];

    for (const p of defaultRupiahProducts) {
      await query(
        `INSERT INTO products (name, category, price, image_url, is_new, is_popular)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.name, p.category, p.price, p.image_url, p.is_new, p.is_popular]
      );
    }
    console.log(`✅ Seeded ${defaultRupiahProducts.length} products with Rupiah pricing.`);
  }
}

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

