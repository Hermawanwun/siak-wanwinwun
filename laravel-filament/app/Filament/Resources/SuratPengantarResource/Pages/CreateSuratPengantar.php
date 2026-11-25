<?php

namespace App\Filament\Resources\SuratPengantarResource\Pages;

use App\Filament\Resources\SuratPengantarResource;
use App\Models\Warga;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Auth;

class CreateSuratPengantar extends CreateRecord
{
    protected static string $resource = SuratPengantarResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $warga = Warga::findOrFail($data['nik_warga']);
        $data['rw_id'] = $warga->rw_id;
        $data['rt_id'] = $warga->rt_id;
        $data['diterbitkan_oleh'] = Auth::user()?->name ?? 'Petugas Kelurahan';

        return $data;
    }
}