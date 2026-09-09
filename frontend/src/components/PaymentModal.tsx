import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { UniversalNumpad } from './UniversalNumpad';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { createTransactionApi } from '../services/api';
import { Transaction } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessTransaction: (transaction: Transaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccessTransaction,
}) => {
  const { cart, totalAmount, customerName, clearCart } = useCart();
  const { formatMoney, playSound } = useTheme();

  const [cashInput, setCashInput] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCashInput('0');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const cashAmount = useMemo(() => {
    const parsed = parseInt(cashInput, 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [cashInput]);

  // Smart Change Calculation in Rupiah
  const isExactOrMore = cashAmount >= totalAmount;
  const changeAmount = useMemo(() => {
    return isExactOrMore ? cashAmount - totalAmount : 0;
  }, [cashAmount, totalAmount, isExactOrMore]);

  const shortageAmount = useMemo(() => {
    return !isExactOrMore ? totalAmount - cashAmount : 0;
  }, [totalAmount, cashAmount, isExactOrMore]);

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    if (cashAmount < totalAmount) {
      setErrorMessage(`Nominal pembayaran kurang ${formatMoney(shortageAmount)}`);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        customer_name: customerName,
        cash_paid: cashAmount,
        payment_method: 'Tunai',
      };

      const res = await createTransactionApi(payload);

      if (res.success && res.transaction) {
        playSound('success');
        clearCart();
        onClose();
        onSuccessTransaction(res.transaction);
      } else {
        setErrorMessage(res.message || 'Gagal menyelesaikan transaksi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Koneksi ke server backend gagal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-float border border-slate-100 flex flex-col md:flex-row max-h-[96vh] md:max-h-[88vh] animate-modal my-auto overflow-hidden">
        {/* Left Side: Summary & Smart Change */}
        <div className="w-full md:w-5/12 bg-slate-50/80 p-3 sm:p-5 md:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
          <div>
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-wider text-slate-400">Ringkasan Pembayaran</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 truncate max-w-[120px]">
                {customerName}
              </span>
            </div>

            {/* Mobile Compact View (Side-by-Side Cards on Mobile) */}
            <div className="grid grid-cols-2 gap-2 md:hidden">
              <div className="bg-white rounded-xl p-2.5 border border-slate-200/70 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 block">Total Tagihan</span>
                <span className="text-base font-black text-slate-900 block truncate">{formatMoney(totalAmount)}</span>
              </div>
              <div className={`rounded-xl p-2.5 border ${isExactOrMore ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <span className="text-[10px] font-bold block truncate">
                  {isExactOrMore ? 'Kembalian:' : 'Kurang:'}
                </span>
                <span className={`text-base font-black block truncate ${isExactOrMore ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {formatMoney(isExactOrMore ? changeAmount : shortageAmount)}
                </span>
              </div>
            </div>

            {/* Desktop View (Stacked Detailed Cards) */}
            <div className="hidden md:block">
              {/* Bill breakdown card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-3">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Total Item</span>
                  <span className="font-bold text-slate-700">{cart.length} menu</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between items-baseline">
                  <span className="text-xs font-black text-slate-700">Total Tagihan</span>
                  <span className="text-xl font-black text-slate-900">{formatMoney(totalAmount)}</span>
                </div>
              </div>

              {/* Smart Change Calculation Box */}
              <div className="mt-4 space-y-2">
                {isExactOrMore ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 animate-slide-up">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Kembalian Otomatis:</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">
                      {formatMoney(changeAmount)}
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                      {changeAmount === 0 ? '✨ Uang pas diterima' : 'Berikan kembalian ke pelanggan'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 animate-slide-up">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Uang Diterima Kurang:</span>
                    </div>
                    <div className="text-2xl font-black text-amber-600 mt-1">
                      {formatMoney(shortageAmount)}
                    </div>
                    <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
                      Masukkan nominal yang cukup
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:block mt-4 text-[11px] font-medium text-slate-400 bg-white p-2.5 rounded-2xl border border-slate-200/60 text-center">
            ⌨️ Ketik angka langsung di keyboard komputer Anda
          </div>
        </div>

        {/* Right Side: Universal Numpad Input */}
        <div className="w-full md:w-7/12 p-3.5 sm:p-5 md:p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-black text-slate-800 text-sm sm:text-base md:text-lg">Nominal Pembayaran</h3>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Screen Display for Cash Input */}
            <div className="bg-slate-900 text-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 mb-2 sm:mb-3 shadow-inner flex items-center justify-between">
              <span className="text-[11px] sm:text-xs text-slate-400 font-bold">Uang Diterima:</span>
              <div className="text-xl sm:text-2xl font-black tracking-wider text-emerald-400 font-mono">
                {formatMoney(cashAmount)}
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="mb-2 text-xs bg-rose-50 text-rose-600 border border-rose-200 p-2 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Universal Numpad Component */}
            <UniversalNumpad
              value={cashInput}
              onChange={setCashInput}
              onEnter={handleProcessPayment}
              totalDue={totalAmount}
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={isSubmitting || !isExactOrMore}
              className={`w-2/3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm text-white shadow-btn flex items-center justify-center gap-2 transition-all ${
                isSubmitting || !isExactOrMore
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-theme-primary hover:bg-theme-primary-hover active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? 'Memproses...' : 'Selesaikan Transaksi (Enter)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
