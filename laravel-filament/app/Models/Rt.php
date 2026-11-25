<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rt extends Model
{
    protected $fillable = ['rw_id', 'nomor_rt', 'ketua_rt', 'telepon'];

    public function rw(): BelongsTo
    {
        return $this->belongsTo(Rw::class, 'rw_id');
    }

    public function wargas(): HasMany
    {
        return $this->hasMany(Warga::class, 'rt_id');
    }
}