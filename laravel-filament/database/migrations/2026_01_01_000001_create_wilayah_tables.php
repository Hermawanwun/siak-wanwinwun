<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rws', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_rw', 3)->unique();
            $table->string('ketua_rw');
            $table->string('telepon', 20)->nullable();
            $table->string('kelurahan')->default('Kelurahan Sukamaju');
            $table->timestamps();
        });

        Schema::create('rts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rw_id')->constrained('rws')->cascadeOnDelete();
            $table->string('nomor_rt', 3);
            $table->string('ketua_rt');
            $table->string('telepon', 20)->nullable();
            $table->timestamps();

            $table->unique(['rw_id', 'nomor_rt']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rts');
        Schema::dropIfExists('rws');
    }
};