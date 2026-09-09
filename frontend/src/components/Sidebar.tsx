import React from 'react';
import { Home, PlusCircle, Receipt, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavView = 'home' | 'products' | 'transactions' | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const { logout, user } = useAuth();

  const navItems: Array<{ id: NavView; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5 stroke-[2.2]" /> },
    { id: 'products', label: 'Produk', icon: <PlusCircle className="w-5 h-5 stroke-[2.2]" /> },
    { id: 'transactions', label: 'Transaksi', icon: <Receipt className="w-5 h-5 stroke-[2]" /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-5 h-5 stroke-[2]" /> },
  ];

  return (
    <aside className="w-16 sm:w-20 md:w-22 bg-white border-r border-slate-100 flex flex-col items-center py-4 sm:py-6 select-none shrink-0 z-30 shadow-[2px_0_16px_rgba(0,0,0,0.02)]">
      {/* Brand Logo */}
      <div
        onClick={() => onSelectView('home')}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#FF4365] to-[#FF758F] flex items-center justify-center cursor-pointer shadow-btn mb-6 sm:mb-8 hover:scale-105 active:scale-95 transition-all duration-300 group shrink-0"
        title="CashierIno POS"
      >
        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-xs group-hover:rotate-6 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18V8a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v10" />
          <path d="M12 18V8a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v10" />
        </svg>
      </div>

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col gap-3 sm:gap-4 w-full items-center">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`relative group flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-theme-primary text-white shadow-btn scale-102'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-95'
              }`}
            >
              {item.icon}
              <span className={`text-[9px] sm:text-[10px] font-bold mt-1 tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {item.label}
              </span>

              {/* Tooltip on Hover */}
              <span className="hidden sm:block absolute left-full ml-3 px-2.5 py-1 bg-slate-800 text-white text-[11px] font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-md whitespace-nowrap z-40">
                {item.id === 'products' ? 'Tambah & Kelola Produk' : item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile & Keluar */}
      <div className="flex flex-col items-center gap-2.5 sm:gap-3 w-full pt-3 sm:pt-4 border-t border-slate-100/80 shrink-0">
        {user && (
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 hover:bg-theme-primary-light flex items-center justify-center text-xs font-black text-slate-700 hover:text-theme-primary cursor-pointer border border-slate-200/80 transition-all duration-200"
            title={`${user.full_name} (${user.role}) - Pengaturan`}
            onClick={() => onSelectView('settings')}
          >
            {user.username.slice(0, 2).toUpperCase()}
          </div>
        )}
        <button
          onClick={logout}
          className="w-12 h-12 sm:w-14 sm:h-14 flex flex-col items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-95 transition-all duration-200 group"
          title="Keluar"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[9px] sm:text-[10px] font-bold mt-1 text-slate-400 group-hover:text-rose-500">
            Keluar
          </span>
        </button>
      </div>
    </aside>
  );
};
