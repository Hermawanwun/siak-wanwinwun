import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { RtWithCounts, RwWithCounts } from '../api.ts';
import type {
  Agama,
  GolonganDarah,
  JenisKelamin,
  StatusKependudukan,
  StatusPerkawinan,
  Warga,
} from '../types.ts';

interface WargaModalProps {
  mode: 'create' | 'edit' | 'view';
  initialWarga?: Warga | null;
  rws: RwWithCounts[];
  rts: RtWithCounts[];
  defaultRwId?: string;
  defaultRtId?: string;
  onClose: () => void;
  onSubmit: (payload: Partial<Warga>) => Promise<void>;
}

export const WargaModal: React.FC<WargaModalProps> = ({
  mode,
  initialWarga,
  rws,
  rts,
  defaultRwId,
  defaultRtId,
  onClose,
  onSubmit,
}) => {
  const isReadOnly = mode === 'view';
  const isEdit = mode === 'edit';

  const initialRw = initialWarga?.rw_id || defaultRwId || rws[0]?.id || '';
  const initialRt =
    initialWarga?.rt_id ||
    defaultRtId ||
    rts.find((rt) => rt.rw_id === initialRw)?.id ||
    '';

  const [nik, setNik] = useState(initialWarga?.nik ?? '');
  const [noKk, setNoKk] = useState(initialWarga?.no_kk ?? '');
  const [namaLengkap, setNamaLengkap] = useState(initialWarga?.nama_lengkap ?? '');
  const [tempatLahir, setTempatLahir] = useState(initialWarga?.tempat_lahir ?? '');
  const [tanggalLahir, setTanggalLahir] = useState(initialWarga?.tanggal_lahir ?? '1990-01-01');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>(
    initialWarga?.jenis_kelamin ?? 'Laki-laki'
  );
  const [agama, setAgama] = useState<Agama>(initialWarga?.agama ?? 'Islam');
  const [statusPerkawinan, setStatusPerkawinan] = useState<StatusPerkawinan>(
    initialWarga?.status_perkawinan ?? 'Kawin'
  );
  const [pekerjaan, setPekerjaan] = useState(initialWarga?.pekerjaan ?? '');
  const [pendidikan, setPendidikan] = useState(initialWarga?.pendidikan_terakhir ?? 'SMA/SMK');
  const [golDarah, setGolDarah] = useState<GolonganDarah>(initialWarga?.golongan_darah ?? '-');
  const [alamat, setAlamat] = useState(initialWarga?.alamat ?? '');
  const [rwId, setRwId] = useState(initialRw);
  const [rtId, setRtId] = useState(initialRt);
  const [statusKependudukan, setStatusKependudukan] = useState<StatusKependudukan>(
    initialWarga?.status_kependudukan ?? 'Tetap'
  );
  const [hubunganKeluarga, setHubunganKeluarga] = useState<Warga['hubungan_keluarga']>(
    initialWarga?.hubungan_keluarga ?? 'Kepala Keluarga'
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRts = rts.filter((rt) => rt.rw_id === rwId);

  useEffect(() => {
    if (!filteredRts.some((rt) => rt.id === rtId)) {
      setRtId(filteredRts[0]?.id ?? '');
    }
  }, [rwId, filteredRts, rtId]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setError(null);

    if (!/^\d{16}$/.test(nik)) {
      setError('NIK (Primary Key) wajib tepat 16 digit angka.');
      return;
    }
    if (!/^\d{16}$/.test(noKk)) {
      setError('Nomor KK wajib tepat 16 digit angka.');
      return;
    }
    if (!namaLengkap.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!rwId || !rtId) {
      setError('Wilayah RW dan RT wajib dipilih.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        nik,
        no_kk: noKk,
        nama_lengkap: namaLengkap.trim(),
        tempat_lahir: tempatLahir.trim() || '-',
        tanggal_lahir: tanggalLahir,
        jenis_kelamin: jenisKelamin,
        agama,
        status_perkawinan: statusPerkawinan,
        pekerjaan: pekerjaan.trim() || '-',
        pendidikan_terakhir: pendidikan,
        golongan_darah: golDarah,
        alamat: alamat.trim() || '-',
        rw_id: rwId,
        rt_id: rtId,
        status_kependudukan: statusKependudukan,
        hubungan_keluarga: hubunganKeluarga,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data warga.');
    } finally {
      setSubmitting(false);
    }
  };

  const title =
    mode === 'create'
      ? 'Tambah Data Warga Baru'
      : mode === 'edit'
      ? `Ubah Data Warga — ${initialWarga?.nama_lengkap ?? ''}`
      : `Detail Data Warga — ${initialWarga?.nama_lengkap ?? ''}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warga-modal-title"
    >
      <div className="w-full max-w-3xl bg-white rounded-xl border border-zinc-200 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/70">
          <div>
            <h3 id="warga-modal-title" className="text-base font-semibold text-zinc-900">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Primary Key menggunakan NIK 16 digit sesuai standar administrasi kependudukan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Section 1: Identitas Utama */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900 pb-2 border-b border-zinc-100">
              01. Identitas Kependudukan (Primary Key NIK)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-700">
                    NIK (Primary Key) *
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                    {nik.length}/16
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={16}
                  disabled={isReadOnly || isEdit}
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="357804xxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white disabled:bg-zinc-100 disabled:text-zinc-600 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Nomor Kartu Keluarga (No. KK) *
                  </label>
                  <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                    {noKk.length}/16
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={16}
                  disabled={isReadOnly}
                  value={noKk}
                  onChange={(e) => setNoKk(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="357804xxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white disabled:bg-zinc-100 disabled:text-zinc-600 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Nama Lengkap Sesuai KTP *
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Wilayah & Status */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900 pb-2 border-b border-zinc-100">
              02. Domisili RT / RW & Status Kependudukan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Wilayah RW *</label>
                <select
                  disabled={isReadOnly}
                  value={rwId}
                  onChange={(e) => setRwId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  {rws.map((rw) => (
                    <option key={rw.id} value={rw.id}>
                      RW {rw.nomor_rw} — {rw.ketua_rw}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Wilayah RT *</label>
                <select
                  disabled={isReadOnly}
                  value={rtId}
                  onChange={(e) => setRtId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  {filteredRts.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      RT {rt.nomor_rt} — {rt.ketua_rt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Status Kependudukan
                </label>
                <select
                  disabled={isReadOnly}
                  value={statusKependudukan}
                  onChange={(e) => setStatusKependudukan(e.target.value as StatusKependudukan)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  <option value="Tetap">Tetap</option>
                  <option value="Pendatang">Pendatang</option>
                  <option value="Pindah">Pindah</option>
                  <option value="Meninggal">Meninggal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Hubungan dalam Keluarga
                </label>
                <select
                  disabled={isReadOnly}
                  value={hubunganKeluarga}
                  onChange={(e) =>
                    setHubunganKeluarga(e.target.value as Warga['hubungan_keluarga'])
                  }
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  <option value="Kepala Keluarga">Kepala Keluarga</option>
                  <option value="Istri">Istri</option>
                  <option value="Anak">Anak</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Famili Lain">Famili Lain</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Melati No. 14"
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Data Sosial */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900 pb-2 border-b border-zinc-100">
              03. Demografi & Pekerjaan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Jenis Kelamin</label>
                <select
                  disabled={isReadOnly}
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as JenisKelamin)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Agama</label>
                <select
                  disabled={isReadOnly}
                  value={agama}
                  onChange={(e) => setAgama(e.target.value as Agama)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Status Perkawinan
                </label>
                <select
                  disabled={isReadOnly}
                  value={statusPerkawinan}
                  onChange={(e) => setStatusPerkawinan(e.target.value as StatusPerkawinan)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  <option value="Belum Kawin">Belum Kawin</option>
                  <option value="Kawin">Kawin</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Pekerjaan</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={pekerjaan}
                  onChange={(e) => setPekerjaan(e.target.value)}
                  placeholder="Wiraswasta / Pelajar"
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Pendidikan Terakhir
                </label>
                <select
                  disabled={isReadOnly}
                  value={pendidikan}
                  onChange={(e) => setPendidikan(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  <option value="Belum Sekolah">Belum Sekolah</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Golongan Darah
                </label>
                <select
                  disabled={isReadOnly}
                  value={golDarah}
                  onChange={(e) => setGolDarah(e.target.value as GolonganDarah)}
                  className="w-full px-3 py-2 text-sm bg-white disabled:bg-zinc-100 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600"
                >
                  <option value="-">-</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              {isReadOnly ? 'Tutup' : 'Batal'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Data Warga'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
