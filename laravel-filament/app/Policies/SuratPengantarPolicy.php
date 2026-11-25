<?php

namespace App\Policies;

use App\Models\SuratPengantar;
use App\Models\User;

class SuratPengantarPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SuratPengantar $surat): bool
    {
        if ($user->isRw()) {
            return $surat->rw_id === $user->rw_id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isRt();
    }

    public function update(User $user, SuratPengantar $surat): bool
    {
        return $user->isAdmin() || $user->isRt();
    }

    public function delete(User $user, SuratPengantar $surat): bool
    {
        return $user->isAdmin() || $user->isRt();
    }
}