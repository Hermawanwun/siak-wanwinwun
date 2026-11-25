<?php

namespace App\Filament\Resources;

use App\Filament\Resources\WargaResource\Pages;
use App\Models\Rt;
use App\Models\Rw;
use App\Models\Warga;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class WargaResource extends Resource
{
    protected static ?string $model = Warga::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-identification';

    protected static ?string $navigationLabel = 'Data Warga (NIK)';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'Data Warga';

    protected static ?string $pluralModelLabel = 'Data Warga';

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user = Auth::user();

        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        // RW: Melihat data 1 RT dalam wilayah RW-nya
        if ($user->isRw()) {
            $firstRtId = Rt::where('rw_id', $user->rw_id)->orderBy('nomor_rt')->value('id');
            $selectedRtId = request()->input('tableFilters.rt_id.value') ?: $firstRtId;

            return $query
                ->where('rw_id', $user->rw_id)
                ->when($selectedRtId, fn (Builder $q) => $q->where('rt_id', $selectedRtId));
        }

        // ADMIN, RT (CRUD seluruh data warga), LURAH (lihat data per RW)
        return $query;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Identitas Utama (Primary Key NIK)')
                ->columns(2)
                ->schema([
                    TextInput::make('nik')
                        ->label('NIK (Primary Key)')
                        ->required()
                        ->length(16)
                        ->regex('/^\d{16}$/')
                        ->unique(table: Warga::class, column: 'nik', ignoreRecord: true)
                        ->disabledOn('edit')
                        ->dehydrated()
                        ->helperText('16 digit angka unik sebagai Primary Key tabel warga.'),
                    TextInput::make('no_kk')
                        ->label('Nomor Kartu Keluarga (KK)')
                        ->required()
                        ->length(16)
                        ->regex('/^\d{16}$/'),
                    TextInput::make('nama_lengkap')
                        ->label('Nama Lengkap')
                        ->required()
                        ->maxLength(150),
                    Select::make('jenis_kelamin')
                        ->label('Jenis Kelamin')
                        ->options([
                            'Laki-laki' => 'Laki-laki',
                            'Perempuan' => 'Perempuan',
                        ])
                        ->required(),
                    TextInput::make('tempat_lahir')
                        ->label('Tempat Lahir')
                        ->required(),
                    DatePicker::make('tanggal_lahir')
                        ->label('Tanggal Lahir')
                        ->required(),
                ]),

            Section::make('Domisili Wilayah & Status Kependudukan')
                ->columns(2)
                ->schema([
                    Select::make('rw_id')
                        ->label('RW')
                        ->options(Rw::query()->orderBy('nomor_rw')->pluck('nomor_rw', 'id'))
                        ->live()
                        ->required(),
                    Select::make('rt_id')
                        ->label('RT')
                        ->options(fn (callable $get) => Rt::query()
                            ->when($get('rw_id'), fn ($q, $rwId) => $q->where('rw_id', $rwId))
                            ->orderBy('nomor_rt')
                            ->pluck('nomor_rt', 'id'))
                        ->required(),
                    Select::make('status_kependudukan')
                        ->label('Status Kependudukan')
                        ->options([
                            'Tetap' => 'Tetap',
                            'Pendatang' => 'Pendatang',
                            'Pindah' => 'Pindah',
                            'Meninggal' => 'Meninggal',
                        ])
                        ->default('Tetap')
                        ->required(),
                    Select::make('hubungan_keluarga')
                        ->label('Status Hubungan Keluarga')
                        ->options([
                            'Kepala Keluarga' => 'Kepala Keluarga',
                            'Istri' => 'Istri',
                            'Anak' => 'Anak',
                            'Orang Tua' => 'Orang Tua',
                            'Famili Lain' => 'Famili Lain',
                        ])
                        ->default('Kepala Keluarga')
                        ->required(),
                    Textarea::make('alamat')
                        ->label('Alamat Lengkap')
                        ->columnSpanFull()
                        ->required(),
                ]),

            Section::make('Data Sosial & Demografi')
                ->columns(3)
                ->schema([
                    Select::make('agama')
                        ->options([
                            'Islam' => 'Islam',
                            'Kristen' => 'Kristen',
                            'Katolik' => 'Katolik',
                            'Hindu' => 'Hindu',
                            'Buddha' => 'Buddha',
                            'Konghucu' => 'Konghucu',
                        ])
                        ->required(),
                    Select::make('status_perkawinan')
                        ->label('Status Perkawinan')
                        ->options([
                            'Belum Kawin' => 'Belum Kawin',
                            'Kawin' => 'Kawin',
                            'Cerai Hidup' => 'Cerai Hidup',
                            'Cerai Mati' => 'Cerai Mati',
                        ])
                        ->required(),
                    Select::make('golongan_darah')
                        ->label('Golongan Darah')
                        ->options(['A' => 'A', 'B' => 'B', 'AB' => 'AB', 'O' => 'O', '-' => '-'])
                        ->default('-'),
                    TextInput::make('pekerjaan')->required(),
                    TextInput::make('pendidikan_terakhir')->label('Pendidikan Terakhir')->required(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        $user = Auth::user();

        return $table
            ->columns([
                TextColumn::make('nik')
                    ->label('NIK (PK)')
                    ->searchable()
                    ->sortable()
                    ->copyable()
                    ->fontFamily('mono'),
                TextColumn::make('no_kk')
                    ->label('No. KK')
                    ->searchable()
                    ->fontFamily('mono')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('nama_lengkap')
                    ->label('Nama Lengkap')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('rw.nomor_rw')
                    ->label('RW')
                    ->formatStateUsing(fn ($state) => "RW {$state}")
                    ->sortable(),
                TextColumn::make('rt.nomor_rt')
                    ->label('RT')
                    ->formatStateUsing(fn ($state) => "RT {$state}")
                    ->sortable(),
                TextColumn::make('jenis_kelamin')->label('Gender'),
                TextColumn::make('status_kependudukan')
                    ->label('Status')
                    ->badge(),
            ])
            ->filters([
                SelectFilter::make('rw_id')
                    ->label('Filter RW (Lurah / Admin)')
                    ->options(Rw::query()->orderBy('nomor_rw')->pluck('nomor_rw', 'id'))
                    ->visible(fn () => ! $user?->isRw()),
                SelectFilter::make('rt_id')
                    ->label('Pilih 1 RT')
                    ->options(fn () => $user?->isRw()
                        ? Rt::where('rw_id', $user->rw_id)->orderBy('nomor_rt')->pluck('nomor_rt', 'id')
                        : Rt::query()->orderBy('nomor_rt')->pluck('nomor_rt', 'id'))
                    ->selectablePlaceholder(fn () => ! $user?->isRw()),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWargas::route('/'),
            'create' => Pages\CreateWarga::route('/create'),
            'view' => Pages\ViewWarga::route('/{record}'),
            'edit' => Pages\EditWarga::route('/{record}/edit'),
        ];
    }
}