<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wargas', function (Blueprint $table) {
            // Primary Key adalah NIK (16 digit, non-incrementing string)
            $table->string('nik', 16)->primary();
            $table->string('no_kk', 16)->index();
            $table->string('nama_lengkap');
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan']);
            $table->string('agama', 30);
            $table->string('status_perkawinan', 30);
            $table->string('pekerjaan', 100);
            $table->string('pendidikan_terakhir', 50);
            $table->string('golongan_darah', 5)->default('-');
            $table->text('alamat');
            $table->foreignId('rw_id')->constrained('rws')->cascadeOnDelete();
            $table->foreignId('rt_id')->constrained('rts')->cascadeOnDelete();
            $table->enum('status_kependudukan', ['Tetap', 'Pendatang', 'Pindah', 'Meninggal'])->default('Tetap');
            $table->string('hubungan_keluarga', 40)->default('Kepala Keluarga');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wargas');
    }
};