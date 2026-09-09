import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { useTheme } from '../context/ThemeContext';
import { deleteProductApi } from '../services/api';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Utensils,
  CupSoda,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Package
} from 'lucide-react';

interface ProductManagementViewProps {
  products: Product[];
  isLoading: boolean;
  onRefreshProducts: () => void;
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
}

export const ProductManagementView: React.FC<ProductManagementViewProps> = ({
  products,
  isLoading,
  onRefreshProducts,
  onOpenAddProduct,
  onEditProduct,
}) => {
  const { formatMoney, playSound } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const categoryCounts = useMemo(() => {
    return {
      all: products.length,
      makanan: products.filter((p) => p.category === 'Makanan').length,
      minuman: products.filter((p) => p.category === 'Minuman').length,
    };
  }, [products]);

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Yakin ingin menghapus menu "${prod.name}" dari sistem POS?`)) return;

    try {
      const res = await deleteProductApi(prod.id);
      if (res.success) {
        playSound('delete');
        setNotice({ type: 'success', text: `Menu "${prod.name}" berhasil dihapus.` });
        onRefreshProducts();
        setTimeout(() => setNotice(null), 3500);
      } else {
        setNotice({ type: 'error', text: res.message || 'Gagal menghapus produk.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Gagal menghapus produk.' });
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 select-none animate-slide-up">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-theme-primary" />
            <span>Daftar & Kelola Menu</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Lihat seluruh menu yang terdaftar di POS. Anda dapat menambah, mengedit harga/foto, atau menghapus menu.
          </p>
        </div>

        {/* Primary Call to Action: Tambah Menu Baru */}
        <button
          type="button"
          onClick={onOpenAddProduct}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white font-black text-xs sm:text-sm shadow-btn hover:shadow-lg transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          <span>+ Tambah Menu Baru</span>
        </button>
      </div>

      {/* Notice Alert if any */}
      {notice && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-slide-up ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua ({categoryCounts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('Makanan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
              selectedCategory === 'Makanan'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Makanan ({categoryCounts.makanan})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('Minuman')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
              selectedCategory === 'Minuman'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
          >
            <CupSoda className="w-3.5 h-3.5" />
            <span>Minuman ({categoryCounts.minuman})</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama menu produk..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-ring shadow-xs"
          />
        </div>
      </div>

      {/* Product List Cards / Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-800 text-sm sm:text-base">
            Daftar Produk POS ({filteredProducts.length} menu)
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            Tersedia untuk kasir
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold animate-pulse">
            Memuat daftar produk...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="font-black text-sm text-slate-700">Tidak ada produk ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm ? 'Coba ubah kata kunci pencarian Anda.' : 'Tambahkan menu baru sekarang agar tampil di kasir.'}
            </p>
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="mt-2 px-4 py-2 rounded-xl bg-theme-primary text-white font-black text-xs shadow-btn hover:bg-theme-primary-hover transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu Baru</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                {/* Left: Product Info & Image */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-black text-sm sm:text-base text-slate-800 truncate">
                        {prod.name}
                      </h4>

                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          prod.category === 'Makanan'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {prod.category}
                      </span>

                      {prod.is_new && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md inline-flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>New</span>
                        </span>
                      )}
                    </div>

                    <p className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      {formatMoney(prod.price)}
                    </p>
                  </div>
                </div>

                {/* Right: Clear Action Buttons (Edit & Delete) */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onEditProduct(prod)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition-colors shadow-2xs active:scale-95"
                    title="Ubah info / harga produk"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Menu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(prod)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-xs transition-colors border border-rose-200/60 shadow-2xs active:scale-95"
                    title="Hapus menu dari POS"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
