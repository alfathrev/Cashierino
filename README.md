# 🍔 CashierIno POS - Full-Stack Modern Point of Sale System

Sistem Point of Sale (POS) modern berbasis web, dirancang sesuai spesifikasi **PRD.md** dan desain UI/UX **DesignCashierFino.jfif**.

---

## 🚀 Panduan Menjalankan Aplikasi (Ready to Run)

### Cara Termudah (Windows Batch Launcher):
Cukup klik ganda (double-click) file:
👉 **`run-all.bat`** (otomatis menjalankan Backend di port 5000 & Frontend di port 5173).

Atau jalankan secara manual per terminal:

#### 1. Backend REST API (Node.js & Neon DB / Hybrid SQLite)
```bash
cd backend
npm install
node src/server.js
# atau klik ganda run-backend.bat
```
Server berjalan di: `http://localhost:5000`  
Health Check: `http://localhost:5000/api/health`

#### 2. Frontend Application (React.tsx, Vite, Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
# atau klik ganda run-frontend.bat
```
Aplikasi berjalan di: `http://localhost:5173`

---

## 🔑 Kredensial Akun (Demo Login)

Aplikasi dilengkapi tombol cepat (*One-Click Fill*) pada layar Login:
- **Kasir (Shift 1):** `kasir` / `kasir123` (Akses POS, Cart, Checkout, Kembalian, Struk)
- **Admin Owner:** `admin` / `admin123` (Akses Penuh Manajemen & Keuangan)

---

## 🎨 Fitur Utama Sesuai PRD & Design Reference

1. **Desain UI/UX Presisi:**
   - Sidebar navigasi (Logo brand curved M, Home, Dashboard, Messages, Bills, Setting, Log Out).
   - Menu Category dengan ikon horizontal (Hot, Burger, Pizza, Snack, Soft Drink, Coffee, Ice Cream).
   - Search bar terintegrasi dengan filter kategori terkunci (*Locked Enum*: `Makanan` dan `Minuman`).
   - Grid katalog makanan dengan latar belakang melingkar lembut, badge *"New"*, nama menu, dan harga.
   - Panel kanan *"Order Menu"* dengan badge multiplier (`x2`, `x3`), subtotal, PB 5% (pajak restoran), dan tombol utama *"Charge $XX.XX"*.

2. **Smart Payment & Universal Numpad (Phase 4):**
   - Pop-up modal pembayaran cerdas.
   - **Universal Numpad**: Numpad virtual on-screen responsif untuk layar sentuh / tablet / mobile.
   - **Desktop Physical Keyboard**: Kasir di PC/Desktop dapat langsung mengetik nominal menggunakan tombol angka keyboard fisik (`0-9`, `.` , `Backspace`, `Enter`, `Esc`).
   - **Smart Change Calculation**: Kalkulasi kembalian otomatis real-time tanpa hitung manual (peringatan jika uang kurang, highlight jika uang pas/lebih).
   - Quick Cash preset (Uang Pas, nominal pembulatan).

3. **Struk Kasir Termal (Receipt Modal):**
   - No. Invoice unik (`INV-YYYYMMDD-XXXX`), tanggal, nama kasir, nama pelanggan.
   - Rincian item, subtotal, pajak PB 5%, total tagihan, uang tunai diterima, kembalian.
   - Tombol **Cetak Struk** (`window.print()`) siap hubung ke printer termal POS 80mm.

4. **Theming & Soft Color Palette (US-005):**
   - Sistem theme provider dinamis berbasis CSS Variables & Tailwind.
   - Pilihan palet warna pastel/soft:
     - **Coral Red (Mockup Default)**
     - **Soft Blue**
     - **Soft Purple**
     - **Soft Green**
     - **Soft Orange**
     - **Soft Yellow**
   - Opsi mata uang fleksibel: **USD ($)** sesuai mockup atau **IDR (Rp)**.
   - Efek suara audio synthesizer (Web Audio API) untuk feedback kasir.

5. **Keuangan & Riwayat Transaksi (Bills - Phase 5):**
   - Dashboard KPI: Total Pendapatan Hari Ini, Total Transaksi, Rata-rata Penjualan per Struk.
   - Tabel riwayat transaksi dengan pencarian invoice dan tombol preview struk instan.

6. **Form Login (US-001):**
   - Menggunakan `react-hook-form` dengan alias `register` menjadi `login` (`const { register: login, ... } = useForm()`).

---

## 🗄️ Database & Arsitektur Backend

- **Neon DB Connection:**
  `DATABASE_URL="postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"`
- **Hybrid Storage Adapter:**
  Backend secara otomatis mencoba koneksi ke Neon DB Cloud. Jika terjadi kendala kredensial/jaringan, sistem secara transparan beralih ke engine SQLite lokal berkinerja tinggi (`data/pos_database.sqlite`) dengan skema dan kueri SQL identik, menjamin aplikasi **100% Ready to Run** tanpa hambatan.
- **Skema Tabel:**
  - `users`: `id`, `username`, `password_hash`, `full_name`, `role` (Admin / Kasir), `created_at`.
  - `products`: `id`, `name`, `category` (Locked: Makanan / Minuman), `subcategory`, `price`, `image_url`, `is_new`, `is_popular`, `is_available`, `created_at`.
  - `transactions`: `id`, `invoice_number`, `cashier_id`, `cashier_name`, `customer_name`, `subtotal`, `tax_rate`, `tax_amount`, `total_amount`, `cash_paid`, `change_amount`, `payment_method`, `status`, `created_at`.
  - `transaction_details`: `id`, `transaction_id`, `product_id`, `product_name`, `price`, `quantity`, `subtotal`, `created_at`.
