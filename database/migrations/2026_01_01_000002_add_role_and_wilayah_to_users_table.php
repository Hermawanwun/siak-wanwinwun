<?php

use App\Enums\UserRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 16)->default(UserRole::RT->value)->after('password');
            $table->foreignId('rw_id')->nullable()->after('role')->constrained('rws')->nullOnDelete();
            $table->foreignId('rt_id')->nullable()->after('rw_id')->constrained('rts')->nullOnDelete();
            $table->boolean('active')->default(true)->after('rt_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('rt_id');
            $table->dropConstrainedForeignId('rw_id');
            $table->dropColumn(['role', 'active']);
        });
    }
};