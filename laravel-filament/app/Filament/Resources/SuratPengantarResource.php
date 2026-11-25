<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SuratPengantarResource\Pages;
use App\Models\SuratPengantar;
use App\Models\Warga;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class SuratPengantarResource extends Resource
{
    protected static ?string $model = SuratPengantar::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationLabel = 'Surat Pengantar';

    protected static ?int $navigationSort = 4;

    protected static ?string $modelLabel = 'Surat Pengantar';

    protected static ?string $pluralModelLabel = 'Surat Pengantar';

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user  = Auth::user();

        if (! $user) {
            return $query;
        }

        // RW: hanya melihat surat di bawah rw_id-nya (semua RT)
        if ($user->isRw()) {
            return $query->where('rw_id', $user->rw_id);
        }

        // RT: hanya melihat surat di rt_id-nya
        if ($user->isRt()) {
            return $query->where('rt_id', $user->rt_id);
        }

        // Admin dan Lurah: semua data
        return $query;
    }

    public static function form(Schema $schema): Schema
    {
        $user = Auth::user();

        return $schema->components([
            Select::make('nik_warga')
                ->label('Warga (NIK)')
                ->options(function () use ($user) {
                    $query = Warga::query()->orderBy('nama_lengkap');

                    // RT hanya pilih warga di wilayahnya
                    if ($user?->isRt()) {
                        $query->where('rt_id', $user->rt_id);
                    }

                    // RW hanya pilih warga di rwnya
                    if ($user?->isRw()) {
                        $query->where('rw_id', $user->rw_id);
                    }

                    return $query->get()
                        ->mapWithKeys(fn (Warga $w) => [$w->nik => "{$w->nik} — {$w->nama_lengkap}"]);
                })
                ->searchable()
                ->required(),

            Select::make('jenis_surat')
                ->label('Jenis Surat')
                ->options([
                    'Surat Keterangan Domisili'    => 'Surat Keterangan Domisili',
                    'Surat Pengantar KTP / KK'     => 'Surat Pengantar KTP / KK',
                    'Surat Keterangan Usaha'       => 'Surat Keterangan Usaha',
                    'Surat Keterangan Tidak Mampu' => 'Surat Keterangan Tidak Mampu',
                    'Surat Pengantar Pindah'       => 'Surat Pengantar Pindah',
                ])
                ->required(),

            TextInput::make('nomor_surat')
                ->label('Nomor Surat')
                ->default(fn () => '470/' . str_pad((string) (SuratPengantar::count() + 14), 3, '0', STR_PAD_LEFT) . '/KEL-SMJ/' . date('Y'))
                ->required()
                ->unique(ignoreRecord: true),

            DatePicker::make('tanggal_pengajuan')
                ->label('Tanggal Pengajuan')
                ->default(now())
                ->required(),

            Select::make('status')
                ->options([
                    'Menunggu'   => 'Menunggu',
                    'Disetujui'  => 'Disetujui',
                    'Diterbitkan' => 'Diterbitkan',
                ])
                ->default('Diterbitkan')
                ->required(),

            Textarea::make('keperluan')
                ->label('Keperluan')
                ->columnSpanFull()
                ->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nomor_surat')->label('Nomor Surat')->searchable()->fontFamily('mono'),
                TextColumn::make('nik_warga')->label('NIK Warga')->searchable()->fontFamily('mono'),
                TextColumn::make('warga.nama_lengkap')->label('Nama Warga')->searchable(),
                TextColumn::make('jenis_surat')->label('Jenis Surat'),
                TextColumn::make('tanggal_pengajuan')->label('Tanggal')->date('d M Y'),
                TextColumn::make('status')->badge(),
            ])
            ->recordActions([
                Action::make('cetak')
                    ->label('Cetak')
                    ->icon('heroicon-o-printer')
                    ->url(fn (SuratPengantar $record) => route('surat.cetak', $record))
                    ->openUrlInNewTab(),
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListSuratPengantars::route('/'),
            'create' => Pages\CreateSuratPengantar::route('/create'),
            'edit'   => Pages\EditSuratPengantar::route('/{record}/edit'),
        ];
    }
}