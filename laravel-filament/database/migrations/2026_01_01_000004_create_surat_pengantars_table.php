<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surat_pengantars', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_surat')->unique();
            $table->string('nik_warga', 16);
            $table->foreign('nik_warga')->references('nik')->on('wargas')->cascadeOnDelete();
            $table->string('jenis_surat');
            $table->text('keperluan');
            $table->date('tanggal_pengajuan');
            $table->enum('status', ['Menunggu', 'Disetujui', 'Diterbitkan'])->default('Diterbitkan');
            $table->string('diterbitkan_oleh');
            $table->foreignId('rw_id')->constrained('rws')->cascadeOnDelete();
            $table->foreignId('rt_id')->constrained('rts')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surat_pengantars');
    }
};