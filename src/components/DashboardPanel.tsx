import { ArrowRight } from 'lucide-react';
import React from 'react';
import type { RtWithCounts, RwWithCounts } from '../api.ts';
import type { AuditEntry, SafeUser, StatsSummary } from '../types.ts';

interface DashboardPanelProps {
  user: SafeUser;
  stats: StatsSummary | null;
  rws: RwWithCounts[];
  rts: RtWithCounts[];
  audits: AuditEntry[];
  selectedRwId: string;
  selectedRtId: string;
  onChangeRwId: (rwId: string) => void;
  onChangeRtId: (rtId: string) => void;
  onNavigateWarga: (rwId?: string, rtId?: string) => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  user,
  stats,
  rts,
  audits,
  selectedRwId,
  selectedRtId,
  onChangeRwId,
  onChangeRtId,
  onNavigateWarga,
}) => {
  const isRwRole = user.role === 'RW';
  const isLurahRole = user.role === 'LURAH';
  const rtsInMyRw = isRwRole ? rts.filter((rt) => rt.rw_id === user.rw_id) : rts;

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 bg-white border border-zinc-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scope & Quick Role Context */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>Cakupan Aktif</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-zinc-800">{stats.scope_label}</span>
          </div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Ringkasan Kependudukan Kelurahan Sukamaju
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
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

          {isLurahRole && (
            <select
              aria-label="Filter RW Dashboard"
              value={selectedRwId}
              onChange={(e) => onChangeRwId(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-zinc-300 rounded-lg text-zinc-800 focus:outline-none focus:border-amber-600"
            >
              <option value="all">Seluruh RW (Kelurahan)</option>
              {stats.per_rw.map((rw) => (
                <option key={rw.rw_id} value={rw.rw_id}>
                  RW {rw.nomor_rw} — {rw.ketua_rw}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => onNavigateWarga()}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            Buka Data Warga (NIK)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500">Total Penduduk Terdaftar</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 tabular-nums">
            {stats.total_warga}
          </p>
          <p className="mt-1.5 text-xs text-zinc-600 tabular-nums">
            {stats.warga_tetap} Tetap · {stats.warga_pendatang} Pendatang
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500">Jumlah Kartu Keluarga (KK)</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 tabular-nums">
            {stats.total_kk}
          </p>
          <p className="mt-1.5 text-xs text-zinc-600 tabular-nums">
            Rata-rata{' '}
            {stats.total_kk > 0 ? (stats.total_warga / stats.total_kk).toFixed(1) : '0'} jiwa / KK
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500">Komposisi Gender</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 tabular-nums">
            {stats.laki_laki} <span className="text-base font-normal text-zinc-400">/</span>{' '}
            {stats.perempuan}
          </p>
          <p className="mt-1.5 text-xs text-zinc-600 tabular-nums">
            Laki-laki · Perempuan
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500">Cakupan Wilayah</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900 tabular-nums">
            {stats.total_rw} <span className="text-sm font-medium text-zinc-500">RW</span> ·{' '}
            {stats.total_rt} <span className="text-sm font-medium text-zinc-500">RT</span>
          </p>
          <p className="mt-1.5 text-xs text-zinc-600 tabular-nums">
            {stats.warga_pindah} Pindah · {stats.warga_meninggal} Meninggal
          </p>
        </div>
      </div>

      {/* Breakdown Table: RW for Lurah/Admin/RT, or 1-RT Detail for RW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              {isRwRole
                ? `Distribusi RT di ${user.rw_label ?? 'RW Anda'}`
                : 'Rekapitulasi Penduduk Per RW'}
            </h3>
            <span className="text-xs text-zinc-500">
              {isRwRole ? 'Pilih 1 RT untuk melihat daftar warga' : 'Klik baris untuk melihat data'}
            </span>
          </div>

          <div className="overflow-x-auto">
            {isRwRole ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-600">
                    <th className="py-2.5 px-4">RT</th>
                    <th className="py-2.5 px-4">Ketua RT</th>
                    <th className="py-2.5 px-4 text-right">KK</th>
                    <th className="py-2.5 px-4 text-right">Warga</th>
                    <th className="py-2.5 px-4 text-right">Lihat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {stats.per_rt.map((rt) => (
                    <tr key={rt.rt_id} className="hover:bg-zinc-50/80">
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 tabular-nums">
                        RT {rt.nomor_rt}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-700">{rt.ketua_rt}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-zinc-700">
                        {rt.total_kk}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-zinc-900">
                        {rt.total_warga}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigateWarga(rt.rw_id, rt.rt_id)}
                          className="text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                        >
                          Buka 1 RT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-600">
                    <th className="py-2.5 px-4">RW</th>
                    <th className="py-2.5 px-4">Ketua RW</th>
                    <th className="py-2.5 px-4 text-right">Jumlah RT</th>
                    <th className="py-2.5 px-4 text-right">KK</th>
                    <th className="py-2.5 px-4 text-right">Total Warga</th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {stats.per_rw.map((rw) => (
                    <tr key={rw.rw_id} className="hover:bg-zinc-50/80">
                      <td className="py-2.5 px-4 font-semibold text-zinc-900 tabular-nums">
                        RW {rw.nomor_rw}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-700">{rw.ketua_rw}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-zinc-700">
                        {rw.total_rt}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-zinc-700">
                        {rw.total_kk}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-zinc-900">
                        {rw.total_warga}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigateWarga(rw.rw_id)}
                          className="text-xs font-medium text-amber-700 hover:text-amber-800 cursor-pointer"
                        >
                          Lihat RW
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Audit Trail (Admin/Lurah) or Role Permissions Matrix */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900">
              {audits.length > 0 ? 'Aktivitas Administrasi Terbaru' : 'Matriks Hak Akses Role'}
            </h3>
          </div>
          {audits.length > 0 ? (
            <div className="divide-y divide-zinc-100 max-h-[320px] overflow-y-auto">
              {audits.slice(0, 8).map((a) => (
                <div key={a.id} className="px-5 py-3 space-y-0.5">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-medium text-zinc-800">
                      {a.actor_name} · {a.actor_role}
                    </span>
                    <span className="font-mono tabular-nums">
                      {new Date(a.timestamp).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600">{a.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 text-xs">
              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="font-semibold text-zinc-900">ADMIN</span>
                <span className="text-zinc-600">All Access (Warga, Wilayah, User, Surat)</span>
              </div>
              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="font-semibold text-zinc-900">RT</span>
                <span className="text-zinc-600">CRUD Seluruh Data Warga & Surat</span>
              </div>
              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="font-semibold text-zinc-900">RW</span>
                <span className="text-zinc-600">Melihat Data 1 RT (Read-Only)</span>
              </div>
              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="font-semibold text-zinc-900">LURAH</span>
                <span className="text-zinc-600">Melihat Data Per RW (Read-Only)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
