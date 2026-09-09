import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../services/api';
import { Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginInputs {
  username: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const { loginUser } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Requirement: react-hook-form dengan alias register menjadi 'login'
  const {
    register: login,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInputs) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await loginApi(data);
      if (res.success && res.token && res.user) {
        loginUser(res.user, res.token);
      } else {
        setErrorMsg(res.message || 'Username atau password salah.');
      }
    } catch (err: any) {
      setErrorMsg('Gagal terhubung ke server backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FB] via-[#FFF3F6] to-[#F1F4F9] flex items-center justify-center p-4 selection:bg-rose-100 selection:text-rose-800">
      <div className="bg-white/95 backdrop-blur-md w-full max-w-sm rounded-3xl shadow-float border border-slate-100/90 p-8 sm:p-10 animate-modal">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF4365] to-[#FF758F] text-white flex items-center justify-center mx-auto mb-4 shadow-btn transform hover:scale-105 transition-transform">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 18V8a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v10" />
              <path d="M12 18V8a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v10" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            CashierIno POS
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Masuk untuk mengakses sistem kasir
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-2 text-rose-700 text-xs animate-slide-up">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Form using alias 'login' for register */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                {...login('username', { required: 'Username wajib diisi' })}
                placeholder="Masukkan username"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              />
            </div>
            {errors.username && (
              <p className="text-rose-500 text-[11px] mt-1 font-semibold">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                {...login('password', { required: 'Password wajib diisi' })}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-[11px] mt-1 font-semibold">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF4365] to-[#E83152] hover:from-[#E83152] hover:to-[#D1183C] text-white font-black text-xs shadow-btn flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>Masuk ke POS</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
