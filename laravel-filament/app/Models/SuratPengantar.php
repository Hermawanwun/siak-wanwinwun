<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuratPengantar extends Model
{
    protected $table = 'surat_pengantars';

    protected $fillable = [
        'nomor_surat',
        'nik_warga',
        'jenis_surat',
        'keperluan',
        'tanggal_pengajuan',
        'status',
        'diterbitkan_oleh',
        'rw_id',
        'rt_id',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pengajuan' => 'date',
            'status'            => 'string',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────────────────

    public function warga(): BelongsTo
    {
        return $this->belongsTo(Warga::class, 'nik_warga', 'nik');
    }

    public function rw(): BelongsTo
    {
        return $this->belongsTo(Rw::class, 'rw_id');
    }

    public function rt(): BelongsTo
    {
        return $this->belongsTo(Rt::class, 'rt_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────────────────

    /**
     * Batasi query berdasarkan role user yang sedang login.
     *   - ADMIN / LURAH : semua data
     *   - RW            : semua surat di bawah rw_id user
     *   - RT            : hanya surat di rt_id user
     */
    public function scopeForUser(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        if (! $user) {
            return $query->whereRaw('0 = 1');
        }

        if ($user->isRw()) {
            return $query->where('rw_id', $user->rw_id);
        }

        if ($user->isRt()) {
            return $query->where('rt_id', $user->rt_id);
        }

        // Admin dan Lurah melihat semua data
        return $query;
    }
}