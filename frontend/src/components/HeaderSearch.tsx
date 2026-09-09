import React from 'react';
import { Search, ShoppingBag } from 'lucide-react';

interface HeaderSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenCartMobile?: () => void;
  cartItemCount?: number;
}

export const HeaderSearch: React.FC<HeaderSearchProps> = ({
  search,
  onSearchChange,
  onOpenCartMobile,
  cartItemCount = 0,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
            Menu Category
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Pilih makanan atau minuman untuk pesanan
          </p>
        </div>

        {/* Mobile/Tablet Cart Button */}
        {onOpenCartMobile && (
          <button
            type="button"
            onClick={onOpenCartMobile}
            className="xl:hidden relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-theme-primary text-white font-black text-xs shadow-btn active:scale-95 transition-all"
            title="Buka Keranjang Pesanan"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span>Pesanan</span>
            {cartItemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-theme-primary flex items-center justify-center text-[10px] font-black shadow-xs">
                {cartItemCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-72 md:w-80">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari makanan, minuman..."
          className="w-full pl-11 pr-8 py-2.5 sm:py-3 bg-white border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-theme-ring focus:border-theme-border shadow-card transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
