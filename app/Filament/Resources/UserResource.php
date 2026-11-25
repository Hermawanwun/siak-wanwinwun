<?php

namespace App\Filament\Resources;

use App\Enums\UserRole;
use App\Filament\Resources\UserResource\Pages;
use App\Models\Rt;
use App\Models\Rw;
use App\Models\User;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationLabel = 'Pengguna & Role';

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')->label('Nama Lengkap')->required(),
            TextInput::make('email')->email()->required()->unique(ignoreRecord: true),
            TextInput::make('password')
                ->password()
                ->dehydrated(fn (?string $state): bool => filled($state))
                ->required(fn (string $operation): bool => $operation === 'create'),
            Select::make('role')
                ->options(UserRole::class)
                ->live()
                ->required(),
            Select::make('rw_id')
                ->label('Penugasan RW')
                ->options(Rw::query()->orderBy('nomor_rw')->pluck('nomor_rw', 'id'))
                ->visible(fn (callable $get) => in_array($get('role'), [UserRole::RW->value, UserRole::RT->value]))
                ->live(),
            Select::make('rt_id')
                ->label('Penugasan RT')
                ->options(fn (callable $get) => Rt::query()
                    ->when($get('rw_id'), fn ($q, $rwId) => $q->where('rw_id', $rwId))
                    ->pluck('nomor_rt', 'id'))
                ->visible(fn (callable $get) => $get('role') === UserRole::RT->value),
            Toggle::make('active')->label('Akun Aktif')->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->label('Nama')->searchable(),
                TextColumn::make('email')->searchable(),
                TextColumn::make('role')->badge(),
                TextColumn::make('rw.nomor_rw')->label('RW')->placeholder('-'),
                TextColumn::make('rt.nomor_rt')->label('RT')->placeholder('-'),
                IconColumn::make('active')->boolean(),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}