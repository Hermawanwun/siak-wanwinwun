import { FileText, Plus, Printer, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { createSurat, fetchSurats, fetchWargas, type EnrichedSurat } from '../api.ts';
import type { SafeUser, SuratPengantar, Warga } from '../types.ts';

interface SuratPanelProps {
  user: SafeUser;
  selectedRwId: string;
  selectedRtId: string;
}

export const SuratPanel: React.FC<SuratPanelProps> = ({
  user,
  selectedRwId,
  selectedRtId,
}) => {
  const canIssue = user.role === 'ADMIN' || user.role === 'RT';
  const [surats, setSurats] = useState<EnrichedSurat[]>([]);
  const [wargas, setWargas] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewSurat, setPreviewSurat] = useState<EnrichedSurat | null>(null);

  const [nikWarga, setNikWarga] = useState('');
  const [jenisSurat, setJenisSurat] = useState<SuratPengantar['jenis_surat']>(
    'Surat Keterangan Domisili'
  );
  const [keperluan, setKeperluan] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { rw_id?: string; rt_id?: string } = {};
      if (user.role === 'RW' && selectedRtId && selectedRtId !== 'all') {
        params.rt_id = selectedRtId;
      } else if (user.role === 'LURAH' && selectedRwId && selectedRwId !== 'all') {
        params.rw_id = selectedRwId;
      }
      const [suratRes, wargaRes] = await Promise.all([
        fetchSurats(params),
        canIssue ? fetchWargas() : Promise.resolve({ wargas: [] }),
      ]);
      setSurats(suratRes.surats);
      setWargas(wargaRes.wargas);
      if (wargaRes.wargas.length > 0 && !nikWarga) {
        setNikWarga(wargaRes.wargas[0].nik);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat surat pengantar.');
    } finally {
      setLoading(false);
    }
  }, [user.role, selectedRwId, selectedRtId, canIssue, nikWarga]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await createSurat({
        nik_warga: nikWarga,
        jenis_surat: jenisSurat,
        keperluan,
      });
      setKeperluan('');
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menerbitkan surat.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">Pelayanan Administrasi Warga Berbasis NIK</p>
          <h2 className="text-lg font-semibold text-zinc-900 mt-0.5">
            Surat Pengantar & Keterangan Kependudukan
          </h2>
        </div>

        {canIssue && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Terbitkan Surat Baru
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && canIssue && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-zinc-900">Terbitkan Surat Pengantar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Pilih Warga (NIK Primary Key) *
              </label>
              <select
                required
                value={nikWarga}
                onChange={(e) => setNikWarga(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                {wargas.map((w) => (
                  <option key={w.nik} value={w.nik}>
                    {w.nik} — {w.nama_lengkap}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Jenis Surat *</label>
              <select
                value={jenisSurat}
                onChange={(e) => setJenisSurat(e.target.value as SuratPengantar['jenis_surat'])}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg bg-white"
              >
                <option value="Surat Keterangan Domisili">Surat Keterangan Domisili</option>
                <option value="Surat Pengantar KTP / KK">Surat Pengantar KTP / KK</option>
                <option value="Surat Keterangan Usaha">Surat Keterangan Usaha</option>
                <option value="Surat Keterangan Tidak Mampu">Surat Keterangan Tidak Mampu</option>
                <option value="Surat Pengantar Pindah">Surat Pengantar Pindah</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Keperluan / Keterangan *
              </label>
              <input
                type="text"
                required
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                placeholder="Contoh: Persyaratan pengurusan pembaruan Kartu Keluarga"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg"
              />
            </div>
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
              {saving ? 'Menerbitkan...' : 'Terbitkan Surat'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-600">
                <th className="py-3 px-4">Nomor Surat</th>
                <th className="py-3 px-4">NIK Warga</th>
                <th className="py-3 px-4">Nama & Wilayah</th>
                <th className="py-3 px-4">Jenis Surat</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                    Memuat arsip surat...
                  </td>
                </tr>
              ) : surats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-zinc-500">
                    Belum ada surat pengantar pada cakupan wilayah ini.
                  </td>
                </tr>
              ) : (
                surats.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/80">
                    <td className="py-2.5 px-4 font-mono text-xs text-zinc-900 whitespace-nowrap">
                      {s.nomor_surat}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs tabular-nums text-zinc-700 whitespace-nowrap">
                      {s.nik_warga}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-zinc-900">{s.nama_warga}</div>
                      <div className="text-xs text-zinc-500">
                        RT {s.rt_nomor} / RW {s.rw_nomor}
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="text-xs font-medium text-zinc-800">{s.jenis_surat}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-[240px]">
                        {s.keperluan}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs tabular-nums text-zinc-600 whitespace-nowrap">
                      {s.tanggal_pengajuan}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-medium text-emerald-700 whitespace-nowrap">
                      {s.status}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setPreviewSurat(s)}
                        className="px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-md inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Pratinjau
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Preview Modal */}
      {previewSurat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl bg-white rounded-xl border border-zinc-200 overflow-hidden my-8">
            <div className="no-print flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <span className="text-sm font-semibold text-zinc-900">
                Pratinjau Surat Resmi
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Surat
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSurat(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-10 space-y-6 text-zinc-900 text-sm leading-relaxed">
              <div className="text-center border-b-2 border-zinc-900 pb-4 space-y-1">
                <p className="text-xs font-semibold tracking-wide">
                  PEMERINTAH KELURAHAN SUKAMAJU
                </p>
                <p className="text-base font-bold">
                  RUKUN TETANGGA {previewSurat.rt_nomor} / RUKUN WARGA {previewSurat.rw_nomor}
                </p>
                <p className="text-xs text-zinc-600">
                  Sekretariat Administrasi Kependudukan Kelurahan Sukamaju
                </p>
              </div>

              <div className="text-center space-y-1 pt-2">
                <h3 className="text-base font-bold underline">{previewSurat.jenis_surat}</h3>
                <p className="font-mono text-xs text-zinc-700">
                  Nomor: {previewSurat.nomor_surat}
                </p>
              </div>

              <p>
                Yang bertanda tangan di bawah ini Ketua RT {previewSurat.rt_nomor} / RW{' '}
                {previewSurat.rw_nomor} Kelurahan Sukamaju menerangkan dengan sebenarnya bahwa:
              </p>

              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 w-44 text-zinc-600">Nama Lengkap</td>
                    <td className="py-1 font-semibold">: {previewSurat.nama_warga}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-zinc-600">NIK (Primary Key)</td>
                    <td className="py-1 font-mono">: {previewSurat.nik_warga}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-zinc-600">Alamat Domisili</td>
                    <td className="py-1">
                      : {previewSurat.alamat_warga}, RT {previewSurat.rt_nomor} / RW{' '}
                      {previewSurat.rw_nomor}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 text-zinc-600">Keperluan</td>
                    <td className="py-1">: {previewSurat.keperluan}</td>
                  </tr>
                </tbody>
              </table>

              <p>
                Demikian surat keterangan / pengantar ini dibuat berdasarkan basis data kependudukan
                resmi untuk dipergunakan sebagaimana mestinya.
              </p>

              <div className="pt-6 flex justify-end">
                <div className="text-center space-y-14 min-w-[220px]">
                  <div>
                    <p className="text-xs text-zinc-600">
                      Diterbitkan tanggal {previewSurat.tanggal_pengajuan}
                    </p>
                    <p className="text-xs font-semibold mt-0.5">Petugas Penandatangan,</p>
                  </div>
                  <p className="text-sm font-semibold underline">{previewSurat.diterbitkan_oleh}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
