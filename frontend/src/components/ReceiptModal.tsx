import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Printer, CheckCircle, X, Bluetooth, AlertCircle, HelpCircle, Check, RefreshCw } from 'lucide-react';
import { printDirectBluetooth, getSavedPrinterName, forgetPrinter } from '../utils/bluetoothPrinter';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { formatMoney, playSound } = useTheme();

  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [printStatus, setPrintStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState<string | null>(null);

  useEffect(() => {
    setSavedPrinter(getSavedPrinterName());
  }, [transaction]);

  if (!transaction) return null;

  const handlePrintBrowser = () => {
    window.print();
  };

  const handlePrintBluetooth = async (forceNew = false) => {
    setIsPrintingBt(true);
    setPrintStatus({
      type: 'info',
      text: forceNew ? 'Mencari printer Bluetooth baru...' : 'Mengirim data ke printer...'
    });

    const res = await printDirectBluetooth(transaction, forceNew);
    setIsPrintingBt(false);

    if (res.success) {
      playSound('success');
      setSavedPrinter(getSavedPrinterName());
      setPrintStatus({ type: 'success', text: res.message });
      setTimeout(() => setPrintStatus(null), 4000);
    } else {
      setPrintStatus({ type: 'error', text: res.message });
    }
  };

  const handleForgetPrinter = () => {
    forgetPrinter();
    setSavedPrinter(null);
    setPrintStatus({ type: 'info', text: 'Memori printer direset. Silakan pilih printer baru saat mencetak.' });
    setTimeout(() => setPrintStatus(null), 3000);
  };

  const formattedDate = transaction.created_at
    ? new Date(transaction.created_at).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <>
      {/* 1. Modal Preview for Screen View */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto no-print">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-float border border-slate-100 overflow-hidden flex flex-col max-h-[94vh] animate-modal my-auto">
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

          {/* Status Message Alert */}
          {printStatus && (
            <div
              className={`mx-4 mt-3 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-up ${
                printStatus.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : printStatus.type === 'error'
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              {printStatus.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : printStatus.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Bluetooth className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
              )}
              <span className="truncate">{printStatus.text}</span>
            </div>
          )}

          {/* Saved Printer Bar if paired */}
          {savedPrinter && (
            <div className="mx-4 mt-2 px-3 py-1.5 bg-slate-100 rounded-xl flex items-center justify-between text-[11px] text-slate-600 font-bold border border-slate-200/70">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="truncate">Printer: <strong>{savedPrinter}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleForgetPrinter}
                className="text-[10px] text-blue-600 hover:text-blue-800 underline ml-2 shrink-0 flex items-center gap-0.5"
                title="Ganti ke perangkat Bluetooth lain"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Ganti</span>
              </button>
            </div>
          )}

          {/* Thermal Receipt Preview Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/60">
            <div className="bg-white p-5 rounded-2xl shadow-card border border-dashed border-slate-300 font-mono text-xs text-slate-900 space-y-3">
              {/* Store Branding - Ino Yummy */}
              <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
                <h2 className="font-sans font-black text-xl tracking-tight text-slate-900">
                  Ino Yummy
                </h2>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  {formattedDate}
                </p>
                <p className="text-xs font-bold text-slate-800 font-sans mt-0.5">
                  {transaction.customer_name || 'Pelanggan Walk-In'}
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
                  <span>Tunai</span>
                  <span>{formatMoney(transaction.cash_paid)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>KEMBALIAN</span>
                  <span>{formatMoney(transaction.change_amount)}</span>
                </div>
              </div>

              {/* Maturnuwun Footer */}
              <div className="pt-2 text-center text-slate-700 font-sans space-y-0.5">
                <p className="font-black text-xs text-slate-900">Maturnuwun</p>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Semoga Kita Selalu Diberi Kesehatan, Rejekinya Lancar Dan Umur Yang Barokah
                </p>
              </div>
            </div>

            {/* Expandable Help Accordion */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 py-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHelp ? 'Sembunyikan info' : 'Cara print otomatis tanpa pairing ulang?'}</span>
              </button>

              {showHelp && (
                <div className="mt-2 p-3 bg-white rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5 animate-slide-up">
                  <p className="font-bold text-slate-800">⚡ Print Otomatis Sekali Klik:</p>
                  <p>1. Cukup klik tombol biru <strong>Cetak Bluetooth</strong> dan hubungkan printer sekali saja.</p>
                  <p>2. Printer akan otomatis tersimpan. Setiap transaksi berikutnya langsung tercetak tanpa muncul pop-up pairing lagi!</p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="p-3.5 bg-white border-t border-slate-100 flex flex-col gap-2">
            {/* Primary Direct Bluetooth Print (Auto-remembered, 1-Click) */}
            <button
              type="button"
              onClick={() => handlePrintBluetooth(false)}
              disabled={isPrintingBt}
              className="w-full py-3 px-3 rounded-2xl font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-btn flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Bluetooth className={`w-4 h-4 ${isPrintingBt ? 'animate-spin' : ''}`} />
              <span>
                {isPrintingBt
                  ? 'Mencetak ke Bluetooth...'
                  : savedPrinter
                  ? `Cetak Langsung (${savedPrinter})`
                  : 'Cetak Bluetooth (Hubungkan Sekali)'}
              </span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrintBrowser}
                className="flex-1 py-2.5 px-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Browser</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-2 rounded-xl font-black text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all active:scale-95"
              >
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED THERMAL PRINTER OUTPUT (Visible only when Printing via @media print) */}
      <div id="thermal-receipt-print" className="hidden print:block">
        <div className="thermal-paper">
          {/* Header */}
          <div className="thermal-center font-bold text-base thermal-mb">
            Ino Yummy
          </div>
          <div className="thermal-center text-xs thermal-mb">
            {formattedDate}
          </div>
          <div className="thermal-center font-bold text-xs thermal-mb">
            {transaction.customer_name || 'Pelanggan'}
          </div>

          {/* Dotted Divider */}
          <div className="thermal-divider">--------------------------------</div>

          {/* Items */}
          <div className="thermal-items">
            {transaction.items && transaction.items.map((item, idx) => (
              <div key={idx} className="thermal-item-row">
                <div className="thermal-flex font-bold">
                  <span>{item.product_name}</span>
                  <span>{formatMoney(item.subtotal)}</span>
                </div>
                <div className="thermal-sub">
                  {item.quantity} x {formatMoney(item.price)}
                </div>
              </div>
            ))}
          </div>

          {/* Dotted Divider */}
          <div className="thermal-divider">--------------------------------</div>

          {/* Totals */}
          <div className="thermal-totals">
            <div className="thermal-flex font-bold text-sm">
              <span>TOTAL</span>
              <span>{formatMoney(transaction.total_amount)}</span>
            </div>
            <div className="thermal-flex">
              <span>Tunai</span>
              <span>{formatMoney(transaction.cash_paid)}</span>
            </div>
            <div className="thermal-flex font-bold">
              <span>Kembalian</span>
              <span>{formatMoney(transaction.change_amount)}</span>
            </div>
          </div>

          {/* Dotted Divider */}
          <div className="thermal-divider">--------------------------------</div>

          {/* Footer Maturnuwun */}
          <div className="thermal-center font-bold text-xs thermal-mt">
            Maturnuwun
          </div>
          <div className="thermal-center text-[9.5px]">
            Semoga Kita Selalu Diberi Kesehatan, Rejekinya Lancar Dan Umur Yang Barokah
          </div>
          <div className="thermal-feed-space">&nbsp;</div>
        </div>
      </div>
    </>
  );
};
