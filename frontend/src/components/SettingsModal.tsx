import React from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Palette, Volume2, VolumeX, Database, Check, X, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, soundEnabled, setSoundEnabled, playSound } = useTheme();
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-float border border-slate-100 p-6 space-y-6 max-h-[92vh] overflow-y-auto animate-modal">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Pengaturan Sistem POS
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Kustomisasi tema warna soft pastel dan audio kasir
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Account Info */}
        {user && (
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-theme-primary text-white flex items-center justify-center font-black text-xs shadow-xs">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">{user.full_name}</h4>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Role: {user.role}</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Online
            </span>
          </div>
        )}

        {/* Theme Palette Chooser - Soft Colors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700">
              <Palette className="w-4 h-4 text-theme-primary" />
              <span>Pilihan Tema Warna (Soft & Pastel Palette)</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Pilih palet</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {THEMES.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id);
                    playSound('click');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-slate-800 bg-slate-50/80 shadow-xs ring-2 ring-slate-800/10 scale-102'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="w-6 h-6 rounded-full shadow-xs border border-white shrink-0"
                      style={{ backgroundColor: item.colorCode }}
                    />
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-800">{item.name}</span>
                    <span className="block text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{item.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Effects Setting */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <div>
              <p className="font-extrabold">Efek Suara Kasir</p>
              <p className="text-[10px] font-normal text-slate-400">Audio feedback saat numpad ditekan & transaksi sukses</p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              soundEnabled ? 'bg-theme-primary' : 'bg-slate-200'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Database Status Box */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-blue-950">
          <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-black">Mata Uang Murni Rupiah:</span> Sistem menggunakan format resmi IDR (Rp) di seluruh katalog, keranjang, pembayaran kasir, dan struk.
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors active:scale-[0.98]"
        >
          Tutup Pengaturan
        </button>
      </div>
    </div>
  );
};
