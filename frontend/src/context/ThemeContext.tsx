import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeName, ThemeOption } from '../types';

export const THEMES: ThemeOption[] = [
  { id: 'coral', name: 'Coral Rose Soft', colorCode: '#FF4365', lightBg: '#FFF0F3', description: 'Merah muda hangat & segar' },
  { id: 'soft-blue', name: 'Soft Blue Sky', colorCode: '#3B82F6', lightBg: '#EFF6FF', description: 'Biru pastel sejuk & modern' },
  { id: 'soft-purple', name: 'Soft Purple Lavender', colorCode: '#8B5CF6', lightBg: '#F5F3FF', description: 'Ungu lavender menenangkan' },
  { id: 'soft-green', name: 'Soft Green Mint', colorCode: '#10B981', lightBg: '#ECFDF5', description: 'Hijau mint segar & natural' },
  { id: 'soft-orange', name: 'Soft Orange Peach', colorCode: '#F97316', lightBg: '#FFF7ED', description: 'Oranye peach manis & ramah' },
  { id: 'soft-yellow', name: 'Soft Yellow Butter', colorCode: '#F59E0B', lightBg: '#FFFBEB', description: 'Kuning butter lembut & cerah' },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  formatMoney: (val: number) => string;
  playSound: (type: 'beep' | 'success' | 'click' | 'delete') => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return (localStorage.getItem('cashierino_theme') as ThemeName) || 'coral';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cashierino_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  // Format currency: Murni Rupiah (Rp)
  const formatMoney = (val: number): string => {
    const num = Math.round(val || 0);
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  // Web Audio API sounds
  const playSound = (type: 'beep' | 'success' | 'click' | 'delete') => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep' || type === 'click') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'delete') {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        formatMoney,
        playSound,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
