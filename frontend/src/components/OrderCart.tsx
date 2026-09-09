import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Plus, Minus, Trash2, ShoppingBag, X } from 'lucide-react';

interface OrderCartProps {
  onOpenPayment: () => void;
  onCloseMobile?: () => void;
}

export const OrderCart: React.FC<OrderCartProps> = ({ onOpenPayment, onCloseMobile }) => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,
    customerName,
    setCustomerName
  } = useCart();
  const { formatMoney } = useTheme();
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  return (
    <div className="w-full sm:w-96 xl:w-96 bg-white border-l border-slate-100 flex flex-col h-full shrink-0 shadow-[-2px_0_16px_rgba(0,0,0,0.03)] select-none">
      {/* Header */}
      <div className="p-5 sm:p-6 pb-4 border-b border-slate-100/80 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Order Menu
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {isEditingCustomer ? (
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onBlur={() => setIsEditingCustomer(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingCustomer(false)}
                autoFocus
                className="text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-theme-primary font-bold text-slate-700"
              />
            ) : (
              <span 
                onClick={() => setIsEditingCustomer(true)}
                className="text-xs text-slate-400 hover:text-theme-primary cursor-pointer transition-colors font-medium flex items-center gap-1"
                title="Klik untuk ubah nama pelanggan"
              >
                <span>{customerName}</span>
                <span className="text-[10px] text-slate-300">✏️</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] font-bold text-slate-400 hover:text-rose-500 px-2.5 py-1 rounded-xl hover:bg-rose-50 transition-colors"
              title="Kosongkan pesanan"
            >
              Reset
            </button>
          )}

          {/* Close button for Tablet/Mobile Drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="xl:hidden w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              title="Tutup Keranjang"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 text-slate-300 stroke-[1.5]" />
            </div>
            <p className="font-extrabold text-sm text-slate-700">Keranjang Kosong</p>
            <p className="text-xs text-slate-400 text-center max-w-[200px] mt-1">
              Klik menu makanan atau minuman di samping untuk menambah ke pesanan.
            </p>
          </div>
        ) : (
          cart.map((item, index) => {
            const lineTotal = item.product.price * item.quantity;
            const isWarmBg = index % 3 === 0;
            const isPinkBg = index % 3 === 2;

            let cardBg = 'bg-slate-50/70 border-slate-100/90';
            if (isWarmBg) cardBg = 'bg-[#FFF9F2] border-[#FFEBD0]';
            if (isPinkBg) cardBg = 'bg-[#FFF2F5] border-[#FFDFE6]';

            return (
              <div
                key={item.product.id}
                className={`relative group rounded-2xl p-3 border transition-all duration-300 flex items-center justify-between gap-2.5 ${cardBg} hover:shadow-xs animate-slide-up`}
              >
                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-1 border border-black/5">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Title & Unit Price */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                    {formatMoney(item.product.price)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 shrink-0 bg-white/80 px-1.5 py-1 rounded-xl border border-black/5 shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-transform active:scale-90"
                    title="Kurangi"
                  >
                    <Minus className="w-3 h-3 stroke-[2.5]" />
                  </button>

                  <span className="text-xs font-black text-slate-800 min-w-[20px] text-center">
                    x{item.quantity}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-5 h-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-transform active:scale-90"
                    title="Tambah"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="w-20 text-right shrink-0">
                  <span className="text-xs font-black text-slate-900">
                    {formatMoney(lineTotal)}
                  </span>
                </div>

                {/* Quick Remove on hover */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="absolute -right-2 -top-2 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xs"
                  title="Hapus menu"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bill Calculation & Charge Button */}
      <div className="p-5 sm:p-6 bg-white border-t border-slate-100 space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-slate-700">
            <span className="font-bold text-xs">Total Menu ({cart.length})</span>
            <span className="font-black text-slate-900 text-sm">{formatMoney(totalAmount)}</span>
          </div>
        </div>

        {/* Bayar Button */}
        <button
          onClick={onOpenPayment}
          disabled={cart.length === 0}
          className={`w-full py-4 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-btn transition-all duration-300 ${
            cart.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-theme-primary hover:bg-theme-primary-hover text-white active:scale-[0.98]'
          }`}
        >
          Bayar {formatMoney(totalAmount)}
        </button>
      </div>
    </div>
  );
};
