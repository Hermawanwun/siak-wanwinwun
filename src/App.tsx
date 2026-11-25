import {
  Code2,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Shield,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchAudits,
  fetchMe,
  fetchStats,
  fetchWilayah,
  getStoredToken,
  setStoredToken,
  type RtWithCounts,
  type RwWithCounts,
} from './api.ts';
import { DashboardPanel } from './components/DashboardPanel.tsx';
import { LaravelSourcePanel } from './components/LaravelSourcePanel.tsx';
import { LoginView } from './components/LoginView.tsx';
import { SuratPanel } from './components/SuratPanel.tsx';
import { UsersPanel } from './components/UsersPanel.tsx';
import { WargaPanel } from './components/WargaPanel.tsx';
import { WilayahPanel } from './components/WilayahPanel.tsx';
import type { AuditEntry, SafeUser, StatsSummary } from './types.ts';

type NavTab = 'dashboard' | 'warga' | 'wilayah' | 'users' | 'surat' | 'laravel';

const TAB_LABELS: Record<NavTab, string> = {
  dashboard: 'Ringkasan',
  warga: 'Data Warga (NIK)',
  wilayah: 'Wilayah RW & RT',
  users: 'Pengguna & Role',
  surat: 'Surat Pengantar',
  laravel: 'Laravel 11 & Filament v5',
};

