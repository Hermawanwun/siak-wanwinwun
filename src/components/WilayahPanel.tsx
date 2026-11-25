import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { createRt, createRw, type RtWithCounts, type RwWithCounts } from '../api.ts';
import type { SafeUser } from '../types.ts';

interface WilayahPanelProps {
  user: SafeUser;
  rws: RwWithCounts[];
  rts: RtWithCounts[];
  onRefresh: () => Promise<void>;
  onInspectWilayah: (rwId: string, rtId?: string) => void;
}

export const WilayahPanel: React.FC<WilayahPanelProps> = ({
  user,
  rws,
  rts,
  onRefresh,
  onInspectWilayah,
}) => {
  const isAdmin = user.role === 'ADMIN';
  const [showRwForm, setShowRwForm] = useState(false);
  const [showRtForm, setShowRtForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [nomorRw, setNomorRw] = useState('');
  const [ketuaRw, setKetuaRw] = useState('');
  const [telpRw, setTelpRw] = useState('');

  const [parentRwId, setParentRwId] = useState(rws[0]?.id ?? '');
  const [nomorRt, setNomorRt] = useState('');
  const [ketuaRt, setKetuaRt] = useState('');
  const [telpRt, setTelpRt] = useState('');

  const handleAddRw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createRw({ nomor_rw: nomorRw, ketua_rw: ketuaRw, telepon: telpRw });
      setNomorRw('');
      setKetuaRw('');
      setTelpRw('');
      setShowRwForm(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah RW.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createRt({
        rw_id: parentRwId || rws[0]?.id,
        nomor_rt: nomorRt,
        ketua_rt: ketuaRt,
        telepon: telpRt,
      });
      setNomorRt('');
      setKetuaRt('');
      setTelpRt('');
      setShowRtForm(false);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambah RT.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">Struktur Wilayah Administratif</p>
          <h2 className="text-lg font-semibold text-zinc-900 mt-0.5">
            Data Rukun Warga (RW) & Rukun Tetangga (RT)
          </h2>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowRwForm((v) => !v);
                setShowRtForm(false);
              }}
              className="px-3.5 py-2 text-xs font-medium text-zinc-800 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah RW
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRtForm((v) => !v);
                setShowRwForm(false);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah RT
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {showRwForm && isAdmin && (
        <form
          onSubmit={handleAddRw}
          className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-zinc-900">Daftarkan RW Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Nomor RW *</label>
              <input
                type="text"
                required
                value={nomorRw}
                onChange={(e) => setNomorRw(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="004"
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Nama Ketua RW *
              </label>
              <input
                type="text"
                required
                value={ketuaRw}
                onChange={(e) => setKetuaRw(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">No. Telepon</label>
              <input
                type="text"
                value={telpRw}
                onChange={(e) => setTelpRw(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRwForm(false)}
              className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan RW'}
            </button>
          </div>
        </form>
      )}

      {showRtForm && isAdmin && (
        <form
          onSubmit={handleAddRt}
          className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-zinc-900">Daftarkan RT Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">RW Induk *</label>
              <select
                value={parentRwId || rws[0]?.id}
                onChange={(e) => setParentRwId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                {rws.map((rw) => (
                  <option key={rw.id} value={rw.id}>
                    RW {rw.nomor_rw}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Nomor RT *</label>
              <input
                type="text"
                required
                value={nomorRt}
                onChange={(e) => setNomorRt(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="004"
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Nama Ketua RT *
              </label>
              <input
                type="text"
                required
                value={ketuaRt}
                onChange={(e) => setKetuaRt(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">No. Telepon</label>
              <input
                type="text"
                value={telpRt}
                onChange={(e) => setTelpRt(e.target.value)}
                placeholder="0813xxxxxxxx"
                className="w-full px-3 py-2 text-sm font-mono border border-zinc-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRtForm(false)}
              className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan RT'}
            </button>
          </div>
        </form>
      )}

      {/* RW Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rws.map((rw) => (
          <div
            key={rw.id}
            className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{rw.kelurahan}</span>
                <span className="font-mono tabular-nums">{rw.total_rt} RT</span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">RW {rw.nomor_rw}</h3>
              <p className="text-sm text-zinc-700">Ketua: {rw.ketua_rw}</p>
              <p className="text-xs font-mono text-zinc-500">{rw.telepon}</p>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-sm font-semibold tabular-nums text-zinc-900">
                {rw.total_warga} Warga
              </span>
              {user.role !== 'RW' && (
                <button
                  type="button"
                  onClick={() => onInspectWilayah(rw.id)}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                >
                  Lihat Warga RW
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* RT Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200">
          <h3 className="text-sm font-semibold text-zinc-900">Daftar Rukun Tetangga (RT)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-600">
                <th className="py-3 px-4">RT</th>
                <th className="py-3 px-4">RW Induk</th>
                <th className="py-3 px-4">Ketua RT</th>
                <th className="py-3 px-4">Telepon</th>
                <th className="py-3 px-4 text-right">Jumlah Warga</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {rts.map((rt) => (
                <tr key={rt.id} className="hover:bg-zinc-50/80">
                  <td className="py-2.5 px-4 font-semibold text-zinc-900 tabular-nums">
                    RT {rt.nomor_rt}
                  </td>
                  <td className="py-2.5 px-4 text-zinc-700 tabular-nums">RW {rt.nomor_rw}</td>
                  <td className="py-2.5 px-4 text-zinc-800">{rt.ketua_rt}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-zinc-600 tabular-nums">
                    {rt.telepon}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-zinc-900">
                    {rt.total_warga}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onInspectWilayah(rt.rw_id, rt.id)}
                      className="text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                    >
                      Lihat Data RT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
