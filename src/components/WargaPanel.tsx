import {
  Check,
  Copy,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  createWarga,
  deleteWarga,
  fetchWargas,
  updateWarga,
  type RtWithCounts,
  type RwWithCounts,
} from '../api.ts';
import type { SafeUser, Warga } from '../types.ts';
import { WargaModal } from './WargaModal.tsx';

interface WargaPanelProps {
  user: SafeUser;
  rws: RwWithCounts[];
  rts: RtWithCounts[];
  selectedRwId: string;
  selectedRtId: string;
  onChangeRwId: (rwId: string) => void;
  onChangeRtId: (rtId: string) => void;
  onDataChanged: () => void;
}

const STATUS_TEXT_CLASS: Record<Warga['status_kependudukan'], string> = {
  Tetap: 'text-emerald-700 font-medium',
  Pendatang: 'text-amber-700 font-medium',
  Pindah: 'text-sky-700 font-medium',
  Meninggal: 'text-red-700 font-medium',
};

export const WargaPanel: React.FC<WargaPanelProps> = ({
  user,
  rws,
  rts,
  selectedRwId,
  selectedRtId,
  onChangeRwId,
  onChangeRtId,
  onDataChanged,
}) => {
  const canCrud = user.role === 'ADMIN' || user.role === 'RT';
  const isRwRole = user.role === 'RW';
  const isLurahRole = user.role === 'LURAH';

  const [wargas, setWargas] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedNik, setCopiedNik] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: 'create' | 'edit' | 'view';
    target: Warga | null;
  }>({ open: false, mode: 'view', target: null });

  const [deleteTarget, setDeleteTarget] = useState<Warga | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rtsInMyRw = isRwRole ? rts.filter((rt) => rt.rw_id === user.rw_id) : rts;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: {
        search?: string;
        rw_id?: string;
        rt_id?: string;
        status?: string;
      } = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      if (isRwRole) {
        params.rw_id = user.rw_id ?? undefined;
        params.rt_id = selectedRtId || rtsInMyRw[0]?.id;
      } else if (isLurahRole) {
        if (selectedRwId && selectedRwId !== 'all') params.rw_id = selectedRwId;
      } else {
        if (selectedRwId && selectedRwId !== 'all') params.rw_id = selectedRwId;
        if (selectedRtId && selectedRtId !== 'all') params.rt_id = selectedRtId;
      }

      const res = await fetchWargas(params);
      setWargas(res.wargas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data warga.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, isRwRole, isLurahRole, user.rw_id, selectedRwId, selectedRtId, rtsInMyRw]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleCopyNik = (nik: string) => {
    void navigator.clipboard.writeText(nik);
    setCopiedNik(nik);
    setTimeout(() => setCopiedNik(null), 1500);
  };

  const handleSaveWarga = async (payload: Partial<Warga>) => {
    if (modalState.mode === 'create') {
      await createWarga(payload);
    } else if (modalState.mode === 'edit' && modalState.target) {
      await updateWarga(modalState.target.nik, payload);
    }
    await loadData();
    onDataChanged();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWarga(deleteTarget.nik);
      setDeleteTarget(null);
      await loadData();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data warga.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'NIK (PK)',
      'No KK',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'RW',
      'RT',
      'Alamat',
      'Status Kependudukan',
      'Pekerjaan',
    ];
    const rows = wargas.map((w) => {
      const rw = rws.find((r) => r.id === w.rw_id)?.nomor_rw ?? '-';
      const rt = rts.find((r) => r.id === w.rt_id)?.nomor_rt ?? '-';
      return [
        `'${w.nik}`,
        `'${w.no_kk}`,
        w.nama_lengkap,
        w.jenis_kelamin,
        w.tempat_lahir,
        w.tanggal_lahir,
        `RW ${rw}`,
        `RT ${rt}`,
        w.alamat,
        w.status_kependudukan,
        w.pekerjaan,
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-warga-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRwLabel = (id: string) => rws.find((r) => r.id === id)?.nomor_rw ?? '-';
  const getRtLabel = (id: string) => rts.find((r) => r.id === id)?.nomor_rt ?? '-';

  const availableRtsForFilter =
    selectedRwId && selectedRwId !== 'all'
      ? rts.filter((rt) => rt.rw_id === selectedRwId)
      : rts;

  return (
    <div className="space-y-6">
      {/* Role Scope Banner (Clean hairline container, zero thick left border) */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Primary Key: NIK (16 Digit)</span>
            <span aria-hidden="true">·</span>
            <span>
              {canCrud
                ? 'Hak Akses: Tambah, Ubah, & Hapus Seluruh Data Warga'
                : isRwRole
                ? `Hak Akses RW: Melihat Data 1 RT di ${user.rw_label ?? 'RW Anda'} (Read-Only)`
                : 'Hak Akses Lurah: Monitoring Data Warga per RW (Read-Only)'}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">
            {isRwRole
              ? `Daftar Penduduk 1 RT — ${user.rw_label ?? ''}`
              : isLurahRole
              ? 'Daftar Penduduk Kelurahan (Filter per RW)'
              : 'Basis Data Kependudukan Warga'}
          </h2>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={wargas.length === 0}
            className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV
          </button>
          {canCrud && (
            <button
              type="button"
              onClick={() => setModalState({ open: true, mode: 'create', target: null })}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Warga
            </button>
          )}
        </div>
      </div>

      {/* Role-Specific Scope Controls + Search */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIK (16 digit), No. KK, Nama, atau Alamat..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* RW Role: Strict 1-RT Selector (No "All" option) */}
            {isRwRole && (
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
                {rtsInMyRw.map((rt) => {
                  const active = (selectedRtId || rtsInMyRw[0]?.id) === rt.id;
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() => onChangeRtId(rt.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      RT {rt.nomor_rt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Lurah Role: Select RW */}
            {isLurahRole && (
              <select
                aria-label="Filter RW"
                value={selectedRwId}
                onChange={(e) => onChangeRwId(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-amber-600"
              >
                <option value="all">Semua RW (Kelurahan)</option>
                {rws.map((rw) => (
                  <option key={rw.id} value={rw.id}>
                    RW {rw.nomor_rw} ({rw.total_warga} warga)
                  </option>
                ))}
              </select>
            )}

            {/* Admin / RT Role: Optional RW & RT filter */}
            {canCrud && (
              <>
                <select
                  aria-label="Filter RW"
                  value={selectedRwId}
                  onChange={(e) => {
                    onChangeRwId(e.target.value);
                    onChangeRtId('all');
                  }}
                  className="px-3 py-2 text-xs font-medium bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-amber-600"
                >
                  <option value="all">Semua RW</option>
                  {rws.map((rw) => (
                    <option key={rw.id} value={rw.id}>
                      RW {rw.nomor_rw}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter RT"
                  value={selectedRtId}
                  onChange={(e) => onChangeRtId(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-amber-600"
                >
                  <option value="all">Semua RT</option>
                  {availableRtsForFilter.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      RT {rt.nomor_rt} (RW {rt.nomor_rw})
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Status filter */}
            <select
              aria-label="Filter Status Kependudukan"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:border-amber-600"
            >
              <option value="all">Semua Status</option>
              <option value="Tetap">Tetap</option>
              <option value="Pendatang">Pendatang</option>
              <option value="Pindah">Pindah</option>
              <option value="Meninggal">Meninggal</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="m-4 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[12px] font-medium text-zinc-600">
                <th className="py-3 px-4 whitespace-nowrap">NIK (Primary Key)</th>
                <th className="py-3 px-4 whitespace-nowrap">Nama Lengkap</th>
                <th className="py-3 px-4 whitespace-nowrap">No. KK</th>
                <th className="py-3 px-4 whitespace-nowrap">Wilayah</th>
                <th className="py-3 px-4 whitespace-nowrap">Gender</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3.5 px-4">
                      <div className="h-4 bg-zinc-100 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : wargas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <p className="text-sm font-medium text-zinc-800">
                      Tidak ada data warga yang sesuai filter.
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Coba ubah kata kunci pencarian NIK/nama atau pilih wilayah lain.
                    </p>
                    {canCrud && (
                      <button
                        type="button"
                        onClick={() => setModalState({ open: true, mode: 'create', target: null })}
                        className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                      >
                        Daftarkan Warga Pertama
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                wargas.map((w) => (
                  <tr key={w.nik} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-xs tabular-nums text-zinc-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{w.nik}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyNik(w.nik)}
                          title="Salin NIK"
                          className="p-1 text-zinc-400 hover:text-zinc-800 rounded cursor-pointer"
                        >
                          {copiedNik === w.nik ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-zinc-900">{w.nama_lengkap}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[220px]">
                        {w.hubungan_keluarga} · {w.pekerjaan}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs tabular-nums text-zinc-600 whitespace-nowrap">
                      {w.no_kk}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-zinc-700 whitespace-nowrap">
                      RT {getRtLabel(w.rt_id)} / RW {getRwLabel(w.rw_id)}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-zinc-700 whitespace-nowrap">
                      {w.jenis_kelamin}
                    </td>
                    <td className={`py-2.5 px-4 text-xs whitespace-nowrap ${STATUS_TEXT_CLASS[w.status_kependudukan]}`}>
                      {w.status_kependudukan}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setModalState({ open: true, mode: 'view', target: w })}
                          className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                        {canCrud && (
                          <>
                            <button
                              type="button"
                              onClick={() => setModalState({ open: true, mode: 'edit', target: w })}
                              className="px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(w)}
                              className="px-2.5 py-1.5 text-xs font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
          <span className="tabular-nums">Menampilkan {wargas.length} data penduduk</span>
          <span>Primary Key: NIK</span>
        </div>
      </div>

      {/* Create / Edit / View Modal */}
      {modalState.open && (
        <WargaModal
          mode={modalState.mode}
          initialWarga={modalState.target}
          rws={rws}
          rts={rts}
          defaultRwId={
            user.rw_id || (selectedRwId !== 'all' ? selectedRwId : rws[0]?.id)
          }
          defaultRtId={
            user.rt_id || (selectedRtId !== 'all' ? selectedRtId : undefined)
          }
          onClose={() => setModalState({ open: false, mode: 'view', target: null })}
          onSubmit={handleSaveWarga}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-zinc-900">
              Hapus Data Warga?
            </h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Data penduduk atas nama{' '}
              <span className="font-semibold text-zinc-900">{deleteTarget.nama_lengkap}</span>{' '}
              dengan NIK{' '}
              <span className="font-mono text-zinc-900">{deleteTarget.nik}</span> akan dihapus permanen dari database.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg cursor-pointer"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
