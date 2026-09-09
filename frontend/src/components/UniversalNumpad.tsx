import React, { useEffect, useCallback } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface UniversalNumpadProps {
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  totalDue: number;
}

export const UniversalNumpad: React.FC<UniversalNumpadProps> = ({
  value,
  onChange,
  onEnter,
  totalDue,
}) => {
  const { playSound, formatMoney } = useTheme();

  const handleDigit = useCallback((digit: string) => {
    playSound('beep');
    if (value === '0') {
      onChange(digit);
    } else {
      onChange(value + digit);
    }
  }, [value, onChange, playSound]);

  const handleBackspace = useCallback(() => {
    playSound('delete');
    if (value.length <= 1) {
      onChange('0');
    } else {
      onChange(value.slice(0, -1));
    }
  }, [value, onChange, playSound]);

  const handleClear = useCallback(() => {
    playSound('delete');
    onChange('0');
  }, [onChange, playSound]);

  const handleExact = useCallback(() => {
    playSound('click');
    onChange(String(Math.round(totalDue)));
  }, [totalDue, onChange, playSound]);

  // Physical Keyboard listener for Desktop Kasir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.id !== 'numpad-display') {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (onEnter) onEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear, onEnter]);

  // Rupiah Quick Cash Presets
  const quickCashOptions = [
    Math.ceil(totalDue / 10000) * 10000,
    50000,
    100000,
    200000
  ].filter((v, i, a) => a.indexOf(v) === i && v >= totalDue);

  return (
    <div className="flex flex-col gap-2 sm:gap-3 select-none">
      {/* Quick Cash Presets */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={handleExact}
          className="py-2 sm:py-2.5 px-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black transition-colors text-center shadow-2xs active:scale-95"
        >
          Uang Pas
        </button>
        {quickCashOptions.slice(0, 3).map((val, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              playSound('click');
              onChange(String(val));
            }}
            className="py-2 sm:py-2.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black transition-colors text-center shadow-2xs active:scale-95 truncate"
          >
            {formatMoney(val)}
          </button>
        ))}
      </div>

      {/* Grid Numpad Buttons */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-10 sm:h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-slate-800 text-lg sm:text-xl font-black rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs transition-all flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          type="button"
          onClick={handleClear}
          className="h-10 sm:h-12 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 active:scale-95 text-rose-600 rounded-xl sm:rounded-2xl border border-rose-200/80 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1"
          title="Clear (C / Esc)"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>C</span>
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-10 sm:h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-slate-800 text-lg sm:text-xl font-black rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs transition-all flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-10 sm:h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-700 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs transition-all flex items-center justify-center"
          title="Hapus digit"
        >
          <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Indonesian POS special rows: 00 and 000 */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => handleDigit('00')}
          className="h-9 sm:h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-slate-700 text-sm sm:text-base font-black rounded-xl sm:rounded-2xl border border-slate-200/80 transition-all flex items-center justify-center"
        >
          00
        </button>
        <button
          type="button"
          onClick={() => handleDigit('000')}
          className="h-9 sm:h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl border border-slate-200/80 transition-all flex items-center justify-center"
        >
          000 (Ribu)
        </button>
      </div>
    </div>
  );
};
