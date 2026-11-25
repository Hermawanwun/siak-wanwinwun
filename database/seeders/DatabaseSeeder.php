<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Rt;
use App\Models\Rw;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $rw1 = Rw::create(['nomor_rw' => '001', 'ketua_rw' => 'Hendra Wijaya', 'kelurahan' => 'Kelurahan Sukamaju']);
        $rw2 = Rw::create(['nomor_rw' => '002', 'ketua_rw' => 'Bambang Sutrisno', 'kelurahan' => 'Kelurahan Sukamaju']);

        $rt1 = Rt::create(['rw_id' => $rw1->id, 'nomor_rt' => '001', 'ketua_rt' => 'Budi Santoso']);
        $rt2 = Rt::create(['rw_id' => $rw1->id, 'nomor_rt' => '002', 'ketua_rt' => 'Siti Aminah']);
        $rt3 = Rt::create(['rw_id' => $rw2->id, 'nomor_rt' => '001', 'ketua_rt' => 'Dewi Lestari']);

        User::create([
            'name' => 'Drs. Wahyu Nugroho',
            'email' => 'admin@kelurahan.go.id',
            'password' => Hash::make('password123'),
            'role' => UserRole::ADMIN,
        ]);

        User::create([
            'name' => 'Budi Santoso (Ketua RT 001)',
            'email' => 'rt01.rw01@kelurahan.go.id',
            'password' => Hash::make('password123'),
            'role' => UserRole::RT,
            'rw_id' => $rw1->id,
            'rt_id' => $rt1->id,
        ]);

        User::create([
            'name' => 'Hendra Wijaya (Ketua RW 001)',
            'email' => 'rw01@kelurahan.go.id',
            'password' => Hash::make('password123'),
            'role' => UserRole::RW,
            'rw_id' => $rw1->id,
        ]);

        User::create([
            'name' => 'Hj. Ratna Kusuma (Lurah)',
            'email' => 'lurah@kelurahan.go.id',
            'password' => Hash::make('password123'),
            'role' => UserRole::LURAH,
        ]);

        Warga::create([
            'nik' => '3578041508850001',
            'no_kk' => '3578040101120011',
            'nama_lengkap' => 'Ahmad Fauzan',
            'tempat_lahir' => 'Surabaya',
            'tanggal_lahir' => '1985-08-15',
            'jenis_kelamin' => 'Laki-laki',
            'agama' => 'Islam',
            'status_perkawinan' => 'Kawin',
            'pekerjaan' => 'Pegawai Swasta',
            'pendidikan_terakhir' => 'S1',
            'golongan_darah' => 'O',
            'alamat' => 'Jl. Melati No. 14',
            'rw_id' => $rw1->id,
            'rt_id' => $rt1->id,
            'status_kependudukan' => 'Tetap',
            'hubungan_keluarga' => 'Kepala Keluarga',
        ]);
    }
}