import React from 'react';
import { Transaction } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Printer, CheckCircle, X, Store } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-float border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-modal">
        {/* Header Bar */}
        <div className="bg-emerald-500 text-white p-4 px-6 flex items-center justify-between">
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
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60">
          <div
            id="printable-receipt"
            className="bg-white p-6 rounded-2xl shadow-card border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-4"
          >
            {/* Store Branding */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-center gap-1.5 font-sans font-black text-base text-slate-900">
                <Store className="w-5 h-5 text-theme-primary" />
                <span>CASHIERINO RESTO</span>
              </div>
              <p className="text-[10px] text-slate-500 font-sans">
                Jl. Kuliner Nusantara No. 10, Jakarta Selatan
              </p>
              <p className="text-[10px] text-slate-500 font-sans">Telp: 021-555-8888</p>
            </div>

            {/* Receipt Metadata */}
            <div className="space-y-1 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-3">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold text-slate-900">{transaction.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span>{transaction.customer_name}</span>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              {transaction.items && transaction.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span className="truncate pr-2">{item.product_name}</span>
                    <span>{formatMoney(item.subtotal)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {item.quantity} x {formatMoney(item.price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals & Taxes */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatMoney(transaction.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>PB Resto ({transaction.tax_rate}%):</span>
                <span>{formatMoney(transaction.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-dashed border-slate-200">
                <span>TOTAL:</span>
                <span>{formatMoney(transaction.total_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1">
                <span>Bayar ({transaction.payment_method}):</span>
                <span>{formatMoney(transaction.cash_paid)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-emerald-600">
                <span>KEMBALIAN:</span>
                <span>{formatMoney(transaction.change_amount)}</span>
              </div>
            </div>

            {/* Footer barcode & message */}
            <div className="pt-3 text-center border-t border-dashed border-slate-300 space-y-1.5">
              <div className="h-8 bg-slate-100 rounded flex items-center justify-center font-mono text-[9px] tracking-widest text-slate-400">
                |||| | ||||| ||| |||||| |||| | |||||
              </div>
              <p className="text-[10px] text-slate-500 font-sans">
                Terima kasih atas kunjungan Anda!<br />
                Kritik & saran: halo@cashierino.com
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex gap-2.5">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk (POS)</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl font-black text-xs bg-theme-primary hover:bg-theme-primary-hover text-white shadow-btn flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Transaksi Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
