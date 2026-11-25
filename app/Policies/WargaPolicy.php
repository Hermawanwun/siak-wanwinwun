<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Warga;

class WargaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Warga $warga): bool
    {
        if ($user->isAdmin() || $user->isRt() || $user->isLurah()) {
            return true;
        }

        // RW hanya bisa melihat data dalam lingkup RW-nya (1 RT terpilih)
        if ($user->isRw()) {
            return $warga->rw_id === $user->rw_id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        // ADMIN all access & RT CRUD seluruh data warga
        return $user->isAdmin() || $user->isRt();
    }

    public function update(User $user, Warga $warga): bool
    {
        return $user->isAdmin() || $user->isRt();
    }

    public function delete(User $user, Warga $warga): bool
    {
        return $user->isAdmin() || $user->isRt();
    }

    public function deleteAny(User $user): bool
    {
        return $user->isAdmin() || $user->isRt();
    }
}