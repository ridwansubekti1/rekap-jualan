import React, { useState } from 'react';
import { Lock, Mail, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setInfoMsg('Akun admin berhasil dibuat! Silakan langsung masuk.');
        setIsRegister(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg('Email atau password salah. Pastikan akun sudah terdaftar.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            R
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Admin Rekap Jualan</h1>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Daftarkan email & password untuk membuat akun admin baru'
              : 'Masuk untuk mengelola order, stok, dan laporan harian'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-2xl text-xs font-bold">
            ✓ {infoMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Admin</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tokokamu.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{loading ? 'Memproses...' : isRegister ? 'Daftar Akun Admin' : 'Masuk Sekarang'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
              setInfoMsg('');
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            {isRegister
              ? 'Sudah punya akun admin? Masuk di sini'
              : 'Belum punya akun admin? Buat akun baru'}
          </button>
        </div>
      </div>
    </div>
  );
}