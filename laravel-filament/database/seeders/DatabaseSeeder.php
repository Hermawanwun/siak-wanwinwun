<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Rt;
use App\Models\Rw;
use App\Models\SuratPengantar;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $rw1 = Rw::create(['nomor_rw' => '001', 'ketua_rw' => 'Hendra Wijaya', 'telepon' => '081234560001', 'kelurahan' => 'Kelurahan Sukamaju']);
        $rw2 = Rw::create(['nomor_rw' => '002', 'ketua_rw' => 'Bambang Sutrisno', 'telepon' => '081234560002', 'kelurahan' => 'Kelurahan Sukamaju']);
        $rw3 = Rw::create(['nomor_rw' => '003', 'ketua_rw' => 'Rahmat Hidayat', 'telepon' => '081234560003', 'kelurahan' => 'Kelurahan Sukamaju']);

        $rt11 = Rt::create(['rw_id' => $rw1->id, 'nomor_rt' => '001', 'ketua_rt' => 'Budi Santoso', 'telepon' => '081355001101']);
        $rt12 = Rt::create(['rw_id' => $rw1->id, 'nomor_rt' => '002', 'ketua_rt' => 'Siti Aminah', 'telepon' => '081355001102']);
        $rt13 = Rt::create(['rw_id' => $rw1->id, 'nomor_rt' => '003', 'ketua_rt' => 'Agus Pratama', 'telepon' => '081355001103']);
        $rt21 = Rt::create(['rw_id' => $rw2->id, 'nomor_rt' => '001', 'ketua_rt' => 'Dewi Lestari', 'telepon' => '081355002201']);
        $rt22 = Rt::create(['rw_id' => $rw2->id, 'nomor_rt' => '002', 'ketua_rt' => 'Eko Purnomo', 'telepon' => '081355002202']);
        $rt31 = Rt::create(['rw_id' => $rw3->id, 'nomor_rt' => '001', 'ketua_rt' => 'Nurul Huda', 'telepon' => '081355003301']);

        $admin = User::create(['name' => 'Drs. Wahyu Nugroho', 'email' => 'admin@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::ADMIN]);
        $uRt1 = User::create(['name' => 'Budi Santoso (Ketua RT 001)', 'email' => 'rt01.rw01@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::RT, 'rw_id' => $rw1->id, 'rt_id' => $rt11->id]);
        User::create(['name' => 'Siti Aminah (Ketua RT 002)', 'email' => 'rt02.rw01@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::RT, 'rw_id' => $rw1->id, 'rt_id' => $rt12->id]);
        User::create(['name' => 'Hendra Wijaya (Ketua RW 001)', 'email' => 'rw01@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::RW, 'rw_id' => $rw1->id]);
        User::create(['name' => 'Bambang Sutrisno (Ketua RW 002)', 'email' => 'rw02@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::RW, 'rw_id' => $rw2->id]);
        User::create(['name' => 'Hj. Ratna Kusuma (Lurah)', 'email' => 'lurah@kelurahan.go.id', 'password' => Hash::make('password123'), 'role' => UserRole::LURAH]);

        $rows = [
            ['3578041508850001', '3578040101120011', 'Ahmad Fauzan', 'Surabaya', '1985-08-15', 'Laki-laki', 'Islam', 'Kawin', 'Pegawai Swasta', 'S1', 'O', 'Jl. Melati No. 14', $rw1->id, $rt11->id, 'Tetap', 'Kepala Keluarga'],
            ['3578045203880002', '3578040101120011', 'Rina Marlina', 'Sidoarjo', '1988-03-12', 'Perempuan', 'Islam', 'Kawin', 'Guru SD', 'S1', 'A', 'Jl. Melati No. 14', $rw1->id, $rt11->id, 'Tetap', 'Istri'],
            ['3578042209790004', '3578040205140022', 'Slamet Riyadi', 'Malang', '1979-09-22', 'Laki-laki', 'Islam', 'Kawin', 'Wiraswasta', 'SMA/SMK', 'B', 'Jl. Melati No. 21', $rw1->id, $rt11->id, 'Tetap', 'Kepala Keluarga'],
            ['3578040504950006', '3578040809230033', 'Daniel Kurniawan', 'Semarang', '1995-04-05', 'Laki-laki', 'Kristen', 'Belum Kawin', 'Analis Sistem', 'S1', 'AB', 'Jl. Melati Gang II No. 7', $rw1->id, $rt11->id, 'Pendatang', 'Kepala Keluarga'],
            ['3578041807840007', '3578041203150044', 'Haryanto Wibowo', 'Gresik', '1984-07-18', 'Laki-laki', 'Islam', 'Kawin', 'Karyawan BUMN', 'S1', 'A', 'Jl. Kenanga No. 08', $rw1->id, $rt12->id, 'Tetap', 'Kepala Keluarga'],
            ['3578045511860008', '3578041203150044', 'Nadia Puspitasari', 'Surabaya', '1986-11-15', 'Perempuan', 'Islam', 'Kawin', 'Apoteker', 'S1', 'O', 'Jl. Kenanga No. 08', $rw1->id, $rt12->id, 'Tetap', 'Istri'],
            ['3578040912910010', '3578041908210066', 'Rizky Ramadhan', 'Surabaya', '1991-12-09', 'Laki-laki', 'Islam', 'Kawin', 'Teknisi Jaringan', 'D3', 'A', 'Jl. Cempaka No. 03', $rw1->id, $rt13->id, 'Tetap', 'Kepala Keluarga'],
            ['3578041410800012', '3578040501130077', 'Yohanes Setiawan', 'Surabaya', '1980-10-14', 'Laki-laki', 'Katolik', 'Kawin', 'Akuntan', 'S1', 'AB', 'Jl. Anggrek Blok A-05', $rw2->id, $rt21->id, 'Tetap', 'Kepala Keluarga'],
            ['3578045804830013', '3578040501130077', 'Maria Magdalena', 'Yogyakarta', '1983-04-18', 'Perempuan', 'Katolik', 'Kawin', 'Perawat', 'S1', 'A', 'Jl. Anggrek Blok A-05', $rw2->id, $rt21->id, 'Tetap', 'Istri'],
            ['3578040301750015', '3578041111110099', 'Supriadi', 'Lamongan', '1975-01-03', 'Laki-laki', 'Islam', 'Kawin', 'Sopir Logistik', 'SMP', 'B', 'Jl. Flamboyan No. 11', $rw2->id, $rt22->id, 'Tetap', 'Kepala Keluarga'],
            ['3578041905870017', '3578041506180101', 'Hendra Kusuma', 'Surabaya', '1987-05-19', 'Laki-laki', 'Buddha', 'Kawin', 'Wiraswasta', 'S1', 'A', 'Jl. Teratai No. 02', $rw3->id, $rt31->id, 'Tetap', 'Kepala Keluarga'],
            ['3578046209900018', '3578041506180101', 'Melissa Wijaya', 'Surabaya', '1990-09-22', 'Perempuan', 'Buddha', 'Kawin', 'Ibu Rumah Tangga', 'S1', 'B', 'Jl. Teratai No. 02', $rw3->id, $rt31->id, 'Tetap', 'Istri'],
        ];

        foreach ($rows as $r) {
            Warga::create([
                'nik' => $r[0],
                'no_kk' => $r[1],
                'nama_lengkap' => $r[2],
                'tempat_lahir' => $r[3],
                'tanggal_lahir' => $r[4],
                'jenis_kelamin' => $r[5],
                'agama' => $r[6],
                'status_perkawinan' => $r[7],
                'pekerjaan' => $r[8],
                'pendidikan_terakhir' => $r[9],
                'golongan_darah' => $r[10],
                'alamat' => $r[11],
                'rw_id' => $r[12],
                'rt_id' => $r[13],
                'status_kependudukan' => $r[14],
                'hubungan_keluarga' => $r[15],
                'created_by' => $uRt1->id ?? $admin->id,
            ]);
        }

        SuratPengantar::create([
            'nomor_surat' => '470/014/RT001-RW001/XI/2026',
            'nik_warga' => '3578040504950006',
            'jenis_surat' => 'Surat Keterangan Domisili',
            'keperluan' => 'Persyaratan administrasi perbankan dan domisili tempat tinggal',
            'tanggal_pengajuan' => '2026-11-12',
            'status' => 'Diterbitkan',
            'diterbitkan_oleh' => 'Budi Santoso (Ketua RT 001)',
            'rw_id' => $rw1->id,
            'rt_id' => $rt11->id,
        ]);

        SuratPengantar::create([
            'nomor_surat' => '470/015/RT002-RW001/XI/2026',
            'nik_warga' => '3578041807840007',
            'jenis_surat' => 'Surat Pengantar KTP / KK',
            'keperluan' => 'Pembaruan Kartu Keluarga karena penambahan anggota keluarga',
            'tanggal_pengajuan' => '2026-11-14',
            'status' => 'Diterbitkan',
            'diterbitkan_oleh' => 'Siti Aminah (Ketua RT 002)',
            'rw_id' => $rw1->id,
            'rt_id' => $rt12->id,
        ]);
    }
}