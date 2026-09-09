import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ChevronDown, UtensilsCrossed, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onOpenAddProduct?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  onOpenAddProduct,
}) => {
  const { cart, addToCart } = useCart();

  const getProductQuantity = (id: number) => {
    const item = cart.find((c) => c.product.id === id);
    return item ? item.quantity : 0;
  };

  return (
    <div className="flex-1 flex flex-col">
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
