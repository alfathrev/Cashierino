import React, { useState, useEffect } from 'react';
import { fetchTransactionsApi, fetchDashboardStatsApi, cleanupOldTransactionsApi, getExportTransactionsUrl } from '../services/api';
import { Transaction } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Receipt, TrendingUp, DollarSign, ShoppingBag, Search, Eye, Download, Trash2, Calendar, Check, AlertCircle } from 'lucide-react';

interface BillsViewProps {
  onViewReceipt: (transaction: Transaction) => void;
}

export const BillsView: React.FC<BillsViewProps> = ({ onViewReceipt }) => {
  const { formatMoney, playSound } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transRes, statsRes] = await Promise.all([
        fetchTransactionsApi({ search: searchTerm }),
        fetchDashboardStatsApi(),
      ]);

      if (transRes.success) {
        setTransactions(transRes.transactions);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (e) {
      console.error('Failed to load bills data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  // Client-side & Direct CSV Spreadsheet Export
  const handleExportCsv = () => {
    playSound('click');
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    // Generate CSV content with UTF-8 BOM for Microsoft Excel
    let csvContent = '\uFEFF';
    csvContent += 'No Invoice,Tanggal & Waktu,Nama Pelanggan,Kasir,Metode Pembayaran,Subtotal,Pajak PB 5%,Total Tagihan,Uang Diterima,Kembalian,Status\n';

    for (const t of transactions) {
      const dateStr = t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-';
      const cleanCustomer = (t.customer_name || '').replace(/,/g, ' ');
      const cleanCashier = (t.cashier_name || '').replace(/,/g, ' ');
      csvContent += `"${t.invoice_number}","${dateStr}","${cleanCustomer}","${cleanCashier}","${t.payment_method}",${Math.round(t.subtotal)},${Math.round(t.tax_amount)},${Math.round(t.total_amount)},${Math.round(t.cash_paid)},${Math.round(t.change_amount)},"${t.status}"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Transaksi_CashierIno_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotice({ type: 'success', text: 'Spreadsheet (.CSV) berhasil diunduh!' });
    setTimeout(() => setNotice(null), 3500);
  };

  const handleCleanupOld = async () => {
    if (!window.confirm('Sistem secara otomatis menghapus data transaksi lebih dari 1 Bulan (30 hari). Jalankan pembersihan sekarang?')) return;

    setIsCleaning(true);
    try {
      const res = await cleanupOldTransactionsApi();
      if (res.success) {
        playSound('delete');
        setNotice({ type: 'success', text: 'Data transaksi lebih dari 30 hari telah dibersihkan.' });
        loadData();
        setTimeout(() => setNotice(null), 3500);
      }
    } catch {
      setNotice({ type: 'info', text: 'Pembersihan otomatis aktif di latar belakang.' });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 select-none animate-slide-up">
      {/* Header with Export & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Riwayat Transaksi
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-semibold text-slate-400">
              Kelola seluruh struk transaksi dan arus kas kasir
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Calendar className="w-3 h-3" />
              Retensi: Otomatis dihapus setelah 1 Bulan (30 Hari)
            </span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari invoice / pelanggan..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-ring shadow-xs"
            />
          </div>

          {/* Export to Excel / Spreadsheet Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs hover:shadow-md transition-all active:scale-95 shrink-0"
            title="Download laporan transaksi format Excel / Spreadsheet (.CSV)"
          >
            <Download className="w-4 h-4" />
            <span>Download Spreadsheet (.CSV)</span>
          </button>

          {/* Cleanup Old Data Button */}
          <button
            type="button"
            onClick={handleCleanupOld}
            disabled={isCleaning}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors shrink-0"
            title="Bersihkan transaksi lebih dari 1 bulan sekarang"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Bersihkan &gt;30 Hari</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-slide-up ${
          notice.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendapatan Hari Ini</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {formatMoney(stats?.today?.today_revenue ? parseFloat(stats.today.today_revenue) : 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaksi Hari Ini</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {stats?.today?.today_orders || 0} Struk
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Penjualan</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {formatMoney(stats?.today?.avg_ticket ? parseFloat(stats.today.avg_ticket) : 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-800 text-base">Semua Transaksi</h3>
            <span className="text-[11px] font-semibold text-slate-400">
              Data tersimpan selama 1 bulan (30 hari terakhir)
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {transactions.length} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold animate-pulse">
              Memuat data transaksi...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-10 h-10 mx-auto mb-2 stroke-[1.5] text-slate-300" />
              <p className="font-black text-sm text-slate-700">Belum ada transaksi</p>
              <p className="text-xs text-slate-400 mt-1">Lakukan checkout pertama Anda di menu Home.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">No. Invoice</th>
                  <th className="py-3.5 px-5">Waktu</th>
                  <th className="py-3.5 px-5">Pelanggan</th>
                  <th className="py-3.5 px-5">Kasir</th>
                  <th className="py-3.5 px-5">Metode</th>
                  <th className="py-3.5 px-5 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((trans) => (
                  <tr key={trans.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-black text-slate-900">
                      {trans.invoice_number}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">
                      {trans.created_at ? new Date(trans.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-700">
                      {trans.customer_name}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {trans.cashier_name}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                        {trans.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-black text-slate-900 text-right">
                      {formatMoney(parseFloat(String(trans.total_amount)))}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <button
                        onClick={() => onViewReceipt(trans)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-theme-primary-light text-slate-700 hover:text-theme-primary font-black text-[11px] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
