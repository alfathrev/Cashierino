import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ChevronDown, UtensilsCrossed, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onOpenAddProduct?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  sortBy,
  onSortChange,
  onOpenAddProduct,
}) => {
  const { cart, addToCart } = useCart();

  const getProductQuantity = (id: number) => {
    const item = cart.find((c) => c.product.id === id);
    return item ? item.quantity : 0;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Subheader: Choose Order & Sort By */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Choose Order
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {products.length} menu siap dipesan
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative inline-flex items-center bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-400 mr-2">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none bg-transparent pr-6 pl-1 py-0.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="popular">Terpopuler</option>
              <option value="price-asc">Harga Termurah</option>
              <option value="price-desc">Harga Tertinggi</option>
              <option value="name">Nama Menu</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {onOpenAddProduct && (
            <button
              onClick={onOpenAddProduct}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-theme-primary-light hover:bg-theme-border text-theme-primary font-bold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 h-60 animate-pulse flex flex-col items-center justify-between border border-slate-100"
            >
              <div className="w-28 h-28 rounded-full bg-slate-100" />
              <div className="w-3/4 h-4 bg-slate-100 rounded-full" />
              <div className="w-1/2 h-3 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex-1 min-h-[320px] flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-8 h-8 stroke-[1.5] text-slate-300" />
          </div>
          <p className="font-bold text-sm text-slate-700">Belum ada menu di kategori ini</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Gunakan tombol Tambah Produk untuk menambahkan menu makanan atau minuman baru.
          </p>
          {onOpenAddProduct && (
            <button
              onClick={onOpenAddProduct}
              className="mt-4 px-4 py-2 rounded-xl bg-theme-primary text-white font-bold text-xs shadow-btn hover:bg-theme-primary-hover transition-all"
            >
              + Tambah Menu Baru Sekarang
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
              cartQuantity={getProductQuantity(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