export default function App() {
  const [authUser, setAuthUser] = useState<SafeUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [rws, setRws] = useState<RwWithCounts[]>([]);
  const [rts, setRts] = useState<RtWithCounts[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [audits, setAudits] = useState<AuditEntry[]>([]);

  const [selectedRwId, setSelectedRwId] = useState<string>('all');
  const [selectedRtId, setSelectedRtId] = useState<string>('all');
  const [emblemFailed, setEmblemFailed] = useState(false);

  const loadWorkspaceData = useCallback(
    async (user: SafeUser, rwIdParam: string, rtIdParam: string) => {
      try {
        const wilayahRes = await fetchWilayah();
        setRws(wilayahRes.rws);
        setRts(wilayahRes.rts);

        let effectiveRwId = rwIdParam;
        let effectiveRtId = rtIdParam;

        if (user.role === 'RW') {
          effectiveRwId = user.rw_id ?? '';
          const rtsInRw = wilayahRes.rts.filter((r) => r.rw_id === user.rw_id);
          if (!rtsInRw.some((r) => r.id === effectiveRtId)) {
            effectiveRtId = rtsInRw[0]?.id ?? '';
            setSelectedRtId(effectiveRtId);
          }
        }

        const statsRes = await fetchStats({
          rw_id: effectiveRwId !== 'all' ? effectiveRwId : undefined,
          rt_id: effectiveRtId !== 'all' ? effectiveRtId : undefined,
        });
        setStats(statsRes.stats);

        if (user.role === 'ADMIN' || user.role === 'LURAH') {
          const auditRes = await fetchAudits();
          setAudits(auditRes.audits);
        } else {
          setAudits([]);
        }
      } catch {
        // Handled cleanly in individual views
      }
    },
    []
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setBootstrapping(false);
      return;
    }
    fetchMe()
      .then((res) => {
        setAuthUser(res.user);
        if (res.user.role === 'RW') {
          setSelectedRwId(res.user.rw_id ?? '');
        }
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => setBootstrapping(false));
  }, []);

  useEffect(() => {
    if (authUser) {
      void loadWorkspaceData(authUser, selectedRwId, selectedRtId);
    }
  }, [authUser, selectedRwId, selectedRtId, loadWorkspaceData]);

  const handleLoginSuccess = (token: string, user: SafeUser) => {
    setStoredToken(token);
    setAuthUser(user);
    setActiveTab('dashboard');
    if (user.role === 'RW') {
      setSelectedRwId(user.rw_id ?? '');
      setSelectedRtId('');
    } else {
      setSelectedRwId('all');
      setSelectedRtId('all');
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setAuthUser(null);
    setStats(null);
    setAudits([]);
  };

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-sm text-zinc-600">
        Memuat sesi SIAK Kelurahan...
      </div>
    );
  }

  if (!authUser) {
    return <LoginView onSuccess={handleLoginSuccess} />;
  }

  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
  }> = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard, visible: true },
    { id: 'warga', label: 'Data Warga (NIK)', icon: Users, visible: true },
    { id: 'wilayah', label: 'Wilayah RW & RT', icon: MapPin, visible: true },
    { id: 'surat', label: 'Surat Pengantar', icon: FileText, visible: true },
    {
      id: 'users',
      label: 'Pengguna & Role',
      icon: Shield,
      visible: authUser.role === 'ADMIN',
    },
    { id: 'laravel', label: 'Kode Laravel 11 & Filament v5', icon: Code2, visible: true },
  ];

  const handleNavigateWarga = (rwId?: string, rtId?: string) => {
    if (rwId) setSelectedRwId(rwId);
    if (rtId) setSelectedRtId(rtId);
    setActiveTab('warga');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Brand */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center gap-3 shrink-0">
        {!emblemFailed ? (
          <img
            src="/src/assets/images/municipal_emblem_1795438770108.jpg"
            alt="Lambang SIAK"
            referrerPolicy="no-referrer"
            onError={() => setEmblemFailed(true)}
            className="w-8 h-8 rounded-md object-cover bg-white p-0.5 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            SK
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">SIAK Kelurahan</p>
          <p className="text-[11px] text-slate-400 truncate">Administrasi Kependudukan</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
      </nav>

      {/* Active User Account Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-white truncate">{authUser.name}</p>
          <p className="text-[11px] text-amber-400 font-medium">
            Role: {authUser.role}
            {authUser.rw_label ? ` · ${authUser.rw_label}` : ''}
            {authUser.rt_label ? ` / ${authUser.rt_label}` : ''}
          </p>
          <p className="text-[11px] text-slate-400 truncate font-mono">{authUser.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Ganti Akun / Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-white z-20"
              aria-label="Tutup navigasi"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="no-print h-16 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 cursor-pointer"
              aria-label="Buka navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-zinc-500 hidden sm:inline whitespace-nowrap">
                SIAK Kelurahan
              </span>
              <span className="text-zinc-300 hidden sm:inline">/</span>
              <h1 className="font-semibold text-zinc-900 truncate">{TAB_LABELS[activeTab]}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline text-xs text-zinc-600 whitespace-nowrap">
              {authUser.role}
              {authUser.rw_label ? ` · ${authUser.rw_label}` : ''}
              {authUser.rt_label ? ` / ${authUser.rt_label}` : ''}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardPanel
              user={authUser}
              stats={stats}
              rws={rws}
              rts={rts}
              audits={audits}
              selectedRwId={selectedRwId}
              selectedRtId={selectedRtId}
              onChangeRwId={setSelectedRwId}
              onChangeRtId={setSelectedRtId}
              onNavigateWarga={handleNavigateWarga}
            />
          )}

          {activeTab === 'warga' && (
            <WargaPanel
              user={authUser}
              rws={rws}
              rts={rts}
              selectedRwId={selectedRwId}
              selectedRtId={selectedRtId}
              onChangeRwId={setSelectedRwId}
              onChangeRtId={setSelectedRtId}
              onDataChanged={() => {
                void loadWorkspaceData(authUser, selectedRwId, selectedRtId);
              }}
            />
          )}

          {activeTab === 'wilayah' && (
            <WilayahPanel
              user={authUser}
              rws={rws}
              rts={rts}
              onRefresh={() => loadWorkspaceData(authUser, selectedRwId, selectedRtId)}
              onInspectWilayah={(rwId, rtId) => handleNavigateWarga(rwId, rtId)}
            />
          )}

          {activeTab === 'users' && authUser.role === 'ADMIN' && (
            <UsersPanel currentUser={authUser} rws={rws} rts={rts} />
          )}

          {activeTab === 'surat' && (
            <SuratPanel
              user={authUser}
              selectedRwId={selectedRwId}
              selectedRtId={selectedRtId}
            />
          )}

          {activeTab === 'laravel' && <LaravelSourcePanel />}
        </main>
      </div>
    </div>
  );
}
