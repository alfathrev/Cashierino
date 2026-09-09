import { pool, query } from '../db/pool.js';

export async function createTransaction(req, res) {
  const client = await pool.connect();
  try {
    const { items, customer_name, cash_paid, payment_method } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Keranjang belanja tidak boleh kosong.' });
    }

    if (cash_paid === undefined || isNaN(cash_paid)) {
      return res.status(400).json({ success: false, message: 'Nominal pembayaran tidak valid.' });
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Format item pesanan tidak valid.' });
      }

      const prodRes = await client.query('SELECT id, name, price FROM products WHERE id = $1', [item.product_id]);
      if (prodRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: `Produk ID ${item.product_id} tidak ditemukan.` });
      }

      const prod = prodRes.rows[0];
      const itemPrice = parseFloat(prod.price);
      const lineSubtotal = Math.round(itemPrice * item.quantity);
      subtotal += lineSubtotal;

      verifiedItems.push({
        product_id: prod.id,
        product_name: prod.name,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: lineSubtotal
      });
    }

    subtotal = Math.round(subtotal);
    const taxRate = 5.00; // PB 5%
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = Math.round(subtotal + taxAmount);

    const cashPaidNum = parseFloat(cash_paid);
    if (cashPaidNum < totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Uang yang dibayarkan kurang dari total tagihan.`
      });
    }

    const changeAmount = Math.round(cashPaidNum - totalAmount);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randSuffix}`;

    await client.query('BEGIN');

    const cashierId = req.user ? req.user.id : null;
    const cashierName = req.user ? req.user.full_name : 'Kasir CashierIno';

    const transRes = await client.query(
      `INSERT INTO transactions (
        invoice_number, cashier_id, cashier_name, customer_name,
        subtotal, tax_rate, tax_amount, total_amount,
        cash_paid, change_amount, payment_method, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        invoiceNumber, cashierId, cashierName, customer_name || 'Pelanggan Walk-in',
        subtotal, taxRate, taxAmount, totalAmount,
        cashPaidNum, changeAmount, payment_method || 'Cash', 'Completed'
      ]
    );

    const transaction = transRes.rows[0];

    for (const item of verifiedItems) {
      await client.query(
        `INSERT INTO transaction_details (
          transaction_id, product_id, product_name, price, quantity, subtotal
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [transaction.id, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil diselesaikan!',
      transaction: {
        ...transaction,
        items: verifiedItems
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses transaksi.' });
  } finally {
    client.release();
  }
}

export async function getTransactions(req, res) {
  try {
    const { date, search, limit = 100, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = 'SELECT * FROM transactions WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (date) {
      sql += ` AND DATE(created_at) = $${paramIdx++}`;
      params.push(date);
    }

    if (search) {
      sql += ` AND (LOWER(invoice_number) LIKE LOWER($${paramIdx++}) OR LOWER(customer_name) LIKE LOWER($${paramIdx++}) OR LOWER(cashier_name) LIKE LOWER($${paramIdx++}))`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);
    res.json({ success: true, count: result.rows.length, transactions: result.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat transaksi.' });
  }
}

export async function getTransactionById(req, res) {
  try {
    const { id } = req.params;

    let transRes;
    if (isNaN(id)) {
      transRes = await query('SELECT * FROM transactions WHERE invoice_number = $1', [id]);
    } else {
      transRes = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    }

    if (transRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    const transaction = transRes.rows[0];
    const detailsRes = await query('SELECT * FROM transaction_details WHERE transaction_id = $1 ORDER BY id ASC', [transaction.id]);

    res.json({
      success: true,
      transaction: {
        ...transaction,
        items: detailsRes.rows
      }
    });
  } catch (error) {
    console.error('Get transaction by id error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail struk transaksi.' });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const todayRes = await query(`
      SELECT 
        COUNT(*) as today_orders,
        COALESCE(SUM(total_amount), 0) as today_revenue,
        COALESCE(SUM(subtotal), 0) as today_subtotal,
        COALESCE(AVG(total_amount), 0) as avg_ticket
      FROM transactions 
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    const allRes = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM transactions
    `);

    const topItemsRes = await query(`
      SELECT 
        product_name,
        SUM(quantity) as total_sold,
        SUM(subtotal) as total_sales
      FROM transaction_details
      GROUP BY product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    const recentRes = await query(`
      SELECT id, invoice_number, customer_name, total_amount, payment_method, status, created_at
      FROM transactions
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        today: todayRes.rows[0],
        lifetime: allRes.rows[0],
        top_items: topItemsRes.rows,
        recent_transactions: recentRes.rows
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat statistik keuangan.' });
  }
}

// Auto-cleanup rule: Hapus transaksi yang lebih dari 1 Bulan (30 Hari)
export async function cleanupOldTransactions(req, res) {
  try {
    console.log('🧹 Menjalankan pembersihan data transaksi lebih dari 1 bulan (30 hari)...');
    
    // Support both PostgreSQL and SQLite
    let deleteQuery = `DELETE FROM transactions WHERE created_at < NOW() - INTERVAL '30 days'`;
    try {
      await query(deleteQuery);
    } catch {
      // SQLite fallback syntax
      await query(`DELETE FROM transactions WHERE created_at < DATETIME('now', '-30 days')`);
    }

    if (res) {
      res.json({ success: true, message: 'Data transaksi lebih dari 1 bulan berhasil dibersihkan.' });
    }
  } catch (error) {
    console.error('Cleanup old transactions error:', error);
    if (res) {
      res.status(500).json({ success: false, message: 'Gagal membersihkan data transaksi lama.' });
    }
  }
}

// Export data transaksi ke Spreadsheet format CSV
export async function exportTransactionsCsv(req, res) {
  try {
    const result = await query(`
      SELECT 
        t.invoice_number,
        t.created_at,
        t.customer_name,
        t.cashier_name,
        t.payment_method,
        t.subtotal,
        t.tax_amount,
        t.total_amount,
        t.cash_paid,
        t.change_amount,
        t.status
      FROM transactions t
      ORDER BY t.created_at DESC
    `);

    // Build CSV with UTF-8 BOM for Microsoft Excel compatibility
    let csv = '\uFEFF';
    csv += 'No Invoice,Tanggal & Waktu,Nama Pelanggan,Kasir,Metode Pembayaran,Subtotal (Rp),Pajak Resto 5% (Rp),Total Transaksi (Rp),Uang Diterima (Rp),Kembalian (Rp),Status\n';

    for (const row of result.rows) {
      const dateStr = row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-';
      const cleanCustomer = (row.customer_name || '').replace(/,/g, ' ');
      const cleanCashier = (row.cashier_name || '').replace(/,/g, ' ');
      csv += `"${row.invoice_number}","${dateStr}","${cleanCustomer}","${cleanCashier}","${row.payment_method}",${Math.round(row.subtotal)},${Math.round(row.tax_amount)},${Math.round(row.total_amount)},${Math.round(row.cash_paid)},${Math.round(row.change_amount)},"${row.status}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan_Transaksi_CashierIno_${new Date().toISOString().slice(0, 10)}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengekspor laporan transaksi.' });
  }
}
