# [PRD] POS Dashboard - Antigravity Agent Configuration
> **Mode:** `--prd`
> **Context:** BMad Method for Agentic Workflow (PRD → Architecture → Stories → Dev → QA)

## 1. Executive Summary
- **Project:** Web-Based POS (Point of Sale) System
- **Problem Statement:** Membutuhkan sistem kasir responsif yang mempercepat proses checkout, memiliki perhitungan kembalian otomatis (smart change), manajemen inventaris dengan database serverless (Neon DB), dan antarmuka dengan tema warna yang dapat disesuaikan.
- **Success Metrics:** Transaksi responsif, UI tidak pecah di mobile/tablet, kalkulasi kembalian 100% akurat, dan pergantian tema warna berjalan mulus tanpa mengganggu performa.

## 2. Technical Specifications & Tool Requirements
- **Frontend:** React.tsx, Tailwind CSS (untuk dinamisasi tema warna), react-hook-form (dengan alias `register` menjadi `login`).
- **Backend:** Java (Spring Boot) terintegrasi dengan REST API (atau framework pilihan lainnya).
- **Database:** Neon DB (Serverless PostgreSQL).
- **Platform:** Web Application (Desktop, Tablet, Mobile).

## 3. User Personas
- **Kasir:** Melakukan input transaksi, memilih menu, memasukkan nominal pembayaran, menerima kalkulasi kembalian, dan dapat menyesuaikan tema warna dashboard sesuai preferensi visual.
- **Admin:** Mengelola inventaris produk, mengontrol akses (login), dan memantau riwayat keuangan.

## 4. Phase Implementation (Agent Workflow)
*Catatan untuk AI Agent (Architect & Dev): Kerjakan berdasarkan urutan fase ini.*

### Phase 1: Database & Backend Foundations
- **Neon DB Connection String (HARDCODED FOR AGENT):** 
  `DATABASE_URL="postgresql://neondb_owner:npg_h9Wa1q1DJTjS@ep-patient-shape-b36x8yuj-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"`
- Gunakan connection string di atas untuk inisialisasi koneksi `.env` secara otomatis pada backend.
- Buat skema tabel: `Users` (Role: Admin/Kasir), `Products` (Locked enum: Makanan, Minuman), `Transactions`, `Transaction_Details`.
- Implementasi REST API untuk autentikasi dan CRUD dasar.

### Phase 2: Frontend Layout, Authentication & Theme Provider
- Setup React.tsx dan Tailwind CSS.
- **Theme Provider:** Implementasikan sistem *theming* (menggunakan Context API atau konfigurasi Tailwind) untuk mendukung perpindahan warna secara dinamis.
  - **Color Palette (Nuansa Soft/Pastel):** Soft Blue, Soft Purple, Soft Green, Soft Orange, Soft Yellow.
- Implementasi halaman Login (Wajib sebelum akses sistem). Form menggunakan `useForm` dengan alias `login`.
- Buat layout utama: Sidebar, Top Filter, Main Grid, dan Order Cart. Tambahkan toggle/opsi di *Settings* untuk mengubah tema warna.

### Phase 3: Core POS Features (Dashboard & Cart)
- Render daftar produk dari API ke UI Grid.
- Filter Kategori: Hanya ada opsi 'Makanan' dan 'Minuman'.
- Implementasi State Keranjang (Cart): Tambah item, hapus item, tambah jumlah (x2, x3), hitung Subtotal dan Pajak. Aksen warna UI akan mengikuti tema yang dipilih.

### Phase 4: Smart Payment & Universal Numpad
- **Smart Change Calculation:** Kalkulasi kembalian otomatis saat input pembayaran tanpa perlu dihitung manual.
- **Universal Numpad:** 
  - Sediakan UI On-Screen Numpad di dalam pop-up pembayaran (optimal untuk Mobile/Tablet).
  - Untuk Desktop, sistem wajib listen pada `keydown` event sehingga kasir bisa langsung mengetik menggunakan physical keyboard.

### Phase 5: Keuangan & Riwayat Transaksi (Bills)
- Halaman/Dashboard Keuangan untuk melihat riwayat struk/transaksi sukses dan total pendapatan harian.

## 5. User Stories & Acceptance Criteria
- **US-001 [Auth]:** Sebagai kasir, saya harus login agar bisa masuk ke dashboard utama.
- **US-002 [Order]:** Sebagai kasir, saya bisa memfilter dan menambahkan makanan/minuman ke Order Menu.
- **US-003 [Payment]:** Sebagai kasir, saya memasukkan uang tunai pelanggan dan sistem langsung memberitahu kembaliannya.
- **US-004 [Numpad]:** Sebagai kasir di berbagai device, saya bisa menggunakan virtual numpad atau physical keyboard untuk memasukkan angka.
- **US-005 [Theme]:** Sebagai pengguna, saya bisa mengubah aksen warna aplikasi menjadi Biru Soft, Ungu Soft, Hijau Soft, Oranye Soft, atau Kuning Soft melalui menu Settings.
