export type UserRole = 'ADMIN' | 'RT' | 'RW' | 'LURAH';

export type JenisKelamin = 'Laki-laki' | 'Perempuan';
export type StatusPerkawinan = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';
export type StatusKependudukan = 'Tetap' | 'Pendatang' | 'Pindah' | 'Meninggal';
export type Agama = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';
export type GolonganDarah = 'A' | 'B' | 'AB' | 'O' | '-';

export interface Rw {
  id: string;
  nomor_rw: string;
  ketua_rw: string;
  telepon: string;
  kelurahan: string;
  created_at: string;
}

export interface Rt {
  id: string;
  rw_id: string;
  nomor_rt: string;
  ketua_rt: string;
  telepon: string;
  created_at: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  rw_id: string | null;
  rt_id: string | null;
  active: boolean;
  created_at: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rw_id: string | null;
  rt_id: string | null;
  active: boolean;
  created_at: string;
  rw_label?: string;
  rt_label?: string;
}

export interface Warga {
  nik: string; // Primary Key (16-digit)
  no_kk: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: JenisKelamin;
  agama: Agama;
  status_perkawinan: StatusPerkawinan;
  pekerjaan: string;
  pendidikan_terakhir: string;
  golongan_darah: GolonganDarah;
  alamat: string;
  rt_id: string;
  rw_id: string;
  status_kependudukan: StatusKependudukan;
  hubungan_keluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SuratPengantar {
  id: string;
  nomor_surat: string;
  nik_warga: string;
  jenis_surat:
    | 'Surat Keterangan Domisili'
    | 'Surat Pengantar KTP / KK'
    | 'Surat Keterangan Usaha'
    | 'Surat Keterangan Tidak Mampu'
    | 'Surat Pengantar Pindah';
  keperluan: string;
  tanggal_pengajuan: string;
  status: 'Menunggu' | 'Disetujui' | 'Diterbitkan';
  diterbitkan_oleh: string;
  rt_id: string;
  rw_id: string;
}

export interface AuditEntry {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ISSUE_SURAT';
  target_type: 'WARGA' | 'WILAYAH' | 'USER' | 'SURAT';
  target_id: string;
  summary: string;
  timestamp: string;
}

export interface SiakDatabase {
  rws: Rw[];
  rts: Rt[];
  users: UserRecord[];
  wargas: Warga[];
  surats: SuratPengantar[];
  audits: AuditEntry[];
}

export interface StatsSummary {
  scope_label: string;
  total_warga: number;
  total_kk: number;
  laki_laki: number;
  perempuan: number;
  warga_tetap: number;
  warga_pendatang: number;
  warga_pindah: number;
  warga_meninggal: number;
  total_rw: number;
  total_rt: number;
  per_rw: Array<{
    rw_id: string;
    nomor_rw: string;
    ketua_rw: string;
    total_warga: number;
    total_kk: number;
    total_rt: number;
  }>;
  per_rt: Array<{
    rt_id: string;
    rw_id: string;
    nomor_rt: string;
    nomor_rw: string;
    ketua_rt: string;
    total_warga: number;
    total_kk: number;
  }>;
}
