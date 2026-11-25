import { Building2, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { fetchDemoAccounts, login } from '../api.ts';
import type { SafeUser } from '../types.ts';

interface LoginViewProps {
  onSuccess: (token: string, user: SafeUser) => void;
}

const ROLE_SUMMARY: Record<SafeUser['role'], string> = {
  ADMIN: 'Akses penuh seluruh modul, wilayah, dan pengguna',
  RT: 'CRUD seluruh data warga dan penerbitan surat',
  RW: 'Akses lihat data 1 RT dalam wilayah RW',
  LURAH: 'Monitoring data kependudukan per RW',
};

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@kelurahan.go.id');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<SafeUser[]>([]);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [emblemFailed, setEmblemFailed] = useState(false);

  useEffect(() => {
    fetchDemoAccounts()
      .then((res) => setDemoAccounts(res.accounts))
      .catch(() => {
        // Silent fallback if demo accounts fail to load
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      onSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk ke sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('password123');
    setError(null);
    setLoading(true);
    try {
      const res = await login(accountEmail, 'password123');
      onSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk ke sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col lg:flex-row">
      {/* Left Architectural Visual Panel */}
      <div className="relative lg:w-[46%] min-h-[260px] lg:min-h-screen bg-slate-900 overflow-hidden flex flex-col justify-between">
        {!heroImgFailed ? (
          <img
            src="/src/assets/images/civic_hall_login_1795438770882.jpg"
            alt="Gedung Pelayanan Administrasi Kependudukan Kelurahan"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/55 to-slate-900/35" />

        <div className="relative z-10 p-8 lg:p-12 flex items-center gap-4">
          {!emblemFailed ? (
            <img
              src="/src/assets/images/municipal_emblem_1795438770108.jpg"
              alt="Lambang Kelurahan Sukamaju"
              referrerPolicy="no-referrer"
              onError={() => setEmblemFailed(true)}
              className="w-12 h-12 rounded-lg object-cover bg-white p-1 border border-white/20 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white tracking-tight">Kelurahan Sukamaju</p>
            <p className="text-xs text-zinc-300">Portal Administrasi Kependudukan Terpadu</p>
          </div>
        </div>

        <div className="relative z-10 p-8 lg:p-12 space-y-6">
          <div className="space-y-3 max-w-lg">
            <h1 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-tight text-balance">
              Sistem Informasi Administrasi Kependudukan
            </h1>
            <p className="text-sm lg:text-base text-zinc-200 leading-relaxed">
              Pengelolaan data penduduk berbasis Nomor Induk Kependudukan (NIK) sebagai Primary Key dengan pemisahan kewenangan antara Admin, Ketua RT, Ketua RW, dan Lurah.
            </p>
          </div>

          <div className="pt-4 border-t border-white/15 grid grid-cols-2 gap-6 text-xs text-zinc-200">
            <div>
              <p className="font-semibold text-amber-400">Primary Key NIK</p>
              <p className="mt-1 text-zinc-300">Validasi 16 digit unik tanpa duplikasi identitas warga.</p>
            </div>
            <div>
              <p className="font-semibold text-amber-400">Arsitektur Laravel 11 & Filament v5</p>
              <p className="mt-1 text-zinc-300">Tersedia paket kode sumber PHP siap unduh di dalam panel.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">
              Masuk ke Panel SIAK
            </h2>
            <p className="text-sm text-zinc-600">
              Gunakan kredensial petugas atau pilih akun role di bawah untuk menguji batasan akses.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 sm:p-8 rounded-xl border border-zinc-200">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-sm font-medium text-zinc-800">
                Email Petugas
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                  placeholder="nama@kelurahan.go.id"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-zinc-800">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                  placeholder="Masukkan kata sandi"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Quick Role Switcher for Evaluators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium text-zinc-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Masuk Cepat Berdasarkan Role
              </span>
              <span className="font-mono">Kata sandi: password123</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc.email)}
                  className="text-left p-3 rounded-lg bg-white border border-zinc-200 hover:border-amber-500 hover:bg-amber-50/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-900 group-hover:text-amber-800 truncate">
                      {acc.role}
                      {acc.rw_label ? ` · ${acc.rw_label}` : ''}
                      {acc.rt_label ? ` / ${acc.rt_label}` : ''}
                    </span>
                    <span className="text-[11px] font-medium text-amber-700 whitespace-nowrap shrink-0">
                      Masuk
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-700 truncate">{acc.name}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 truncate">
                    {ROLE_SUMMARY[acc.role]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
