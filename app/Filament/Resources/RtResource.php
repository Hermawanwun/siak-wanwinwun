<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RtResource\Pages;
use App\Models\Rt;
use App\Models\Rw;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class RtResource extends Resource
{
    protected static ?string $model = Rt::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-map-pin';

    protected static ?string $navigationLabel = 'Wilayah RT';

    protected static ?string $modelLabel = 'Wilayah RT';

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user = Auth::user();

        if ($user?->isRw()) {
            return $query->where('rw_id', $user->rw_id);
        }

        return $query;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('rw_id')
                ->label('RW Induk')
                ->options(Rw::query()->orderBy('nomor_rw')->pluck('nomor_rw', 'id'))
                ->required(),
            TextInput::make('nomor_rt')->label('Nomor RT')->required()->maxLength(3),
            TextInput::make('ketua_rt')->label('Nama Ketua RT')->required(),
            TextInput::make('telepon')->label('Telepon'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nomor_rt')->label('Nomor RT')->formatStateUsing(fn ($state) => "RT {$state}")->sortable(),
                TextColumn::make('rw.nomor_rw')->label('RW Induk')->formatStateUsing(fn ($state) => "RW {$state}")->sortable(),
                TextColumn::make('ketua_rt')->label('Ketua RT')->searchable(),
                TextColumn::make('wargas_count')->counts('wargas')->label('Total Warga'),
                TextColumn::make('telepon')->label('Telepon'),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListRts::route('/'),
            'create' => Pages\CreateRt::route('/create'),
            'edit' => Pages\EditRt::route('/{record}/edit'),
        ];
    }
}