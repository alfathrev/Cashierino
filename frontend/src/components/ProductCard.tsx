import React, { useState } from 'react';
import { Product } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  cartQuantity,
}) => {
  const { formatMoney, playSound } = useTheme();
  const [isAddedAnim, setIsAddedAnim] = useState(false);

  const handleClick = () => {
    onAddToCart(product);
    setIsAddedAnim(true);
    setTimeout(() => setIsAddedAnim(false), 400);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white rounded-3xl p-4 shadow-card hover:shadow-float border border-slate-100/90 hover:border-theme-border flex flex-col items-center justify-between cursor-pointer transition-all duration-300 select-none hover:-translate-y-1.5 active:scale-95 ${
        isAddedAnim ? 'ring-2 ring-theme-primary scale-98' : ''
      }`}
    >
      {/* Badge "New" if marked */}
      {product.is_new ? (
        <span className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs z-10 animate-pulse">
          New
        </span>
      ) : null}

      {/* Cart quantity indicator badge */}
      {cartQuantity && cartQuantity > 0 ? (
        <span className="absolute top-3 left-3 bg-theme-primary text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-btn z-10 animate-bounce">
          {cartQuantity}
        </span>
      ) : null}

      {/* Soft circular background with food image matching DesignCashierFino */}
      <div className="relative w-32 h-32 my-1 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#FFF5E9] to-[#FFEBD4] opacity-90 scale-95 group-hover:scale-105 transition-transform duration-300 shadow-inner" />
        <img
          src={product.image_url}
          alt={product.name}
          className="relative w-28 h-28 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 rounded-full"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=60';
          }}
        />
      </div>

      {/* Product Information - Tampil 2 baris penuh tanpa terpotong */}
      <div className="text-center w-full mt-2">
        <h3 className="font-black text-slate-800 text-sm group-hover:text-theme-primary transition-colors line-clamp-2 min-h-[2.6rem] flex items-center justify-center leading-snug px-1">
          {product.name}
        </h3>
        <p className="text-slate-500 font-black text-sm mt-1">
          {formatMoney(product.price)}
        </p>
      </div>

      {/* Hover Quick Add Indicator */}
      <div className="mt-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full transition-colors ${
          isAddedAnim
            ? 'bg-emerald-500 text-white shadow-xs'
            : 'text-theme-primary bg-theme-primary-light group-hover:bg-theme-primary group-hover:text-white'
        }`}>
          {isAddedAnim ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Ditambahkan
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[3]" /> Tambah
            </>
          )}
        </span>
      </div>
    </div>
  );
};
