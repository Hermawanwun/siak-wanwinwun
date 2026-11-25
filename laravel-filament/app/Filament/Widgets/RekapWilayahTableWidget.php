<?php

namespace App\Filament\Widgets;

use App\Models\Rt;
use App\Models\Rw;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;
use Illuminate\Support\Facades\Auth;

class RekapWilayahTableWidget extends TableWidget
{
    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        $user = Auth::user();

        if ($user?->isRw()) {
            return $table
                ->heading('Rekapitulasi RT di Wilayah RW Anda')
                ->query(Rt::query()->where('rw_id', $user->rw_id)->withCount('wargas'))
                ->columns([
                    TextColumn::make('nomor_rt')->label('RT')->formatStateUsing(fn ($state) => "RT {$state}"),
                    TextColumn::make('ketua_rt')->label('Ketua RT'),
                    TextColumn::make('wargas_count')->label('Jumlah Warga'),
                ]);
        }

        return $table
            ->heading('Rekapitulasi Penduduk Per RW')
            ->query(Rw::query()->withCount(['rts', 'wargas']))
            ->columns([
                TextColumn::make('nomor_rw')->label('RW')->formatStateUsing(fn ($state) => "RW {$state}"),
                TextColumn::make('ketua_rw')->label('Ketua RW'),
                TextColumn::make('rts_count')->label('Jumlah RT'),
                TextColumn::make('wargas_count')->label('Total Warga'),
            ]);
    }
}