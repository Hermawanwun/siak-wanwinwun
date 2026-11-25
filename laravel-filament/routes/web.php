<?php

use App\Models\SuratPengantar;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/admin'));

Route::get('/surat/{surat}/cetak', function (SuratPengantar $surat) {
    $surat->load(['warga', 'rw', 'rt']);

    return view('surat.cetak', compact('surat'));
})->middleware('auth')->name('surat.cetak');