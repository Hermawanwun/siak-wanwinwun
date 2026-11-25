import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  createUser,
  fetchUsers,
  toggleUserActive,
  type RtWithCounts,
  type RwWithCounts,
} from '../api.ts';
import type { SafeUser, UserRole } from '../types.ts';

interface UsersPanelProps {
  currentUser: SafeUser;
  rws: RwWithCounts[];
  rts: RtWithCounts[];
}

const ROLE_DESCRIPTION: Record<UserRole, string> = {
  ADMIN: 'All Access',
  RT: 'CRUD Seluruh Data Warga',
  RW: 'Lihat Data 1 RT',
  LURAH: 'Lihat Data RW',
};

export const UsersPanel: React.FC<UsersPanelProps> = ({ currentUser, rws, rts }) => {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('RT');
  const [rwId, setRwId] = useState(rws[0]?.id ?? '');
  const [rtId, setRtId] = useState(rts[0]?.id ?? '');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers();
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredRts = rts.filter((rt) => rt.rw_id === rwId);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createUser({
        name,
        email,
        password,
        role,
        rw_id: role === 'RW' || role === 'RT' ? rwId : null,
        rt_id: role === 'RT' ? rtId || filteredRts[0]?.id : null,
      });
      setName('');
      setEmail('');
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat akun pengguna.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    setError(null);
    try {
      await toggleUserActive(id);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui status pengguna.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">Kontrol Akses Berbasis Role (Khusus ADMIN)</p>
          <h2 className="text-lg font-semibold text-zinc-900 mt-0.5">
            Manajemen Akun Petugas & Penugasan Wilayah
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreateUser}
          className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-zinc-900">Buat Akun Pengguna Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Agus Pratama (Ketua RT 003)"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="petugas@kelurahan.go.id"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Kata Sandi *</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Role Akses *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                <option value="ADMIN">ADMIN — All Access</option>
                <option value="RT">RT — CRUD Seluruh Data Warga</option>
                <option value="RW">RW — Melihat Data 1 RT</option>
                <option value="LURAH">LURAH — Melihat Data RW</option>
              </select>
            </div>
            {(role === 'RW' || role === 'RT') && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Penugasan RW *
                </label>
                <select
                  value={rwId}
                  onChange={(e) => {
                    const nextRw = e.target.value;
                    setRwId(nextRw);
                    const firstRt = rts.find((r) => r.rw_id === nextRw);
                    setRtId(firstRt?.id ?? '');
                  }}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                >
                  {rws.map((rw) => (
                    <option key={rw.id} value={rw.id}>
                      RW {rw.nomor_rw} — {rw.ketua_rw}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {role === 'RT' && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Penugasan RT *
                </label>
                <select
                  value={rtId}
                  onChange={(e) => setRtId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
                >
                  {filteredRts.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      RT {rt.nomor_rt} — {rt.ketua_rt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Buat Akun'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-600">
                <th className="py-3 px-4">Nama Petugas</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role & Hak Akses</th>
                <th className="py-3 px-4">Wilayah Tugas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-zinc-500">
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/80">
                    <td className="py-2.5 px-4 font-medium text-zinc-900">{u.name}</td>
                    <td className="py-2.5 px-4 font-mono text-xs text-zinc-600">{u.email}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs font-semibold text-zinc-900">{u.role}</span>
                      <span className="text-xs text-zinc-500"> · {ROLE_DESCRIPTION[u.role]}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-zinc-700">
                      {u.rw_label
                        ? `${u.rw_label}${u.rt_label ? ` / ${u.rt_label}` : ''}`
                        : 'Tingkat Kelurahan'}
                    </td>
                    <td className="py-2.5 px-4 text-xs">
                      <span className={u.active ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                        {u.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {u.id !== currentUser.id ? (
                        <button
                          type="button"
                          onClick={() => handleToggle(u.id)}
                          className="text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                        >
                          {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">Sedang digunakan</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
