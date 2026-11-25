<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RwResource\Pages;
use App\Models\Rw;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class RwResource extends Resource
{
    protected static ?string $model = Rw::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-building-office-2';

    protected static ?string $navigationLabel = 'Wilayah RW';

    protected static ?int $navigationSort = 2;

    protected static ?string $modelLabel = 'Wilayah RW';

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user = Auth::user();

        if ($user?->isRw()) {
            return $query->where('id', $user->rw_id);
        }

        return $query;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('nomor_rw')->label('Nomor RW')->required()->maxLength(3)->unique(ignoreRecord: true),
            TextInput::make('ketua_rw')->label('Nama Ketua RW')->required(),
            TextInput::make('telepon')->label('Telepon'),
            TextInput::make('kelurahan')->default('Kelurahan Sukamaju')->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nomor_rw')->label('Nomor RW')->formatStateUsing(fn ($state) => "RW {$state}")->sortable(),
                TextColumn::make('ketua_rw')->label('Ketua RW')->searchable(),
                TextColumn::make('rts_count')->counts('rts')->label('Jumlah RT'),
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
            'index' => Pages\ListRws::route('/'),
            'create' => Pages\CreateRw::route('/create'),
            'edit' => Pages\EditRw::route('/{record}/edit'),
        ];
    }
}