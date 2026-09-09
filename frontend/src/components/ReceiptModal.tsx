import React from 'react';
import { Transaction } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Printer, CheckCircle, X, Sparkles } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { formatMoney } = useTheme();

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = transaction.created_at
    ? new Date(transaction.created_at).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-float border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-modal my-auto">
        {/* Header Bar */}
        <div className="bg-emerald-500 text-white p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-black text-sm">Pembayaran Berhasil!</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-emerald-600/60 hover:bg-emerald-600 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/60">
          <div
            id="printable-receipt-area"
            className="bg-white p-5 sm:p-6 rounded-2xl shadow-card border border-dashed border-slate-300 font-mono text-xs text-slate-900 space-y-3 print:border-none print:shadow-none print:p-2"
          >
            {/* Store Branding - Ino Yummy */}
            <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
              <h2 className="font-sans font-black text-xl tracking-tight text-slate-900">
                Ino Yummy
              </h2>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                {formattedDate}
              </p>
            </div>

            {/* Order Items List */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3 pt-1">
              {transaction.items && transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="truncate pr-2">{item.product_name}</span>
                    <span className="shrink-0">{formatMoney(item.subtotal)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {item.quantity} x {formatMoney(item.price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="space-y-1.5 text-xs pt-1 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between font-black text-sm text-slate-900">
                <span>TOTAL</span>
                <span>{formatMoney(transaction.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Uang Diterima</span>
                <span>{formatMoney(transaction.cash_paid)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>KEMBALIAN</span>
                <span>{formatMoney(transaction.change_amount)}</span>
              </div>
            </div>

            {/* Simple Footer */}
            <div className="pt-2 text-center text-slate-600 font-sans text-[11px] font-medium">
              <p>Terima kasih atas kunjungan Anda!</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-3 rounded-2xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-3 rounded-2xl font-black text-xs bg-theme-primary hover:bg-theme-primary-hover text-white shadow-btn flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <span>Selesai</span>
          </button>
        </div>
      </div>
    </div>
  );
};
