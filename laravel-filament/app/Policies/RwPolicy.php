<?php

namespace App\Policies;

use App\Models\Rw;
use App\Models\User;

class RwPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Rw $rw): bool
    {
        if ($user->isRw()) {
            return $rw->id === $user->rw_id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Rw $rw): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Rw $rw): bool
    {
        return $user->isAdmin();
    }
}