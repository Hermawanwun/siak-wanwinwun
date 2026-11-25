<?php

namespace App\Enums;

use Filament\Support\Contracts\HasColor;
use Filament\Support\Contracts\HasLabel;

enum UserRole: string implements HasLabel, HasColor
{
    case ADMIN = 'ADMIN';
    case RT = 'RT';
    case RW = 'RW';
    case LURAH = 'LURAH';

    public function getLabel(): string
    {
        return match ($this) {
            self::ADMIN => 'Admin (All Access)',
            self::RT => 'Ketua RT (CRUD Seluruh Data Warga)',
            self::RW => 'Ketua RW (Lihat Data 1 RT)',
            self::LURAH => 'Lurah (Lihat Data RW)',
        };
    }

    public function getColor(): string|array|null
    {
        return match ($this) {
            self::ADMIN => 'danger',
            self::RT => 'success',
            self::RW => 'warning',
            self::LURAH => 'info',
        };
    }
}