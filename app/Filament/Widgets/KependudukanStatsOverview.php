<?php

namespace App\Filament\Widgets;

use App\Models\Rt;
use App\Models\Rw;
use App\Models\Warga;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Auth;

class KependudukanStatsOverview extends StatsOverviewWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $user = Auth::user();
        $query = Warga::query();
        $scopeLabel = 'Seluruh Kelurahan';

        if ($user?->isRw()) {
            $firstRt = Rt::where('rw_id', $user->rw_id)->orderBy('nomor_rt')->first();
            $query->where('rw_id', $user->rw_id)
                ->when($firstRt, fn ($q) => $q->where('rt_id', $firstRt->id));
            $scopeLabel = $firstRt ? "RW {$user->rw?->nomor_rw} · RT {$firstRt->nomor_rt}" : 'Wilayah RW';
        }

        $totalWarga = (clone $query)->count();
        $totalKk = (clone $query)->distinct('no_kk')->count('no_kk');
        $lakiLaki = (clone $query)->where('jenis_kelamin', 'Laki-laki')->count();
        $perempuan = (clone $query)->where('jenis_kelamin', 'Perempuan')->count();
        $totalRw = $user?->isRw() ? 1 : Rw::count();
        $totalRt = $user?->isRw() ? Rt::where('rw_id', $user->rw_id)->count() : Rt::count();

        return [
            Stat::make('Total Penduduk (NIK PK)', $totalWarga)
                ->description($scopeLabel)
                ->color('warning'),
            Stat::make('Jumlah Kartu Keluarga', $totalKk)
                ->description('Berdasarkan No. KK unik')
                ->color('primary'),
            Stat::make('Laki-laki / Perempuan', "{$lakiLaki} / {$perempuan}")
                ->description('Komposisi jenis kelamin')
                ->color('success'),
            Stat::make('Wilayah Administratif', "{$totalRw} RW · {$totalRt} RT")
                ->description('Role: ' . ($user?->role?->getLabel() ?? '-'))
                ->color('info'),
        ];
    }
}