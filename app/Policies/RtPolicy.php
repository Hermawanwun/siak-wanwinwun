<?php

namespace App\Policies;

use App\Models\Rt;
use App\Models\User;

class RtPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Rt $rt): bool
    {
        if ($user->isRw()) {
            return $rt->rw_id === $user->rw_id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Rt $rt): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Rt $rt): bool
    {
        return $user->isAdmin();
    }
}