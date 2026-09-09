import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing database schema on Neon DB...');
    await client.query('BEGIN');

    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Kasir')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Products table (Locked enum: Makanan, Minuman)
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(20) NOT NULL CHECK (category IN ('Makanan', 'Minuman')),
        subcategory VARCHAR(50) DEFAULT 'General',
        price DECIMAL(12, 2) NOT NULL,
        image_url TEXT,
        is_new BOOLEAN DEFAULT FALSE,
        is_popular BOOLEAN DEFAULT TRUE,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        cashier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        cashier_name VARCHAR(100) NOT NULL,
        customer_name VARCHAR(100) DEFAULT 'Pelanggan Umum',
        subtotal DECIMAL(12, 2) NOT NULL,
        tax_rate DECIMAL(5, 2) DEFAULT 5.00,
        tax_amount DECIMAL(12, 2) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        cash_paid DECIMAL(12, 2) NOT NULL,
        change_amount DECIMAL(12, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        status VARCHAR(20) DEFAULT 'Completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Transaction_Details table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transaction_details (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(100) NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        subtotal DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default users if empty
    const userRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial users (admin & kasir)...');
      const adminHash = await bcrypt.hash('admin123', 10);
      const kasirHash = await bcrypt.hash('kasir123', 10);

      await client.query(
        `INSERT INTO users (username, password_hash, full_name, role) VALUES 
         ($1, $2, $3, $4),
         ($5, $6, $7, $8)`,
        [
          'admin', adminHash, 'Administrator CashierIno', 'Admin',
          'kasir', kasirHash, 'Fino (Kasir Shift 1)', 'Kasir'
        ]
      );
      console.log('✅ Default users created: admin/admin123, kasir/kasir123');
    }

    // Seed default products if empty
    const prodRes = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial products matching DesignCashierFino...');
      const defaultProducts = [
        {
          name: 'Triple Burger',
          category: 'Makanan',
          subcategory: 'Burger',
          price: 5.48,
          image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Double Cheese',
          category: 'Makanan',
          subcategory: 'Burger',
          price: 4.99,
          image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Cheese Burger',
          category: 'Makanan',
          subcategory: 'Burger',
          price: 4.40,
          image_url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Origin Burger',
          category: 'Makanan',
          subcategory: 'Burger',
          price: 4.59,
          image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80',
          is_new: true,
          is_popular: true
        },
        {
          name: 'Chicken Pop3',
          category: 'Makanan',
          subcategory: 'Hot',
          price: 5.48,
          image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80',
          is_new: true,
          is_popular: true
        },
        {
          name: 'Happy Breakfast',
          category: 'Makanan',
          subcategory: 'Hot',
          price: 6.00,
          image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Kebab Katsu',
          category: 'Makanan',
          subcategory: 'Snack',
          price: 5.49,
          image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Chicken Nugget',
          category: 'Makanan',
          subcategory: 'Snack',
          price: 2.00,
          image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Italian Supreme Pizza',
          category: 'Makanan',
          subcategory: 'Pizza',
          price: 8.50,
          image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'French Fries Crispy',
          category: 'Makanan',
          subcategory: 'Snack',
          price: 2.50,
          image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Coffee Latte',
          category: 'Minuman',
          subcategory: 'Coffee',
          price: 1.20,
          image_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Iced Americano',
          category: 'Minuman',
          subcategory: 'Coffee',
          price: 1.10,
          image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Matcha Green Tea',
          category: 'Minuman',
          subcategory: 'Soft Drink',
          price: 1.50,
          image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=80',
          is_new: true,
          is_popular: true
        },
        {
          name: 'Classic Coca Cola',
          category: 'Minuman',
          subcategory: 'Soft Drink',
          price: 1.00,
          image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Vanilla Soft Cone',
          category: 'Minuman',
          subcategory: 'Ice Cream',
          price: 1.25,
          image_url: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        },
        {
          name: 'Choco Sundae Delight',
          category: 'Minuman',
          subcategory: 'Ice Cream',
          price: 1.75,
          image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop&q=80',
          is_new: false,
          is_popular: true
        }
      ];

      for (const p of defaultProducts) {
        await client.query(
          `INSERT INTO products (name, category, subcategory, price, image_url, is_new, is_popular)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [p.name, p.category, p.subcategory, p.price, p.image_url, p.is_new, p.is_popular]
        );
      }
      console.log(`✅ Seeded ${defaultProducts.length} default products.`);
    }

    await client.query('COMMIT');
    console.log('🎉 Database initialization completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('init.js')) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
