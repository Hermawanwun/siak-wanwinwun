<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rw extends Model
{
    protected $fillable = ['nomor_rw', 'ketua_rw', 'telepon', 'kelurahan'];

    public function rts(): HasMany
    {
        return $this->hasMany(Rt::class, 'rw_id');
    }

    public function wargas(): HasMany
    {
        return $this->hasMany(Warga::class, 'rw_id');
    }
}