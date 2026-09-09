import { query } from '../db/pool.js';

export async function getProducts(req, res) {
  try {
    const { category, subcategory, search, sort } = req.query;

    let sql = 'SELECT * FROM products WHERE is_available = true';
    const params = [];
    let paramIndex = 1;

    // Filter locked enum category: Makanan / Minuman
    if (category && (category === 'Makanan' || category === 'Minuman')) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    // Filter subcategory (Burger, Pizza, Snack, Hot, etc.)
    if (subcategory && subcategory !== 'All' && subcategory !== 'Semua') {
      sql += ` AND LOWER(subcategory) = LOWER($${paramIndex++})`;
      params.push(subcategory);
    }

    // Search keyword
    if (search) {
      sql += ` AND (LOWER(name) LIKE LOWER($${paramIndex++}) OR LOWER(subcategory) LIKE LOWER($${paramIndex++}))`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // Sorting
    if (sort === 'price-asc') {
      sql += ' ORDER BY price ASC';
    } else if (sort === 'price-desc') {
      sql += ' ORDER BY price DESC';
    } else if (sort === 'name') {
      sql += ' ORDER BY name ASC';
    } else {
      // Default: Popular or New first
      sql += ' ORDER BY is_popular DESC, is_new DESC, id ASC';
    }

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data produk dari database.' });
  }
}

export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Get product by id error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail produk.' });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, category, subcategory, price, image_url, is_new, is_popular } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Nama, kategori, dan harga wajib diisi.' });
    }

    // Locked enum validation according to PRD
    if (category !== 'Makanan' && category !== 'Minuman') {
      return res.status(400).json({
        success: false,
        message: "Kategori terkunci: hanya boleh 'Makanan' atau 'Minuman'."
      });
    }

    const result = await query(
      `INSERT INTO products (name, category, subcategory, price, image_url, is_new, is_popular)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name.trim(),
        category,
        subcategory || 'General',
        parseFloat(price),
        image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
        Boolean(is_new),
        Boolean(is_popular)
      ]
    );

    res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan.', product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyimpan produk baru.' });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, category, subcategory, price, image_url, is_new, is_popular, is_available } = req.body;

    if (category && category !== 'Makanan' && category !== 'Minuman') {
      return res.status(400).json({
        success: false,
        message: "Kategori terkunci: hanya boleh 'Makanan' atau 'Minuman'."
      });
    }

    const result = await query(
      `UPDATE products SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        subcategory = COALESCE($3, subcategory),
        price = COALESCE($4, price),
        image_url = COALESCE($5, image_url),
        is_new = COALESCE($6, is_new),
        is_popular = COALESCE($7, is_popular),
        is_available = COALESCE($8, is_available)
       WHERE id = $9 RETURNING *`,
      [name, category, subcategory, price, image_url, is_new, is_popular, is_available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Produk berhasil diperbarui.', product: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui produk.' });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
  }
}
